"""Machine Learning Evaluation and Reporting Utilities."""

import os
import json
from typing import Dict, Any, Optional
from app.core.config import settings


def load_evaluation_report(model_dir: Optional[str] = None) -> Dict[str, Any]:
    """Load evaluation metrics JSON file."""
    effective_dir = model_dir or settings.MODEL_DIR
    eval_file = os.path.join(effective_dir, "evaluation_metrics.json")
    if os.path.exists(eval_file):
        with open(eval_file, "r") as f:
            return json.load(f)
    return {
        "status": "not_trained",
        "message": "Model evaluation metrics are not available. Please trigger model training.",
    }
