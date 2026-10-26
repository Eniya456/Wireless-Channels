"""Experiment History and Management API Routes."""

import io
import csv
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import Response

from app.schemas.experiment import (
    ExperimentCreateRequest,
    ExperimentResponse,
    CompareExperimentsRequest,
)
from app.storage import get_storage_provider

router = APIRouter(prefix="/experiments", tags=["Experiments"])


@router.post("", response_model=ExperimentResponse, status_code=status.HTTP_201_CREATED)
def save_experiment(req: ExperimentCreateRequest):
    """Save simulation experiment metadata, configurations, and results."""
    store = get_storage_provider()
    data = req.model_dump()
    exp_id = store.save_experiment(data)
    record = store.get_experiment(exp_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to persist experiment record.",
        )
    return record


@router.get("", response_model=List[ExperimentResponse])
def list_experiments(
    limit: int = Query(default=50, ge=1, le=200),
    modulation: Optional[str] = Query(default=None),
    channel: Optional[str] = Query(default=None),
):
    """Retrieve historical experiments with optional filters."""
    store = get_storage_provider()
    mod_val = modulation if isinstance(modulation, str) else None
    chan_val = channel if isinstance(channel, str) else None
    limit_val = limit if isinstance(limit, int) else 50
    records = store.list_experiments(limit=limit_val, modulation=mod_val, channel_type=chan_val)
    return records


@router.get("/export/csv")
def export_experiments_csv():
    """Export stored experiment history as a downloadable CSV spreadsheet."""
    store = get_storage_provider()
    records = store.list_experiments(limit=500)

    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow([
        "Experiment ID",
        "Timestamp",
        "Title",
        "Modulation",
        "Channel",
        "Nominal SNR (dB)",
        "Effective SNR (dB)",
        "Distance (m)",
        "Speed (m/s)",
        "Path Loss (dB)",
        "Received Power (dBm)",
        "Doppler Shift (Hz)",
        "Total Bits",
        "Bit Errors",
        "BER",
        "Theoretical BER",
        "Effective Throughput (kbps)",
        "ML Predicted Quality",
        "ML Predicted BER",
    ])

    for r in records:
        cfg = r.get("configuration", {})
        m = r.get("metrics", {})
        ml = r.get("ml_prediction", {})
        writer.writerow([
            r.get("id", ""),
            r.get("timestamp", ""),
            r.get("title", ""),
            cfg.get("modulation", ""),
            cfg.get("channel", ""),
            cfg.get("snr_db", ""),
            m.get("effective_snr_db", ""),
            cfg.get("distance_m", ""),
            cfg.get("speed_mps", ""),
            m.get("path_loss_db", ""),
            m.get("received_power_dbm", ""),
            m.get("doppler_shift_hz", ""),
            m.get("total_bits", ""),
            m.get("bit_errors", ""),
            m.get("ber", ""),
            m.get("theoretical_ber", ""),
            m.get("effective_throughput_kbps", ""),
            ml.get("predicted_channel_quality", ""),
            ml.get("predicted_ber", ""),
        ])

    csv_content = output.getvalue()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=wireless_experiments.csv"},
    )


@router.get("/{experiment_id}", response_model=ExperimentResponse)
def get_experiment_by_id(experiment_id: str):
    """Retrieve details of a single experiment by ID."""
    store = get_storage_provider()
    record = store.get_experiment(experiment_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Experiment '{experiment_id}' not found.",
        )
    return record


@router.delete("/{experiment_id}", status_code=status.HTTP_200_OK)
def delete_experiment_by_id(experiment_id: str):
    """Delete an experiment record by ID."""
    store = get_storage_provider()
    deleted = store.delete_experiment(experiment_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Experiment '{experiment_id}' not found.",
        )
    return {"status": "success", "message": f"Experiment '{experiment_id}' deleted."}


@router.post("/compare")
def compare_experiments(req: CompareExperimentsRequest):
    """Compare performance across multiple selected experiments."""
    store = get_storage_provider()
    selected_records = []
    missing_ids = []

    for exp_id in req.experiment_ids:
        rec = store.get_experiment(exp_id)
        if rec:
            selected_records.append(rec)
        else:
            missing_ids.append(exp_id)

    if missing_ids:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Experiments not found: {missing_ids}",
        )

    # Comparative analysis summary
    comparison_summary = []
    for r in selected_records:
        cfg = r.get("configuration", {})
        m = r.get("metrics", {})
        ml = r.get("ml_prediction", {})
        comparison_summary.append({
            "id": r.get("id"),
            "title": r.get("title"),
            "timestamp": r.get("timestamp"),
            "modulation": cfg.get("modulation"),
            "channel": cfg.get("channel"),
            "snr_db": cfg.get("snr_db"),
            "effective_snr_db": m.get("effective_snr_db"),
            "distance_m": cfg.get("distance_m"),
            "speed_mps": cfg.get("speed_mps"),
            "path_loss_db": m.get("path_loss_db"),
            "received_power_dbm": m.get("received_power_dbm"),
            "ber": m.get("ber"),
            "theoretical_ber": m.get("theoretical_ber"),
            "effective_throughput_kbps": m.get("effective_throughput_kbps"),
            "doppler_shift_hz": m.get("doppler_shift_hz"),
            "predicted_quality": ml.get("predicted_channel_quality", "N/A"),
        })

    return {
        "count": len(comparison_summary),
        "experiments": comparison_summary,
    }
