"""
evaluate.py — Comprehensive Multiclass Evaluation for Model 5.

Module: Model 5 — Inventory Risk Prediction (Random Forest Classifier)
System: TBO SmartStock AI

Calculates:
- Overall Accuracy & Balanced Accuracy
- Macro & Weighted Precision, Recall, F1
- Per-class Precision, Recall, F1 for BALANCED (0), UNSOLD (1), SHORTAGE (2)
- Multiclass Log Loss & Multiclass Brier Score
- One-vs-Rest Multiclass ROC-AUC
- Confusion Matrix
"""
from __future__ import annotations

from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    balanced_accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    log_loss,
    roc_auc_score,
    classification_report
)

from model5.features import CLASS_TO_LABEL, LABEL_TO_CLASS


def compute_multiclass_brier_score(y_true: np.ndarray, y_prob: np.ndarray, n_classes: int = 3) -> float:
    """
    Computes multiclass Brier score:
    Brier = (1/N) * sum_{i=1}^N sum_{c=0}^{K-1} (p_{ic} - y_{ic})^2
    """
    y_true = np.asarray(y_true)
    y_prob = np.asarray(y_prob)
    n = len(y_true)
    if n == 0:
        return 0.0
        
    # One-hot encode ground truth
    y_one_hot = np.zeros((n, n_classes), dtype=np.float64)
    for i, label in enumerate(y_true):
        if 0 <= label < n_classes:
            y_one_hot[i, int(label)] = 1.0
            
    brier = float(np.mean(np.sum((y_prob - y_one_hot) ** 2, axis=1)))
    return round(brier, 5)


def evaluate_predictions(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    y_prob: Optional[np.ndarray] = None,
    dataset_name: str = "Dataset"
) -> Dict[str, Any]:
    """
    Computes all 13 required evaluation metrics for Model 5.
    """
    y_true = np.asarray(y_true)
    y_pred = np.asarray(y_pred)
    
    acc = float(accuracy_score(y_true, y_pred))
    bal_acc = float(balanced_accuracy_score(y_true, y_pred))
    macro_prec = float(precision_score(y_true, y_pred, average="macro", zero_division=0))
    macro_rec = float(recall_score(y_true, y_pred, average="macro", zero_division=0))
    macro_f1 = float(f1_score(y_true, y_pred, average="macro", zero_division=0))
    weighted_f1 = float(f1_score(y_true, y_pred, average="weighted", zero_division=0))
    
    # Per-class metrics (classes 0, 1, 2)
    per_class_prec = precision_score(y_true, y_pred, average=None, labels=[0, 1, 2], zero_division=0)
    per_class_rec = recall_score(y_true, y_pred, average=None, labels=[0, 1, 2], zero_division=0)
    per_class_f1 = f1_score(y_true, y_pred, average=None, labels=[0, 1, 2], zero_division=0)
    
    cm = confusion_matrix(y_true, y_pred, labels=[0, 1, 2]).tolist()
    
    metrics: Dict[str, Any] = {
        "dataset_name": dataset_name,
        "n_samples": int(len(y_true)),
        "accuracy": round(acc, 4),
        "balanced_accuracy": round(bal_acc, 4),
        "macro_precision": round(macro_prec, 4),
        "macro_recall": round(macro_rec, 4),
        "macro_f1": round(macro_f1, 4),
        "weighted_f1": round(weighted_f1, 4),
        "per_class": {
            "BALANCED": {
                "precision": round(float(per_class_prec[0]), 4),
                "recall": round(float(per_class_rec[0]), 4),
                "f1_score": round(float(per_class_f1[0]), 4)
            },
            "UNSOLD": {
                "precision": round(float(per_class_prec[1]), 4),
                "recall": round(float(per_class_rec[1]), 4),
                "f1_score": round(float(per_class_f1[1]), 4)
            },
            "SHORTAGE": {
                "precision": round(float(per_class_prec[2]), 4),
                "recall": round(float(per_class_rec[2]), 4),
                "f1_score": round(float(per_class_f1[2]), 4)
            }
        },
        "confusion_matrix": {
            "labels": ["BALANCED (0)", "UNSOLD (1)", "SHORTAGE (2)"],
            "matrix": cm
        }
    }
    
    # Probability metrics if probabilities provided
    if y_prob is not None:
        y_prob = np.asarray(y_prob)
        try:
            ll = float(log_loss(y_true, y_prob, labels=[0, 1, 2]))
            metrics["log_loss"] = round(ll, 4)
        except Exception:
            metrics["log_loss"] = None
            
        metrics["brier_score"] = compute_multiclass_brier_score(y_true, y_prob, n_classes=3)
        
        try:
            auc = float(roc_auc_score(y_true, y_prob, multi_class="ovr", average="macro", labels=[0, 1, 2]))
            metrics["roc_auc_ovr_macro"] = round(auc, 4)
        except Exception:
            metrics["roc_auc_ovr_macro"] = None
    else:
        metrics["log_loss"] = None
        metrics["brier_score"] = None
        metrics["roc_auc_ovr_macro"] = None
        
    return metrics


def format_metrics_markdown(metrics: Dict[str, Any]) -> str:
    """Formats metrics dictionary into a readable markdown string."""
    dname = metrics.get("dataset_name", "Split")
    lines = [
        f"### {dname} Evaluation Summary (N = {metrics['n_samples']:,})",
        "",
        "| Metric | Value |",
        "|---|---|",
        f"| **Accuracy** | {metrics['accuracy']:.2%} |",
        f"| **Balanced Accuracy** | {metrics['balanced_accuracy']:.2%} |",
        f"| **Macro F1-Score** | {metrics['macro_f1']:.4f} |",
        f"| **Weighted F1-Score** | {metrics['weighted_f1']:.4f} |",
        f"| **Macro Precision** | {metrics['macro_precision']:.4f} |",
        f"| **Macro Recall** | {metrics['macro_recall']:.4f} |",
    ]
    if metrics.get("log_loss") is not None:
        lines.append(f"| **Log Loss** | {metrics['log_loss']:.4f} |")
    if metrics.get("brier_score") is not None:
        lines.append(f"| **Brier Score** | {metrics['brier_score']:.4f} |")
    if metrics.get("roc_auc_ovr_macro") is not None:
        lines.append(f"| **ROC-AUC (OvR Macro)** | {metrics['roc_auc_ovr_macro']:.4f} |")
        
    lines.extend([
        "",
        "#### Per-Class Performance",
        "",
        "| Risk Class | Precision | Recall | F1-Score |",
        "|---|---|---|---|",
        f"| **BALANCED (0)** | {metrics['per_class']['BALANCED']['precision']:.4f} | {metrics['per_class']['BALANCED']['recall']:.4f} | {metrics['per_class']['BALANCED']['f1_score']:.4f} |",
        f"| **UNSOLD (1)** | {metrics['per_class']['UNSOLD']['precision']:.4f} | {metrics['per_class']['UNSOLD']['recall']:.4f} | {metrics['per_class']['UNSOLD']['f1_score']:.4f} |",
        f"| **SHORTAGE (2)** | {metrics['per_class']['SHORTAGE']['precision']:.4f} | {metrics['per_class']['SHORTAGE']['recall']:.4f} | {metrics['per_class']['SHORTAGE']['f1_score']:.4f} |",
        "",
        "#### Confusion Matrix (Rows: Actual, Cols: Predicted)",
        "",
        "| Actual \\ Pred | Pred BALANCED | Pred UNSOLD | Pred SHORTAGE |",
        "|---|---|---|---|",
        f"| **Actual BALANCED** | {metrics['confusion_matrix']['matrix'][0][0]} | {metrics['confusion_matrix']['matrix'][0][1]} | {metrics['confusion_matrix']['matrix'][0][2]} |",
        f"| **Actual UNSOLD** | {metrics['confusion_matrix']['matrix'][1][0]} | {metrics['confusion_matrix']['matrix'][1][1]} | {metrics['confusion_matrix']['matrix'][1][2]} |",
        f"| **Actual SHORTAGE** | {metrics['confusion_matrix']['matrix'][2][0]} | {metrics['confusion_matrix']['matrix'][2][1]} | {metrics['confusion_matrix']['matrix'][2][2]} |"
    ])
    return "\n".join(lines)
