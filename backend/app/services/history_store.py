"""
In-Memory Session History Store
--------------------------------
Why this file exists:
Implements generation tracking and monitoring for the course's evaluation module.
Keeps state in-memory without requiring an external database (PostgreSQL/Redis),
adhering to the zero-extra-services constraint.
"""

from typing import List, Dict, Any
import time

class HistoryStore:
    _instance = None

    def __init__(self):
        self._history: List[Dict[str, Any]] = []

    @classmethod
    def get_instance(cls) -> "HistoryStore":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def add_entry(self, entry: Dict[str, Any]) -> None:
        entry["timestamp"] = time.time()
        # Keep newest first, limit to 50 entries to preserve memory
        self._history.insert(0, entry)
        if len(self._history) > 50:
            self._history.pop()

    def get_all(self) -> List[Dict[str, Any]]:
        return self._history

    def clear(self) -> None:
        self._history.clear()
