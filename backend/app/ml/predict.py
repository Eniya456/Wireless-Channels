"""Machine Learning Inference Service Module.

Provides online inference for:
- Channel quality classification with class confidence scores
- Numerical BER estimation
Handles automated calculation of derived wireless features if not supplied.
"""

import os
import json
from typing import Dict, Any, Optional
import joblib
import numpy as np
import pandas as pd

from app.wireless.channels import (
    calculate_doppler_shift,
    calculate_path_loss_db,
    calculate_received_power_dbm,
)
from app.core.config import settings
from .train import preprocess_features, CLASSES, FEATURE_COLS_NUMERIC


class MLPredictor:
    """Loads trained artifacts and performs online inference."""

    def __init__(self, model_dir: Optional[str] = None):
        self.model_dir = model_dir or settings.MODEL_DIR
        self.classifier = None
        self.regressor = None
        self.scaler = None
        self.evaluation_report = None
        self.load_models()

    def load_models(self) -> bool:
        """Load persisted models and scalers if they exist."""
        clf_path = os.path.join(self.model_dir, "channel_quality_classifier.joblib")
        reg_path = os.path.join(self.model_dir, "ber_regressor.joblib")
        scaler_path = os.path.join(self.model_dir, "feature_scaler.joblib")
        eval_path = os.path.join(self.model_dir, "evaluation_metrics.json")

        if (
            os.path.exists(clf_path)
            and os.path.exists(reg_path)
            and os.path.exists(scaler_path)
        ):
            self.classifier = joblib.load(clf_path)
            self.regressor = joblib.load(reg_path)
            self.scaler = joblib.load(scaler_path)

            if os.path.exists(eval_path):
                with open(eval_path, "r") as f:
                    self.evaluation_report = json.load(f)
            return True
        return False

    @property
    def is_ready(self) -> bool:
        return self.classifier is not None and self.regressor is not None and self.scaler is not None

    def predict(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Run ML prediction on input features."""
        if not self.is_ready:
            # Try reloading in case trained recently
            if not self.load_models():
                raise RuntimeError("ML models not trained or loaded. Please train models first.")

        # Extract or compute required features
        snr_db = float(input_data.get("snr_db", 10.0))
        dist_m = float(input_data.get("distance_m", 100.0))
        speed_mps = float(input_data.get("speed_mps", 0.0))
        ple = float(input_data.get("path_loss_exponent", 3.0))
        fc = float(input_data.get("carrier_frequency_hz", 2.4e9))
        mod = str(input_data.get("modulation", "BPSK")).upper()
        chan = str(input_data.get("channel_type", "AWGN")).upper()

        ref_dist = float(input_data.get("reference_distance_m", 50.0))

        # Compute derived channel features if missing
        if input_data.get("effective_snr_db") is not None:
            effective_snr_db = float(input_data["effective_snr_db"])
        else:
            dist_attenuation = 10.0 * ple * np.log10(max(dist_m, 1.0) / ref_dist)
            effective_snr_db = snr_db - dist_attenuation

        if input_data.get("path_loss_db") is not None:
            pl_db = float(input_data["path_loss_db"])
        else:
            pl_db = calculate_path_loss_db(dist_m, ref_dist, 38.0, ple)

        if input_data.get("received_power_dbm") is not None:
            rx_power = float(input_data["received_power_dbm"])
        else:
            rx_power = calculate_received_power_dbm(20.0, pl_db)

        if input_data.get("doppler_shift_hz") is not None:
            doppler = float(input_data["doppler_shift_hz"])
        else:
            doppler = calculate_doppler_shift(speed_mps, fc)

        sample_df = pd.DataFrame([{
            "effective_snr_db": effective_snr_db,
            "distance_m": dist_m,
            "speed_mps": speed_mps,
            "path_loss_exponent": ple,
            "received_power_dbm": rx_power,
            "doppler_shift_hz": doppler,
            "modulation": mod,
            "channel_type": chan,
        }])

        X_sample, _, _ = preprocess_features(sample_df, scaler=self.scaler, fit_scaler=False)

        # Classification
        pred_class = str(self.classifier.predict(X_sample)[0])
        probas = self.classifier.predict_proba(X_sample)[0]
        prob_dict = {
            cls_name: round(float(prob), 4)
            for cls_name, prob in zip(self.classifier.classes_, probas)
        }

        # Regression
        pred_ber = float(self.regressor.predict(X_sample)[0])
        pred_ber = float(np.clip(pred_ber, 0.0, 0.5))

        # Classification criteria explanation
        criteria_explanation = {
            "Good": "BER < 0.001 (Minimal packet loss, optimal for real-time traffic)",
            "Moderate": "0.001 <= BER <= 0.05 (Tolerable for buffered media, standard ARQ recovers lost frames)",
            "Poor": "BER > 0.05 (Severe corruption, high retransmissions, possible radio link failure)",
        }

        return {
            "predicted_channel_quality": pred_class,
            "confidence_scores": prob_dict,
            "predicted_ber": round(pred_ber, 6),
            "quality_criteria": criteria_explanation.get(pred_class, ""),
            "model_version": self.evaluation_report.get("version", "1.0.0") if self.evaluation_report else "1.0.0",
            "derived_features": {
                "effective_snr_db": round(effective_snr_db, 2),
                "path_loss_db": round(pl_db, 2),
                "received_power_dbm": round(rx_power, 2),
                "doppler_shift_hz": round(doppler, 2),
            },
        }

    def get_evaluation_metrics(self) -> Dict[str, Any]:
        """Return held-out test evaluation report."""
        if not self.is_ready:
            self.load_models()
        return self.evaluation_report or {}
