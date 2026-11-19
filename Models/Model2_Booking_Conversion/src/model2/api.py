"""
api.py — FastAPI service for Model 2: Booking Conversion Prediction.

Endpoints:
  - GET  /api/model2/health           : Health check and model metadata
  - POST /api/model2/predict          : Single or batch conversion probability prediction
  - POST /api/model2/expected-bookings: Aggregate calibrated probabilities by destination and checkin month

NOTE: Public consumer-travel proxy data, NOT TBO B2B data.
      This model MUST be recalibrated on TBO data before production use.
"""
from __future__ import annotations

import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from .predict import (
    FIELD_ALIASES,
    FORBIDDEN_COLS,
    Model2Predictor,
    _get_predictor,
    explain_prediction,
    predict_conversion_proba,
    transform_raw_searches_to_features,
)

app = FastAPI(
    title="TBO SmartStock AI — Model 2: Booking Conversion Prediction Service",
    version="1.0.0",
    description=(
        "Production inference API for Model 2 (Booking Conversion Prediction) in TBO SmartStock AI. "
        "Predicts the calibrated probability that a hotel search converts into a confirmed booking. "
        "Provides aggregate expected bookings for downstream inventory pre-purchasing.\n\n"
        "**NOTE**: Trained on public consumer-travel proxy data, NOT TBO B2B data."
    ),
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins (e.g. localhost:3000, localhost:5173, etc.)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OPTIMAL_THRESHOLD = 0.21  # F1-maximizing threshold chosen strictly on validation block


# ---------------------------------------------------------------------------
# Pydantic Schemas
# ---------------------------------------------------------------------------
class SearchItem(BaseModel):
    """
    Schema for an incoming search query record.
    Supports standard Expedia raw names as well as user-friendly frontend aliases.
    """
    model_config = ConfigDict(populate_by_name=True, extra="allow")

    srch_destination_id: int = Field(
        ...,
        alias="destination_id",
        description="Destination ID (e.g., 8250)",
        examples=[8250],
    )
    srch_ci: str = Field(
        ...,
        alias="checkin_date",
        description="Check-in date in YYYY-MM-DD or ISO 8601 format",
        examples=["2026-12-01"],
    )
    srch_co: str = Field(
        ...,
        alias="checkout_date",
        description="Check-out date in YYYY-MM-DD or ISO 8601 format",
        examples=["2026-12-05"],
    )
    srch_adults_cnt: Optional[int] = Field(
        1,
        alias="num_adults",
        ge=1,
        le=20,
        description="Number of adult guests (default 1)",
        examples=[2],
    )
    srch_children_cnt: Optional[int] = Field(
        0,
        alias="num_children",
        ge=0,
        le=10,
        description="Number of children (default 0)",
        examples=[0],
    )
    srch_rm_cnt: Optional[int] = Field(
        1,
        alias="num_rooms",
        ge=1,
        le=10,
        description="Number of rooms requested (default 1)",
        examples=[1],
    )
    user_id: Optional[Union[int, str]] = Field(
        None,
        description="User identifier for historical conversion rate lookup (cold start defaults to 0 prior intents)",
        examples=[95161],
    )
    date_time: Optional[str] = Field(
        None,
        alias="search_datetime",
        description="Search execution timestamp (default: current UTC timestamp)",
        examples=["2026-11-18 12:00:00"],
    )
    orig_destination_distance: Optional[float] = Field(
        None,
        alias="distance",
        description="Physical distance between searcher origin and destination",
        examples=[254.8],
    )
    is_mobile: Optional[int] = Field(
        0,
        ge=0,
        le=1,
        description="Device type: 1 if mobile device, 0 otherwise",
        examples=[0],
    )
    is_package: Optional[int] = Field(
        0,
        ge=0,
        le=1,
        description="Package booking: 1 if combined flight+hotel, 0 otherwise",
        examples=[0],
    )
    channel: Optional[int] = Field(
        0,
        description="Distribution / marketing channel identifier",
        examples=[9],
    )
    site_name: Optional[int] = Field(
        2,
        description="Expedia POS / point-of-sale portal ID",
        examples=[2],
    )
    posa_continent: Optional[int] = Field(
        3,
        description="Point of sale continent ID",
        examples=[3],
    )
    srch_destination_type_id: Optional[int] = Field(
        1,
        description="Destination classification type ID",
        examples=[1],
    )
    hotel_continent: Optional[int] = Field(
        2,
        description="Hotel continent ID",
        examples=[2],
    )
    hotel_country: Optional[int] = Field(
        50,
        description="Hotel country ID",
        examples=[50],
    )
    hotel_market: Optional[int] = Field(
        628,
        description="Hotel market ID",
        examples=[628],
    )
    user_location_country: Optional[int] = Field(
        66,
        description="User origin country ID",
        examples=[66],
    )
    user_location_region: Optional[int] = Field(
        311,
        description="User origin region ID",
        examples=[311],
    )
    user_prior_intents: Optional[float] = Field(
        None,
        description="Optional explicit count of prior search intents",
    )
    user_prior_booking_rate: Optional[float] = Field(
        None,
        description="Optional explicit historical booking conversion rate",
    )

    @field_validator("srch_ci", "srch_co")
    @classmethod
    def validate_date_format(cls, v: str) -> str:
        try:
            ts = pd.to_datetime(v)
            if pd.isna(ts):
                raise ValueError
        except Exception:
            raise ValueError(f"Invalid date format '{v}'. Expected YYYY-MM-DD or ISO 8601 string.")
        return v

    @model_validator(mode="after")
    def validate_date_ordering_and_forbidden(self) -> SearchItem:
        # Check forbidden columns in extra fields
        extra = self.__pydantic_extra__ or {}
        found_forbidden = [c for c in FORBIDDEN_COLS if c in extra]
        if found_forbidden:
            raise ValueError(
                f"Input contains forbidden post-event columns: {found_forbidden}. "
                "These columns represent post-booking leakage and are strictly forbidden at inference time."
            )

        # Date ordering
        ci = pd.to_datetime(self.srch_ci)
        co = pd.to_datetime(self.srch_co)
        if co < ci:
            raise ValueError(
                f"Check-out date ({self.srch_co}) cannot be earlier than check-in date ({self.srch_ci})."
            )
        return self


class PredictRequest(BaseModel):
    """Payload for POST /api/model2/predict."""
    search: Optional[SearchItem] = Field(
        None,
        description="Single search query record",
    )
    searches: Optional[List[SearchItem]] = Field(
        None,
        description="Batch of search query records",
    )
    include_explanation: Optional[bool] = Field(
        False,
        description="Whether to generate top SHAP explanation drivers for each prediction",
    )
    actual_matured_rate: Optional[float] = Field(
        None,
        description="Optional observed booking rate in matured cohort for drift recalibration",
    )
    predicted_matured_rate: Optional[float] = Field(
        None,
        description="Optional mean predicted booking rate in matured cohort for drift recalibration",
    )

    @model_validator(mode="after")
    def check_at_least_one(self) -> PredictRequest:
        if self.search is None and (self.searches is None or len(self.searches) == 0):
            raise ValueError("Must provide either 'search' (single object) or 'searches' (list of objects).")
        return self


class SinglePredictionResult(BaseModel):
    index: int
    destination_id: int
    conversion_probability: float = Field(
        ...,
        description="Calibrated probability in [0, 1] that this search converts to a booking",
    )
    conversion_percentage: str
    expected_bookings_per_1000: float
    binary_prediction_at_optimal_threshold: int = Field(
        ...,
        description="Binary 0/1 flag using the validation-optimal threshold (0.21)",
    )
    optimal_threshold: float = OPTIMAL_THRESHOLD
    explanation: Optional[Dict[str, Any]] = None


class PredictResponse(BaseModel):
    status: str = "success"
    model_version: str = "1.0.0"
    model_name: str = "Model 2: Booking Conversion Prediction"
    prediction_count: int
    mean_conversion_probability: float
    expected_bookings_total: float
    predictions: List[SinglePredictionResult]
    dataset_note: str = "PUBLIC CONSUMER DATA PROXY - NOT TBO B2B DATA"


class ExpectedBookingsRequest(BaseModel):
    """Payload for POST /api/model2/expected-bookings."""
    searches: List[SearchItem] = Field(
        ...,
        description="List of search queries to aggregate",
    )
    group_cols: Optional[List[str]] = Field(
        None,
        description="Columns to group by (default: ['destination_id', 'checkin_month'])",
        examples=[["destination_id", "checkin_month"]],
    )
    actual_matured_rate: Optional[float] = None
    predicted_matured_rate: Optional[float] = None


class GroupAggResult(BaseModel):
    destination_id: Optional[Union[int, str]] = None
    checkin_month: Optional[int] = None
    search_count: int
    expected_bookings: float
    expected_conversion_rate: float
    extra_group_values: Optional[Dict[str, Any]] = None


class ExpectedBookingsResponse(BaseModel):
    status: str = "success"
    model_version: str = "1.0.0"
    total_searches: int
    total_expected_bookings: float
    overall_expected_conversion_rate: float
    group_columns: List[str]
    aggregation_method: str = "sum_of_calibrated_probabilities"
    aggregated_results: List[GroupAggResult]
    dataset_note: str = "PUBLIC CONSUMER DATA PROXY - NOT TBO B2B DATA"


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get("/", tags=["General"])
def root():
    """Service landing page and navigation."""
    return {
        "service": "TBO SmartStock AI — Model 2: Booking Conversion Prediction",
        "status": "online",
        "docs_url": "/docs",
        "health_url": "/api/model2/health",
        "predict_url": "/api/model2/predict",
        "expected_bookings_url": "/api/model2/expected-bookings",
        "dataset_note": "PUBLIC CONSUMER DATA PROXY - NOT TBO B2B DATA",
    }


@app.get("/health", tags=["Health"])
@app.get("/api/model2/health", tags=["Health"])
def health():
    """Health check endpoint: verifies model and lookup tables are loaded."""
    try:
        predictor = _get_predictor()
        return {
            "status": "healthy",
            "model": "Model 2: Booking Conversion Prediction",
            "model_version": "1.0.0",
            "xgboost_loaded": predictor.xgb_model is not None,
            "calibrator_loaded": predictor.calibrator is not None,
            "calibrator_method": predictor.cal_method,
            "feature_count": len(predictor.feat_cols),
            "optimal_threshold": OPTIMAL_THRESHOLD,
            "dataset_note": "PUBLIC CONSUMER DATA PROXY - NOT TBO B2B DATA",
        }
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Model initialization failed: {str(exc)}",
        )


@app.post("/api/model2/predict", response_model=PredictResponse, tags=["Inference"])
def predict(payload: Union[PredictRequest, List[SearchItem], SearchItem]):
    """
    Predict calibrated booking conversion probability for individual or batch searches.
    
    Accepts:
      - `{"search": {...}, "include_explanation": bool}`
      - `{"searches": [{...}, ...], "include_explanation": bool}`
      - `[{...}, ...]` (direct list of search items)
      - `{...}` (direct single search item)
    """
    predictor = _get_predictor()

    # Normalize input
    items: List[SearchItem] = []
    include_explanation = False
    actual_matured_rate = None
    predicted_matured_rate = None

    if isinstance(payload, SearchItem):
        items = [payload]
    elif isinstance(payload, list):
        items = payload
    elif isinstance(payload, PredictRequest):
        if payload.search is not None:
            items = [payload.search]
        elif payload.searches is not None:
            items = payload.searches
        include_explanation = bool(payload.include_explanation)
        actual_matured_rate = payload.actual_matured_rate
        predicted_matured_rate = payload.predicted_matured_rate

    if not items:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No search items provided for prediction.",
        )

    # Convert items to raw dictionaries
    raw_dicts = []
    for it in items:
        d = it.model_dump(by_alias=True)
        # Extra check for forbidden columns
        for fc in FORBIDDEN_COLS:
            if fc in d:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Input contains forbidden post-event column '{fc}'.",
                )
        raw_dicts.append(d)

    df_raw = pd.DataFrame(raw_dicts)

    try:
        proba = predictor.predict_conversion_proba(
            df_raw,
            actual_matured_rate=actual_matured_rate,
            predicted_matured_rate=predicted_matured_rate,
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(ve))
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Inference error: {str(exc)}")

    # Format predictions
    pred_results = []
    for i, p in enumerate(proba):
        prob_val = float(p)
        dest_val = int(raw_dicts[i].get("destination_id") or raw_dicts[i].get("srch_destination_id", 0))

        expl = None
        if include_explanation:
            try:
                expl = predictor.explain_prediction(raw_dicts[i], top_k=5)
            except Exception as e:
                expl = {"error": f"SHAP explanation failed: {str(e)}"}

        pred_results.append(
            SinglePredictionResult(
                index=i,
                destination_id=dest_val,
                conversion_probability=round(prob_val, 4),
                conversion_percentage=f"{prob_val * 100:.2f}%",
                expected_bookings_per_1000=round(prob_val * 1000.0, 1),
                binary_prediction_at_optimal_threshold=1 if prob_val >= OPTIMAL_THRESHOLD else 0,
                optimal_threshold=OPTIMAL_THRESHOLD,
                explanation=expl,
            )
        )

    return PredictResponse(
        status="success",
        model_version="1.0.0",
        prediction_count=len(pred_results),
        mean_conversion_probability=round(float(proba.mean()), 4),
        expected_bookings_total=round(float(proba.sum()), 3),
        predictions=pred_results,
    )


@app.post("/api/model2/expected-bookings", response_model=ExpectedBookingsResponse, tags=["Aggregation"])
def get_expected_bookings(payload: Union[ExpectedBookingsRequest, List[SearchItem]]):
    """
    Aggregate calibrated conversion probabilities into expected bookings by destination and check-in month.
    
    Uses calibrated probabilities directly:
      expected_bookings = sum(calibrated_probabilities)
    Never sums threshold-based binary predictions.
    """
    predictor = _get_predictor()

    if isinstance(payload, list):
        items = payload
        group_cols = ["destination_id", "checkin_month"]
        actual_matured_rate = None
        predicted_matured_rate = None
    else:
        items = payload.searches
        group_cols = payload.group_cols or ["destination_id", "checkin_month"]
        actual_matured_rate = payload.actual_matured_rate
        predicted_matured_rate = payload.predicted_matured_rate

    if not items:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No search items provided for aggregation.",
        )

    raw_dicts = []
    for it in items:
        d = it.model_dump(by_alias=True)
        for fc in FORBIDDEN_COLS:
            if fc in d:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Input contains forbidden post-event column '{fc}'.",
                )
        raw_dicts.append(d)

    df_raw = pd.DataFrame(raw_dicts)

    # Standardize column names for grouping
    if "destination_id" in df_raw.columns and "srch_destination_id" not in df_raw.columns:
        df_raw["srch_destination_id"] = df_raw["destination_id"]
    elif "srch_destination_id" in df_raw.columns and "destination_id" not in df_raw.columns:
        df_raw["destination_id"] = df_raw["srch_destination_id"]

    # Compute checkin_month if not present
    if "checkin_month" not in df_raw.columns:
        ci_col = "checkin_date" if "checkin_date" in df_raw.columns else "srch_ci"
        if ci_col in df_raw.columns:
            df_raw["checkin_month"] = pd.to_datetime(df_raw[ci_col], errors="coerce").dt.month.fillna(-1).astype(int)

    try:
        proba = predictor.predict_conversion_proba(
            df_raw,
            actual_matured_rate=actual_matured_rate,
            predicted_matured_rate=predicted_matured_rate,
        )
        df_raw["_calibrated_proba"] = proba

        # Validate group columns exist
        for col in group_cols:
            if col not in df_raw.columns:
                raise ValueError(f"Group column '{col}' not found in search data.")

        # Group and aggregate
        agg = (
            df_raw.groupby(group_cols, observed=True)
            .agg(
                search_count=("_calibrated_proba", "count"),
                expected_bookings=("_calibrated_proba", "sum"),
            )
            .reset_index()
        )
        agg["expected_conversion_rate"] = (
            agg["expected_bookings"] / agg["search_count"].clip(lower=1)
        )

        results = []
        for _, row in agg.iterrows():
            dest = row.get("destination_id") or row.get("srch_destination_id")
            c_month = int(row.get("checkin_month")) if "checkin_month" in row and pd.notna(row["checkin_month"]) else None
            
            # Additional group cols if user requested custom groupings
            extra = {}
            for col in group_cols:
                if col not in ["destination_id", "srch_destination_id", "checkin_month"]:
                    extra[col] = row[col]

            results.append(
                GroupAggResult(
                    destination_id=int(dest) if pd.notna(dest) and str(dest).isdigit() else dest,
                    checkin_month=c_month,
                    search_count=int(row["search_count"]),
                    expected_bookings=round(float(row["expected_bookings"]), 3),
                    expected_conversion_rate=round(float(row["expected_conversion_rate"]), 4),
                    extra_group_values=extra if extra else None,
                )
            )

        total_searches = len(df_raw)
        total_expected = float(proba.sum())
        overall_rate = total_expected / max(total_searches, 1)

        return ExpectedBookingsResponse(
            status="success",
            model_version="1.0.0",
            total_searches=total_searches,
            total_expected_bookings=round(total_expected, 3),
            overall_expected_conversion_rate=round(overall_rate, 4),
            group_columns=group_cols,
            aggregation_method="sum_of_calibrated_probabilities",
            aggregated_results=results,
        )

    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(ve))
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Aggregation error: {str(exc)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("model2.api:app", host="0.0.0.0", port=8000, reload=False)
