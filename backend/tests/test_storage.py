"""Unit Tests for Storage Providers (Local and Firebase Adapter)."""

import os
import tempfile
import pytest

from app.storage.local_store import LocalStorageProvider
from app.storage.firebase_store import FirebaseStorageProvider


def test_local_storage_lifecycle():
    """Verify local store save, retrieve, list, filter, and delete."""
    with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as tf:
        temp_file = tf.name

    try:
        store = LocalStorageProvider(file_path=temp_file)
        status = store.get_status()
        assert status["mode"] == "local"
        assert status["connected"] is True
        assert status["total_experiments"] == 0

        # Save experiment
        exp1 = {
            "title": "BPSK AWGN Baseline",
            "configuration": {
                "modulation": "BPSK",
                "channel": "AWGN",
                "snr_db": 10.0,
            },
            "metrics": {"ber": 0.0001, "bit_errors": 10},
        }
        id1 = store.save_experiment(exp1)
        assert id1 is not None

        # Retrieve
        fetched = store.get_experiment(id1)
        assert fetched is not None
        assert fetched["title"] == "BPSK AWGN Baseline"
        assert fetched["metrics"]["bit_errors"] == 10

        # Save second experiment
        exp2 = {
            "title": "QPSK Rayleigh Test",
            "configuration": {
                "modulation": "QPSK",
                "channel": "RAYLEIGH",
                "snr_db": 15.0,
            },
            "metrics": {"ber": 0.02, "bit_errors": 400},
        }
        id2 = store.save_experiment(exp2)

        # List all
        all_exps = store.list_experiments()
        assert len(all_exps) == 2

        # Filter by modulation
        bpsk_only = store.list_experiments(modulation="BPSK")
        assert len(bpsk_only) == 1
        assert bpsk_only[0]["id"] == id1

        # Delete
        deleted = store.delete_experiment(id1)
        assert deleted is True
        assert store.get_experiment(id1) is None
        assert len(store.list_experiments()) == 1

    finally:
        if os.path.exists(temp_file):
            os.remove(temp_file)


def test_firebase_provider_graceful_fallback():
    """Verify Firebase provider falls back gracefully when credentials are not supplied."""
    with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as tf:
        temp_file = tf.name

    try:
        # Initializing without valid credentials must not crash
        fb_store = FirebaseStorageProvider(
            service_account_path="non_existent_key.json",
            fallback_local_path=temp_file,
        )
        status = fb_store.get_status()
        assert status["connected"] is False
        assert "fallback" in status["mode"]

        # Operations still succeed using local fallback
        exp = {
            "title": "Fallback Test",
            "configuration": {"modulation": "BPSK", "channel": "AWGN"},
        }
        exp_id = fb_store.save_experiment(exp)
        assert exp_id is not None

        fetched = fb_store.get_experiment(exp_id)
        assert fetched is not None
        assert fetched["title"] == "Fallback Test"

    finally:
        if os.path.exists(temp_file):
            os.remove(temp_file)
