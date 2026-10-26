"""Digital Modulation and Demodulation Module.

Supports:
- BPSK (Binary Phase Shift Keying) - 1 bit per symbol
- QPSK (Quadrature Phase Shift Keying) - 2 bits per symbol

Implements strict energy normalization (average symbol energy Es = 1.0)
and Gray coding mapping for minimum bit error probability.
"""

from enum import Enum
from typing import Tuple
import numpy as np


class ModulationType(str, Enum):
    BPSK = "BPSK"
    QPSK = "QPSK"


def modulate_bpsk(bits: np.ndarray) -> np.ndarray:
    """Modulate binary sequence using BPSK.

    Mapping:
        0 -> +1.0 + 0j
        1 -> -1.0 + 0j
    Symbol energy Es = 1.0.
    Bit energy Eb = Es = 1.0.
    """
    if bits.ndim != 1:
        raise ValueError("Bits array must be 1-dimensional")
    # 0 -> +1, 1 -> -1
    symbols = (1.0 - 2.0 * bits).astype(np.complex128)
    return symbols


def demodulate_bpsk(received_symbols: np.ndarray) -> np.ndarray:
    """Hard-decision BPSK demodulation.

    Decision boundary: Re(r) >= 0 -> bit 0, Re(r) < 0 -> bit 1.
    """
    return np.where(np.real(received_symbols) >= 0.0, 0, 1).astype(np.int8)


def modulate_qpsk(bits: np.ndarray) -> np.ndarray:
    """Modulate binary sequence using Gray-coded QPSK.

    Pairs of bits (b0, b1):
        00 -> (+1 + 1j) / sqrt(2)
        01 -> (-1 + 1j) / sqrt(2)
        11 -> (-1 - 1j) / sqrt(2)
        10 -> (+1 - 1j) / sqrt(2)

    Symbol energy Es = 1.0.
    Bit energy Eb = Es / 2 = 0.5.
    """
    if bits.ndim != 1:
        raise ValueError("Bits array must be 1-dimensional")
    if len(bits) % 2 != 0:
        raise ValueError(f"QPSK requires an even number of bits, got {len(bits)}")

    b0 = bits[0::2]
    b1 = bits[1::2]

    # In-phase component (b0: 0 -> +1, 1 -> -1)
    i_comp = (1.0 - 2.0 * b0)
    # Quadrature component (b1: 0 -> +1, 1 -> -1)
    q_comp = (1.0 - 2.0 * b1)

    # Normalized by sqrt(2) so average power is 1.0
    norm_factor = 1.0 / np.sqrt(2.0)
    symbols = (i_comp + 1j * q_comp) * norm_factor
    return symbols.astype(np.complex128)


def demodulate_qpsk(received_symbols: np.ndarray) -> np.ndarray:
    """Hard-decision Gray-coded QPSK demodulation.

    Decision boundaries:
        Re(r) >= 0 -> b0 = 0, Re(r) < 0 -> b0 = 1
        Im(r) >= 0 -> b1 = 0, Im(r) < 0 -> b1 = 1
    """
    n_symbols = len(received_symbols)
    bits = np.empty(2 * n_symbols, dtype=np.int8)

    bits[0::2] = np.where(np.real(received_symbols) >= 0.0, 0, 1)
    bits[1::2] = np.where(np.imag(received_symbols) >= 0.0, 0, 1)

    return bits


def modulate(bits: np.ndarray, mod_type: ModulationType) -> np.ndarray:
    """Dispatcher for modulation schemes."""
    val = mod_type.value if hasattr(mod_type, "value") else str(mod_type)
    if val == "BPSK":
        return modulate_bpsk(bits)
    elif val == "QPSK":
        return modulate_qpsk(bits)
    else:
        raise ValueError(f"Unsupported modulation type: {mod_type}")


def demodulate(received_symbols: np.ndarray, mod_type: ModulationType) -> np.ndarray:
    """Dispatcher for demodulation schemes."""
    val = mod_type.value if hasattr(mod_type, "value") else str(mod_type)
    if val == "BPSK":
        return demodulate_bpsk(received_symbols)
    elif val == "QPSK":
        return demodulate_qpsk(received_symbols)
    else:
        raise ValueError(f"Unsupported modulation type: {mod_type}")


def get_bits_per_symbol(mod_type: ModulationType) -> int:
    """Number of bits carried by each modulation symbol."""
    val = mod_type.value if hasattr(mod_type, "value") else str(mod_type)
    if val == "BPSK":
        return 1
    elif val == "QPSK":
        return 2
    raise ValueError(f"Unknown modulation: {mod_type}")
