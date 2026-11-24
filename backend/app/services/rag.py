"""
In-Process Retrieval-Augmented Generation (RAG) Prompt Enhancer
--------------------------------------------------------------
Why this file exists:
Addresses the core limitation of standard text-to-image prompts: user prompts are
often vague (e.g. "a cat on a roof"), missing critical conditioning signals such as
volumetric lighting, lens focal length, depth of field, art medium, and color palette.

Instead of running an external vector database (Chroma, Pinecone, Milvus), we perform
in-process dense semantic retrieval using sentence-transformers (all-MiniLM-L6-v2)
and NumPy cosine similarity over a local corpus of 30 curated photographic & artistic
techniques. The retrieved style snippets augment an instruction prompt passed to a
local Ollama LLM (qwen2.5:3b), synthesizing a rich, prompt-engineered description.
"""

import json
import time
from typing import List, Dict, Any, Tuple
import numpy as np
import requests
from sentence_transformers import SentenceTransformer
from app.config import (
    STYLE_SNIPPETS_FILE,
    EMBEDDING_MODEL_ID,
    OLLAMA_API_URL,
    OLLAMA_MODEL,
)


class RAGEnhancer:
    """
    In-process RAG engine:
    1. Embeds style snippets into a dense vector space at startup.
    2. Computes cosine similarity between user prompt and style corpus.
    3. Augments prompt context and queries local Ollama LLM for prompt synthesis.
    """
    _instance = None

    def __init__(self):
        print(f"[RAG] Loading embedding model '{EMBEDDING_MODEL_ID}'...")
        start_time = time.perf_counter()
        
        # MiniLM runs comfortably on CPU with negligible RAM footprint (~80MB)
        self.encoder = SentenceTransformer(EMBEDDING_MODEL_ID, device="cpu")
        
        # Load corpus of 30 style snippets
        with open(STYLE_SNIPPETS_FILE, "r", encoding="utf-8") as f:
            self.snippets: List[Dict[str, Any]] = json.load(f)

        # Precompute dense embeddings for the entire corpus at startup
        texts = [
            f"{s['name']}: {s['text']} Tags: {', '.join(s.get('tags', []))}"
            for s in self.snippets
        ]
        raw_embeddings = self.encoder.encode(texts, convert_to_numpy=True, show_progress_bar=False)
        
        # L2-normalize embeddings so cosine similarity reduces to simple dot product:
        # cosine_sim(u, v) = (u . v) / (||u|| * ||v||) = dot(u_norm, v_norm)
        norms = np.linalg.norm(raw_embeddings, axis=1, keepdims=True)
        self.normalized_embeddings = raw_embeddings / np.maximum(norms, 1e-12)
        
        elapsed = time.perf_counter() - start_time
        print(f"[RAG] Indexed {len(self.snippets)} style snippets in {elapsed:.2f}s")

    @classmethod
    def get_instance(cls) -> "RAGEnhancer":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def retrieve_top_k(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """
        Performs in-process dense vector similarity search.
        
        Theoretical Viva Explanation:
        Dense retrieval maps heterogeneous text to a continuous metric space where
        semantic relatedness corresponds to angular proximity. The cosine similarity
        in NumPy runs in O(N * D) where N=30 and D=384, executing in sub-millisecond
        time with zero network overhead.
        """
        query_vector = self.encoder.encode(query, convert_to_numpy=True, show_progress_bar=False)
        query_norm = query_vector / max(np.linalg.norm(query_vector), 1e-12)

        # Dot product with all normalized corpus vectors yields cosine similarity in [-1, 1]
        similarities = np.dot(self.normalized_embeddings, query_norm)

        # Get top-k snippet indices sorted in descending order of similarity
        top_indices = np.argsort(similarities)[::-1][:top_k]

        results = []
        for idx in top_indices:
            snippet = self.snippets[idx].copy()
            snippet["similarity_score"] = float(round(similarities[idx], 4))
            results.append(snippet)

        return results

    def enhance(self, prompt: str, top_k: int = 3) -> Tuple[str, List[Dict[str, Any]], float]:
        """
        Retrieves context, formats prompt augmentation, and queries Ollama LLM.
        
        Returns:
            Tuple of (enhanced_prompt, retrieved_snippets, latency_seconds).
        """
        start_time = time.perf_counter()
        
        # 1. Retrieve top-k semantic matches
        retrieved = self.retrieve_top_k(prompt, top_k=top_k)

        # Format context string
        context_lines = []
        for i, item in enumerate(retrieved, 1):
            context_lines.append(f"{i}. Style: {item['name']} (Category: {item.get('category', 'Art')})\n   Technique: {item['text']}")
        context_block = "\n".join(context_lines)

        # 2. Build context-augmented prompt for Ollama
        system_instruction = (
            "You are an expert Generative AI prompt engineer for Stable Diffusion.\n"
            "Given a user's raw idea and retrieved artistic/photographic styling context, "
            "synthesize a single, visually detailed, compelling diffusion prompt.\n"
            "Incorporate relevant lighting, composition, texture, and mood from the retrieved styles.\n"
            "CRITICAL: Output ONLY the final enhanced prompt. Do NOT include introductory phrases, "
            "explanations, quotes, or markdown formatting."
        )

        user_content = (
            f"User Raw Prompt: {prompt}\n\n"
            f"Retrieved Style Context:\n{context_block}\n\n"
            f"Enhanced Stable Diffusion Prompt:"
        )

        # 3. Call local Ollama API
        enhanced_prompt = ""
        try:
            payload = {
                "model": OLLAMA_MODEL,
                "prompt": f"{system_instruction}\n\n{user_content}",
                "stream": False,
                "keep_alive": "30s",  # Unload from unified memory after 30s to keep RAM free for diffusion
                "options": {
                    "temperature": 0.7,
                    "num_predict": 128,  # Keep responses concise for diffusion prompts
                }
            }
            response = requests.post(OLLAMA_API_URL, json=payload, timeout=20)
            if response.status_code == 200:
                data = response.json()
                raw_response = data.get("response", "").strip()
                # Clean up any potential quotes or leading text
                enhanced_prompt = raw_response.strip('"`\n ')
            else:
                print(f"[RAG] Ollama returned status {response.status_code}, falling back to template augmentation")
        except Exception as e:
            print(f"[RAG] Ollama connection error: {e}. Falling back to template augmentation.")

        # Fallback if Ollama is unreachable or model is still warming up
        if not enhanced_prompt:
            top_snippet = retrieved[0]
            enhanced_prompt = (
                f"{prompt}, rendered with {top_snippet['name'].lower()}, "
                f"{top_snippet['text'].lower()}, 8k resolution, highly detailed, masterwork"
            )

        latency = time.perf_counter() - start_time
        return enhanced_prompt, retrieved, latency
