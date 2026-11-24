"""
Diffusion Generation Service (SD-Turbo on Apple Silicon MPS)
-------------------------------------------------------------
Why this file exists:
Implements the core image synthesis engine using Hugging Face Diffusers.
We use `stabilityai/sd-turbo`, which implements Adversarial Diffusion Distillation (ADD).
Traditional diffusion models (DDPM/DDIM) reverse a Markovian forward noise process
over 20-50 iterations using classifier-free guidance. SD-Turbo distills this into
1 to 4 steps with guidance_scale=0.0, reducing inference latency from ~45 seconds
to ~1.5 - 3.0 seconds on an Apple Silicon M3 GPU (MPS) under an 8GB memory envelope.

Supported Generative Modalities:
1. Text-to-Image (T2I) with optional Negative Prompting & LoRA
2. Image-to-Image (Img2Img) with Denoising Strength (eta) - Zero extra VRAM
3. Latent Spherical Linear Interpolation (Slerp) across latent manifold
"""

import base64
import io
import os
import time
from typing import Optional, Tuple, List, Dict, Any
from PIL import Image
import torch
from diffusers import AutoPipelineForText2Image, AutoPipelineForImage2Image
from app.config import DEVICE, TORCH_DTYPE, SD_MODEL_ID, BASE_DIR


def slerp(val: float, low: torch.Tensor, high: torch.Tensor) -> torch.Tensor:
    """
    Spherical Linear Interpolation (Slerp) on the Gaussian Latent Manifold.
    
    Why Slerp matters for the viva:
    Linear interpolation z = (1 - lambda)*z_0 + lambda*z_1 causes norm collapse
    toward the origin in high-dimensional Gaussian spaces (d = 4 x 64 x 64 = 16,384),
    resulting in blurry, low-variance intermediate images. Slerp interpolates along
    the spherical arc on the hypersphere, preserving the expected latent variance
    E[||z||^2] = d throughout the entire transition.
    """
    low_f = low.float()
    high_f = high.float()
    
    low_norm = low_f / torch.norm(low_f)
    high_norm = high_f / torch.norm(high_f)
    dot = torch.sum(low_norm * high_norm)
    dot = torch.clamp(dot, -1.0 + 1e-7, 1.0 - 1e-7)
    theta = torch.acos(dot)
    sin_theta = torch.sin(theta)
    
    if sin_theta.abs() < 1e-4:
        res = (1.0 - val) * low_f + val * high_f
    else:
        res = (torch.sin((1.0 - val) * theta) / sin_theta) * low_f + (torch.sin(val * theta) / sin_theta) * high_f
        
    return res.to(dtype=low.dtype, device=low.device)


class SDTurboGenerator:
    """
    Singleton service managing the Stable Diffusion Turbo pipeline.
    Reuses the exact in-memory UNet & VAE across Text2Image and Image2Image
    without duplicating model weights.
    """
    _instance: Optional["SDTurboGenerator"] = None

    def __init__(self):
        print(f"[Generator] Initializing SD-Turbo on device '{DEVICE}' with dtype {TORCH_DTYPE}...")
        start_time = time.perf_counter()

        kwargs = {"torch_dtype": TORCH_DTYPE}
        if TORCH_DTYPE == torch.float16:
            kwargs["variant"] = "fp16"

        self.pipe = AutoPipelineForText2Image.from_pretrained(
            SD_MODEL_ID,
            **kwargs
        )
        self.pipe.to(DEVICE)
        self.pipe.set_progress_bar_config(disable=True)

        # Memory optimization for 8GB Apple Silicon M3:
        # Slicing reduces peak memory allocation by ~40%
        if hasattr(self.pipe, "enable_attention_slicing"):
            self.pipe.enable_attention_slicing()
        if hasattr(self.pipe, "enable_vae_slicing"):
            self.pipe.enable_vae_slicing()

        # Shared Img2Img pipeline referencing the identical weights
        self._img2img_pipe: Optional[AutoPipelineForImage2Image] = None

        self.current_lora_path: Optional[str] = None
        load_time = time.perf_counter() - start_time
        print(f"[Generator] SD-Turbo pipeline ready in {load_time:.2f}s")

    @classmethod
    def get_instance(cls) -> "SDTurboGenerator":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    @property
    def img2img_pipe(self) -> AutoPipelineForImage2Image:
        if self._img2img_pipe is None:
            print("[Generator] Initializing Image2Image pipeline from existing weights...")
            self._img2img_pipe = AutoPipelineForImage2Image.from_pipe(self.pipe)
            self._img2img_pipe.set_progress_bar_config(disable=True)
        return self._img2img_pipe

    def apply_lora(self, lora_path: Optional[str], lora_scale: float = 0.8) -> None:
        """
        Dynamically attaches or scales a Low-Rank Adaptation (LoRA) checkpoint.
        """
        if not lora_path:
            if self.current_lora_path is not None:
                try:
                    self.pipe.disable_lora()
                except Exception as e:
                    print(f"[Generator] Warning disabling LoRA: {e}")
                self.current_lora_path = None
            return

        resolved_path = lora_path
        if not os.path.exists(resolved_path):
            candidate = (BASE_DIR / lora_path).resolve()
            if candidate.exists():
                resolved_path = str(candidate)
            else:
                candidate = (BASE_DIR.parent / lora_path).resolve()
                if candidate.exists():
                    resolved_path = str(candidate)

        if not os.path.exists(resolved_path):
            print(f"[Generator] LoRA path not found: {lora_path} (resolved: {resolved_path})")
            return

        if self.current_lora_path != resolved_path:
            try:
                if self.current_lora_path is not None:
                    try:
                        self.pipe.unload_lora_weights()
                    except Exception:
                        pass
                print(f"[Generator] Loading LoRA weights from: {resolved_path}")
                self.pipe.load_lora_weights(resolved_path, adapter_name="custom_style")
                self.current_lora_path = resolved_path
            except Exception as e:
                print(f"[Generator] Error loading LoRA {resolved_path}: {e}")
                return

        try:
            if hasattr(self.pipe, "set_adapters"):
                self.pipe.set_adapters(["custom_style"], adapter_weights=[lora_scale])
        except Exception as e:
            print(f"[Generator] Warning adjusting LoRA scale: {e}")

    def generate(
        self,
        prompt: str,
        negative_prompt: Optional[str] = None,
        num_inference_steps: int = 2,
        seed: Optional[int] = None,
        lora_path: Optional[str] = None,
        lora_scale: float = 0.8,
        width: int = 512,
        height: int = 512,
    ) -> Tuple[Image.Image, str, float]:
        """
        Executes Text-to-Image (T2I) synthesis.
        """
        if lora_path:
            self.apply_lora(lora_path, lora_scale)
        elif self.current_lora_path is not None:
            self.apply_lora(None, 0.0)

        generator = None
        if seed is not None:
            generator = torch.Generator(device=DEVICE).manual_seed(seed)

        start_time = time.perf_counter()

        pipe_kwargs = {
            "prompt": prompt,
            "num_inference_steps": num_inference_steps,
            "guidance_scale": 0.0,
            "width": width,
            "height": height,
            "generator": generator,
        }
        if negative_prompt:
            pipe_kwargs["negative_prompt"] = negative_prompt

        with torch.inference_mode():
            output = self.pipe(**pipe_kwargs)

        latency = time.perf_counter() - start_time
        image: Image.Image = output.images[0]

        if DEVICE == "mps" and hasattr(torch.mps, "empty_cache"):
            torch.mps.empty_cache()

        buffered = io.BytesIO()
        image.save(buffered, format="JPEG", quality=92)
        img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
        base64_url = f"data:image/jpeg;base64,{img_str}"

        return image, base64_url, latency

    def generate_img2img(
        self,
        image: Image.Image,
        prompt: str,
        negative_prompt: Optional[str] = None,
        strength: float = 0.6,
        num_inference_steps: int = 2,
        seed: Optional[int] = None,
        lora_path: Optional[str] = None,
        lora_scale: float = 0.8,
    ) -> Tuple[Image.Image, str, float]:
        """
        Executes Image-to-Image (Img2Img) synthesis.
        
        Viva Explanation:
        Instead of starting from white noise z_T ~ N(0, I), Img2Img encodes the
        reference image into latent space z_0 = VAE_enc(x), adds forward Markov noise
        up to timestep t = strength * T:
            z_t = sqrt(alpha_bar_t) * z_0 + sqrt(1 - alpha_bar_t) * eps
        and then denoises backwards under text guidance.
        """
        if lora_path:
            self.apply_lora(lora_path, lora_scale)
        elif self.current_lora_path is not None:
            self.apply_lora(None, 0.0)

        generator = None
        if seed is not None:
            generator = torch.Generator(device=DEVICE).manual_seed(seed)

        if image.size != (512, 512):
            image = image.resize((512, 512), Image.Resampling.LANCZOS)

        start_time = time.perf_counter()

        pipe_kwargs = {
            "image": image,
            "prompt": prompt,
            "strength": strength,
            "num_inference_steps": max(2, int(num_inference_steps / strength)) if strength > 0 else 2,
            "guidance_scale": 0.0,
            "generator": generator,
        }
        if negative_prompt:
            pipe_kwargs["negative_prompt"] = negative_prompt

        with torch.inference_mode():
            output = self.img2img_pipe(**pipe_kwargs)

        latency = time.perf_counter() - start_time
        res_image: Image.Image = output.images[0]

        if DEVICE == "mps" and hasattr(torch.mps, "empty_cache"):
            torch.mps.empty_cache()

        buffered = io.BytesIO()
        res_image.save(buffered, format="JPEG", quality=92)
        img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
        base64_url = f"data:image/jpeg;base64,{img_str}"

        return res_image, base64_url, latency

    def generate_slerp(
        self,
        prompt: str,
        seed_a: int = 42,
        seed_b: int = 999,
        num_frames: int = 4,
        num_inference_steps: int = 2,
    ) -> List[Dict[str, Any]]:
        """
        Executes Spherical Linear Interpolation across the latent noise manifold.
        Generates num_frames intermediate visualizations between seed_a and seed_b.
        """
        # Sample latent noise vectors on CPU / MPS
        gen_a = torch.Generator(device="cpu").manual_seed(seed_a)
        gen_b = torch.Generator(device="cpu").manual_seed(seed_b)

        shape = (1, 4, 64, 64)
        z_a = torch.randn(shape, generator=gen_a, dtype=TORCH_DTYPE)
        z_b = torch.randn(shape, generator=gen_b, dtype=TORCH_DTYPE)

        lambdas = [i / (num_frames - 1) for i in range(num_frames)]
        frames = []

        for l in lambdas:
            z_interp = slerp(l, z_a, z_b).to(DEVICE)
            with torch.inference_mode():
                out = self.pipe(
                    prompt=prompt,
                    latents=z_interp,
                    num_inference_steps=num_inference_steps,
                    guidance_scale=0.0,
                    width=512,
                    height=512,
                )
            img = out.images[0]
            buffered = io.BytesIO()
            img.save(buffered, format="JPEG", quality=90)
            img_b64 = base64.b64encode(buffered.getvalue()).decode("utf-8")

            frames.append({
                "lambda": round(l, 2),
                "image": f"data:image/jpeg;base64,{img_b64}"
            })

        if DEVICE == "mps" and hasattr(torch.mps, "empty_cache"):
            torch.mps.empty_cache()

        return frames
