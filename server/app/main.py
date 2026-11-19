import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from server.app.core.config import CORS_ORIGINS, PROJECT_NAME, API_V1_STR
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

@app.post(f"{API_V1_STR}/optimize", response_model=OptimizationResponse)
def optimize_procurement(req: OptimizationRequest):
    try:
        # 1. Fetch matching candidates (seed catalog or live API if configured)
        candidates = get_candidates_for_query(
            location=req.location,
            category=req.category,
            target_type=req.targetType
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
        
        # 3. Run 2,000-run Monte Carlo risk check
        mc_result = run_monte_carlo_simulation(
            allocated_budget=summary.allocatedBudget,
            expected_profit=summary.expectedProfit,
            risk_tolerance=req.riskTolerance,
            runs=2000
        )
        
        return OptimizationResponse(
            status="success",
            message=f"Optimal inventory allocation computed for {len(items)} candidates under budget cap of ${req.budget:,.0f}.",
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
