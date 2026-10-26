"""Machine Learning Dataset Generation Module.

Generates a physically grounded, reproducible dataset by invoking the
wireless simulation engine across diverse operational parameters:
- SNR (-5 to 25 dB)
- Modulation (BPSK, QPSK)
- Channel type (AWGN, RAYLEIGH)
- Distance (5 m to 500 m)
- Speed (0 to 120 km/h)
- Path-loss exponent (2.0 to 4.0)

Assigns ground-truth Channel Quality classes based on communication thresholds:
- Good: BER < 0.001 (High quality, reliable link for VoIP / streaming)
- Moderate: 0.001 <= BER <= 0.05 (Usable with standard FEC / retransmissions)
- Poor: BER > 0.05 (Severe error rate, link degraded or dropped)
"""

import os
from typing import Dict, Any, List, Tuple
import numpy as np
import pandas as pd

from app.wireless.modulation import ModulationType
from app.wireless.channels import ChannelType
from app.wireless.receiver import EqualizerType
from app.wireless.simulator import SimulatorEngine


def assign_channel_quality_label(ber: float) -> str:
    """Assign categorical channel quality based on empirical BER."""
    if ber < 0.001:
        return "Good"
    elif ber <= 0.05:
        return "Moderate"
    else:
        return "Poor"


def generate_simulation_dataset(
    num_samples_target: int = 1200,
    random_seed: int = 42,
    bits_per_point: int = 30_000,
) -> pd.DataFrame:
    """Generate structured synthetic dataset from true physical simulation runs."""
    rng = np.random.default_rng(random_seed)
    engine = SimulatorEngine()
    records: List[Dict[str, Any]] = []

    # Parameter sampling spaces
    modulations = [ModulationType.BPSK, ModulationType.QPSK]
    channels = [ChannelType.AWGN, ChannelType.RAYLEIGH]
    snr_levels = np.linspace(0.0, 30.0, 31)  # 0 to 30 dB
    distances = [10.0, 25.0, 50.0, 80.0, 120.0, 200.0]
    speeds_kmh = [0.0, 15.0, 30.0, 60.0, 90.0, 120.0]
    ple_values = [2.0, 2.5, 3.0, 3.5]

    count = 0
    # Systematic grid sampling with randomized parameter combinations
    for i in range(num_samples_target):
        mod = modulations[int(rng.integers(0, len(modulations)))]
        chan = channels[int(rng.integers(0, len(channels)))]
        snr = float(rng.choice(snr_levels))
        dist = float(rng.choice(distances))
        speed_kmh = float(rng.choice(speeds_kmh))
        speed_mps = speed_kmh / 3.6
        ple = float(rng.choice(ple_values))
        fc = 2.4e9
        seed = int(random_seed + i)

        res = engine.run_single_simulation(
            mod_type=mod,
            channel_type=chan,
            snr_db=snr,
            num_bits=bits_per_point,
            distance_m=dist,
            reference_distance_m=50.0,
            reference_loss_db=38.0,
            path_loss_exponent=ple,
            speed_mps=speed_mps,
            carrier_frequency_hz=fc,
            equalizer_type=EqualizerType.MMSE,
            random_seed=seed,
            max_constellation_points=0,
        )

        metrics = res["metrics"]
        ber = metrics["ber"]
        quality = assign_channel_quality_label(ber)

        records.append({
            "snr_db": snr,
            "effective_snr_db": metrics["effective_snr_db"],
            "modulation": mod.value,
            "channel_type": chan.value,
            "distance_m": dist,
            "speed_mps": round(speed_mps, 2),
            "speed_kmh": round(speed_kmh, 1),
            "path_loss_exponent": ple,
            "carrier_frequency_hz": fc,
            "path_loss_db": metrics["path_loss_db"],
            "received_power_dbm": metrics["received_power_dbm"],
            "doppler_shift_hz": metrics["doppler_shift_hz"],
            "raw_bit_rate_kbps": metrics["raw_bit_rate_kbps"],
            "effective_throughput_kbps": metrics["effective_throughput_kbps"],
            "ber": ber,
            "theoretical_ber": metrics["theoretical_ber"],
            "channel_quality": quality,
        })
        count += 1

    df = pd.DataFrame(records)
    return df
