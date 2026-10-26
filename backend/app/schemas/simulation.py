"""Pydantic Request and Response Schemas for Wireless Simulation."""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from app.wireless.modulation import ModulationType
from app.wireless.channels import ChannelType
from app.wireless.receiver import EqualizerType


class SingleSimulationRequest(BaseModel):
    modulation: ModulationType = Field(default=ModulationType.BPSK, description="Modulation scheme")
    channel: ChannelType = Field(default=ChannelType.AWGN, description="Channel propagation model")
    snr_db: float = Field(default=10.0, ge=-20.0, le=50.0, description="Nominal SNR in dB")
    num_bits: int = Field(default=100_000, ge=1_000, le=2_000_000, description="Transmitted bits count")
    distance_m: float = Field(default=50.0, ge=1.0, le=10_000.0, description="Receiver distance in meters")
    reference_distance_m: float = Field(default=50.0, ge=0.1, le=1000.0, description="Path loss reference distance")
    path_loss_exponent: float = Field(default=3.0, ge=1.5, le=5.0, description="Path loss exponent (n)")
    speed_mps: float = Field(default=0.0, ge=0.0, le=300.0, description="Receiver speed in m/s")
    carrier_frequency_hz: float = Field(default=2.4e9, ge=1e6, le=100e9, description="RF Carrier frequency in Hz")
    symbol_rate_sps: float = Field(default=100_000.0, ge=1e3, le=100e6, description="Baud rate (symbols/sec)")
    equalizer: EqualizerType = Field(default=EqualizerType.MMSE, description="Equalization detector type")
    random_seed: Optional[int] = Field(default=None, description="Reproducible random seed")
    max_constellation_points: int = Field(default=200, ge=0, le=1000, description="Number of sample constellation dots")


class BatchSimulationRequest(BaseModel):
    modulation: ModulationType = Field(default=ModulationType.BPSK)
    channel: ChannelType = Field(default=ChannelType.AWGN)
    snr_start: float = Field(default=0.0, ge=-20.0, le=40.0)
    snr_end: float = Field(default=20.0, ge=-20.0, le=50.0)
    snr_step: float = Field(default=2.0, ge=0.5, le=10.0)
    num_bits_per_snr: int = Field(default=50_000, ge=1_000, le=500_000)
    distance_m: float = Field(default=50.0, ge=1.0, le=10_000.0)
    speed_mps: float = Field(default=0.0, ge=0.0, le=300.0)
    carrier_frequency_hz: float = Field(default=2.4e9)
    path_loss_exponent: float = Field(default=3.0, ge=1.5, le=5.0)
    equalizer: EqualizerType = Field(default=EqualizerType.MMSE)
    random_seed: Optional[int] = Field(default=None)


class SimulationMetricsResponse(BaseModel):
    total_bits: int
    bit_errors: int
    ber: float
    theoretical_ber: float
    nominal_snr_db: float
    effective_snr_db: float
    path_loss_db: float
    received_power_dbm: float
    received_power_mw: float
    doppler_shift_hz: float
    coherence_time_s: float
    raw_bit_rate_kbps: float
    effective_throughput_kbps: float
    packet_throughput_kbps: float
    packet_success_rate: float
    execution_time_ms: float


class ConstellationPoint(BaseModel):
    tx_i: float
    tx_q: float
    rx_i: float
    rx_q: float
    faded_i: float
    faded_q: float


class SingleSimulationResponse(BaseModel):
    configuration: Dict[str, Any]
    metrics: SimulationMetricsResponse
    constellation_samples: List[ConstellationPoint]


class BatchPointResponse(BaseModel):
    snr_db: float
    effective_snr_db: float
    ber: float
    theoretical_ber: float
    bit_errors: int
    total_bits: int
    effective_throughput_kbps: float
    received_power_dbm: float


class BatchSimulationResponse(BaseModel):
    configuration: Dict[str, Any]
    points: List[BatchPointResponse]
