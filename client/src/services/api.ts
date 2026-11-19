export interface OptimizationRequest {
  location: string;
  dates: {
    startDate: string;
    endDate: string;
  };
  budget: number;
  riskTolerance: string;
  category: string;
  targetType: 'hotels' | 'flights';
}

export interface ShapFactor {
  feature: string;
  impact: number;
  direction: 'positive' | 'negative';
  description: string;
}

export interface ReasonCardData {
  headline: string;
  confidence: number;
  factors: ShapFactor[];
  recommendation: string;
}

export interface ApiInventoryItem {
  id: string;
  name: string;
  location: string;
  category: string;
  rating: number;
  reviewsCount: number;
  image: string;
  roomsOrSeats: number;
  procuredUnits: number;
  wholesaleCostPerUnit: number;
  batchCost: number;
  targetSellingPrice: number;
  expectedRevenue: number;
  expectedProfit: number;
  profitMargin: number;
  demandQuantileP10: number;
  demandQuantileP50: number;
  demandQuantileP90: number;
  riskClass: 'BALANCED' | 'UNSOLD' | 'SHORTAGE';
  bookingConversionProb: number;
  cancellationProb: number;
  opportunityScore: number;
  lat: number;
  lng: number;
  reasonCard: ReasonCardData;
}

export interface PortfolioSummary {
  totalBudget: number;
  allocatedBudget: number;
  deployedPercentage: number;
  remainingLiquidity: number;
  expectedRevenue: number;
  expectedProfit: number;
  expectedRoi: number;
  riskDialScore: number;
  riskCategory: string;
  var95: number;
  cvar: number;
  totalAllocatedUnits: number;
  activeCandidatesCount: number;
}

export interface MonteCarloPoint {
  bin: number;
  frequency: number;
}

export interface MonteCarloResult {
  runs: number;
  meanProfit: number;
  medianProfit: number;
  var95: number;
  cvar: number;
  winRate: number;
  distribution: MonteCarloPoint[];
}

export interface OptimizationResponse {
  status: string;
  message: string;
  summary: PortfolioSummary;
  items: ApiInventoryItem[];
  monteCarlo: MonteCarloResult;
}

const API_BASE_URL = 'http://localhost:8000/api/v1';

export async function checkBackendHealth(): Promise<{ status: string; modelsLoaded: Record<string, boolean> } | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { method: 'GET' });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('Backend not currently reachable at', API_BASE_URL, err);
    return null;
  }
}

export async function optimizeProcurement(req: OptimizationRequest): Promise<OptimizationResponse | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/optimize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error('Optimization endpoint error:', errText);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.warn('Backend optimization request failed; using client fallback:', err);
    return null;
  }
}
