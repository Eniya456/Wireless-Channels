"""Application Configuration and Environment Settings."""

import os
from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    APP_NAME: str = "Wireless Channel Simulation & ML Platform"
    APP_VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"

    # Environment: development / production
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Storage settings: "local" or "firebase"
    STORAGE_MODE: str = "local"
    LOCAL_STORAGE_PATH: str = str(BASE_DIR / "data" / "experiments.json")

    # Firebase Firestore settings
    FIREBASE_SERVICE_ACCOUNT_PATH: Optional[str] = None
    FIREBASE_PROJECT_ID: Optional[str] = None
    FIRESTORE_COLLECTION: str = "wireless_experiments"

    # ML Model directory
    MODEL_DIR: str = str(BASE_DIR / "data" / "models")


settings = Settings()
