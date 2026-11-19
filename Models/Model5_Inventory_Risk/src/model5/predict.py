"""
predict.py — Stable Inference Pipeline for Model 5: Inventory Risk Prediction.

Module: Model 5 — Inventory Risk Prediction (Random Forest Classifier)
System: TBO SmartStock AI

Supports:
- Individual opportunity risk prediction
- Batch opportunity risk prediction
- Preprocessing and schema validation
- Handling missing optional features and unseen categoricals
- Calibrated probability extraction (BALANCED, UNSOLD, SHORTAGE)
- Human-readable domain risk explanations
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, Any, List, Union, Optional
import numpy as np
import pandas as pd
import joblib

from model5.config import ARTIFACTS_DIR, PROJECT_ROOT
from model5.features import (
    ALL_PREDICTIVE_FEATURES,
    CATEGORICAL_FEATURES,
    NUMERICAL_FEATURES,
    LABEL_TO_CLASS,
    CLASS_TO_LABEL,
    validate_features_dataframe,
    derive_calendar_features
)
from model5.preprocessing import Model5Preprocessor
from model5.explain import RiskExplainer


class Model5Predictor:
    """
    Production-ready inference interface for Model 5.
    
    Loads trained Random Forest model, feature preprocessor, probability calibrator,
    and metadata schemas. Exposes single and batch prediction methods with probability
    diagnostics and risk factor explanations.
    """
    
    def __init__(self, artifacts_dir: Optional[Union[str, Path]] = None):
        if artifacts_dir is None:
            self.artifacts_dir = ARTIFACTS_DIR / "model5"
        else:
            self.artifacts_dir = Path(artifacts_dir)
            
        self.model = None
        self.preprocessor: Optional[Model5Preprocessor] = None
        self.calibrator = None
        self.feature_schema: Dict[str, Any] = {}
        self.label_mapping: Dict[str, Any] = {}
        self.metadata: Dict[str, Any] = {}
        self.is_loaded = False
        
        self._load_artifacts()
        
    def _load_artifacts(self) -> None:
        """Loads all required model artifacts from disk."""
        model_path = self.artifacts_dir / "random_forest_model.joblib"
        prep_path = self.artifacts_dir / "preprocessor.joblib"
        cal_path = self.artifacts_dir / "calibrator.joblib"
        schema_path = self.artifacts_dir / "feature_schema.json"
        label_path = self.artifacts_dir / "label_mapping.json"
        meta_path = self.artifacts_dir / "model_metadata.json"
        
        if not model_path.exists():
            raise FileNotFoundError(f"Model artifact missing at {model_path}. Please train the model first.")
        if not prep_path.exists():
            raise FileNotFoundError(f"Preprocessor artifact missing at {prep_path}.")
            
        self.model = joblib.load(model_path)
        self.preprocessor = Model5Preprocessor.load(prep_path)
        
        if cal_path.exists():
            self.calibrator = joblib.load(cal_path)
        else:
            self.calibrator = None
            
        if schema_path.exists():
            with open(schema_path, "r", encoding="utf-8") as f:
                self.feature_schema = json.load(f)
                
        if label_path.exists():
            with open(label_path, "r", encoding="utf-8") as f:
                self.label_mapping = json.load(f)
                
        if meta_path.exists():
            with open(meta_path, "r", encoding="utf-8") as f:
                self.metadata = json.load(f)
                
        self.is_loaded = True
        
    def _prepare_inputs(self, records: List[Dict[str, Any]]) -> pd.DataFrame:
        """
        Validates, prepares, and auto-derives calendar features for input records.
        """
        df = pd.DataFrame(records)
        
        # Check for forbidden outcome columns
        validate_features_dataframe(df, strict_leakage_check=True)
        
        # If checkin_date provided but calendar features missing, derive them
        if "checkin_date" in df.columns:
            cal_df = derive_calendar_features(df["checkin_date"])
            for c in ["checkin_year", "checkin_month", "checkin_day_of_week", "is_weekend", "is_high_season", "quarter"]:
                if c not in df.columns:
                    df[c] = cal_df[c]
                    
        # Derive lead time if checkin_date and decision_timestamp provided
        if "checkin_date" in df.columns and "decision_timestamp" in df.columns and "procurement_lead_time_days" not in df.columns:
            try:
                ci = pd.to_datetime(df["checkin_date"])
                dt = pd.to_datetime(df["decision_timestamp"])
                df["procurement_lead_time_days"] = (ci - dt).dt.days.clip(lower=0)
            except Exception:
                pass
                
        return df

    def predict_single(self, record: Dict[str, Any], use_calibrated: bool = True) -> Dict[str, Any]:
        """
        Predicts inventory risk for a single procurement opportunity.
        """
        results = self.predict_batch([record], use_calibrated=use_calibrated)
        return results[0]

    def predict_batch(
        self,
        records: List[Dict[str, Any]],
        use_calibrated: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Predicts inventory risk for a batch of procurement opportunities.
        """
        if not self.is_loaded:
            raise RuntimeError("Model artifacts are not loaded.")
        if not records:
            return []
            
        df = self._prepare_inputs(records)
        
        # Transform through preprocessor
        X_trans = self.preprocessor.transform(df)
        
        # Determine which estimator to use
        estimator = self.calibrator if (use_calibrated and self.calibrator is not None) else self.model
        probs = estimator.predict_proba(X_trans)
        preds = np.argmax(probs, axis=1)
        
        results: List[Dict[str, Any]] = []
        for i, (pred_cls, prob_vec) in enumerate(zip(preds, probs)):
            pred_cls = int(pred_cls)
            pred_label = CLASS_TO_LABEL.get(pred_cls, "UNKNOWN")
            
            p_balanced = round(float(prob_vec[0]), 4)
            p_unsold = round(float(prob_vec[1]), 4)
            p_shortage = round(float(prob_vec[2]), 4)
            
            prob_dict = {
                "balanced_probability": p_balanced,
                "unsold_probability": p_unsold,
                "shortage_probability": p_shortage
            }
            
            # Generate domain explanations
            raw_rec = records[i]
            explanations = RiskExplainer.explain_opportunity(raw_rec, pred_cls, prob_dict)
            
            opp_id = raw_rec.get("opportunity_id", f"OPP_{i+1:04d}")
            res = {
                "opportunity_id": opp_id,
                "predicted_risk_class": pred_cls,
                "predicted_risk_label": pred_label,
                "probabilities": prob_dict,
                "is_calibrated": (use_calibrated and self.calibrator is not None),
                "risk_factors": explanations,
                "model_version": self.metadata.get("version", "1.0.0")
            }
            results.append(res)
            
        return results
