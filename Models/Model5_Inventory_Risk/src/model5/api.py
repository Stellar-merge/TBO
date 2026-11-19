"""
api.py — FastAPI Backend Inference Service for Model 5: Inventory Risk Prediction.

Module: Model 5 — Inventory Risk Prediction (Random Forest Classifier)
System: TBO SmartStock AI

Exposes:
- GET  /api/model5/health
- POST /api/model5/predict
- POST /api/model5/risk-summary
"""
from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import List, Dict, Any, Optional, Union
from fastapi import FastAPI, APIRouter, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Ensure src in sys.path
SRC_DIR = Path(__file__).resolve().parents[1]
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from model5.predict import Model5Predictor
from model5.config import ARTIFACTS_DIR

app = FastAPI(
    title="TBO SmartStock AI — Model 5 Inventory Risk API",
    description="Predicts procurement inventory risks (BALANCED, UNSOLD, SHORTAGE) for hotel room allotments.",
    version="1.0.0"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global predictor instance
_predictor: Optional[Model5Predictor] = None

def get_predictor() -> Model5Predictor:
    global _predictor
    if _predictor is None:
        try:
            _predictor = Model5Predictor()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Model 5 artifacts could not be loaded: {str(e)}"
            )
    return _predictor


# ------------------------------------------------------------------------------
# Pydantic Schemas
# ------------------------------------------------------------------------------

class ProcurementOpportunityInput(BaseModel):
    opportunity_id: Optional[str] = Field(default=None, description="Unique procurement opportunity identifier")
    property_id: Optional[str] = Field(default="HOTEL_CITY_02", description="Hotel property identifier")
    destination_id: Optional[str] = Field(default="DEST_LISBON_PRT", description="Destination code")
    destination_type: Optional[str] = Field(default="City", description="Destination category: City or Resort")
    supplier_id: Optional[str] = Field(default="SUP_HOTELBEDS", description="Supplier or wholesaler code")
    contract_flexibility: Optional[str] = Field(default="SEMI_FLEXIBLE", description="FLEXIBLE, SEMI_FLEXIBLE, or NON_REFUNDABLE")
    checkin_date: Optional[str] = Field(default="2027-06-15", description="Stay date (YYYY-MM-DD)")
    decision_timestamp: Optional[str] = Field(default=None, description="Timestamp of procurement decision")
    procured_quantity: float = Field(..., ge=1, description="Number of committed rooms procured")
    supplier_capacity: Optional[float] = Field(default=100.0, ge=1, description="Supplier allotment capacity ceiling")
    procurement_cost_per_room: Optional[float] = Field(default=85.0, ge=0, description="Cost per room per night (USD)")
    expected_selling_price: Optional[float] = Field(default=115.0, ge=0, description="Target retail ADR (USD)")
    procurement_lead_time_days: Optional[float] = Field(default=45.0, ge=0, description="Days between decision and checkin")
    historical_daily_demand_30d_avg: Optional[float] = Field(default=50.0, ge=0, description="Trailing 30-day average net demand")
    historical_daily_demand_90d_avg: Optional[float] = Field(default=48.0, ge=0, description="Trailing 90-day average net demand")
    historical_same_month_prior_year_demand: Optional[float] = Field(default=52.0, ge=0, description="Prior year same month average demand")
    historical_cancellation_rate_30d: Optional[float] = Field(default=0.25, ge=0, le=1.0, description="Historical cancellation rate")
    current_pace_on_the_books: Optional[float] = Field(default=15.0, ge=0, description="Confirmed bookings currently on books")
    supplier_release_days: Optional[float] = Field(default=14.0, ge=0, description="Free cancellation cutoff deadline")
    supplier_reliability_score: Optional[float] = Field(default=0.95, ge=0, le=1.0, description="Supplier contract fulfillment reliability")
    stay_nights: Optional[float] = Field(default=2.0, ge=1, description="Average length of stay (nights)")
    is_high_season: Optional[int] = Field(default=0, ge=0, le=1, description="1 if peak travel season, else 0")
    
    # Optional upstream model features
    model1_demand_forecast: Optional[float] = Field(default=None, description="Model 1 latent demand forecast")
    model2_conversion_prob_est: Optional[float] = Field(default=None, description="Model 2 conversion probability estimate")
    model3_cancellation_risk_est: Optional[float] = Field(default=None, description="Model 3 cancellation risk estimate")
    model4_price_momentum_est: Optional[float] = Field(default=None, description="Model 4 price ratio estimate")

    model_config = {
        "extra": "allow"
    }


class PredictRequest(BaseModel):
    opportunities: List[ProcurementOpportunityInput] = Field(..., description="List of procurement opportunities to evaluate")
    use_calibrated: bool = Field(default=True, description="Whether to apply probability calibration")


class RiskProbabilities(BaseModel):
    balanced_probability: float
    unsold_probability: float
    shortage_probability: float


class OpportunityPredictionResult(BaseModel):
    opportunity_id: str
    predicted_risk_class: int
    predicted_risk_label: str
    probabilities: RiskProbabilities
    is_calibrated: bool
    risk_factors: List[str]
    model_version: str


class PredictResponse(BaseModel):
    total_opportunities: int
    predictions: List[OpportunityPredictionResult]


class RiskSummaryResponse(BaseModel):
    total_opportunities_analyzed: int
    balanced_count: int
    unsold_risk_count: int
    shortage_risk_count: int
    balanced_pct: float
    unsold_pct: float
    shortage_pct: float
    average_probabilities: Dict[str, float]
    breakdown_by_destination: Dict[str, Any]
    breakdown_by_supplier: Dict[str, Any]
    summary_notes: str
    model_version: str


# ------------------------------------------------------------------------------
# Endpoints
# ------------------------------------------------------------------------------

@app.get("/api/model5/health", tags=["Health"])
def health_check() -> Dict[str, Any]:
    """
    Health check returning Model 5 operational status, versions, and loaded components.
    """
    try:
        predictor = get_predictor()
        return {
            "status": "healthy",
            "model_name": "Model 5 - Inventory Risk Prediction",
            "algorithm": "RandomForestClassifier",
            "model_version": predictor.metadata.get("version", "1.0.0"),
            "model_loaded": predictor.model is not None,
            "preprocessor_loaded": predictor.preprocessor is not None,
            "calibrator_loaded": predictor.calibrator is not None,
            "n_predictive_features": len(predictor.preprocessor.feature_names_out_) if predictor.preprocessor else 0,
            "dataset_provenance": (
                "Trained on synthetic B2B procurement scenarios anchored to empirical hotel "
                "reservation demand from hotels.csv (Antonio et al., 2019)."
            )
        }
    except Exception as e:
        return {
            "status": "degraded",
            "error": str(e),
            "model_loaded": False
        }


@app.post("/api/model5/predict", response_model=PredictResponse, tags=["Inference"])
def predict_inventory_risk(request: Union[PredictRequest, ProcurementOpportunityInput, List[ProcurementOpportunityInput]]):
    """
    Classifies hotel procurement opportunities into BALANCED, UNSOLD, or SHORTAGE risks.
    Accepts single object, array of objects, or wrapped request.
    """
    predictor = get_predictor()
    
    # Handle flexible input formats
    if isinstance(request, ProcurementOpportunityInput):
        records = [request.model_dump()]
        use_cal = True
    elif isinstance(request, list):
        records = [item.model_dump() for item in request]
        use_cal = True
    elif isinstance(request, PredictRequest):
        records = [item.model_dump() for item in request.opportunities]
        use_cal = request.use_calibrated
    else:
        raise HTTPException(status_code=400, detail="Invalid request payload format.")
        
    try:
        raw_predictions = predictor.predict_batch(records, use_calibrated=use_cal)
        return PredictResponse(
            total_opportunities=len(raw_predictions),
            predictions=raw_predictions
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")


@app.post("/api/model5/risk-summary", response_model=RiskSummaryResponse, tags=["Analytics"])
def risk_summary(request: PredictRequest):
    """
    Aggregates inventory risk predictions across a portfolio of procurement opportunities.
    """
    predictor = get_predictor()
    records = [item.model_dump() for item in request.opportunities]
    if not records:
        raise HTTPException(status_code=400, detail="No opportunities provided for summary.")
        
    predictions = predictor.predict_batch(records, use_calibrated=request.use_calibrated)
    n = len(predictions)
    
    balanced_cnt = sum(1 for p in predictions if p["predicted_risk_label"] == "BALANCED")
    unsold_cnt = sum(1 for p in predictions if p["predicted_risk_label"] == "UNSOLD")
    shortage_cnt = sum(1 for p in predictions if p["predicted_risk_label"] == "SHORTAGE")
    
    avg_p_bal = round(sum(p["probabilities"]["balanced_probability"] for p in predictions) / n, 4)
    avg_p_unsold = round(sum(p["probabilities"]["unsold_probability"] for p in predictions) / n, 4)
    avg_p_short = round(sum(p["probabilities"]["shortage_probability"] for p in predictions) / n, 4)
    
    # Grouping by destination
    by_dest: Dict[str, Any] = {}
    for rec, p in zip(records, predictions):
        d = rec.get("destination_id", "UNKNOWN_DEST")
        if d not in by_dest:
            by_dest[d] = {"total": 0, "balanced": 0, "unsold": 0, "shortage": 0}
        by_dest[d]["total"] += 1
        by_dest[d][p["predicted_risk_label"].lower()] += 1
        
    # Grouping by supplier
    by_supp: Dict[str, Any] = {}
    for rec, p in zip(records, predictions):
        s = rec.get("supplier_id", "UNKNOWN_SUPP")
        if s not in by_supp:
            by_supp[s] = {"total": 0, "balanced": 0, "unsold": 0, "shortage": 0}
        by_supp[s]["total"] += 1
        by_supp[s][p["predicted_risk_label"].lower()] += 1
        
    notes = (
        f"Analyzed {n} opportunities: {unsold_cnt} ({unsold_cnt/n:.1%}) carrying UNSOLD risk, "
        f"{shortage_cnt} ({shortage_cnt/n:.1%}) carrying SHORTAGE risk, and "
        f"{balanced_cnt} ({balanced_cnt/n:.1%}) BALANCED."
    )
    
    return RiskSummaryResponse(
        total_opportunities_analyzed=n,
        balanced_count=balanced_cnt,
        unsold_risk_count=unsold_cnt,
        shortage_risk_count=shortage_cnt,
        balanced_pct=round(balanced_cnt / n * 100, 2),
        unsold_pct=round(unsold_cnt / n * 100, 2),
        shortage_pct=round(shortage_cnt / n * 100, 2),
        average_probabilities={
            "balanced": avg_p_bal,
            "unsold": avg_p_unsold,
            "shortage": avg_p_short
        },
        breakdown_by_destination=by_dest,
        breakdown_by_supplier=by_supp,
        summary_notes=notes,
        model_version=predictor.metadata.get("version", "1.0.0")
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("model5.api:app", host="127.0.0.1", port=8001, reload=False)
