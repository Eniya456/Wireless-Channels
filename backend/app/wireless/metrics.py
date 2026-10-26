"""Performance Metrics and Throughput Calculation Module.

Calculates:
- Bit Error Rate (BER)
- Bit Errors & Total Transmitted Bits
- Received Power (dBm and mW)
- Throughput Estimate (kbps and Mbps)
- Maximum Doppler Shift (Hz) & Coherence Time
- Execution Timing
"""

import time
from typing import Dict, Any, Optional
import numpy as np
from .modulation import ModulationType, get_bits_per_symbol
from .receiver import calculate_theoretical_ber


def calculate_throughput_estimates(
    ber: float,
    mod_type: ModulationType,
    symbol_rate_sps: float = 100_000.0,
    packet_length_bits: int = 1024,
) -> Dict[str, float]:
    """Calculate explicit throughput metrics based on transmission speed and errors.

    Definitions:
        - raw_bit_rate_bps = symbol_rate_sps * bits_per_symbol
        - bit_throughput_bps = raw_bit_rate_bps * (1.0 - ber)
        - packet_success_rate = (1.0 - ber) ** packet_length_bits
        - packet_throughput_bps = raw_bit_rate_bps * packet_success_rate

    Assumptions:
        - Continuous synchronous symbol transmission at symbol_rate_sps.
        - Bit-level throughput models ideal selective-repeat or ARQ without protocol header overhead.
        - Packet throughput models standard block retransmission without FEC.
    """
    bits_per_sym = get_bits_per_symbol(mod_type)
    raw_bit_rate_bps = symbol_rate_sps * bits_per_sym

    # Bit-level effective throughput
    bit_throughput_bps = max(0.0, raw_bit_rate_bps * (1.0 - ber))

    # Packet / Frame level throughput (for frame size L)
    # Clip 1 - ber to [0, 1]
    p_success_bit = max(0.0, min(1.0, 1.0 - ber))
    if p_success_bit > 0.0 and ber < 0.99:
        # Avoid underflow
        packet_success_rate = float(p_success_bit**packet_length_bits)
    else:
        packet_success_rate = 0.0

    packet_throughput_bps = float(raw_bit_rate_bps * packet_success_rate)

    return {
        "raw_bit_rate_kbps": round(raw_bit_rate_bps / 1000.0, 2),
        "effective_throughput_kbps": round(bit_throughput_bps / 1000.0, 2),
        "packet_throughput_kbps": round(packet_throughput_bps / 1000.0, 2),
        "packet_success_rate": round(packet_success_rate, 4),
    }


def compile_simulation_metrics(
    transmitted_bits: np.ndarray,
    recovered_bits: np.ndarray,
    mod_type: ModulationType,
    channel_type: str,
    channel_meta: Dict[str, Any],
    elapsed_time_s: float,
    symbol_rate_sps: float = 100_000.0,
) -> Dict[str, Any]:
    """Compile comprehensive wireless communication performance metrics."""
    min_len = min(len(transmitted_bits), len(recovered_bits))
    bit_errors = int(np.sum(transmitted_bits[:min_len] != recovered_bits[:min_len]))
    total_bits = int(min_len)
    ber = float(bit_errors / total_bits) if total_bits > 0 else 0.0

    is_rayleigh = channel_type.upper() == "RAYLEIGH"
    effective_snr_linear = channel_meta.get("effective_snr_linear", 1.0)
    theoretical_ber = calculate_theoretical_ber(
        snr_linear=effective_snr_linear,
        mod_type=mod_type,
        is_rayleigh=is_rayleigh,
    )

    throughput = calculate_throughput_estimates(
        ber=ber,
        mod_type=mod_type,
        symbol_rate_sps=symbol_rate_sps,
    )

    rx_power_dbm = channel_meta.get("received_power_dbm", -50.0)
    rx_power_mw = 10.0 ** (rx_power_dbm / 10.0)

    return {
        "total_bits": total_bits,
        "bit_errors": bit_errors,
        "ber": float(ber),
        "theoretical_ber": float(theoretical_ber),
        "nominal_snr_db": channel_meta.get("nominal_snr_db", 0.0),
        "effective_snr_db": channel_meta.get("effective_snr_db", 0.0),
        "path_loss_db": channel_meta.get("path_loss_db", 0.0),
        "received_power_dbm": rx_power_dbm,
        "received_power_mw": round(rx_power_mw, 8),
        "doppler_shift_hz": channel_meta.get("doppler_shift_hz", 0.0),
        "coherence_time_s": channel_meta.get("coherence_time_s", float("inf")),
        "raw_bit_rate_kbps": throughput["raw_bit_rate_kbps"],
        "effective_throughput_kbps": throughput["effective_throughput_kbps"],
        "packet_throughput_kbps": throughput["packet_throughput_kbps"],
        "packet_success_rate": throughput["packet_success_rate"],
        "execution_time_ms": round(elapsed_time_s * 1000.0, 2),
    }
