"""
SahyogX - Preprocessing Pipeline Module

This module defines data cleaning, missing-value imputation, categorical encoding,
and numerical scaling transformers.

Key considerations:
1. Non-informative Identifiers: 'personnel_id' is stripped from model features.
2. Missing Value Imputation:
   - Median imputation for numerical features (robust against operational outliers like combat surge hours).
   - Mode imputation for categorical features.
3. Categorical Encoding:
   - OneHotEncoder with handle_unknown='ignore' for unit types and operational intensities.
4. Numerical Scaling:
   - RobustScaler to center and scale based on IQR, dampening the influence of temporary operational spikes.
5. Stratified Data Partitioning:
   - Preserves minority ELEVATED risk class distribution across Train (70%), Validation (15%), and Test (15%).
"""

import os
from typing import Tuple
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, RobustScaler

from .feature_engineering import OperationalWelfareFeatureEngineer


# Canonical feature definitions
BASE_NUMERICAL_FEATURES = [
    "duty_hours_weekly",
    "overtime_hours_weekly",
    "deployment_duration_months",
    "deployments_last_3_years",
    "days_since_last_leave",
    "leave_days_taken_annual",
    "recovery_rest_days_monthly",
    "avg_sleep_hours",
    "sleep_disruption_index",
    "physical_readiness_score",
    "wellness_survey_score",
    "peer_support_score",
    "environmental_hardship_score",
]

ENGINEERED_NUMERICAL_FEATURES = [
    "sleep_deficit_hours",
    "composite_fatigue_index",
    "deployment_to_recovery_ratio",
    "leave_deprivation_index",
    "operational_strain_index",
    "protective_buffer_score",
    "net_vulnerability_index",
]

ALL_NUMERICAL_FEATURES = BASE_NUMERICAL_FEATURES + ENGINEERED_NUMERICAL_FEATURES

CATEGORICAL_FEATURES = [
    "unit_type",
    "role_operational_intensity",
]

ALL_INPUT_FEATURES = BASE_NUMERICAL_FEATURES + CATEGORICAL_FEATURES
TARGET_COLUMN = "risk_category"
TARGET_SCORE_COLUMN = "risk_score"
ID_COLUMN = "personnel_id"

TARGET_CLASSES = ["LOW", "MODERATE", "ELEVATED"]
TARGET_MAPPING = {"LOW": 0, "MODERATE": 1, "ELEVATED": 2}
TARGET_INV_MAPPING = {0: "LOW", 1: "MODERATE", 2: "ELEVATED"}


def build_preprocessor() -> Pipeline:
    """
    Builds an end-to-end preprocessing pipeline including feature engineering,
    missing value imputation, categorical encoding, and scaling.
    """
    # Numerical pipeline: Median impute -> Robust scale
    num_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", RobustScaler()),
    ])

    # Categorical pipeline: Most frequent impute -> OneHotEncode
    cat_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
    ])

    col_transformer = ColumnTransformer(
        transformers=[
            ("num", num_pipeline, ALL_NUMERICAL_FEATURES),
            ("cat", cat_pipeline, CATEGORICAL_FEATURES),
        ],
        remainder="drop",
    )

    full_pipeline = Pipeline([
        ("feature_engineer", OperationalWelfareFeatureEngineer()),
        ("col_transformer", col_transformer),
    ])

    return full_pipeline


def split_dataset(
    df: pd.DataFrame,
    train_size: float = 0.70,
    val_size: float = 0.15,
    test_size: float = 0.15,
    random_state: int = 42,
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Splits the dataset into stratified Train, Validation, and Test sets.
    """
    assert abs((train_size + val_size + test_size) - 1.0) < 1e-5, "Split ratios must sum to 1.0"

    # First split: Train vs Temp (Val + Test)
    temp_size = val_size + test_size
    train_df, temp_df = train_test_split(
        df,
        test_size=temp_size,
        stratify=df[TARGET_COLUMN],
        random_state=random_state,
    )

    # Second split: Val vs Test
    val_ratio_in_temp = val_size / temp_size
    val_df, test_df = train_test_split(
        temp_df,
        test_size=(1.0 - val_ratio_in_temp),
        stratify=temp_df[TARGET_COLUMN],
        random_state=random_state,
    )

    return train_df.reset_index(drop=True), val_df.reset_index(drop=True), test_df.reset_index(drop=True)


def prepare_and_save_splits(
    raw_data_path: str,
    output_dir: str = "ml/data/processed",
    random_state: int = 42,
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Loads raw data, performs stratified splitting, and writes train/val/test CSVs.
    """
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)
    df = pd.read_csv(raw_data_path)

    train_df, val_df, test_df = split_dataset(df, random_state=random_state)

    train_df.to_csv(os.path.join(output_dir, "train.csv"), index=False)
    val_df.to_csv(os.path.join(output_dir, "val.csv"), index=False)
    test_df.to_csv(os.path.join(output_dir, "test.csv"), index=False)

    print(f"Dataset split saved to {output_dir}:")
    print(f"  Train: {len(train_df)} rows")
    print(f"  Val:   {len(val_df)} rows")
    print(f"  Test:  {len(test_df)} rows")

    return train_df, val_df, test_df
