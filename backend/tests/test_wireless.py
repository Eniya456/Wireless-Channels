"""Unit and Validation Tests for Wireless Simulation Module."""

import pytest
import numpy as np

from app.wireless.modulation import (
    ModulationType,
    modulate_bpsk,
    demodulate_bpsk,
    modulate_qpsk,
    demodulate_qpsk,
    get_bits_per_symbol,
)
from app.wireless.transmitter import Transmitter
from app.wireless.channels import (
    ChannelType,
    WirelessChannel,
    calculate_doppler_shift,
    calculate_coherence_time,
    calculate_path_loss_db,
    calculate_received_power_dbm,
)
from app.wireless.receiver import Receiver, EqualizerType, calculate_theoretical_ber
from app.wireless.metrics import calculate_throughput_estimates
from app.wireless.simulator import SimulatorEngine


def test_bpsk_noiseless_recovery():
    """Verify BPSK mapping and demodulation with zero noise."""
    tx = Transmitter(random_seed=42)
    bits, symbols = tx.transmit(num_bits=1000, mod_type=ModulationType.BPSK)

    # Check symbol energy Es = 1.0
    powers = np.abs(symbols) ** 2
    assert np.allclose(powers, 1.0)

    # Demodulate directly
    recovered_bits = demodulate_bpsk(symbols)
    bit_errors, total_bits, ber = Receiver.calculate_ber(bits, recovered_bits)

    assert total_bits == 1000
    assert bit_errors == 0
    assert ber == 0.0


def test_qpsk_noiseless_recovery():
    """Verify QPSK Gray-coded mapping and demodulation with zero noise."""
    tx = Transmitter(random_seed=123)
    bits, symbols = tx.transmit(num_bits=2000, mod_type=ModulationType.QPSK)

    # Check symbol energy Es = 1.0
    powers = np.abs(symbols) ** 2
    assert np.allclose(powers, 1.0)

    # Demodulate directly
    recovered_bits = demodulate_qpsk(symbols)
    bit_errors, total_bits, ber = Receiver.calculate_ber(bits, recovered_bits)

    assert total_bits == 2000
    assert bit_errors == 0
    assert ber == 0.0


def test_bpsk_awgn_ber_matches_theory():
    """Verify simulated BPSK BER approximately matches theoretical erfc / Q-function."""
    # At 7 dB SNR:
    # snr_linear = 10^(0.7) approx 5.01187
    # Theoretical BER = 0.5 * erfc(sqrt(5.01187)) approx 7.726e-4
    snr_db = 7.0
    engine = SimulatorEngine()
    result = engine.run_single_simulation(
        mod_type=ModulationType.BPSK,
        channel_type=ChannelType.AWGN,
        snr_db=snr_db,
        num_bits=200_000,
        distance_m=50.0,
        reference_distance_m=50.0,  # at reference distance, no relative path-loss offset
        random_seed=999,
    )

    simulated_ber = result["metrics"]["ber"]
    theoretical_ber = result["metrics"]["theoretical_ber"]

    # At 7 dB, theoretical BER is ~0.00077
    # For 200,000 bits, expected errors ~ 154
    assert simulated_ber > 0.0
    # Within 30% relative tolerance or 0.0005 absolute tolerance
    assert abs(simulated_ber - theoretical_ber) < 0.0005


def test_ber_monotonic_decrease_with_snr():
    """Verify that BER strictly or non-increasingly drops as SNR increases."""
    engine = SimulatorEngine()
    batch = engine.run_batch_simulation(
        mod_type=ModulationType.BPSK,
        channel_type=ChannelType.AWGN,
        snr_start=0.0,
        snr_end=10.0,
        snr_step=2.5,
        num_bits_per_snr=50_000,
        distance_m=50.0,
        random_seed=42,
    )

    bers = [pt["ber"] for pt in batch["points"]]
    # High SNR BER must be strictly lower than low SNR BER
    assert bers[0] > bers[-1]
    # Check general trend: at 0 dB, BER is ~0.078, at 10 dB, BER is ~0.00003
    assert bers[0] > 0.05
    assert bers[-1] < 0.001


def test_rayleigh_statistical_properties():
    """Verify Rayleigh fading envelope distribution and power normalization."""
    channel = WirelessChannel(random_seed=555)
    h = channel.generate_rayleigh_coefficients(num_symbols=100_000)

    # Average power E[|h|^2] must be approx 1.0
    power = np.mean(np.abs(h) ** 2)
    assert np.isclose(power, 1.0, atol=0.05)

    # Theoretical mean of Rayleigh with parameter sigma = 1/sqrt(2) is sigma * sqrt(pi/2) = sqrt(pi)/2 approx 0.8862
    mean_mag = np.mean(np.abs(h))
    expected_mean = np.sqrt(np.pi) / 2.0
    assert np.isclose(mean_mag, expected_mean, atol=0.03)


def test_doppler_shift_and_mobility():
    """Verify maximum Doppler shift formula f_D = v * f_c / c."""
    # Speed: 120 km/h = 120 / 3.6 = 33.333 m/s
    speed_mps = 120.0 / 3.6
    fc = 2.4e9  # 2.4 GHz
    c = 299_792_458.0
    expected_fd = (speed_mps * fc) / c

    calc_fd = calculate_doppler_shift(speed_mps, fc)
    assert np.isclose(calc_fd, expected_fd, atol=1e-3)
    assert calc_fd > 250.0  # ~266.85 Hz

    # Increasing speed increases Doppler shift
    fd_faster = calculate_doppler_shift(speed_mps * 2, fc)
    assert fd_faster > calc_fd

    # Zero speed gives zero Doppler shift and infinite coherence time
    assert calculate_doppler_shift(0.0, fc) == 0.0
    assert np.isinf(calculate_coherence_time(0.0))


def test_path_loss_scaling():
    """Verify log-distance path loss increases with distance and exponent."""
    d0 = 1.0
    ref_loss = 38.0

    pl_10m = calculate_path_loss_db(10.0, reference_distance_m=d0, reference_loss_db=ref_loss, path_loss_exponent=3.0)
    pl_100m = calculate_path_loss_db(100.0, reference_distance_m=d0, reference_loss_db=ref_loss, path_loss_exponent=3.0)

    # At 10x distance with exponent 3.0, loss increases by 10 * 3 * log10(10) = 30 dB
    assert np.isclose(pl_100m - pl_10m, 30.0, atol=0.01)

    # Higher exponent gives greater loss
    pl_100m_exp4 = calculate_path_loss_db(100.0, reference_distance_m=d0, reference_loss_db=ref_loss, path_loss_exponent=4.0)
    assert pl_100m_exp4 > pl_100m


def test_throughput_calculation():
    """Verify throughput calculations under varying BER."""
    # Zero BER: effective throughput equals raw bit rate
    t_zero = calculate_throughput_estimates(ber=0.0, mod_type=ModulationType.BPSK, symbol_rate_sps=100_000.0)
    assert t_zero["raw_bit_rate_kbps"] == 100.0
    assert t_zero["effective_throughput_kbps"] == 100.0
    assert t_zero["packet_success_rate"] == 1.0

    # 50% BER: throughput drops by 50%
    t_half = calculate_throughput_estimates(ber=0.5, mod_type=ModulationType.BPSK, symbol_rate_sps=100_000.0)
    assert t_half["effective_throughput_kbps"] == 50.0
    assert t_half["packet_success_rate"] == 0.0

    # QPSK has double raw rate
    t_qpsk = calculate_throughput_estimates(ber=0.0, mod_type=ModulationType.QPSK, symbol_rate_sps=100_000.0)
    assert t_qpsk["raw_bit_rate_kbps"] == 200.0
    assert t_qpsk["effective_throughput_kbps"] == 200.0
