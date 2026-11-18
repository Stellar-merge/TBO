export interface OpportunityCardItem {
  id: string;
  title: string;
  destination: 'India' | 'Middle East' | 'Southeast Asia' | 'Europe';
  inventoryType: 'Hotels' | 'Flights' | 'Both';
  image: string;
  bookmarked: boolean;
  expectedProfit: string;
  expectedProfitNum: number;
  allocatedAmount: number;
  
  // 3 metric slots per card matching reference screenshot
  metric1: { label: string; value: string };
  metric2: { label: string; value: string };
  metric3: { label: string; value: string };

  // ML Deep Details (for modal inspect)
  wholesaleCost: number;
  targetPrice: number;
  recommendedUnits: number;
  p10: number;
  p50: number;
  p90: number;
  cancellationRisk: number;
  riskRating: 'Low' | 'Medium' | 'High';
}

export const initialOpportunities: OpportunityCardItem[] = [
  {
    id: 'goa',
    title: 'Goa Premium Hotels',
    destination: 'India',
    inventoryType: 'Hotels',
    image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=600&q=80',
    bookmarked: false,
    expectedProfit: '+$28,400',
    expectedProfitNum: 28400,
    allocatedAmount: 18200,
    metric1: { label: 'Expected profit', value: '+$28,400' },
    metric2: { label: 'Demand forecast', value: '+32%' },
    metric3: { label: 'L2B', value: '8.4%' },
    wholesaleCost: 85,
    targetPrice: 145,
    recommendedUnits: 45,
    p10: 25,
    p50: 48,
    p90: 72,
    cancellationRisk: 0.11,
    riskRating: 'Low',
  },
  {
    id: 'dubai',
    title: 'Dubai Hotel Allotment',
    destination: 'Middle East',
    inventoryType: 'Hotels',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=600&q=80',
    bookmarked: false,
    expectedProfit: '+$21,750',
    expectedProfitNum: 21750,
    allocatedAmount: 22500,
    metric1: { label: 'Expected profit', value: '+$21,750' },
    metric2: { label: 'Sold-out demand', value: '18%' },
    metric3: { label: 'Buy window', value: '21–30 days' },
    wholesaleCost: 160,
    targetPrice: 250,
    recommendedUnits: 35,
    p10: 18,
    p50: 38,
    p90: 55,
    cancellationRisk: 0.14,
    riskRating: 'Medium',
  },
  {
    id: 'bali',
    title: 'Bali Resort Inventory',
    destination: 'Southeast Asia',
    inventoryType: 'Hotels',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=600&q=80',
    bookmarked: false,
    expectedProfit: '+$18,200',
    expectedProfitNum: 18200,
    allocatedAmount: 14000,
    metric1: { label: 'Expected profit', value: '+$18,200' },
    metric2: { label: 'Search growth', value: '+26%' },
    metric3: { label: 'Risk', value: 'Medium' },
    wholesaleCost: 75,
    targetPrice: 125,
    recommendedUnits: 30,
    p10: 15,
    p50: 32,
    p90: 50,
    cancellationRisk: 0.12,
    riskRating: 'Medium',
  },
  {
    id: 'swiss',
    title: 'Swiss Alps Winter Stays',
    destination: 'Europe',
    inventoryType: 'Hotels',
    image: 'https://images.unsplash.com/photo-1502784444187-359ac186c5bb?auto=format&fit=crop&w=600&q=80',
    bookmarked: false,
    expectedProfit: '+$15,600',
    expectedProfitNum: 15600,
    allocatedAmount: 9800,
    metric1: { label: 'Expected profit', value: '+$15,600' },
    metric2: { label: 'Demand forecast', value: '+19%' },
    metric3: { label: 'Risk', value: 'Low' },
    wholesaleCost: 210,
    targetPrice: 330,
    recommendedUnits: 20,
    p10: 12,
    p50: 24,
    p90: 38,
    cancellationRisk: 0.08,
    riskRating: 'Low',
  },
  {
    id: 'singapore',
    title: 'Singapore Flight + Hotel',
    destination: 'Southeast Asia',
    inventoryType: 'Both',
    image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=600&q=80',
    bookmarked: false,
    expectedProfit: '+$12,900',
    expectedProfitNum: 12900,
    allocatedAmount: 4500,
    metric1: { label: 'Expected profit', value: '+$12,900' },
    metric2: { label: 'L2B', value: '6.8%' },
    metric3: { label: 'Supplier rate', value: '-11%' },
    wholesaleCost: 190,
    targetPrice: 280,
    recommendedUnits: 15,
    p10: 8,
    p50: 18,
    p90: 28,
    cancellationRisk: 0.10,
    riskRating: 'Low',
  },
  {
    id: 'phuket',
    title: 'Phuket Beach Inventory',
    destination: 'Southeast Asia',
    inventoryType: 'Hotels',
    image: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=600&q=80',
    bookmarked: false,
    expectedProfit: '+$10,450',
    expectedProfitNum: 10450,
    allocatedAmount: 3400,
    metric1: { label: 'Expected profit', value: '+$10,450' },
    metric2: { label: 'Unmet demand', value: '+14%' },
    metric3: { label: 'Risk', value: 'Medium' },
    wholesaleCost: 60,
    targetPrice: 105,
    recommendedUnits: 25,
    p10: 12,
    p50: 28,
    p90: 42,
    cancellationRisk: 0.15,
    riskRating: 'Medium',
  },
];
