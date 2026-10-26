"""Wireless Channel Models Module.

Implements mathematically rigorous baseband propagation models:
1. AWGN (Additive White Gaussian Noise)
2. Rayleigh Fading (Flat-fading multipath, with Jakes temporal correlation when mobility is active)
3. Log-distance Path Loss (Distance-based received power attenuation)
4. Mobility and Doppler Effect (Maximum Doppler shift and coherence time calculation)
"""

from enum import Enum
from typing import Optional, Tuple
import numpy as np
from scipy.special import j0  # Bessel function of the first kind of order 0


class ChannelType(str, Enum):
    AWGN = "AWGN"
    RAYLEIGH = "RAYLEIGH"


SPEED_OF_LIGHT = 299_792_458.0  # m/s


def calculate_doppler_shift(speed_mps: float, carrier_frequency_hz: float) -> float:
    """Calculate maximum Doppler shift in Hz.

    f_D = (v * f_c) / c
    Where:
        v: velocity in m/s
        f_c: carrier frequency in Hz
        c: speed of light in m/s
    """
    if speed_mps < 0.0 or carrier_frequency_hz <= 0.0:
        return 0.0
    return float((speed_mps * carrier_frequency_hz) / SPEED_OF_LIGHT)


def calculate_coherence_time(doppler_shift_hz: float) -> float:
    """Calculate approximate channel coherence time in seconds.

    Using the rule of thumb based on Clarke-Jakes model:
    T_c approx 0.423 / f_D (or 9 / (16 * pi * f_D))
    For stationary channels (f_D = 0), returns infinity.
    """
    if doppler_shift_hz <= 1e-6:
        return float("inf")
    return float(0.423 / doppler_shift_hz)


def calculate_path_loss_db(
    distance_m: float,
    reference_distance_m: float = 1.0,
    reference_loss_db: float = 38.0,
    path_loss_exponent: float = 3.0,
) -> float:
    """Calculate log-distance path loss in dB.

    PL(d) = PL(d_0) + 10 * n * log10(d / d_0) for d >= d_0
    Where:
        d: distance in meters
        d_0: reference distance (default 1 m)
        PL(d_0): reference path loss at d_0 in dB
        n: path loss exponent (2.0 = free space, 3.0-4.0 = urban)
    """
    effective_dist = max(distance_m, reference_distance_m)
    loss = reference_loss_db + 10.0 * path_loss_exponent * np.log10(
        effective_dist / reference_distance_m
    )
    return float(loss)


def calculate_received_power_dbm(
    transmit_power_dbm: float,
    path_loss_db: float,
) -> float:
    """Calculate received signal power in dBm.

    P_rx(dBm) = P_tx(dBm) - PL(d)(dB)
    """
    return float(transmit_power_dbm - path_loss_db)


class WirelessChannel:
    """Simulates wireless channel distortion, fading, and noise."""

    def __init__(self, random_seed: Optional[int] = None):
        self.random_seed = random_seed
        self.rng = np.random.default_rng(random_seed)

    def generate_rayleigh_coefficients(
        self,
        num_symbols: int,
        doppler_shift_hz: float = 0.0,
        symbol_rate_sps: float = 100_000.0,
    ) -> np.ndarray:
        """Generate complex Rayleigh fading channel coefficients h[n].

        E[|h|^2] = 1.0 (Unit average power).
        If doppler_shift_hz > 0:
            Uses first-order autoregressive AR(1) Gauss-Markov model
            correlated according to Jakes model: rho = J0(2*pi*f_D*T_s).
        If doppler_shift_hz == 0:
            Generates quasi-static (or block) flat Rayleigh fading.
        """
        if doppler_shift_hz > 1e-4:
            # Time-correlated Rayleigh fading
            ts = 1.0 / symbol_rate_sps
            rho = float(j0(2.0 * np.pi * doppler_shift_hz * ts))
            # Bound rho to (-1, 1)
            rho = max(-0.99999, min(0.99999, rho))

            h = np.empty(num_symbols, dtype=np.complex128)
            # Initial symbol from standard complex Gaussian CN(0, 1)
            init_i = self.rng.normal(0.0, 1.0 / np.sqrt(2.0))
            init_q = self.rng.normal(0.0, 1.0 / np.sqrt(2.0))
            h[0] = init_i + 1j * init_q

            # AR(1) evolution: h[k] = rho * h[k-1] + sqrt(1 - rho^2) * w[k]
            scale_innov = np.sqrt(max(0.0, 1.0 - rho**2)) / np.sqrt(2.0)
            innov_i = self.rng.normal(0.0, scale_innov, size=num_symbols)
            innov_q = self.rng.normal(0.0, scale_innov, size=num_symbols)

            for k in range(1, num_symbols):
                h[k] = rho * h[k - 1] + (innov_i[k] + 1j * innov_q[k])
            return h
        else:
            # Independent or quasi-static flat Rayleigh fading across symbols
            # CN(0, 1)
            h_i = self.rng.normal(0.0, 1.0 / np.sqrt(2.0), size=num_symbols)
            h_q = self.rng.normal(0.0, 1.0 / np.sqrt(2.0), size=num_symbols)
            return h_i + 1j * h_q

    def apply_channel(
        self,
        transmitted_symbols: np.ndarray,
        channel_type: ChannelType,
        snr_db: float,
        distance_m: float = 100.0,
        reference_distance_m: float = 50.0,
        reference_loss_db: float = 38.0,
        path_loss_exponent: float = 3.0,
        speed_mps: float = 0.0,
        carrier_frequency_hz: float = 2.4e9,
        symbol_rate_sps: float = 100_000.0,
    ) -> Tuple[np.ndarray, np.ndarray, dict]:
        """Pass transmitted symbols through channel with path loss, fading, and noise.

        Effective SNR incorporates distance-based attenuation relative to reference distance:
        SNR_eff_db = SNR_input_db - 10 * n * log10(d / d0)

        Returns:
            Tuple of (received_signal, channel_coefficients_h, metadata_dict)
        """
        num_symbols = len(transmitted_symbols)

        # 1. Mobility and Doppler calculations
        doppler_shift = calculate_doppler_shift(speed_mps, carrier_frequency_hz)
        coherence_time = calculate_coherence_time(doppler_shift)

        # 2. Path loss and power calculations
        pl_db = calculate_path_loss_db(
            distance_m=distance_m,
            reference_distance_m=reference_distance_m,
            reference_loss_db=reference_loss_db,
            path_loss_exponent=path_loss_exponent,
        )
        tx_power_dbm = 20.0  # standard 100 mW (20 dBm) transmitter
        rx_power_dbm = calculate_received_power_dbm(tx_power_dbm, pl_db)

        # Distance path attenuation relative to reference distance d0
        dist_loss_relative_db = 10.0 * path_loss_exponent * np.log10(
            max(distance_m, 1.0) / reference_distance_m
        )
        # Effective SNR experienced by the detector
        effective_snr_db = snr_db - dist_loss_relative_db
        # Linear effective SNR
        snr_linear = 10.0 ** (effective_snr_db / 10.0)

        # 3. Channel coefficients
        chan_val = channel_type.value if hasattr(channel_type, "value") else str(channel_type)
        if chan_val == "AWGN":
            # Pure AWGN channel has unity channel gain h = 1.0 + 0j
            h = np.ones(num_symbols, dtype=np.complex128)
            faded_signal = transmitted_symbols
        elif chan_val == "RAYLEIGH":
            h = self.generate_rayleigh_coefficients(
                num_symbols=num_symbols,
                doppler_shift_hz=doppler_shift,
                symbol_rate_sps=symbol_rate_sps,
            )
            faded_signal = h * transmitted_symbols
        else:
            raise ValueError(f"Unsupported channel type: {channel_type}")

        # 4. Additive White Gaussian Noise (AWGN)
        # For average symbol energy Es = 1, noise variance per complex dimension is N0/2
        # where N0 = 1 / snr_linear
        noise_std_per_dim = np.sqrt(1.0 / (2.0 * snr_linear))
        noise_i = self.rng.normal(0.0, noise_std_per_dim, size=num_symbols)
        noise_q = self.rng.normal(0.0, noise_std_per_dim, size=num_symbols)
        noise = noise_i + 1j * noise_q

        received_signal = faded_signal + noise

        metadata = {
            "doppler_shift_hz": round(doppler_shift, 4),
            "coherence_time_s": float("inf") if np.isinf(coherence_time) else round(coherence_time, 6),
            "path_loss_db": round(pl_db, 2),
            "received_power_dbm": round(rx_power_dbm, 2),
            "nominal_snr_db": round(snr_db, 2),
            "effective_snr_db": round(effective_snr_db, 2),
            "effective_snr_linear": round(float(snr_linear), 4),
            "average_fading_magnitude": round(float(np.mean(np.abs(h))), 4),
        }

        return received_signal, h, metadata
