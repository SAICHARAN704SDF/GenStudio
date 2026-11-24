"""
Autonomous Visual Critic & Prompt Refinement Agent (RLVF Loop)
--------------------------------------------------------------
Why this file exists:
Implements a closed-loop Generative AI feedback agent. Rather than treating
generation as a one-shot process (Text -> Image), the agent observes the output
perception (BLIP caption) and quantitative fidelity (CLIP score), diagnoses
semantic discrepancies, and autonomously refines the conditioning prompt.

This demonstrates Reinforcement Learning from Visual Feedback (RLVF) principles.
"""

import json
import time
import requests
from typing import Dict, Any
from app.config import OLLAMA_API_URL, OLLAMA_MODEL


class AutonomousCritic:
    """
    Agentic visual critique and prompt refinement service.
    """
    _instance = None

    @classmethod
    def get_instance(cls) -> "AutonomousCritic":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def critique_and_refine(
        self,
        original_prompt: str,
        blip_caption: str,
        clip_score: float,
        clip_rating: str,
    ) -> Dict[str, Any]:
        """
        Diagnoses generative gaps and produces targeted positive and negative prompt adjustments.
        """
        start_time = time.perf_counter()

        system_prompt = (
            "You are an expert Generative AI Art Critic and Prompt Optimization Agent.\n"
            "Your task is to analyze discrepancies between the user's intended prompt, "
            "what the diffusion model actually generated (as described by BLIP captioning), "
            "and its objective CLIP alignment score.\n"
            "Provide:\n"
            "1. 'critique': 1-2 sentence diagnosis of what elements were missed, weak, or distorted.\n"
            "2. 'refined_prompt': A rich, improved prompt incorporating specific lighting, textures, and composition to fix the issues.\n"
            "3. 'negative_prompt': Specific negative tokens to suppress visual flaws.\n\n"
            "Respond strictly in valid JSON format with keys: \"critique\", \"refined_prompt\", \"negative_prompt\"."
        )

        user_content = (
            f"User Intended Prompt: \"{original_prompt}\"\n"
            f"Model BLIP Caption: \"{blip_caption}\"\n"
            f"CLIP Alignment Score: {clip_score:.3f} ({clip_rating})\n\n"
            f"JSON Response:"
        )

        critique = "The generated image captured the general subject but needs stronger lighting and compositional framing."
        refined_prompt = f"{original_prompt}, highly detailed, cinematic lighting, sharp focus, 8k masterpiece"
        negative_prompt = "blurry, distorted, low quality, washed out, artifacts"

        try:
            payload = {
                "model": OLLAMA_MODEL,
                "prompt": f"{system_prompt}\n\n{user_content}",
                "stream": False,
                "keep_alive": "30s",
                "options": {
                    "temperature": 0.6,
                    "num_predict": 250,
                }
            }
            res = requests.post(OLLAMA_API_URL, json=payload, timeout=25)
            if res.status_code == 200:
                raw_text = res.json().get("response", "").strip()
                # Parse JSON block
                if "{" in raw_text and "}" in raw_text:
                    json_str = raw_text[raw_text.find("{"):raw_text.rfind("}") + 1]
                    parsed = json.loads(json_str)
                    critique = parsed.get("critique", critique)
                    refined_prompt = parsed.get("refined_prompt", refined_prompt)
                    negative_prompt = parsed.get("negative_prompt", negative_prompt)
        except Exception as e:
            print(f"[Critic] Ollama critique fallback due to: {e}")

        latency = time.perf_counter() - start_time

        return {
            "critique": critique,
            "refined_prompt": refined_prompt,
            "negative_prompt": negative_prompt,
            "latency": round(latency, 2),
        }
