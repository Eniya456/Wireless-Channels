"""Digital Receiver and Equalizer Module.

Performs:
1. Channel Equalization (Zero-Forcing and MMSE detectors)
2. Demodulation to recovered bit sequence
3. Error calculation and theoretical benchmark evaluation
"""

from enum import Enum
from typing import Tuple, Dict, Any
import numpy as np
from scipy.special import erfc
from .modulation import ModulationType, demodulate, get_bits_per_symbol


class EqualizerType(str, Enum):
    NONE = "NONE"
    ZERO_FORCING = "ZERO_FORCING"
    MMSE = "MMSE"


def calculate_theoretical_ber(
    snr_linear: float,
    mod_type: ModulationType,
    is_rayleigh: bool = False,
) -> float:
    """Calculate theoretical Bit Error Rate (BER) benchmark.

    For AWGN:
        BPSK: Pb = 0.5 * erfc(sqrt(Eb/N0)) = Q(sqrt(2*Eb/N0)), with Eb/N0 = snr_linear
        QPSK: Pb = 0.5 * erfc(sqrt(Eb/N0)), with Eb/N0 = snr_linear / 2

    For Rayleigh Fading (with perfect CSI):
        BPSK / QPSK: Pb = 0.5 * (1 - sqrt(gamma_b / (1 + gamma_b)))
        where gamma_b is the average SNR per bit.
    """
    if snr_linear <= 0.0:
        return 0.5

    bits_per_sym = get_bits_per_symbol(mod_type)
    # Energy per bit to noise ratio: Eb/N0 = Es / (bits_per_sym * N0) = snr_linear / bits_per_sym
    gamma_b = snr_linear / float(bits_per_sym)

    if not is_rayleigh:
        # AWGN theoretical BER
        ber_theory = 0.5 * erfc(np.sqrt(gamma_b))
    else:
        # Rayleigh theoretical BER
        term = np.sqrt(gamma_b / (1.0 + gamma_b))
        ber_theory = 0.5 * (1.0 - term)

    return float(np.clip(ber_theory, 0.0, 0.5))


class Receiver:
    """Simulates receiver processing including equalization and demodulation."""

    def __init__(self, equalizer_type: EqualizerType = EqualizerType.MMSE):
        self.equalizer_type = equalizer_type

    def equalize(
        self,
        received_signal: np.ndarray,
        channel_coefficients: np.ndarray,
        effective_snr_linear: float,
    ) -> np.ndarray:
        """Equalize received signal using channel estimates."""
        h = channel_coefficients
        r = received_signal

        if self.equalizer_type == EqualizerType.NONE:
            return r

        elif self.equalizer_type == EqualizerType.ZERO_FORCING:
            # ZF: x_hat = r / h = (h* / |h|^2) * r
            # Avoid division by zero with small epsilon
            denom = np.abs(h) ** 2
            safe_denom = np.where(denom < 1e-12, 1e-12, denom)
            equalized = (np.conj(h) * r) / safe_denom
            return equalized

        elif self.equalizer_type == EqualizerType.MMSE:
            # MMSE: x_hat = (h* / (|h|^2 + 1/SNR)) * r
            snr_inv = 1.0 / max(1e-10, effective_snr_linear)
            denom = (np.abs(h) ** 2) + snr_inv
            equalized = (np.conj(h) * r) / denom
            return equalized

        else:
            raise ValueError(f"Unknown equalizer type: {self.equalizer_type}")

    def demodulate_and_decode(
        self,
        received_signal: np.ndarray,
        channel_coefficients: np.ndarray,
        mod_type: ModulationType,
        effective_snr_linear: float,
    ) -> np.ndarray:
        """Equalize and demodulate signal into estimated bit sequence."""
        equalized_symbols = self.equalize(
            received_signal, channel_coefficients, effective_snr_linear
        )
        recovered_bits = demodulate(equalized_symbols, mod_type)
        return recovered_bits

    @staticmethod
    def calculate_ber(
        transmitted_bits: np.ndarray,
        recovered_bits: np.ndarray,
    ) -> Tuple[int, int, float]:
        """Compute bit errors and empirical Bit Error Rate (BER).

        Returns:
            Tuple of (bit_errors, total_bits, ber)
        """
        min_len = min(len(transmitted_bits), len(recovered_bits))
        tx = transmitted_bits[:min_len]
        rx = recovered_bits[:min_len]

        bit_errors = int(np.sum(tx != rx))
        total_bits = int(min_len)
        ber = float(bit_errors / total_bits) if total_bits > 0 else 0.0

        return bit_errors, total_bits, ber
