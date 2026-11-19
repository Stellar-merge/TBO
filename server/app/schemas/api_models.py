from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class DateRange(BaseModel):
    startDate: str
    endDate: str

class OptimizationRequest(BaseModel):
    location: str = "Bali, Indonesia"
    dates: DateRange = Field(default_factory=lambda: DateRange(startDate="2026-11-20", endDate="2026-11-26"))
    budget: float = 500000.0
    riskTolerance: str = "P50 Balanced"  # "P10 Conservative", "P50 Balanced", "P90 Aggressive"
    category: str = "All Hotels"
    targetType: str = "hotels" # "hotels" or "flights"

class ShapFactor(BaseModel):
    feature: str
    impact: float
    direction: str  # "positive" or "negative"
    description: str

class ReasonCard(BaseModel):
    headline: str
    confidence: float
    factors: List[ShapFactor]
    recommendation: str

class InventoryItem(BaseModel):
    id: str
    name: str
    location: str
    category: str
    rating: float
    reviewsCount: int
    image: str
    roomsOrSeats: int
    procuredUnits: int
    wholesaleCostPerUnit: float
    batchCost: float
    targetSellingPrice: float
    expectedRevenue: float
    expectedProfit: float
    profitMargin: float
    demandQuantileP10: float
    demandQuantileP50: float
    demandQuantileP90: float
    riskClass: str # "BALANCED", "UNSOLD", "SHORTAGE"
    bookingConversionProb: float
    cancellationProb: float
    opportunityScore: float
    lat: float
    lng: float
    reasonCard: ReasonCard

class PortfolioSummary(BaseModel):
    totalBudget: float
    allocatedBudget: float
    deployedPercentage: float
    remainingLiquidity: float
    expectedRevenue: float
    expectedProfit: float
    expectedRoi: float
    riskDialScore: int
    riskCategory: str
    var95: float
    cvar: float
    totalAllocatedUnits: int
    activeCandidatesCount: int

class MonteCarloPoint(BaseModel):
    bin: float
    frequency: float

class MonteCarloResult(BaseModel):
    runs: int = 2000
    meanProfit: float
    medianProfit: float
    var95: float
    cvar: float
    winRate: float
    distribution: List[MonteCarloPoint]

class OptimizationResponse(BaseModel):
    status: str
    message: str
    summary: PortfolioSummary
    items: List[InventoryItem]
    monteCarlo: MonteCarloResult

class SimulationRequest(BaseModel):
    allocatedBudget: float
    riskTolerance: str
    units: int
    avgMargin: float

class HealthResponse(BaseModel):
    status: str
    modelsLoaded: Dict[str, bool]
    version: str
