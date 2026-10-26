"""Wireless Communication Simulator Engine.

Orchestrates the digital transmitter, channel model, receiver equalization,
demodulation, constellation sampling, and metric extraction.
"""

import time
from typing import List, Dict, Any, Optional
import numpy as np

from .modulation import ModulationType
from .transmitter import Transmitter
from .channels import WirelessChannel, ChannelType
from .receiver import Receiver, EqualizerType
from .metrics import compile_simulation_metrics


class SimulatorEngine:
    """End-to-end baseband digital communication simulation engine."""

    def __init__(self):
        pass

    def run_single_simulation(
        self,
        mod_type: ModulationType,
        channel_type: ChannelType,
        snr_db: float,
        num_bits: int = 100_000,
        distance_m: float = 50.0,
        reference_distance_m: float = 50.0,
        reference_loss_db: float = 38.0,
        path_loss_exponent: float = 3.0,
        speed_mps: float = 0.0,
        carrier_frequency_hz: float = 2.4e9,
        symbol_rate_sps: float = 100_000.0,
        equalizer_type: EqualizerType = EqualizerType.MMSE,
        random_seed: Optional[int] = None,
        max_constellation_points: int = 200,
    ) -> Dict[str, Any]:
        """Execute a single point wireless transmission simulation."""
        start_time = time.perf_counter()

        # 1. Transmitter
        tx = Transmitter(random_seed=random_seed)
        tx_bits, tx_symbols = tx.transmit(num_bits=num_bits, mod_type=mod_type)

        # 2. Wireless Channel
        chan_seed = (random_seed + 100) if random_seed is not None else None
        channel = WirelessChannel(random_seed=chan_seed)
        rx_signal, h_coeff, chan_meta = channel.apply_channel(
            transmitted_symbols=tx_symbols,
            channel_type=channel_type,
            snr_db=snr_db,
            distance_m=distance_m,
            reference_distance_m=reference_distance_m,
            reference_loss_db=reference_loss_db,
            path_loss_exponent=path_loss_exponent,
            speed_mps=speed_mps,
            carrier_frequency_hz=carrier_frequency_hz,
            symbol_rate_sps=symbol_rate_sps,
        )

        # 3. Receiver
        rx = Receiver(equalizer_type=equalizer_type)
        equalized_symbols = rx.equalize(
            received_signal=rx_signal,
            channel_coefficients=h_coeff,
            effective_snr_linear=chan_meta["effective_snr_linear"],
        )
        rx_bits = rx.demodulate_and_decode(
            received_signal=rx_signal,
            channel_coefficients=h_coeff,
            mod_type=mod_type,
            effective_snr_linear=chan_meta["effective_snr_linear"],
        )

        elapsed = time.perf_counter() - start_time

        # 4. Metrics compilation
        metrics = compile_simulation_metrics(
            transmitted_bits=tx_bits,
            recovered_bits=rx_bits,
            mod_type=mod_type,
            channel_type=channel_type.value,
            channel_meta=chan_meta,
            elapsed_time_s=elapsed,
            symbol_rate_sps=symbol_rate_sps,
        )

        # 5. Extract constellation samples for visual plotting
        n_samples = min(len(tx_symbols), max_constellation_points)
        constellation = []
        for i in range(n_samples):
            constellation.append({
                "tx_i": round(float(np.real(tx_symbols[i])), 4),
                "tx_q": round(float(np.imag(tx_symbols[i])), 4),
                "rx_i": round(float(np.real(equalized_symbols[i])), 4),
                "rx_q": round(float(np.imag(equalized_symbols[i])), 4),
                "faded_i": round(float(np.real(rx_signal[i])), 4),
                "faded_q": round(float(np.imag(rx_signal[i])), 4),
            })

        return {
            "configuration": {
                "modulation": mod_type.value,
                "channel": channel_type.value,
                "snr_db": snr_db,
                "num_bits": len(tx_bits),
                "distance_m": distance_m,
                "speed_mps": speed_mps,
                "carrier_frequency_hz": carrier_frequency_hz,
                "path_loss_exponent": path_loss_exponent,
                "equalizer": equalizer_type.value,
                "random_seed": random_seed,
            },
            "metrics": metrics,
            "constellation_samples": constellation,
        }

    def run_batch_simulation(
        self,
        mod_type: ModulationType,
        channel_type: ChannelType,
        snr_start: float = 0.0,
        snr_end: float = 20.0,
        snr_step: float = 2.0,
        num_bits_per_snr: int = 50_000,
        distance_m: float = 100.0,
        speed_mps: float = 0.0,
        carrier_frequency_hz: float = 2.4e9,
        path_loss_exponent: float = 3.0,
        equalizer_type: EqualizerType = EqualizerType.MMSE,
        random_seed: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Execute a batch simulation across a range of SNR values."""
        snr_values = np.arange(snr_start, snr_end + (snr_step / 2.0), snr_step)
        batch_results: List[Dict[str, Any]] = []

        for idx, snr in enumerate(snr_values):
            seed = (random_seed + idx * 37) if random_seed is not None else None
            res = self.run_single_simulation(
                mod_type=mod_type,
                channel_type=channel_type,
                snr_db=float(snr),
                num_bits=num_bits_per_snr,
                distance_m=distance_m,
                speed_mps=speed_mps,
                carrier_frequency_hz=carrier_frequency_hz,
                path_loss_exponent=path_loss_exponent,
                equalizer_type=equalizer_type,
                random_seed=seed,
                max_constellation_points=0,  # save memory on batch
            )
            item = {
                "snr_db": float(round(snr, 2)),
                "effective_snr_db": res["metrics"]["effective_snr_db"],
                "ber": res["metrics"]["ber"],
                "theoretical_ber": res["metrics"]["theoretical_ber"],
                "bit_errors": res["metrics"]["bit_errors"],
                "total_bits": res["metrics"]["total_bits"],
                "effective_throughput_kbps": res["metrics"]["effective_throughput_kbps"],
                "received_power_dbm": res["metrics"]["received_power_dbm"],
            }
            batch_results.append(item)

        return {
            "configuration": {
                "modulation": mod_type.value,
                "channel": channel_type.value,
                "snr_range": [float(snr_start), float(snr_end), float(snr_step)],
                "num_bits_per_snr": num_bits_per_snr,
                "distance_m": distance_m,
                "speed_mps": speed_mps,
                "carrier_frequency_hz": carrier_frequency_hz,
                "path_loss_exponent": path_loss_exponent,
                "equalizer": equalizer_type.value,
                "random_seed": random_seed,
            },
            "points": batch_results,
        }
