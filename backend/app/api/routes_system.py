"""System Status and Diagnostics API Routes."""

from fastapi import APIRouter
from app.core.config import settings
from app.storage import get_storage_provider
from app.ml.predict import MLPredictor

router = APIRouter(prefix="/system", tags=["System Diagnostics"])


@router.get("/status")
def get_system_status():
    """Retrieve full system health, cloud storage mode, and ML status."""
    store = get_storage_provider()
    storage_info = store.get_status()

    predictor = MLPredictor(model_dir=settings.MODEL_DIR)
    ml_ready = predictor.is_ready
    eval_report = predictor.get_evaluation_metrics() or {}

    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "storage": storage_info,
        "machine_learning": {
            "status": "ready" if ml_ready else "not_trained",
            "model_version": eval_report.get("version", "unknown"),
            "classification_accuracy": (
                eval_report.get("classification", {}).get("accuracy")
            ),
            "regression_r2": (
                eval_report.get("regression", {}).get("r2_score")
            ),
        },
        "supported_features": [
            "BPSK and QPSK digital modulation",
            "AWGN and Rayleigh flat-fading channels",
            "Log-distance path loss attenuation",
            "Mobility and Doppler shift estimation",
            "Zero-Forcing and MMSE receiver equalization",
            "Channel Quality ML classification",
            "Empirical BER regression",
            "Persistent experiment storage (Local / Firestore)",
        ],
    }
