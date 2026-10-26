"""Local JSON File-Backed Experiment Storage Provider."""

import os
import json
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from threading import Lock

from .base import BaseStorageProvider
from app.core.config import settings


class LocalStorageProvider(BaseStorageProvider):
    """Stores experiments locally in a persistent JSON document."""

    def __init__(self, file_path: Optional[str] = None):
        self.file_path = file_path or settings.LOCAL_STORAGE_PATH
        self.lock = Lock()
        os.makedirs(os.path.dirname(os.path.abspath(self.file_path)), exist_ok=True)
        if not os.path.exists(self.file_path):
            with open(self.file_path, "w", encoding="utf-8") as f:
                json.dump([], f)

    def _load_all(self) -> List[Dict[str, Any]]:
        with self.lock:
            if not os.path.exists(self.file_path):
                return []
            try:
                with open(self.file_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                return []

    def _save_all(self, records: List[Dict[str, Any]]) -> None:
        with self.lock:
            temp_path = f"{self.file_path}.tmp"
            with open(temp_path, "w", encoding="utf-8") as f:
                json.dump(records, f, indent=2, ensure_ascii=False)
            if os.path.exists(self.file_path):
                os.replace(temp_path, self.file_path)
            else:
                os.rename(temp_path, self.file_path)

    def save_experiment(self, experiment_data: Dict[str, Any]) -> str:
        records = self._load_all()
        exp_id = experiment_data.get("id") or str(uuid.uuid4())
        experiment_data["id"] = exp_id

        if "timestamp" not in experiment_data:
            experiment_data["timestamp"] = datetime.now(timezone.utc).isoformat()

        # Update if exists, else append
        existing_idx = next((i for i, r in enumerate(records) if r.get("id") == exp_id), None)
        if existing_idx is not None:
            records[existing_idx] = experiment_data
        else:
            records.insert(0, experiment_data)

        self._save_all(records)
        return exp_id

    def get_experiment(self, experiment_id: str) -> Optional[Dict[str, Any]]:
        records = self._load_all()
        return next((r for r in records if r.get("id") == experiment_id), None)

    def list_experiments(
        self,
        limit: int = 50,
        modulation: Optional[str] = None,
        channel_type: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        records = self._load_all()

        filtered = records
        if modulation and isinstance(modulation, str):
            mod_upper = modulation.upper()
            filtered = [
                r for r in filtered
                if str(r.get("configuration", {}).get("modulation", "")).upper() == mod_upper
            ]
        if channel_type and isinstance(channel_type, str):
            chan_upper = channel_type.upper()
            filtered = [
                r for r in filtered
                if str(r.get("configuration", {}).get("channel", "")).upper() == chan_upper
            ]

        # Sort descending by timestamp
        filtered.sort(
            key=lambda x: x.get("timestamp", ""),
            reverse=True,
        )
        return filtered[:limit]

    def delete_experiment(self, experiment_id: str) -> bool:
        records = self._load_all()
        initial_len = len(records)
        records = [r for r in records if r.get("id") != experiment_id]
        if len(records) < initial_len:
            self._save_all(records)
            return True
        return False

    def get_status(self) -> Dict[str, Any]:
        count = len(self._load_all())
        return {
            "mode": "local",
            "is_cloud": False,
            "connected": True,
            "storage_target": self.file_path,
            "total_experiments": count,
            "details": "Local file-backed persistence active. All operations work offline without external cloud accounts.",
        }
