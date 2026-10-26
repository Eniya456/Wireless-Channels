"""Executable script to generate dataset, train models, and persist artifacts."""

import os
import sys
import time

# Ensure backend directory is in python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.ml.dataset import generate_simulation_dataset
from app.ml.train import train_models


def main():
    print("=" * 60)
    print("Starting Machine Learning Training Pipeline")
    print("=" * 60)

    data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
    models_dir = os.path.join(data_dir, "models")
    os.makedirs(models_dir, exist_ok=True)

    csv_path = os.path.join(data_dir, "wireless_simulation_dataset.csv")

    t0 = time.time()
    print("Step 1: Generating synthetic wireless simulation dataset...")
    df = generate_simulation_dataset(num_samples_target=1000, random_seed=42, bits_per_point=20_000)
    df.to_csv(csv_path, index=False)
    print(f"Generated {len(df)} samples in {time.time() - t0:.2f}s. Saved to {csv_path}")

    print("\nClass distribution:")
    print(df["channel_quality"].value_counts())

    print("\nStep 2: Training Random Forest Classifier and Regressor...")
    t1 = time.time()
    report = train_models(df, model_dir=models_dir, random_state=42)
    print(f"Training completed in {time.time() - t1:.2f}s")

    print("\n" + "=" * 60)
    print("Evaluation Results on Held-Out Test Set:")
    print("=" * 60)
    print(f"Classification Accuracy: {report['classification']['accuracy'] * 100:.2f}%")
    print(f"Classification F1-Score: {report['classification']['f1_score']:.4f}")
    print(f"Confusion Matrix (Good, Moderate, Poor): {report['classification']['confusion_matrix']}")
    print(f"Regression MAE: {report['regression']['mae']:.6f}")
    print(f"Regression RMSE: {report['regression']['rmse']:.6f}")
    print(f"Regression R^2: {report['regression']['r2_score']:.4f}")
    print("\nArtifacts successfully persisted in:", models_dir)


if __name__ == "__main__":
    main()
