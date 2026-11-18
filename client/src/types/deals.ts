export type DealStage = 'new' | 'viewing' | 'negotiation' | 'legal';

export type PriorityLevel = 'Low' | 'Medium' | 'High';

export interface AvatarBadge {
  letter: string;
  bgClass: string;
  textClass: string;
}

export interface DealItem {
  id: string; // e.g. '#DXB-04219'
  stage: DealStage;
  priority: PriorityLevel;
  title: string;
  propertyPhoto: string;
  floorplanVariant: 1 | 2 | 3 | 4;
  priceValue: number; // in AED
  currency: string; // 'AED'
  reservationDate: string; // e.g. '25 Nov 2025'
  isPendingReservation?: boolean;
  client: string; // e.g. 'James O\'Connor'
  source: string; // e.g. 'bronex.com'
  commentsCount: number;
  filesCount: number;
  avatars: AvatarBadge[];
  
  // ML Optimization & Prediction Fields
  hotelName: string;
  city: string;
  wholesaleCost: number; // Unit or batch cost
  targetPrice: number;   // Unit or batch selling price
  units: number;         // Total units / room nights
  p10: number;           // 10th percentile demand
  p50: number;           // 50th percentile (median) demand
  p90: number;           // 90th percentile demand
  cancellationRisk: number; // e.g. 0.12 (12%)
  recommendedQty: number;   // Newsvendor Q*
  expectedProfit: number;   // Expected net margin
  shapReasons?: string[];
}

export interface MetricSummary {
  pipelineValue: {
    totalAssetVolume: string; // '24.5M AED'
    volumeDelta: string;      // '↑ 14% vs last month'
    commission: string;        // '490k AED'
    commissionDelta: string;  // '↑ 5% vs last month'
  };
  dealActivity: {
    viewingsBooked: number;   // 20
    viewingsDelta: string;    // '↑ 12% vs last month'
    offersSent: number;       // 5
    offersDelta: string;      // '↓ 20% vs last month'
  };
  conversionSpeed: {
    avgDaysToClose: number;   // 42
    daysDelta: string;        // '↑ 5% vs last month'
    winRate: string;          // '12%'
    winRateDelta: string;     // '↑ 2% vs last month'
  };
}
