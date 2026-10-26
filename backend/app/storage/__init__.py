"""Experiment Storage Package."""

from app.core.config import settings
from .base import BaseStorageProvider
from .local_store import LocalStorageProvider
from .firebase_store import FirebaseStorageProvider

_provider_instance = None


def get_storage_provider() -> BaseStorageProvider:
    """Singleton factory returning the configured storage provider."""
    global _provider_instance
    if _provider_instance is None:
        if settings.STORAGE_MODE.lower() in ("firebase", "firestore", "cloud"):
            _provider_instance = FirebaseStorageProvider(
                service_account_path=settings.FIREBASE_SERVICE_ACCOUNT_PATH,
                project_id=settings.FIREBASE_PROJECT_ID,
                collection_name=settings.FIRESTORE_COLLECTION,
                fallback_local_path=settings.LOCAL_STORAGE_PATH,
            )
        else:
            _provider_instance = LocalStorageProvider(
                file_path=settings.LOCAL_STORAGE_PATH,
            )
    return _provider_instance


__all__ = [
    "BaseStorageProvider",
    "LocalStorageProvider",
    "FirebaseStorageProvider",
    "get_storage_provider",
]
