"""Google Cloud Firebase Firestore Experiment Storage Provider."""

import os
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

from .base import BaseStorageProvider
from .local_store import LocalStorageProvider
from app.core.config import settings


class FirebaseStorageProvider(BaseStorageProvider):
    """Stores experiments in Google Cloud Firestore using Firebase Admin SDK."""

    def __init__(
        self,
        service_account_path: Optional[str] = None,
        project_id: Optional[str] = None,
        collection_name: str = "wireless_experiments",
        fallback_local_path: Optional[str] = None,
    ):
        self.service_account_path = service_account_path
        self.project_id = project_id
        self.collection_name = collection_name
        self.db = None
        self.is_connected = False
        self.init_error = None
        self.local_fallback = LocalStorageProvider(fallback_local_path or settings.LOCAL_STORAGE_PATH)

        self._initialize_firebase()

    def _initialize_firebase(self):
        """Attempt initialization of Firebase Admin SDK."""
        try:
            import firebase_admin
            from firebase_admin import credentials, firestore

            # Check if an app is already initialized
            if not firebase_admin._apps:
                cred = None
                if self.service_account_path and os.path.exists(self.service_account_path):
                    cred = credentials.Certificate(self.service_account_path)
                elif os.environ.get("GOOGLE_APPLICATION_CREDENTIALS") and os.path.exists(
                    os.environ["GOOGLE_APPLICATION_CREDENTIALS"]
                ):
                    cred = credentials.Certificate(os.environ["GOOGLE_APPLICATION_CREDENTIALS"])

                if cred:
                    firebase_admin.initialize_app(cred, {"projectId": self.project_id} if self.project_id else None)
                else:
                    self.init_error = (
                        "Firebase credentials not found. Provide FIREBASE_SERVICE_ACCOUNT_PATH "
                        "in .env or set GOOGLE_APPLICATION_CREDENTIALS."
                    )
                    return

            self.db = firestore.client()
            self.is_connected = True
        except Exception as e:
            self.is_connected = False
            self.init_error = f"Firebase initialization failed: {str(e)}"

    def save_experiment(self, experiment_data: Dict[str, Any]) -> str:
        if not self.is_connected or self.db is None:
            # Fall back to local store
            return self.local_fallback.save_experiment(experiment_data)

        exp_id = experiment_data.get("id") or str(uuid.uuid4())
        experiment_data["id"] = exp_id
        if "timestamp" not in experiment_data:
            experiment_data["timestamp"] = datetime.now(timezone.utc).isoformat()

        doc_ref = self.db.collection(self.collection_name).document(exp_id)
        doc_ref.set(experiment_data)
        # Also sync to local store for offline redundancy
        self.local_fallback.save_experiment(experiment_data)
        return exp_id

    def get_experiment(self, experiment_id: str) -> Optional[Dict[str, Any]]:
        if not self.is_connected or self.db is None:
            return self.local_fallback.get_experiment(experiment_id)

        try:
            doc_ref = self.db.collection(self.collection_name).document(experiment_id)
            doc = doc_ref.get()
            if doc.exists:
                return doc.to_dict()
        except Exception:
            pass
        return self.local_fallback.get_experiment(experiment_id)

    def list_experiments(
        self,
        limit: int = 50,
        modulation: Optional[str] = None,
        channel_type: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        if not self.is_connected or self.db is None:
            return self.local_fallback.list_experiments(limit, modulation, channel_type)

        try:
            query = self.db.collection(self.collection_name)
            if modulation:
                query = query.where("configuration.modulation", "==", modulation.upper())
            if channel_type:
                query = query.where("configuration.channel", "==", channel_type.upper())

            docs = query.order_by("timestamp", direction="DESCENDING").limit(limit).stream()
            results = [doc.to_dict() for doc in docs]
            if results:
                return results
        except Exception:
            pass

        return self.local_fallback.list_experiments(limit, modulation, channel_type)

    def delete_experiment(self, experiment_id: str) -> bool:
        deleted = False
        if self.is_connected and self.db is not None:
            try:
                self.db.collection(self.collection_name).document(experiment_id).delete()
                deleted = True
            except Exception:
                pass
        local_del = self.local_fallback.delete_experiment(experiment_id)
        return deleted or local_del

    def get_status(self) -> Dict[str, Any]:
        if self.is_connected and self.db is not None:
            return {
                "mode": "firebase",
                "is_cloud": True,
                "connected": True,
                "storage_target": f"Firestore Collection '{self.collection_name}'",
                "project_id": self.project_id or "Auto-detected",
                "details": "Connected to Google Cloud Firestore. Experiments synchronize to cloud database.",
            }
        else:
            return {
                "mode": "firebase_fallback_local",
                "is_cloud": False,
                "connected": False,
                "storage_target": self.local_fallback.file_path,
                "error": self.init_error or "Cloud credentials not configured",
                "details": "Cloud mode was requested, but valid Firebase credentials were not detected. Falling back to local persistent storage.",
            }
