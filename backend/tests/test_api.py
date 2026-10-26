"""Integration and Functional Unit Tests for API Endpoints."""

import pytest
from app.main import root
from app.api.routes_simulation import run_single, run_batch, get_config_options
from app.api.routes_ml import predict_channel_quality, get_evaluation
from app.api.routes_experiments import (
    save_experiment,
    list_experiments,
    get_experiment_by_id,
    delete_experiment_by_id,
    compare_experiments,
    export_experiments_csv,
)
from app.api.routes_system import get_system_status
from app.schemas.simulation import SingleSimulationRequest, BatchSimulationRequest
from app.schemas.ml import MLPredictionRequest
from app.schemas.experiment import ExperimentCreateRequest, CompareExperimentsRequest


def test_root_endpoint():
    """Verify application health and discovery endpoint."""
    res = root()
    assert res["status"] == "online"
    assert "version" in res


def test_config_options_endpoint():
    """Verify supported configurations API."""
    res = get_config_options()
    assert "BPSK" in res["modulations"]
    assert "QPSK" in res["modulations"]
    assert "AWGN" in res["channels"]
    assert "RAYLEIGH" in res["channels"]


def test_single_simulation_endpoint():
    """Verify execution of single point simulation via API."""
    req = SingleSimulationRequest(
        modulation="BPSK",
        channel="AWGN",
        snr_db=8.0,
        num_bits=50_000,
        distance_m=50.0,
        speed_mps=10.0,
        carrier_frequency_hz=2.4e9,
        random_seed=42,
    )
    res = run_single(req)

    assert "metrics" in res
    assert "constellation_samples" in res
    metrics = res["metrics"]
    assert metrics["total_bits"] == 50_000
    assert 0.0 <= metrics["ber"] <= 1.0
    assert metrics["execution_time_ms"] > 0
    assert len(res["constellation_samples"]) > 0


def test_batch_simulation_endpoint():
    """Verify batch sweep across SNR values."""
    req = BatchSimulationRequest(
        modulation="BPSK",
        channel="AWGN",
        snr_start=0.0,
        snr_end=6.0,
        snr_step=3.0,
        num_bits_per_snr=10_000,
        distance_m=50.0,
        random_seed=100,
    )
    res = run_batch(req)

    points = res["points"]
    assert len(points) == 3  # 0, 3, 6 dB
    assert points[0]["ber"] > points[-1]["ber"]


def test_ml_prediction_endpoint():
    """Verify machine learning inference endpoint."""
    req = MLPredictionRequest(
        snr_db=15.0,
        modulation="BPSK",
        channel_type="AWGN",
        distance_m=50.0,
        speed_mps=0.0,
        path_loss_exponent=3.0,
    )
    res = predict_channel_quality(req)

    assert res["predicted_channel_quality"] in ["Good", "Moderate", "Poor"]
    assert "confidence_scores" in res
    assert "predicted_ber" in res


def test_ml_evaluation_endpoint():
    """Verify model evaluation report endpoint."""
    res = get_evaluation()

    assert "classification" in res
    assert "confusion_matrix" in res["classification"]
    assert "accuracy" in res["classification"]


def test_experiment_persistence_and_retrieval():
    """Verify experiment save, list, get, export, compare, and delete lifecycle."""
    req = ExperimentCreateRequest(
        title="API Functional Test Run",
        description="Lifecycle test for experiment management",
        configuration={
            "modulation": "QPSK",
            "channel": "RAYLEIGH",
            "snr_db": 12.0,
            "num_bits": 50_000,
            "distance_m": 50.0,
            "speed_mps": 15.0,
        },
        metrics={
            "ber": 0.015,
            "bit_errors": 750,
            "total_bits": 50_000,
            "effective_throughput_kbps": 197.0,
            "received_power_dbm": -45.0,
            "doppler_shift_hz": 120.0,
        },
        ml_prediction={
            "predicted_channel_quality": "Moderate",
            "predicted_ber": 0.018,
        },
        tags=["test", "qpsk", "rayleigh"],
    )

    # 1. Create
    created = save_experiment(req)
    exp_id = created["id"]
    assert exp_id is not None

    # 2. Get by ID
    fetched = get_experiment_by_id(exp_id)
    assert fetched["title"] == "API Functional Test Run"

    # 3. List
    records = list_experiments(limit=10)
    assert any(r["id"] == exp_id for r in records)

    # 4. Compare
    comp = compare_experiments(CompareExperimentsRequest(experiment_ids=[exp_id, exp_id]))
    assert comp["count"] == 2

    # 5. Export CSV
    csv_res = export_experiments_csv()
    assert csv_res.media_type == "text/csv"
    assert exp_id in csv_res.body.decode("utf-8")

    # 6. Delete
    del_res = delete_experiment_by_id(exp_id)
    assert del_res["status"] == "success"


def test_system_status_endpoint():
    """Verify diagnostics and system health."""
    res = get_system_status()
    assert res["status"] == "healthy"
    assert "storage" in res
    assert "machine_learning" in res
    assert len(res["supported_features"]) > 0


def test_fastapi_http_client_and_error_handling():
    """Verify full FastAPI HTTP request handling, 404 and 422 error structures."""
    from fastapi.testclient import TestClient
    from app.main import app

    with TestClient(app) as client:
        # 1. Health check
        res = client.get("/")
        assert res.status_code == 200
        assert res.json()["status"] == "online"

        # 2. 404 Handling: verify it returns 404 NOT 500
        res404 = client.get("/api/experiments/non-existent-experiment-id")
        assert res404.status_code == 404
        assert "detail" in res404.json()

        # 3. 422 Validation Error
        res422 = client.post("/api/simulation/run", json={"snr_db": "not-a-number"})
        assert res422.status_code == 422
        assert "detail" in res422.json()
