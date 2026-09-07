#!/usr/bin/env python3
"""
CLI script to run full training, model evaluation, comparison, and artifact export.
"""

import argparse
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from ml.src.train import run_full_training_pipeline


def main():
    parser = argparse.ArgumentParser(description="Run SahyogX ML Training Pipeline")
    parser.add_argument(
        "--raw-data",
        type=str,
        default="ml/data/raw/personnel_welfare_synthetic_raw.csv",
        help="Path to raw synthetic CSV",
    )
    parser.add_argument(
        "--processed-dir",
        type=str,
        default="ml/data/processed",
        help="Directory to save train/val/test splits",
    )
    parser.add_argument("--models-dir", type=str, default="ml/models", help="Directory to save model artifacts")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    args = parser.parse_args()

    print("Executing SahyogX ML Training and Model Evaluation Pipeline...")
    results = run_full_training_pipeline(
        raw_data_path=args.raw_data,
        processed_dir=args.processed_dir,
        models_dir=args.models_dir,
        random_state=args.seed,
    )
    print("\nTraining completed successfully! Best model:", results["best_model_name"])


if __name__ == "__main__":
    main()
