"""
Persistent Session History Store
---------------------------------
Maintains generation tracking and monitoring for model evaluation.
Persists history to local JSON storage (backend/data/generation_history.json)
so demonstration history survives backend restarts while adhering to the
zero-extra-database constraint.
"""

import json
import os
import time
from pathlib import Path
from typing import List, Dict, Any
from app.config import DATA_DIR

HISTORY_FILE = DATA_DIR / "generation_history.json"

class HistoryStore:
    _instance = None

    def __init__(self):
        self._history: List[Dict[str, Any]] = []
        self._load_from_disk()

    @classmethod
    def get_instance(cls) -> "HistoryStore":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _load_from_disk(self) -> None:
        try:
            if HISTORY_FILE.exists():
                with open(HISTORY_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        self._history = data
        except Exception as e:
            print(f"[HistoryStore] Notice: Could not load history from {HISTORY_FILE}: {e}")
            self._history = []

    def _save_to_disk(self) -> None:
        try:
            DATA_DIR.mkdir(parents=True, exist_ok=True)
            # Write to temporary file then replace for atomic persistence
            temp_file = HISTORY_FILE.with_suffix(".tmp")
            with open(temp_file, "w", encoding="utf-8") as f:
                json.dump(self._history, f, indent=2)
            temp_file.replace(HISTORY_FILE)
        except Exception as e:
            print(f"[HistoryStore] Warning: Could not save history to disk: {e}")

    def add_entry(self, entry: Dict[str, Any]) -> None:
        if "timestamp" not in entry:
            entry["timestamp"] = time.time()

        entry_id = entry.get("id")
        # Prevent exact ID duplicates
        if entry_id:
            for idx, existing in enumerate(self._history):
                if existing.get("id") == entry_id:
                    self._history[idx] = entry
                    self._save_to_disk()
                    return

        # Prevent duplicate entries by key generation parameters if identical
        prompt = entry.get("prompt")
        seed = entry.get("seed")
        mode = entry.get("mode")
        steps = entry.get("steps")
        lora_scale = entry.get("lora_scale")
        
        for idx, existing in enumerate(self._history):
            if (existing.get("prompt") == prompt and
                existing.get("seed") == seed and
                existing.get("mode") == mode and
                existing.get("steps") == steps and
                existing.get("lora_scale") == lora_scale and
                existing.get("image") == entry.get("image")):
                # Update existing rather than duplicating
                self._history[idx] = entry
                self._save_to_disk()
                return

        # Insert newest first; limit to 100 entries
        self._history.insert(0, entry)
        if len(self._history) > 100:
            self._history.pop()

        self._save_to_disk()

    def get_all(self) -> List[Dict[str, Any]]:
        return self._history

    def clear(self) -> None:
        self._history.clear()
        self._save_to_disk()
