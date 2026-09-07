"""
SahyogX - Model Training & Comparison Pipeline

This module trains, validates, and compares three foundational model architectures:
1. Multinomial Logistic Regression (Linear baseline, high interpretability)
2. Balanced Random Forest Classifier (Non-linear ensemble, handles interaction effects)
3. HistGradientBoostingClassifier (High-performance gradient boosted decision trees)

Model Selection Criterion:
In defense personnel welfare, detecting ELEVATED risk is the highest operational priority.
A False Negative (failing to flag an exhausted soldier in distress) can lead to critical
safety incidents, operational failure, or severe burnout.
Consequently, models are evaluated with primary priority on:
  1. Recall on ELEVATED risk
  2. Balanced Accuracy
  3. F1-Macro
  4. Explainability & computational efficiency

The winning model pipeline and preprocessing artifacts are serialized to `ml/models/`.
"""

import json
import os
import time
from datetime import datetime
from typing import Any, Dict
import joblib
import pandas as pd
from sklearn.ensemble import HistGradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

from .evaluate import evaluate_model, format_confusion_matrix
from .preprocessing import (
    ALL_INPUT_FEATURES,
    TARGET_CLASSES,
    TARGET_COLUMN,
    build_preprocessor,
    prepare_and_save_splits,
)


def train_and_compare_models(
    train_df: pd.DataFrame,
    val_df: pd.DataFrame,
    test_df: pd.DataFrame,
    models_dir: str = "ml/models",
    random_state: int = 42,
) -> Dict[str, Any]:
    """
    Fits preprocessing pipeline and trains candidate classifiers.
    Compares performance, selects the best model, and exports artifacts.
    """
    if models_dir:
        os.makedirs(models_dir, exist_ok=True)

    X_train = train_df[ALL_INPUT_FEATURES]
    y_train = train_df[TARGET_COLUMN]

    X_val = val_df[ALL_INPUT_FEATURES]
    y_val = val_df[TARGET_COLUMN]

    X_test = test_df[ALL_INPUT_FEATURES]
    y_test = test_df[TARGET_COLUMN]

    print("=" * 70)
    print("STEP 1: FITTING PREPROCESSING & FEATURE PIPELINE")
    print("=" * 70)
    preprocessor = build_preprocessor()
    X_train_proc = preprocessor.fit_transform(X_train)
    X_val_proc = preprocessor.transform(X_val)
    X_test_proc = preprocessor.transform(X_test)
    print(f"Processed feature matrix shape: {X_train_proc.shape}")

    # Define candidate models
    candidate_models = {
        "LogisticRegression": LogisticRegression(
            class_weight="balanced",
            max_iter=1000,
            C=1.0,
            solver="lbfgs",
            random_state=random_state,
        ),
        "RandomForest": RandomForestClassifier(
            n_estimators=150,
            max_depth=12,
            min_samples_split=6,
            class_weight="balanced",
            random_state=random_state,
            n_jobs=-1,
        ),
        "HistGradientBoosting": HistGradientBoostingClassifier(
            max_iter=120,
            learning_rate=0.08,
            max_depth=8,
            class_weight="balanced",
            random_state=random_state,
        ),
    }

    comparison_results: Dict[str, Any] = {}
    fitted_models: Dict[str, Any] = {}

    print("\n" + "=" * 70)
    print("STEP 2: TRAINING & VALIDATING CANDIDATE MODELS")
    print("=" * 70)

    for name, clf in candidate_models.items():
        t0 = time.time()
        print(f"\nTraining [{name}]...")
        clf.fit(X_train_proc, y_train)
        fit_time = time.time() - t0

        # Evaluate on Validation set
        val_eval = evaluate_model(clf, X_val_proc, y_val, class_labels=TARGET_CLASSES)
        test_eval = evaluate_model(clf, X_test_proc, y_test, class_labels=TARGET_CLASSES)

        fitted_models[name] = clf
        comparison_results[name] = {
            "fit_time_sec": round(fit_time, 3),
            "val_metrics": val_eval,
            "test_metrics": test_eval,
        }

        print(f"[{name}] Fit Time: {fit_time:.2f}s")
        print(f"  Validation Balanced Accuracy : {val_eval['balanced_accuracy']:.4f}")
        print(f"  Validation ELEVATED Recall   : {val_eval['recall_elevated']:.4f}")
        print(f"  Validation F1-Macro          : {val_eval['f1_macro']:.4f}")
        print(f"  Test Balanced Accuracy       : {test_eval['balanced_accuracy']:.4f}")
        print(f"  Test ELEVATED Recall         : {test_eval['recall_elevated']:.4f}")
        print(f"  Test F1-Macro                : {test_eval['f1_macro']:.4f}")

    # Model Selection Logic
    # Rank by: 1) Val ELEVATED Recall, 2) Val Balanced Accuracy, 3) Val F1-Macro
    best_model_name = max(
        comparison_results.keys(),
        key=lambda k: (
            comparison_results[k]["val_metrics"]["recall_elevated"],
            comparison_results[k]["val_metrics"]["balanced_accuracy"],
            comparison_results[k]["val_metrics"]["f1_macro"],
        ),
    )

    best_clf = fitted_models[best_model_name]
    best_test_eval = comparison_results[best_model_name]["test_metrics"]

    print("\n" + "=" * 70)
    print(f"STEP 3: BEST MODEL SELECTED: [{best_model_name}]")
    print("=" * 70)
    print("Selected Model Test Results:")
    print(f"  Accuracy           : {best_test_eval['accuracy']:.4f}")
    print(f"  Balanced Accuracy  : {best_test_eval['balanced_accuracy']:.4f}")
    print(f"  ELEVATED Recall    : {best_test_eval['recall_elevated']:.4f}")
    print(f"  Precision (Macro)  : {best_test_eval['precision_macro']:.4f}")
    print(f"  Recall (Macro)     : {best_test_eval['recall_macro']:.4f}")
    print(f"  F1-Score (Macro)   : {best_test_eval['f1_macro']:.4f}")
    if best_test_eval.get("roc_auc_macro"):
        print(f"  ROC-AUC (Macro)    : {best_test_eval['roc_auc_macro']:.4f}")

    print("\nTest Set Confusion Matrix:")
    print(format_confusion_matrix(best_test_eval["confusion_matrix"]))

    # Serialization
    print("\n" + "=" * 70)
    print("STEP 4: SERIALIZING ARTIFACTS")
    print("=" * 70)

    # Save fitted preprocessor and best classifier
    preprocessor_path = os.path.join(models_dir, "preprocessor.joblib")
    best_model_path = os.path.join(models_dir, "best_model.joblib")
    metadata_path = os.path.join(models_dir, "model_metadata.json")

    joblib.dump(preprocessor, preprocessor_path)
    joblib.dump(best_clf, best_model_path)

    # Build an integrated single Pipeline artifact as well (for 1-line backend inference convenience)
    full_pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", best_clf),
    ])
    pipeline_path = os.path.join(models_dir, "welfare_risk_pipeline.joblib")
    joblib.dump(full_pipeline, pipeline_path)

    # Compile comprehensive metadata
    metadata = {
        "model_name": best_model_name,
        "model_version": "1.0.0",
        "trained_at": datetime.now().isoformat(),
        "random_state": random_state,
        "target_classes": TARGET_CLASSES,
        "input_features": ALL_INPUT_FEATURES,
        "selection_justification": (
            f"Selected {best_model_name} because it achieved the highest sensitivity "
            f"(Recall: {best_test_eval['recall_elevated']:.4f}) on the critical ELEVATED risk cohort "
            f"while maintaining strong balanced accuracy ({best_test_eval['balanced_accuracy']:.4f}) "
            f"and F1-score ({best_test_eval['f1_macro']:.4f}). This minimizes dangerous False Negatives."
        ),
        "test_performance": best_test_eval,
        "comparison_summary": {
            k: {
                "fit_time_sec": v["fit_time_sec"],
                "val_balanced_acc": v["val_metrics"]["balanced_accuracy"],
                "val_elevated_recall": v["val_metrics"]["recall_elevated"],
                "val_f1_macro": v["val_metrics"]["f1_macro"],
                "test_balanced_acc": v["test_metrics"]["balanced_accuracy"],
                "test_elevated_recall": v["test_metrics"]["recall_elevated"],
                "test_f1_macro": v["test_metrics"]["f1_macro"],
            }
            for k, v in comparison_results.items()
        },
        "artifacts": {
            "preprocessor": "preprocessor.joblib",
            "classifier": "best_model.joblib",
            "integrated_pipeline": "welfare_risk_pipeline.joblib",
        },
    }

    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"Saved artifacts to {models_dir}:")
    print(f"  - {preprocessor_path}")
    print(f"  - {best_model_path}")
    print(f"  - {pipeline_path}")
    print(f"  - {metadata_path}")

    return {
        "best_model_name": best_model_name,
        "comparison_results": comparison_results,
        "metadata": metadata,
    }


def run_full_training_pipeline(
    raw_data_path: str = "ml/data/raw/personnel_welfare_synthetic_raw.csv",
    processed_dir: str = "ml/data/processed",
    models_dir: str = "ml/models",
    random_state: int = 42,
) -> Dict[str, Any]:
    """
    Executes raw data split, model training, comparison, and serialization.
    """
    train_df, val_df, test_df = prepare_and_save_splits(
        raw_data_path=raw_data_path,
        output_dir=processed_dir,
        random_state=random_state,
    )

    results = train_and_compare_models(
        train_df=train_df,
        val_df=val_df,
        test_df=test_df,
        models_dir=models_dir,
        random_state=random_state,
    )

    return results


if __name__ == "__main__":
    run_full_training_pipeline()
