"""
preprocessing.py — Leakage-Safe Feature Preprocessing Pipeline for Model 5.

Module: Model 5 — Inventory Risk Prediction (Random Forest Classifier)
System: TBO SmartStock AI

Handles categorical encoding (One-Hot Encoding with unknown handling),
numerical imputation (median strategy anchored to training split),
and feature matrix alignment.
"""
from __future__ import annotations

import os
from pathlib import Path
from typing import List, Dict, Any, Optional, Union
import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import OneHotEncoder
import joblib

from model5.features import (
    ALL_PREDICTIVE_FEATURES,
    CATEGORICAL_FEATURES,
    NUMERICAL_FEATURES,
    FORBIDDEN_OUTCOME_COLUMNS,
    TARGET_COLUMNS,
    validate_features_dataframe,
    derive_decision_features
)


class Model5Preprocessor(BaseEstimator, TransformerMixin):
    """
    Leakage-safe preprocessor for Model 5 Inventory Risk Prediction.
    
    Fits categorical one-hot encoders and numerical median imputers strictly on
    the training split, ensuring zero information leakage from validation/test.
    """
    
    def __init__(self):
        self.categorical_cols = list(CATEGORICAL_FEATURES)
        self.numerical_cols = list(NUMERICAL_FEATURES)
        self.all_expected_cols = list(ALL_PREDICTIVE_FEATURES)
        
        # Scikit-learn transformers
        self.cat_encoder = OneHotEncoder(
            handle_unknown="ignore",
            sparse_output=False,
            dtype=np.float32
        )
        self.num_imputer = SimpleImputer(strategy="median")
        
        self.is_fitted = False
        self.feature_names_out_: List[str] = []
        self.num_medians_: Dict[str, float] = {}
        
    def fit(self, X: pd.DataFrame, y: Optional[Any] = None) -> "Model5Preprocessor":
        """
        Fits encoder and imputer strictly on training features.
        """
        # Validate that no forbidden outcome or target columns exist in X
        validate_features_dataframe(X, strict_leakage_check=True)
        
        # Derive decision-time engineered features if not already present
        X_proc = derive_decision_features(X)
        
        # Verify categorical columns exist
        missing_cats = [c for c in self.categorical_cols if c not in X_proc.columns]
        if missing_cats:
            raise ValueError(f"Missing required categorical columns in training data: {missing_cats}")
            
        # Verify numerical columns exist
        missing_nums = [c for c in self.numerical_cols if c not in X_proc.columns]
        if missing_nums:
            raise ValueError(f"Missing required numerical columns in training data: {missing_nums}")
            
        # Fit categorical encoder
        cat_df = X_proc[self.categorical_cols].astype(str)
        self.cat_encoder.fit(cat_df)
        cat_feature_names = list(self.cat_encoder.get_feature_names_out(self.categorical_cols))
        
        # Fit numerical imputer
        num_df = X_proc[self.numerical_cols].astype(np.float64)
        self.num_imputer.fit(num_df)
        self.num_medians_ = {
            col: float(med) for col, med in zip(self.numerical_cols, self.num_imputer.statistics_)
        }
        
        # Output feature names (numericals + one-hot categoricals)
        self.feature_names_out_ = self.numerical_cols + cat_feature_names
        self.is_fitted = True
        return self
        
    def transform(self, X: Union[pd.DataFrame, Dict[str, Any], List[Dict[str, Any]]]) -> np.ndarray:
        """
        Transforms input data into the model-ready feature matrix.
        """
        if not self.is_fitted:
            raise RuntimeError("Model5Preprocessor must be fitted before calling transform().")
            
        # Convert dict or list of dicts to DataFrame
        if isinstance(X, dict):
            df = pd.DataFrame([X])
        elif isinstance(X, list):
            df = pd.DataFrame(X)
        elif isinstance(X, pd.DataFrame):
            df = X.copy()
        else:
            raise TypeError(f"Unsupported input type for transform: {type(X)}")
            
        # Strict leakage check
        validate_features_dataframe(df, strict_leakage_check=True)
        
        # Auto-derive decision-boundary and buffer features
        df = derive_decision_features(df)
        
        # Ensure all numerical columns exist (fill missing with training medians)
        num_data = pd.DataFrame(index=df.index)
        for col in self.numerical_cols:
            if col in df.columns:
                num_data[col] = pd.to_numeric(df[col], errors="coerce")
            else:
                num_data[col] = self.num_medians_.get(col, 0.0)
                
        # Impute numerical features
        num_arr = self.num_imputer.transform(num_data[self.numerical_cols])
        
        # Ensure all categorical columns exist (fill missing with 'UNKNOWN')
        cat_data = pd.DataFrame(index=df.index)
        for col in self.categorical_cols:
            if col in df.columns:
                cat_data[col] = df[col].astype(str).fillna("UNKNOWN")
            else:
                cat_data[col] = "UNKNOWN"
                
        # Encode categorical features
        cat_arr = self.cat_encoder.transform(cat_data[self.categorical_cols])
        
        # Horizontally stack: [numerical_features, one_hot_categorical_features]
        feature_matrix = np.hstack([num_arr, cat_arr]).astype(np.float32)
        return feature_matrix

    def fit_transform(self, X: pd.DataFrame, y: Optional[Any] = None) -> np.ndarray:
        return self.fit(X, y).transform(X)

    def save(self, filepath: Union[str, Path]) -> None:
        """Serializes the preprocessor to disk using joblib."""
        p = Path(filepath)
        p.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(self, p)

    @classmethod
    def load(cls, filepath: Union[str, Path]) -> "Model5Preprocessor":
        """Loads a saved Model5Preprocessor instance from disk."""
        p = Path(filepath)
        if not p.exists():
            raise FileNotFoundError(f"Preprocessor artifact not found at: {p}")
        obj = joblib.load(p)
        if not isinstance(obj, cls):
            raise TypeError(f"Loaded artifact is not of type {cls.__name__}")
        return obj
