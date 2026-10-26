"""Unit Tests for Machine Learning Pipeline and Inference."""

import os
import pytest
import numpy as np
import pandas as pd

from app.ml.dataset import assign_channel_quality_label, generate_simulation_dataset
from app.ml.predict import MLPredictor
from app.ml.evaluation import load_evaluation_report


def test_channel_quality_labeling():
    """Verify ground truth class boundaries."""
    assert assign_channel_quality_label(0.0001) == "Good"
    assert assign_channel_quality_label(0.001) == "Moderate"
    assert assign_channel_quality_label(0.04) == "Moderate"
    assert assign_channel_quality_label(0.051) == "Poor"
    assert assign_channel_quality_label(0.35) == "Poor"


def test_dataset_generation_structure():
    """Verify generated dataset contains expected features and physically plausible values."""
    df = generate_simulation_dataset(num_samples_target=20, random_seed=123, bits_per_point=5000)

    required_cols = [
        "snr_db",
        "effective_snr_db",
        "modulation",
        "channel_type",
        "distance_m",
        "speed_mps",
        "path_loss_exponent",
        "received_power_dbm",
        "doppler_shift_hz",
        "ber",
        "channel_quality",
    ]
    for col in required_cols:
        assert col in df.columns

    assert len(df) == 20
    assert (df["ber"] >= 0.0).all() and (df["ber"] <= 0.55).all()
    assert set(df["channel_quality"].unique()).issubset({"Good", "Moderate", "Poor"})


def test_ml_predictor_inference():
    """Verify online inference with real trained models."""
    predictor = MLPredictor(model_dir="backend/data/models")
    assert predictor.is_ready

    # High SNR, short distance -> expected Good
    res_high_snr = predictor.predict({
        "snr_db": 25.0,
        "modulation": "BPSK",
        "channel_type": "AWGN",
        "distance_m": 15.0,
        "speed_mps": 0.0,
        "path_loss_exponent": 2.5,
    })

    assert res_high_snr["predicted_channel_quality"] == "Good"
    assert res_high_snr["predicted_ber"] < 0.02
    assert "Good" in res_high_snr["confidence_scores"]
    assert res_high_snr["confidence_scores"]["Good"] > 0.5

    # Low SNR, long distance -> expected Poor
    res_low_snr = predictor.predict({
        "snr_db": -2.0,
        "modulation": "QPSK",
        "channel_type": "RAYLEIGH",
        "distance_m": 250.0,
        "speed_mps": 30.0,
        "path_loss_exponent": 3.5,
    })

    assert res_low_snr["predicted_channel_quality"] == "Poor"
    assert res_low_snr["predicted_ber"] > 0.05
    assert res_low_snr["confidence_scores"]["Poor"] > 0.5


def test_evaluation_report():
    """Verify evaluation report schema and integrity."""
    report = load_evaluation_report(model_dir="backend/data/models")

    assert report["version"] == "1.0.0"
    assert "classification" in report
    assert "regression" in report
    assert 0.0 <= report["classification"]["accuracy"] <= 1.0
    assert report["regression"]["mae"] >= 0.0
    assert "disclaimer" in report
