"""Digital Transmitter Module.

Generates reproducible pseudo-random binary data, formats bit frames according
to the modulation scheme, applies modulation mapping, and verifies energy normalization.
"""

from typing import Optional, Tuple
import numpy as np
from .modulation import ModulationType, modulate, get_bits_per_symbol


class Transmitter:
    """Simulates a baseband digital transmitter."""

    def __init__(self, random_seed: Optional[int] = None):
        self.random_seed = random_seed
        self.rng = np.random.default_rng(random_seed)

    def generate_bits(self, num_bits: int, mod_type: ModulationType) -> np.ndarray:
        """Generate a random binary sequence {0, 1}.

        Ensures bit sequence length is divisible by bits_per_symbol.
        """
        if num_bits <= 0:
            raise ValueError("num_bits must be positive")

        bits_per_sym = get_bits_per_symbol(mod_type)
        remainder = num_bits % bits_per_sym
        if remainder != 0:
            num_bits += (bits_per_sym - remainder)

        bits = self.rng.integers(0, 2, size=num_bits, dtype=np.int8)
        return bits

    def transmit(
        self, num_bits: int, mod_type: ModulationType
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Transmit binary data.

        Returns:
            Tuple of (transmitted_bits, modulated_symbols)
        """
        bits = self.generate_bits(num_bits, mod_type)
        symbols = modulate(bits, mod_type)
        return bits, symbols
