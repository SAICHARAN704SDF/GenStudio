"""
Multimodal Image Captioning Service (BLIP)
-------------------------------------------
Why this file exists:
Demonstrates multimodal perception (Vision-to-Language). While diffusion translates
Text -> Image, BLIP (Bootstrapping Language-Image Pre-training) performs the inverse
mapping: Image -> Text.

Comparing the input prompt with the BLIP-generated description of the output image
reveals semantic drift or whether the model accurately captured the intended subject.
To maintain memory efficiency, BLIP executes on CPU, leaving GPU memory reserved for diffusion.
"""

import time
from typing import Optional
from PIL import Image
import torch
from transformers import BlipProcessor, BlipForConditionalGeneration
from app.config import BLIP_MODEL_ID


class ImageCaptioner:
    """
    Singleton service managing Salesforce/blip-image-captioning-base.
    """
    _instance: Optional["ImageCaptioner"] = None

    def __init__(self):
        print(f"[Captioner] Initializing BLIP captioner '{BLIP_MODEL_ID}' on CPU...")
        start_time = time.perf_counter()

        self.processor = BlipProcessor.from_pretrained(BLIP_MODEL_ID)
        self.model = BlipForConditionalGeneration.from_pretrained(
            BLIP_MODEL_ID,
            torch_dtype=torch.float32
        )
        self.model.to("cpu")
        self.model.eval()

        elapsed = time.perf_counter() - start_time
        print(f"[Captioner] BLIP loaded in {elapsed:.2f}s")

    @classmethod
    def get_instance(cls) -> "ImageCaptioner":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def caption(self, image: Image.Image) -> str:
        """
        Generates an objective natural language description of the input image.
        
        Viva Explanation:
        BLIP combines a vision transformer (ViT) image encoder with a causal
        transformer decoder using cross-attention layers. Image patches are projected
        into visual tokens that attend to autoregressive language generation tokens.
        """
        # Ensure image is in RGB format
        if image.mode != "RGB":
            image = image.convert("RGB")

        inputs = self.processor(image, return_tensors="pt").to("cpu")

        with torch.no_grad():
            output_tokens = self.model.generate(
                **inputs,
                max_new_tokens=40,
                num_beams=3,
                repetition_penalty=1.2,
            )

        caption_text = self.processor.decode(output_tokens[0], skip_special_tokens=True)
        return caption_text.strip().capitalize()
