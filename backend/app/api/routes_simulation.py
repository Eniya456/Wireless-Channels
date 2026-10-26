"""Wireless Simulation API Routes."""

from fastapi import APIRouter, HTTPException, status
from app.schemas.simulation import (
    SingleSimulationRequest,
    SingleSimulationResponse,
    BatchSimulationRequest,
    BatchSimulationResponse,
)
from app.wireless.simulator import SimulatorEngine
from app.wireless.modulation import ModulationType
from app.wireless.channels import ChannelType
from app.wireless.receiver import EqualizerType

router = APIRouter(prefix="/simulation", tags=["Wireless Simulation"])
engine = SimulatorEngine()


@router.post("/run", response_model=SingleSimulationResponse)
def run_single(req: SingleSimulationRequest):
    """Execute single point digital wireless simulation."""
    try:
        result = engine.run_single_simulation(
            mod_type=req.modulation,
            channel_type=req.channel,
            snr_db=req.snr_db,
            num_bits=req.num_bits,
            distance_m=req.distance_m,
            reference_distance_m=req.reference_distance_m,
            path_loss_exponent=req.path_loss_exponent,
            speed_mps=req.speed_mps,
            carrier_frequency_hz=req.carrier_frequency_hz,
            symbol_rate_sps=req.symbol_rate_sps,
            equalizer_type=req.equalizer,
            random_seed=req.random_seed,
            max_constellation_points=req.max_constellation_points,
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Simulation calculation error: {str(e)}",
        )


@router.post("/batch", response_model=BatchSimulationResponse)
def run_batch(req: BatchSimulationRequest):
    """Execute batch simulation sweeping across an SNR range."""
    if req.snr_start >= req.snr_end:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="snr_start must be strictly less than snr_end",
        )

    try:
        result = engine.run_batch_simulation(
            mod_type=req.modulation,
            channel_type=req.channel,
            snr_start=req.snr_start,
            snr_end=req.snr_end,
            snr_step=req.snr_step,
            num_bits_per_snr=req.num_bits_per_snr,
            distance_m=req.distance_m,
            speed_mps=req.speed_mps,
            carrier_frequency_hz=req.carrier_frequency_hz,
            path_loss_exponent=req.path_loss_exponent,
            equalizer_type=req.equalizer,
            random_seed=req.random_seed,
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch simulation error: {str(e)}",
        )


@router.get("/config-options")
def get_config_options():
    """Retrieve supported wireless modulation, channel, and equalizer configurations."""
    return {
        "modulations": [m.value for m in ModulationType],
        "channels": [c.value for c in ChannelType],
        "equalizers": [e.value for e in EqualizerType],
        "defaults": {
            "modulation": "BPSK",
            "channel": "AWGN",
            "snr_db": 10.0,
            "num_bits": 100_000,
            "distance_m": 50.0,
            "reference_distance_m": 50.0,
            "path_loss_exponent": 3.0,
            "speed_mps": 0.0,
            "carrier_frequency_hz": 2.4e9,
            "equalizer": "MMSE",
        },
    }
