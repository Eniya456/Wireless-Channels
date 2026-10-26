"""Machine Learning API Routes."""

from fastapi import APIRouter, HTTPException, status
from app.schemas.ml import MLPredictionRequest, MLPredictionResponse, MLEvaluationResponse
from app.ml.predict import MLPredictor
from app.ml.evaluation import load_evaluation_report
from app.core.config import settings

router = APIRouter(prefix="/ml", tags=["Machine Learning"])
predictor = MLPredictor(model_dir=settings.MODEL_DIR)


@router.post("/predict", response_model=MLPredictionResponse)
def predict_channel_quality(req: MLPredictionRequest):
    """Predict channel quality class and BER from simulation features."""
    try:
        prediction = predictor.predict(req.model_dump())
        return prediction
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference error: {str(e)}",
        )


@router.get("/evaluation", response_model=MLEvaluationResponse)
def get_evaluation():
    """Retrieve held-out test evaluation report, confusion matrix, and feature importances."""
    report = load_evaluation_report(model_dir=settings.MODEL_DIR)
    if "status" in report and report["status"] == "not_trained":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=report["message"],
        )
    return report
