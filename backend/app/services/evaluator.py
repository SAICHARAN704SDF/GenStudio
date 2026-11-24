"""
Multimodal Alignment Evaluator (OpenCLIP ViT-B-32)
--------------------------------------------------
Why this file exists:
Generative AI requires objective evaluation metrics. In text-to-image synthesis,
the standard academic metric for semantic fidelity is the CLIP Score.

CLIP (Contrastive Language-Image Pre-training) maps images and text into a shared
multimodal embedding space trained via contrastive cross-entropy loss. By computing
the cosine similarity between the prompt embedding vector and the generated image
embedding vector, we obtain a mathematical score quantifying how accurately the
diffusion model realized the textual concept.
"""

import time
from typing import Dict, Any, Optional
from PIL import Image
import torch
import open_clip
from app.config import CLIP_MODEL_NAME, CLIP_PRETRAINED


class CLIPEvaluator:
    """
    Singleton service managing OpenCLIP ViT-B-32 evaluation.
    """
    _instance: Optional["CLIPEvaluator"] = None

    def __init__(self):
        print(f"[Evaluator] Loading OpenCLIP ({CLIP_MODEL_NAME}, pretrained='{CLIP_PRETRAINED}') on CPU...")
        start_time = time.perf_counter()

        self.model, _, self.preprocess = open_clip.create_model_and_transforms(
            CLIP_MODEL_NAME,
            pretrained=CLIP_PRETRAINED
        )
        self.tokenizer = open_clip.get_tokenizer(CLIP_MODEL_NAME)
        self.model.to("cpu")
        self.model.eval()

        elapsed = time.perf_counter() - start_time
        print(f"[Evaluator] OpenCLIP loaded in {elapsed:.2f}s")

    @classmethod
    def get_instance(cls) -> "CLIPEvaluator":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def evaluate(self, image: Image.Image, prompt: str) -> Dict[str, Any]:
        """
        Computes cosine similarity between text prompt and image in CLIP space.
        
        Viva Explanation:
        Let z_text = f_T(prompt) / ||f_T(prompt)|| and z_img = f_I(image) / ||f_I(image)||.
        The CLIP Score is:
            S_CLIP = cosine_similarity(z_text, z_img) = z_text . z_img
        Higher scores indicate stronger visual-semantic alignment. Typical ViT-B-32
        scores for high quality matches range between 0.24 and 0.36.
        """
        # Ensure image is in RGB format
        if image.mode != "RGB":
            image = image.convert("RGB")

        # Preprocess image into normalized tensor (3, 224, 224)
        image_tensor = self.preprocess(image).unsqueeze(0).to("cpu")
        
        # Tokenize text with 77-token context limit
        text_tokens = self.tokenizer([prompt]).to("cpu")

        with torch.no_grad():
            image_features = self.model.encode_image(image_tensor)
            text_features = self.model.encode_text(text_tokens)

            # L2-normalization for cosine distance
            image_features /= image_features.norm(dim=-1, keepdim=True)
            text_features /= text_features.norm(dim=-1, keepdim=True)

            raw_similarity = (image_features @ text_features.T).item()

        # Clamp and scale for intuitive UI display (0.15 - 0.35 typical range)
        # 0.30+ is strong alignment in standard open_clip ViT-B-32
        raw_score = float(round(raw_similarity, 4))
        normalized_percentage = float(round(min(max((raw_similarity - 0.15) / (0.35 - 0.15), 0.0), 1.0) * 100, 1))

        if raw_score >= 0.30:
            rating = "Excellent Alignment"
            badge_color = "green"
        elif raw_score >= 0.25:
            badge_color = "blue"
            rating = "Good Alignment"
        elif raw_score >= 0.20:
            badge_color = "amber"
            rating = "Moderate Alignment"
        else:
            badge_color = "red"
            rating = "Low Alignment"

        return {
            "raw_clip_score": raw_score,
            "normalized_score": normalized_percentage,
            "rating": rating,
            "badge_color": badge_color,
        }
