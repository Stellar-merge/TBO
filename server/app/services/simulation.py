import numpy as np
from typing import Dict, Any, List
from server.app.schemas.api_models import MonteCarloResult, MonteCarloPoint

def run_monte_carlo_simulation(
    allocated_budget: float,
    expected_profit: float,
    risk_tolerance: str = "P50 Balanced",
    runs: int = 2000
) -> MonteCarloResult:
    # Set seed for reproducible distribution shape
    np.random.seed(42)
    
    # Volatility parameterized by risk tolerance
    volatility = 0.12 if "Conservative" in risk_tolerance else (0.18 if "Balanced" in risk_tolerance else 0.28)
    
    # Generate 2,000 stochastic profit realizations
    # Standard normal draws scaled by portfolio scale and expected return
    shocks = np.random.normal(loc=1.0, scale=volatility, size=runs)
    simulated_profits = expected_profit * shocks - (allocated_budget * np.maximum(0, np.random.normal(0.02, 0.04, size=runs)))
    
    mean_profit = float(np.mean(simulated_profits))
    median_profit = float(np.median(simulated_profits))
    
    # 95% VaR: 5th percentile worst-case outcome
    var95 = float(np.percentile(simulated_profits, 5))
    cvar = float(np.mean(simulated_profits[simulated_profits <= var95]))
    
    win_rate = round(float(np.sum(simulated_profits > 0) / runs) * 100, 1)
    
    # Build 25 histogram bins for smooth probability density rendering on frontend
    hist, bin_edges = np.histogram(simulated_profits, bins=25, density=True)
    distribution_points: List[MonteCarloPoint] = []
    for i in range(len(hist)):
        bin_center = float((bin_edges[i] + bin_edges[i+1]) / 2.0)
        distribution_points.append(MonteCarloPoint(
            bin=round(bin_center, 0),
            frequency=round(float(hist[i]), 6)
        ))
        
    return MonteCarloResult(
        runs=runs,
        meanProfit=round(mean_profit, 2),
        medianProfit=round(median_profit, 2),
        var95=round(abs(var95) if var95 < 0 else 0.0, 2),
        cvar=round(abs(cvar) if cvar < 0 else 0.0, 2),
        winRate=win_rate,
        distribution=distribution_points
    )
