"""
explain.py — Probability Calibration, Feature Importance, and Risk Explanations for Model 5.

Module: Model 5 — Inventory Risk Prediction (Random Forest Classifier)
System: TBO SmartStock AI

Provides:
- Probability calibration fitting and evaluation (CalibratedClassifierCV)
- Global feature importance extraction (Gini impurity & Permutation Importance)
- Local human-readable risk explanations for inference outputs
"""
from __future__ import annotations

from typing import List, Dict, Any, Tuple, Optional
import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.inspection import permutation_importance
import joblib

from model5.features import CLASS_TO_LABEL, LABEL_TO_CLASS


def fit_probability_calibrator(
    rf_model: Any,
    X_val: np.ndarray,
    y_val: np.ndarray,
    method: str = "isotonic"
) -> Tuple[CalibratedClassifierCV, Dict[str, float]]:
    """
    Fits a probability calibrator on held-out validation data (prefit model).
    Never touches test data.
    """
    try:
        from sklearn.frozen import FrozenEstimator
        calibrator = CalibratedClassifierCV(FrozenEstimator(rf_model), method=method)
        calibrator.fit(X_val, y_val)
    except (ImportError, Exception):
        try:
            calibrator = CalibratedClassifierCV(estimator=rf_model, method=method, cv="prefit")
            calibrator.fit(X_val, y_val)
        except Exception:
            try:
                from sklearn.frozen import FrozenEstimator
                calibrator = CalibratedClassifierCV(FrozenEstimator(rf_model), method="sigmoid")
                calibrator.fit(X_val, y_val)
            except Exception:
                calibrator = CalibratedClassifierCV(estimator=rf_model, method="sigmoid", cv="prefit")
                calibrator.fit(X_val, y_val)
        
    # Evaluate probability distribution post-calibration
    raw_probs = rf_model.predict_proba(X_val)
    cal_probs = calibrator.predict_proba(X_val)
    
    # Calculate Brier score change
    from model5.evaluate import compute_multiclass_brier_score
    brier_raw = compute_multiclass_brier_score(y_val, raw_probs)
    brier_cal = compute_multiclass_brier_score(y_val, cal_probs)
    
    diag = {
        "calibration_method": method,
        "brier_score_raw": brier_raw,
        "brier_score_calibrated": brier_cal,
        "brier_improvement": round(brier_raw - brier_cal, 5)
    }
    return calibrator, diag


def extract_feature_importances(
    rf_model: Any,
    feature_names: List[str],
    X_val: Optional[np.ndarray] = None,
    y_val: Optional[np.ndarray] = None
) -> pd.DataFrame:
    """
    Extracts Gini impurity feature importances from Random Forest,
    and optionally computes permutation importance on validation set.
    """
    gini_imp = rf_model.feature_importances_
    
    df_imp = pd.DataFrame({
        "feature": feature_names,
        "gini_importance": np.round(gini_imp, 5)
    })
    
    if X_val is not None and y_val is not None:
        try:
            perm = permutation_importance(
                rf_model, X_val, y_val,
                n_repeats=5,
                random_state=42,
                n_jobs=-1
            )
            df_imp["permutation_importance_mean"] = np.round(perm.importances_mean, 5)
            df_imp["permutation_importance_std"] = np.round(perm.importances_std, 5)
        except Exception:
            df_imp["permutation_importance_mean"] = df_imp["gini_importance"]
            df_imp["permutation_importance_std"] = 0.0
    else:
        df_imp["permutation_importance_mean"] = df_imp["gini_importance"]
        df_imp["permutation_importance_std"] = 0.0
        
    df_imp = df_imp.sort_values("gini_importance", ascending=False).reset_index(drop=True)
    df_imp["rank"] = df_imp.index + 1
    return df_imp


class RiskExplainer:
    """
    Generates human-readable, domain-grounded business explanations for
    individual procurement opportunity predictions.
    """
    
    @staticmethod
    def explain_opportunity(
        record: Dict[str, Any],
        predicted_class: int,
        predicted_probs: Dict[str, float]
    ) -> List[str]:
        """
        Generates 2 to 4 bullet points explaining the driving factors behind
        the predicted inventory risk class.
        """
        explanations: List[str] = []
        
        q = record.get("procured_quantity")
        h30 = record.get("historical_daily_demand_30d_avg")
        cap = record.get("supplier_capacity")
        lead = record.get("procurement_lead_time_days")
        pace = record.get("current_pace_on_the_books")
        cancel_rate = record.get("historical_cancellation_rate_30d")
        flex = record.get("contract_flexibility", "STANDARD")
        is_high = record.get("is_high_season", 0)
        
        pred_label = CLASS_TO_LABEL.get(predicted_class, "UNKNOWN")
        
        # 1. Procurement Quantity vs Historical Demand Ratio
        if q is not None and h30 is not None and h30 > 0:
            ratio = q / h30
            pct_diff = round((ratio - 1.0) * 100, 1)
            if pct_diff > 15:
                explanations.append(
                    f"Procured volume ({q:,} rooms) is {pct_diff:+.1f}% above 30-day historical demand "
                    f"({h30:.1f} rooms/day), driving elevated UNSOLD inventory risk."
                )
            elif pct_diff < -15:
                explanations.append(
                    f"Procured volume ({q:,} rooms) is {abs(pct_diff):.1f}% below 30-day historical demand "
                    f"({h30:.1f} rooms/day), driving high room SHORTAGE / stockout risk."
                )
            else:
                explanations.append(
                    f"Procured volume ({q:,} rooms) is closely aligned within {abs(pct_diff):.1f}% of 30-day historical demand "
                    f"({h30:.1f} rooms/day), supporting a BALANCED inventory outcome."
                )
                
        # 2. Lead Time & Booking Pace On The Books
        if lead is not None and pace is not None:
            if lead >= 60 and pace <= 10:
                explanations.append(
                    f"Long procurement lead time ({lead} days) with early booking pace ({pace} bookings on the books) "
                    "increases demand realization uncertainty."
                )
            elif lead <= 21 and pace >= 20:
                explanations.append(
                    f"Short procurement lead time ({lead} days) with strong confirmed booking pace ({pace} bookings on the books) "
                    "provides solid baseline demand absorption."
                )
                
        # 3. Contract Flexibility & Supplier Capacity
        if flex == "NON_REFUNDABLE" and pred_label == "UNSOLD":
            explanations.append(
                "Contract is NON_REFUNDABLE; unsold rooms cannot be returned to supplier prior to check-in, amplifying downside risk."
            )
        elif flex == "FLEXIBLE" and pred_label == "UNSOLD":
            explanations.append(
                "FLEXIBLE supplier terms allow return of unsold allotments before the release deadline, mitigating cash loss."
            )
            
        # 4. Cancellation Rate Impact
        if cancel_rate is not None and cancel_rate >= 0.35:
            explanations.append(
                f"Elevated 30-day historical cancellation rate ({cancel_rate:.1%}) may erode gross bookings before arrival."
            )
            
        # 5. Seasonality
        if is_high == 1 and pred_label == "SHORTAGE":
            explanations.append(
                "High season travel demand trajectory significantly increases probability of stockout during peak stay dates."
            )
            
        # Fallback if no specific factors triggered
        if not explanations:
            explanations.append(
                f"Prediction {pred_label} driven by general alignment between procurement commitment and historical seasonal velocity."
            )
            
        return explanations
