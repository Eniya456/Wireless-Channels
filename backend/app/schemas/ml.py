"""Pydantic Request and Response Schemas for Machine Learning."""

from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class MLPredictionRequest(BaseModel):
    snr_db: float = Field(default=10.0, description="Nominal SNR in dB")
    modulation: str = Field(default="BPSK", description="Modulation: BPSK or QPSK")
    channel_type: str = Field(default="AWGN", description="Channel: AWGN or RAYLEIGH")
    distance_m: float = Field(default=50.0, ge=1.0, description="Distance in meters")
    reference_distance_m: float = Field(default=50.0, ge=0.1, description="Path loss reference distance")
    speed_mps: float = Field(default=0.0, ge=0.0, description="Speed in m/s")
    path_loss_exponent: float = Field(default=3.0, ge=1.5, le=5.0, description="Path loss exponent")
    carrier_frequency_hz: float = Field(default=2.4e9, description="RF carrier frequency in Hz")
    effective_snr_db: Optional[float] = None
    path_loss_db: Optional[float] = None
    received_power_dbm: Optional[float] = None
    doppler_shift_hz: Optional[float] = None


class MLPredictionResponse(BaseModel):
    predicted_channel_quality: str
    confidence_scores: Dict[str, float]
    predicted_ber: float
    quality_criteria: str
    model_version: str
    derived_features: Dict[str, float]


class MLEvaluationResponse(BaseModel):
    version: str
    dataset_total_samples: int
    train_samples: int
    test_samples: int
    classes: List[str]
    classification: Dict[str, Any]
    regression: Dict[str, Any]
    disclaimer: str
