import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from server.app.core.config import (
    CORS_ORIGINS, 
    PROJECT_NAME, 
    API_V1_STR, 
    is_hotel_api_configured, 
    HOTEL_API_PROVIDER, 
    HOTEL_API_HOST
)
from server.app.schemas.api_models import (
    OptimizationRequest,
    OptimizationResponse,
    SimulationRequest,
    MonteCarloResult,
    HealthResponse
)
from server.app.services.ml_models import ModelManager
from server.app.services.catalog import get_destinations_catalog, get_candidates_for_query
from server.app.services.optimizer import solve_inventory_allocation
from server.app.services.simulation import run_monte_carlo_simulation

app = FastAPI(
    title=PROJECT_NAME,
    description="End-to-end Machine Learning, Quantile Demand Forecasting, Newsvendor Sizing & MILP Budget Optimizer API",
    version="1.0.0",
)

# Enable CORS for frontend Vite application
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get(f"{API_V1_STR}/health", response_model=HealthResponse)
def health_check():
    mgr = ModelManager.get_instance()
    return HealthResponse(
        status="healthy",
        modelsLoaded=mgr.load_status,
        version="1.0.0"
    )

@app.get(f"{API_V1_STR}/destinations")
def list_destinations():
    return {"destinations": get_destinations_catalog()}

@app.get(f"{API_V1_STR}/hotel-api-status")
def get_hotel_api_status():
    configured = is_hotel_api_configured()
    return {
        "apiKeyConfigured": configured,
        "provider": HOTEL_API_PROVIDER,
        "host": HOTEL_API_HOST,
        "status": "ready" if configured else "awaiting_key",
        "instructions": "Paste your Hotel API Key into HOTEL_API_KEY in the .env file to enable live real-time hotel data fetching."
    }

@app.post(f"{API_V1_STR}/optimize", response_model=OptimizationResponse)
def optimize_procurement(req: OptimizationRequest):
    try:
        # 1. Fetch matching candidates (live real-time Hotel API when configured in .env, or seed catalog)
        candidates = get_candidates_for_query(
            location=req.location,
            category=req.category,
            target_type=req.targetType,
            checkin_date=req.dates.startDate if req.dates else None,
            checkout_date=req.dates.endDate if req.dates else None
        )
        
        # 2. Run LightGBM quantiles, Newsvendor sizing Q*, and PuLP MILP solver
        optimization_result = solve_inventory_allocation(
            candidates=candidates,
            total_budget=req.budget,
            risk_tolerance=req.riskTolerance,
            target_type=req.targetType
        )
        
        summary = optimization_result["summary"]
        items = optimization_result["items"]
        
        # 3. Mark live data attributes
        is_live = any(c.get("is_live", False) for c in candidates)
        summary.isLiveData = is_live
        summary.apiKeyConfigured = is_hotel_api_configured()
        summary.liveSource = "live_hotel_api" if is_live else ("awaiting_key" if not summary.apiKeyConfigured else "seed_catalog")

        # 4. Run 2,000-run Monte Carlo risk check
        mc_result = run_monte_carlo_simulation(
            allocated_budget=summary.allocatedBudget,
            expected_profit=summary.expectedProfit,
            risk_tolerance=req.riskTolerance,
            runs=2000
        )
        
        source_label = "real-time live hotel API" if is_live else "curated base catalog (awaiting HOTEL_API_KEY in .env)"
        return OptimizationResponse(
            status="success",
            message=f"Optimal inventory allocation computed for {len(items)} candidates from {source_label} under budget cap of ${req.budget:,.0f}.",
            summary=summary,
            items=items,
            monteCarlo=mc_result
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post(f"{API_V1_STR}/simulate", response_model=MonteCarloResult)
def simulate_risk(req: SimulationRequest):
    try:
        expected_profit = req.allocatedBudget * req.avgMargin
        return run_monte_carlo_simulation(
            allocated_budget=req.allocatedBudget,
            expected_profit=expected_profit,
            risk_tolerance=req.riskTolerance,
            runs=2000
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
