#!/usr/bin/env python3
"""
CLI script to generate synthetic personnel welfare and stress dataset.
"""

import argparse
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from ml.src.data_generator import generate_and_save_data


def main():
    parser = argparse.ArgumentParser(description="Generate synthetic personnel welfare dataset.")
    parser.add_argument("--samples", type=int, default=5000, help="Number of records to generate")
    parser.add_argument(
        "--output",
        type=str,
        default="ml/data/raw/personnel_welfare_synthetic_raw.csv",
        help="Output file path",
    )
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility")
    args = parser.parse_args()

    generate_and_save_data(output_path=args.output, num_samples=args.samples, seed=args.seed)


if __name__ == "__main__":
    main()
