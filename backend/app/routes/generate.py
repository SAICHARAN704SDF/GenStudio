"""
Image Generation, Captioning & Evaluation Route (POST /api/generate)
--------------------------------------------------------------------
Executes the full end-to-end multimodal pipeline:
1. Diffusion synthesis (Text-to-Image OR Image-to-Image on Apple Silicon MPS)
2. Negative prompt vector conditioning
3. Vision-to-language captioning (BLIP)
4. Multimodal alignment scoring (OpenCLIP ViT-B-32)
5. Optional side-by-side LoRA comparison (scale 0 vs scale 0.8)
6. Latent Spherical Linear Interpolation (POST /api/slerp)
7. Autonomous Visual Critic & Refinement (POST /api/critique)
8. Session logging for monitoring & evaluation
"""

import uuid
import gc
import io
import base64
import torch
from typing import Optional
from PIL import Image
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.services.generator import SDTurboGenerator
from app.services.captioner import ImageCaptioner
from app.services.evaluator import CLIPEvaluator
from app.services.critic import AutonomousCritic
from app.services.history_store import HistoryStore

router = APIRouter()

class GenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=2, max_length=1000, description="Text prompt for image synthesis")
    negative_prompt: Optional[str] = Field(None, description="Negative prompt conditioning")
    enhanced_prompt: Optional[str] = Field(None, description="Optional RAG enhanced version for logging")
    steps: Optional[int] = Field(2, ge=1, le=4, description="Inference steps for SD-Turbo (1 to 4)")
    seed: Optional[int] = Field(None, description="Seed for deterministic latent sampling")
    lora_path: Optional[str] = Field(None, description="Local path to LoRA .safetensors weights")
    lora_scale: Optional[float] = Field(0.8, ge=0.0, le=1.0, description="Multiplier for LoRA delta weights")
    compare_side_by_side: Optional[bool] = Field(False, description="Generate both base (scale 0) and LoRA (scale 0.8)")
    # Img2Img parameters
    init_image: Optional[str] = Field(None, description="Base64 encoded initial image for Img2Img")
    strength: Optional[float] = Field(0.6, ge=0.05, le=1.0, description="Img2Img denoising strength (eta)")

class SlerpRequest(BaseModel):
    prompt: str = Field(..., min_length=2, max_length=500)
    seed_a: int = Field(42, description="Start latent seed")
    seed_b: int = Field(999, description="End latent seed")
    num_frames: Optional[int] = Field(4, ge=3, le=6, description="Interpolated steps across manifold")
    steps: Optional[int] = Field(2, ge=1, le=4)

class CritiqueRequest(BaseModel):
    prompt: str
    caption: str
    clip_score: float
    clip_rating: str

@router.post("/generate")
def generate_image(req: GenerateRequest):
    try:
        generator = SDTurboGenerator.get_instance()
        captioner = ImageCaptioner.get_instance()
        evaluator = CLIPEvaluator.get_instance()
        history_store = HistoryStore.get_instance()

        gen_id = f"gen_{uuid.uuid4().hex[:8]}"

        # Check if Image-to-Image mode is requested
        if req.init_image and req.init_image.startswith("data:image"):
            # Decode base64 input image
            raw_b64 = req.init_image.split(",")[1]
            img_bytes = base64.b64decode(raw_b64)
            pil_init = Image.open(io.BytesIO(img_bytes)).convert("RGB")

            pil_image, image_b64, gen_latency = generator.generate_img2img(
                image=pil_init,
                prompt=req.prompt,
                negative_prompt=req.negative_prompt,
                strength=req.strength or 0.6,
                num_inference_steps=req.steps or 2,
                seed=req.seed,
                lora_path=req.lora_path if req.lora_path else None,
                lora_scale=req.lora_scale if req.lora_scale is not None else 0.8,
            )
            mode = f"Img2Img (η={req.strength})"
        else:
            # Standard Text-to-Image mode
            pil_image, image_b64, gen_latency = generator.generate(
                prompt=req.prompt,
                negative_prompt=req.negative_prompt,
                num_inference_steps=req.steps or 2,
                seed=req.seed,
                lora_path=req.lora_path if req.lora_path else None,
                lora_scale=req.lora_scale if req.lora_scale is not None else 0.8,
            )
            mode = "Text2Image"

        # Free Apple Silicon unified cache
        if torch.backends.mps.is_available():
            torch.mps.empty_cache()
        gc.collect()

        # Automated BLIP Captioning
        caption = captioner.caption(pil_image)

        # Automated CLIP Score Evaluation
        clip_results = evaluator.evaluate(pil_image, req.prompt)
        gc.collect()

        # Optional Side-by-Side Comparison (if LoRA is provided and comparison requested)
        comparison_data = None
        if req.compare_side_by_side and req.lora_path:
            base_pil_image, base_b64, base_latency = generator.generate(
                prompt=req.prompt,
                negative_prompt=req.negative_prompt,
                num_inference_steps=req.steps or 2,
                seed=req.seed,
                lora_path=None,  # Base model without LoRA
                lora_scale=0.0,
            )
            base_caption = captioner.caption(base_pil_image)
            base_clip = evaluator.evaluate(base_pil_image, req.prompt)
            comparison_data = {
                "base_image": base_b64,
                "base_caption": base_caption,
                "base_clip": base_clip,
                "base_latency": round(base_latency, 2),
            }

        response_data = {
            "id": gen_id,
            "mode": mode,
            "prompt": req.prompt,
            "negative_prompt": req.negative_prompt,
            "enhanced_prompt": req.enhanced_prompt,
            "image": image_b64,
            "caption": caption,
            "clip_score": clip_results["raw_clip_score"],
            "clip_normalized": clip_results["normalized_score"],
            "clip_rating": clip_results["rating"],
            "badge_color": clip_results["badge_color"],
            "generation_time": round(gen_latency, 2),
            "steps": req.steps or 2,
            "seed": req.seed,
            "lora_path": req.lora_path,
            "lora_scale": req.lora_scale if req.lora_path else 0.0,
            "comparison": comparison_data,
        }

        history_store.add_entry(response_data)
        return response_data

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Generation pipeline failed: {str(e)}")


@router.post("/slerp")
def generate_latent_slerp(req: SlerpRequest):
    """
    Computes spherical linear interpolation between two Gaussian noise latents.
    """
    try:
        generator = SDTurboGenerator.get_instance()
        frames = generator.generate_slerp(
            prompt=req.prompt,
            seed_a=req.seed_a,
            seed_b=req.seed_b,
            num_frames=req.num_frames or 4,
            num_inference_steps=req.steps or 2,
        )
        return {
            "prompt": req.prompt,
            "seed_a": req.seed_a,
            "seed_b": req.seed_b,
            "frames": frames,
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Latent Slerp failed: {str(e)}")


@router.post("/critique")
def critique_generation(req: CritiqueRequest):
    """
    Autonomous AI Art Critic and prompt refinement agent.
    """
    try:
        critic = AutonomousCritic.get_instance()
        result = critic.critique_and_refine(
            original_prompt=req.prompt,
            blip_caption=req.caption,
            clip_score=req.clip_score,
            clip_rating=req.clip_rating,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Critique failed: {str(e)}")
