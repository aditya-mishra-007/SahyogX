"""
Tests for Preprocessing Pipeline
"""

import numpy as np
from ml.src.data_generator import SyntheticPersonnelDataGenerator
from ml.src.preprocessing import (
    ALL_INPUT_FEATURES,
    TARGET_CLASSES,
    build_preprocessor,
    split_dataset,
)


def test_split_dataset_stratification():
    gen = SyntheticPersonnelDataGenerator(random_seed=42)
    df = gen.generate(num_samples=400, inject_missingness=False)

    train, val, test = split_dataset(df, train_size=0.70, val_size=0.15, test_size=0.15)

    assert len(train) == 280
    assert len(val) == 60
    assert len(test) == 60

    # Ensure all classes present in all splits
    for c in TARGET_CLASSES:
        assert (train["risk_category"] == c).sum() > 0
        assert (val["risk_category"] == c).sum() > 0
        assert (test["risk_category"] == c).sum() > 0


def test_preprocessor_fit_transform_handles_missing():
    gen = SyntheticPersonnelDataGenerator(random_seed=42)
    df = gen.generate(num_samples=200, inject_missingness=True, missing_rate=0.1)

    X = df[ALL_INPUT_FEATURES]

    preprocessor = build_preprocessor()
    X_trans = preprocessor.fit_transform(X)

    # Output should be 2D numpy array with no NaNs
    assert isinstance(X_trans, np.ndarray)
    assert not np.isnan(X_trans).any()
    assert X_trans.shape[0] == 200
