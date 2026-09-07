"""
SahyogX - Model Evaluation Module

This module provides comprehensive evaluation for multi-class personnel stress
and welfare risk prediction.

Metrics computed:
- Accuracy
- Balanced Accuracy (crucial under class imbalance)
- Macro & Weighted Precision
- Macro & Weighted Recall
- Class-specific Recall (specifically ELEVATED risk recall)
- Macro & Weighted F1-Score
- Multiclass ROC-AUC (One-vs-Rest)
- Multiclass PR-AUC / Average Precision
- Full Confusion Matrix

Domain Priority Justification:
In defense and uniformed forces welfare monitoring, False Negatives for the
ELEVATED risk tier represent personnel under severe operational exhaustion or
distress who go unnoticed. The human, operational, and safety cost of a False
Negative is significantly higher than a False Positive (which merely results in
a routine welfare inquiry or command check-in). Consequently, Recall on ELEVATED
Risk and Balanced Accuracy are the primary governing metrics.
"""

from typing import Any, Dict, List, Optional
import numpy as np
from sklearn.metrics import (
    accuracy_score,
    balanced_accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
    average_precision_score,
)
from sklearn.preprocessing import label_binarize


def evaluate_model(
    model: Any,
    X: Any,
    y_true: Any,
    class_labels: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """
    Evaluates a trained classifier on a dataset and returns structured metrics.

    Args:
        model: Trained scikit-learn estimator or pipeline.
        X: Feature DataFrame or array.
        y_true: Ground truth target Series (string labels).
        class_labels: Ordered list of unique class names. Defaults to ['LOW', 'MODERATE', 'ELEVATED'].

    Returns:
        Dict containing scalar metrics, confusion matrix, and classification report dict.
    """
    if class_labels is None:
        class_labels = ["LOW", "MODERATE", "ELEVATED"]

    y_pred = model.predict(X)
    has_proba = hasattr(model, "predict_proba")
    y_proba = model.predict_proba(X) if has_proba else None

    # Base Metrics
    acc = accuracy_score(y_true, y_pred)
    bal_acc = balanced_accuracy_score(y_true, y_pred)

    prec_macro = precision_score(y_true, y_pred, labels=class_labels, average="macro", zero_division=0)
    prec_weighted = precision_score(y_true, y_pred, labels=class_labels, average="weighted", zero_division=0)

    rec_macro = recall_score(y_true, y_pred, labels=class_labels, average="macro", zero_division=0)
    rec_weighted = recall_score(y_true, y_pred, labels=class_labels, average="weighted", zero_division=0)

    f1_macro = f1_score(y_true, y_pred, labels=class_labels, average="macro", zero_division=0)
    f1_weighted = f1_score(y_true, y_pred, labels=class_labels, average="weighted", zero_division=0)

    # Class-specific recalls (critical for ELEVATED class)
    class_recalls = recall_score(y_true, y_pred, labels=class_labels, average=None, zero_division=0)
    class_precisions = precision_score(y_true, y_pred, labels=class_labels, average=None, zero_division=0)
    class_f1s = f1_score(y_true, y_pred, labels=class_labels, average=None, zero_division=0)

    per_class_metrics: Dict[str, Dict[str, float]] = {}
    for i, label in enumerate(class_labels):
        per_class_metrics[label] = {
            "precision": float(np.round(class_precisions[i], 4)),
            "recall": float(np.round(class_recalls[i], 4)),
            "f1": float(np.round(class_f1s[i], 4)),
        }

    # Confusion matrix
    cm = confusion_matrix(y_true, y_pred, labels=class_labels)
    cm_dict = {
        "labels": class_labels,
        "matrix": cm.tolist(),
    }

    # ROC-AUC and PR-AUC (One-vs-Rest)
    roc_auc_macro = None
    roc_auc_weighted = None
    pr_auc_macro = None
    if has_proba and y_proba is not None and len(class_labels) > 2:
        try:
            if hasattr(model, "classes_"):
                model_classes = list(model.classes_)
                col_indices = [model_classes.index(lbl) for lbl in class_labels]
                y_proba_aligned = y_proba[:, col_indices]
            else:
                y_proba_aligned = y_proba

            y_bin = label_binarize(y_true, classes=class_labels)
            roc_auc_macro = float(roc_auc_score(y_bin, y_proba_aligned, multi_class="ovr", average="macro"))
            roc_auc_weighted = float(roc_auc_score(y_bin, y_proba_aligned, multi_class="ovr", average="weighted"))
            pr_auc_macro = float(average_precision_score(y_bin, y_proba_aligned, average="macro"))
        except Exception:
            pass

    report_dict = classification_report(
        y_true, y_pred, labels=class_labels, output_dict=True, zero_division=0
    )

    results = {
        "accuracy": float(np.round(acc, 4)),
        "balanced_accuracy": float(np.round(bal_acc, 4)),
        "precision_macro": float(np.round(prec_macro, 4)),
        "precision_weighted": float(np.round(prec_weighted, 4)),
        "recall_macro": float(np.round(rec_macro, 4)),
        "recall_weighted": float(np.round(rec_weighted, 4)),
        "recall_elevated": per_class_metrics.get("ELEVATED", {}).get("recall", 0.0),
        "f1_macro": float(np.round(f1_macro, 4)),
        "f1_weighted": float(np.round(f1_weighted, 4)),
        "roc_auc_macro": float(np.round(roc_auc_macro, 4)) if roc_auc_macro is not None else None,
        "roc_auc_weighted": float(np.round(roc_auc_weighted, 4)) if roc_auc_weighted is not None else None,
        "pr_auc_macro": float(np.round(pr_auc_macro, 4)) if pr_auc_macro is not None else None,
        "per_class": per_class_metrics,
        "confusion_matrix": cm_dict,
        "classification_report": report_dict,
    }

    return results


def format_confusion_matrix(cm_dict: Dict[str, Any]) -> str:
    """Formats confusion matrix into clean ASCII table."""
    labels = cm_dict["labels"]
    matrix = cm_dict["matrix"]
    header = f"{'True \\ Pred':<14} | " + " | ".join(f"{lbl:<10}" for lbl in labels)
    separator = "-" * len(header)
    rows = [header, separator]
    for i, row in enumerate(matrix):
        row_str = f"{labels[i]:<14} | " + " | ".join(f"{val:<10}" for val in row)
        rows.append(row_str)
    return "\n".join(rows)
