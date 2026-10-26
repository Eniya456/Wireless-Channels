"""Machine Learning Training Pipeline Module.

Trains Random Forest models for:
1. Channel Quality Classification (Good / Moderate / Poor)
2. Bit Error Rate (BER) Regression

Saves trained model artifacts, scalers, and evaluation metrics.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    mean_absolute_error,
    root_mean_squared_error,
    r2_score,
)

FEATURE_COLS_NUMERIC = [
    "effective_snr_db",
    "distance_m",
    "speed_mps",
    "path_loss_exponent",
    "received_power_dbm",
    "doppler_shift_hz",
]
FEATURE_COLS_CATEGORICAL = ["modulation", "channel_type"]
ALL_FEATURE_COLS = FEATURE_COLS_NUMERIC + FEATURE_COLS_CATEGORICAL
CLASSES = ["Good", "Moderate", "Poor"]


def preprocess_features(
    df: pd.DataFrame,
    scaler: StandardScaler = None,
    fit_scaler: bool = False,
) -> Tuple[np.ndarray, StandardScaler, list]:
    """Preprocess numeric and one-hot encoded categorical features."""
    # Categorical binary encoding:
    # modulation: BPSK -> 0, QPSK -> 1
    # channel_type: AWGN -> 0, RAYLEIGH -> 1
    mod_binary = (df["modulation"] == "QPSK").astype(float).values.reshape(-1, 1)
    chan_binary = (df["channel_type"] == "RAYLEIGH").astype(float).values.reshape(-1, 1)

    numeric_vals = df[FEATURE_COLS_NUMERIC].values.astype(float)

    if fit_scaler or scaler is None:
        scaler = StandardScaler()
        numeric_scaled = scaler.fit_transform(numeric_vals)
    else:
        numeric_scaled = scaler.transform(numeric_vals)

    feature_matrix = np.hstack([numeric_scaled, mod_binary, chan_binary])
    feature_names = FEATURE_COLS_NUMERIC + ["is_qpsk", "is_rayleigh"]

    return feature_matrix, scaler, feature_names


def train_models(
    df: pd.DataFrame,
    model_dir: str = "backend/data/models",
    random_state: int = 42,
) -> Dict[str, Any]:
    """Train classification and regression models, evaluate, and persist artifacts."""
    os.makedirs(model_dir, exist_ok=True)

    # 1. Feature Preprocessing
    X, scaler, feature_names = preprocess_features(df, fit_scaler=True)
    y_class = df["channel_quality"].values
    y_reg = df["ber"].values.astype(float)

    # 2. Train / Test Split (Stratify if all classes have sufficient support)
    class_counts = pd.Series(y_class).value_counts()
    min_count = class_counts.min() if len(class_counts) > 0 else 0
    stratify_target = y_class if min_count >= 5 else None

    (
        X_train,
        X_test,
        y_class_train,
        y_class_test,
        y_reg_train,
        y_reg_test,
        df_train,
        df_test,
    ) = train_test_split(
        X,
        y_class,
        y_reg,
        df,
        test_size=0.25,
        random_state=random_state,
        stratify=stratify_target,
    )

    # 3. Train Classifier
    classifier = RandomForestClassifier(
        n_estimators=100,
        max_depth=12,
        min_samples_split=4,
        random_state=random_state,
        n_jobs=-1,
    )
    classifier.fit(X_train, y_class_train)

    # 4. Train Regressor
    regressor = RandomForestRegressor(
        n_estimators=100,
        max_depth=12,
        min_samples_split=4,
        random_state=random_state,
        n_jobs=-1,
    )
    regressor.fit(X_train, y_reg_train)

    # 5. Evaluate Classifier
    y_class_pred = classifier.predict(X_test)
    y_class_proba = classifier.predict_proba(X_test)

    acc = float(accuracy_score(y_class_test, y_class_pred))
    prec = float(precision_score(y_class_test, y_class_pred, average="weighted", zero_division=0))
    rec = float(recall_score(y_class_test, y_class_pred, average="weighted", zero_division=0))
    f1 = float(f1_score(y_class_test, y_class_pred, average="weighted", zero_division=0))

    cm = confusion_matrix(y_class_test, y_class_pred, labels=CLASSES).tolist()

    # Feature importances
    clf_importances = {
        name: round(float(imp), 4)
        for name, imp in zip(feature_names, classifier.feature_importances_)
    }

    # 6. Evaluate Regressor
    y_reg_pred = regressor.predict(X_test)
    # Clip predictions to physically meaningful range [0, 0.5]
    y_reg_pred = np.clip(y_reg_pred, 0.0, 0.5)

    mae = float(mean_absolute_error(y_reg_test, y_reg_pred))
    rmse = float(root_mean_squared_error(y_reg_test, y_reg_pred))
    r2 = float(r2_score(y_reg_test, y_reg_pred))

    reg_importances = {
        name: round(float(imp), 4)
        for name, imp in zip(feature_names, regressor.feature_importances_)
    }

    evaluation_report = {
        "version": "1.0.0",
        "dataset_total_samples": len(df),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "classes": CLASSES,
        "classification": {
            "model_type": "RandomForestClassifier",
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "confusion_matrix": cm,
            "feature_importances": clf_importances,
        },
        "regression": {
            "model_type": "RandomForestRegressor",
            "mae": round(mae, 6),
            "rmse": round(rmse, 6),
            "r2_score": round(r2, 4),
            "feature_importances": reg_importances,
        },
        "disclaimer": (
            "This model was trained and validated on synthetic data generated by the physical "
            "wireless simulation engine. It demonstrates channel-quality pattern recognition under "
            "simulated propagation models and is not directly pre-calibrated for field cellular deployments."
        ),
    }

    # 7. Persist Artifacts
    joblib.dump(classifier, os.path.join(model_dir, "channel_quality_classifier.joblib"))
    joblib.dump(regressor, os.path.join(model_dir, "ber_regressor.joblib"))
    joblib.dump(scaler, os.path.join(model_dir, "feature_scaler.joblib"))

    with open(os.path.join(model_dir, "evaluation_metrics.json"), "w") as f:
        json.dump(evaluation_report, f, indent=2)

    return evaluation_report
