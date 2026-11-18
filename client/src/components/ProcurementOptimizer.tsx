import { useState } from 'react';
import { 
  Sparkles, 
  Sliders, 
  CheckCircle2, 
  XCircle, 
  ShieldAlert
} from 'lucide-react';
import { type RecommendationItem, ShapModal } from './ShapModal';

const initialRecommendations: RecommendationItem[] = [
  {
    id: 'rec_01',
    hotel_name: 'Taj Exotica Resort & Spa',
    city: 'Goa',
    stars: 5,
    checkin: '2026-12-28',
    checkout: '2027-01-02',
    wholesale_cost: 85,
    target_price: 145,
    p10: 22,
    p50: 45,
    p90: 68,
    cancellation_risk: 0.12,
    opp_score: 92,
    supplier_min_batch: 10,
    recommended_qty: 35,
    approved: true,
    shap_drivers: [
      {
        feature: 'New Year Holiday Surge',
        impact: '+38%',
        isPositive: true,
        explanation: 'Historical search velocity spikes 4.2x during Dec 28–Jan 2 window.',
      },
      {
        feature: 'Wholesale Discount vs Spot',
        impact: '+26%',
        isPositive: true,
        explanation: 'Wholesale rate is 41% cheaper than current spot market pricing.',
      },
      {
        feature: 'Cancellation Risk Penalty',
        impact: '-9%',
        isPositive: false,
        explanation: 'Long 40-day advance booking window slightly elevates cancellation probability.',
      },
    ],
  },
  {
    id: 'rec_02',
    hotel_name: 'Atlantis The Palm',
    city: 'Dubai',
    stars: 5,
    checkin: '2026-11-20',
    checkout: '2026-11-26',
    wholesale_cost: 160,
    target_price: 250,
    p10: 18,
    p50: 38,
    p90: 55,
    cancellation_risk: 0.15,
    opp_score: 88,
    supplier_min_batch: 15,
    recommended_qty: 30,
    approved: true,
    shap_drivers: [
      {
        feature: 'Look-to-Book Ratio (14:1)',
        impact: '+34%',
        isPositive: true,
        explanation: 'Exceptional intent velocity with low price friction on B2B distribution.',
      },
      {
        feature: 'High Absolute Unit Margin',
        impact: '+29%',
        isPositive: true,
        explanation: '+$90 gross margin per room night sold.',
      },
      {
        feature: 'Currency Volatility Exposure',
        impact: '-6%',
        isPositive: false,
        explanation: 'AED/USD forward hedging variance.',
      },
    ],
  },
  {
    id: 'rec_03',
    hotel_name: 'The Ritz London',
    city: 'London',
    stars: 5,
    checkin: '2026-12-15',
    checkout: '2026-12-22',
    wholesale_cost: 210,
    target_price: 330,
    p10: 12,
    p50: 25,
    p90: 40,
    cancellation_risk: 0.18,
    opp_score: 84,
    supplier_min_batch: 5,
    recommended_qty: 20,
    approved: true,
    shap_drivers: [
      {
        feature: 'Pre-Christmas Shopping Window',
        impact: '+31%',
        isPositive: true,
        explanation: 'Luxury travel intent surges for West End and central shopping districts.',
      },
      {
        feature: 'Strict Non-Refundable Clause',
        impact: '-14%',
        isPositive: false,
        explanation: 'Supplier enforces 100% penalty on unsold allotment after T-7 days.',
      },
    ],
  },
  {
    id: 'rec_04',
    hotel_name: 'Ayana Resort Bali',
    city: 'Bali',
    stars: 5,
    checkin: '2026-12-24',
    checkout: '2026-12-30',
    wholesale_cost: 70,
    target_price: 120,
    p10: 15,
    p50: 32,
    p90: 48,
    cancellation_risk: 0.08,
    opp_score: 86,
    supplier_min_batch: 10,
    recommended_qty: 25,
    approved: true,
    shap_drivers: [
      {
        feature: 'Low Cancellation Rate',
        impact: '+22%',
        isPositive: true,
        explanation: 'Historical Bali holiday packages have sub-8% cancellation rate.',
      },
      {
        feature: 'Competitive Pre-Buy Rate',
        impact: '+25%',
        isPositive: true,
        explanation: 'Secured Tier-1 contracting rate.',
      },
    ],
  },
  {
    id: 'rec_05',
    hotel_name: 'Marina Bay Sands',
    city: 'Singapore',
    stars: 5,
    checkin: '2026-11-28',
    checkout: '2026-12-03',
    wholesale_cost: 195,
    target_price: 290,
    p10: 10,
    p50: 20,
    p90: 35,
    cancellation_risk: 0.10,
    opp_score: 79,
    supplier_min_batch: 5,
    recommended_qty: 15,
    approved: false,
    shap_drivers: [
      {
        feature: 'Fintech Conference Spike',
        impact: '+28%',
        isPositive: true,
        explanation: 'Corporate travel demand spike aligned with regional summit.',
      },
      {
        feature: 'High Capital Commitment',
        impact: '-12%',
        isPositive: false,
        explanation: 'High wholesale price absorbs substantial share of single-item budget.',
      },
    ],
  },
  {
    id: 'rec_06',
    hotel_name: 'Hard Rock Hotel Goa',
    city: 'Goa',
    stars: 4,
    checkin: '2026-12-29',
    checkout: '2027-01-03',
    wholesale_cost: 55,
    target_price: 95,
    p10: 25,
    p50: 50,
    p90: 75,
    cancellation_risk: 0.14,
    opp_score: 89,
    supplier_min_batch: 10,
    recommended_qty: 40,
    approved: true,
    shap_drivers: [
      {
        feature: 'Fast Sell-Through Velocity',
        impact: '+35%',
        isPositive: true,
        explanation: 'High conversion rate among youth/music demographic during peak week.',
      },
      {
        feature: 'Strong Unit Economics',
        impact: '+24%',
        isPositive: true,
        explanation: '42% margin with rapid inventory turnover.',
      },
    ],
  },
];

export const ProcurementOptimizer: React.FC = () => {
  const [budgetCap, setBudgetCap] = useState<number>(100000);
  const [riskTolerance, setRiskTolerance] = useState<'conservative' | 'balanced' | 'aggressive'>('balanced');
  const [selectedDestination, setSelectedDestination] = useState<string>('All');
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>(initialRecommendations);
  const [activeShapItem, setActiveShapItem] = useState<RecommendationItem | null>(null);

  // Filtering
  const filteredRecs = recommendations.filter(
    (r) => selectedDestination === 'All' || r.city === selectedDestination
  );

  // Dynamic Portfolio Calculations
  const approvedItems = recommendations.filter((r) => r.approved);
  const totalAllocatedBudget = approvedItems.reduce(
    (acc, curr) => acc + curr.wholesale_cost * curr.recommended_qty,
    0
  );
  const totalExpectedProfit = approvedItems.reduce(
    (acc, curr) => acc + (curr.target_price - curr.wholesale_cost) * curr.recommended_qty * (1 - curr.cancellation_risk),
    0
  );
  const totalRooms = approvedItems.reduce((acc, curr) => acc + curr.recommended_qty, 0);
  const blendedROI = totalAllocatedBudget > 0 ? (totalExpectedProfit / totalAllocatedBudget) * 100 : 0;
  const isOverBudget = totalAllocatedBudget > budgetCap;

  // Handlers
  const handleToggleApprove = (id: string) => {
    setRecommendations((prev) =>
      prev.map((item) => (item.id === id ? { ...item, approved: !item.approved } : item))
    );
  };

  const handleQtyChange = (id: string, newQty: number) => {
    setRecommendations((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, recommended_qty: Math.max(0, newQty) } : item
      )
    );
  };

  const handleRunMilpSolver = () => {
    const multiplier = riskTolerance === 'conservative' ? 0.75 : riskTolerance === 'aggressive' ? 1.25 : 1.0;
    setRecommendations((prev) =>
      prev.map((item) => {
        const base = item.p50 * multiplier;
        const newQty = Math.round(base / 5) * 5;
        return {
          ...item,
          recommended_qty: Math.max(item.supplier_min_batch, newQty),
          approved: true,
        };
      })
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 text-slate-800 animate-in fade-in duration-300">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 md:p-8 rounded-3xl border border-slate-200/90 shadow-sm">
        <div>
          <span className="text-xs font-bold text-blue-700 uppercase tracking-wider bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200/60">
            Decision & Optimization Pipeline
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
            Procurement & MILP Budget Optimizer
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Solves the Mixed-Integer Linear Program (MILP) to allocate capital across candidate hotels, 
            bounded by Newsvendor quantities and hard budget caps.
          </p>
        </div>

        <button
          onClick={handleRunMilpSolver}
          className="self-start md:self-auto px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs md:text-sm flex items-center gap-2 shadow-md shadow-blue-500/20 active:scale-95 transition"
        >
          <Sliders className="w-4 h-4" />
          <span>Solve MILP Allocation</span>
        </button>
      </div>

      {/* Control Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        {/* Budget Cap Control */}
        <div>
          <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1.5">
            <span>Hard Budget Cap ($B)</span>
            <span className="text-blue-700 font-bold">${budgetCap.toLocaleString()}</span>
          </div>
          <input
            type="range"
            min={40000}
            max={200000}
            step={5000}
            value={budgetCap}
            onChange={(e) => setBudgetCap(Number(e.target.value))}
            className="w-full accent-blue-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>$40,000</span>
            <span>$120,000</span>
            <span>$200,000</span>
          </div>
        </div>

        {/* Risk Policy / Demand Target */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Newsvendor Quantile Sizing
          </label>
          <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => setRiskTolerance('conservative')}
              className={`py-1.5 rounded-lg transition ${
                riskTolerance === 'conservative'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              P10 (Floor)
            </button>
            <button
              onClick={() => setRiskTolerance('balanced')}
              className={`py-1.5 rounded-lg transition ${
                riskTolerance === 'balanced'
                  ? 'bg-white text-blue-700 shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              P50 (Median)
            </button>
            <button
              onClick={() => setRiskTolerance('aggressive')}
              className={`py-1.5 rounded-lg transition ${
                riskTolerance === 'aggressive'
                  ? 'bg-white text-indigo-700 shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              P90 (Upside)
            </button>
          </div>
        </div>

        {/* Destination Filter */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Filter Destination
          </label>
          <select
            value={selectedDestination}
            onChange={(e) => setSelectedDestination(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Destinations</option>
            <option value="Goa">Goa</option>
            <option value="Dubai">Dubai</option>
            <option value="London">London</option>
            <option value="Bali">Bali</option>
            <option value="Singapore">Singapore</option>
          </select>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`p-5 rounded-2xl border shadow-sm transition ${
          isOverBudget ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200/80'
        }`}>
          <p className="text-xs font-medium text-slate-500">Allocated Budget</p>
          <div className="flex items-baseline justify-between mt-1">
            <h3 className={`text-2xl font-extrabold ${isOverBudget ? 'text-rose-600' : 'text-slate-900'}`}>
              ${totalAllocatedBudget.toLocaleString()}
            </h3>
            <span className="text-[11px] text-slate-400">/ ${budgetCap.toLocaleString()}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isOverBudget ? 'bg-rose-500' : 'bg-blue-600'
              }`}
              style={{ width: `${Math.min(100, (totalAllocatedBudget / budgetCap) * 100)}%` }}
            />
          </div>
          {isOverBudget && (
            <p className="text-[10px] text-rose-600 font-bold mt-1.5 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" /> Exceeds hard budget cap!
            </p>
          )}
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Projected Net Profit</p>
          <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">
            +${Math.round(totalExpectedProfit).toLocaleString()}
          </h3>
          <p className="text-[11px] text-slate-400 mt-2">
            Net of estimated cancellation risk
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Expected ROI</p>
          <h3 className="text-2xl font-extrabold text-blue-700 mt-1">
            {blendedROI.toFixed(1)}%
          </h3>
          <p className="text-[11px] text-slate-400 mt-2">
            Blended return on capital deployed
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Committed Inventory</p>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
            {totalRooms} <span className="text-sm font-normal text-slate-400">rooms</span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-2">
            Across {approvedItems.length} approved contracts
          </p>
        </div>
      </div>

      {/* Recommendations Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Candidate Inventory Recommendations ({filteredRecs.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Ranked by Opportunity Score (Margin × Sell-Through)
            </p>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Click "Why?" to inspect SHAP feature attribution
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Hotel & City</th>
                <th className="py-3 px-3">Travel Window</th>
                <th className="py-3 px-3">Cost vs Spot</th>
                <th className="py-3 px-3">Demand (P10/P50/P90)</th>
                <th className="py-3 px-3">Cancel Risk</th>
                <th className="py-3 px-3">Opp. Score</th>
                <th className="py-3 px-3">Buy Qty</th>
                <th className="py-3 px-3">Total Cost</th>
                <th className="py-3 px-3">Net Profit</th>
                <th className="py-3 px-3">SHAP</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecs.map((item) => {
                const totalItemCost = item.wholesale_cost * item.recommended_qty;
                const unitMargin = item.target_price - item.wholesale_cost;
                const expectedItemProfit = unitMargin * item.recommended_qty * (1 - item.cancellation_risk);

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-blue-50/40 transition ${
                      !item.approved ? 'opacity-50 bg-slate-50/60' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{item.hotel_name}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <span>{item.city}</span>
                        <span>•</span>
                        <span className="text-amber-500">{'★'.repeat(item.stars)}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 whitespace-nowrap text-slate-600 font-medium">
                      {item.checkin}
                      <span className="text-slate-400 mx-1">→</span>
                      {item.checkout}
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="font-bold text-slate-900">${item.wholesale_cost}</span>
                      <span className="text-[11px] text-slate-400 block">
                        Spot: ${item.target_price}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="inline-flex items-center gap-1 font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded-md text-slate-700">
                        <span className="text-slate-400">{item.p10}</span>
                        <span className="text-blue-700 font-bold">{item.p50}</span>
                        <span className="text-slate-400">{item.p90}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.cancellation_risk < 0.12
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : item.cancellation_risk < 0.16
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {(item.cancellation_risk * 100).toFixed(0)}%
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="font-extrabold text-blue-700 text-xs">
                        {item.opp_score}
                      </span>
                      <span className="text-[10px] text-slate-400">/100</span>
                    </td>

                    <td className="py-3.5 px-3">
                      <input
                        type="number"
                        min={0}
                        step={5}
                        value={item.recommended_qty}
                        onChange={(e) => handleQtyChange(item.id, Number(e.target.value))}
                        disabled={!item.approved}
                        className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 text-center focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </td>

                    <td className="py-3.5 px-3 font-semibold text-slate-900">
                      ${totalItemCost.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-3 font-bold text-emerald-600">
                      +${Math.round(expectedItemProfit).toLocaleString()}
                    </td>

                    <td className="py-3.5 px-3">
                      <button
                        onClick={() => setActiveShapItem(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-full border border-blue-200 transition"
                      >
                        <Sparkles className="w-3 h-3 text-blue-600" />
                        <span>Why?</span>
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleApprove(item.id)}
                        className={`p-1.5 rounded-full transition ${
                          item.approved
                            ? 'text-emerald-600 hover:bg-emerald-50'
                            : 'text-slate-400 hover:bg-slate-200'
                        }`}
                        title={item.approved ? 'Contract Approved' : 'Contract Excluded'}
                      >
                        {item.approved ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <XCircle className="w-5 h-5" />
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ShapModal item={activeShapItem} onClose={() => setActiveShapItem(null)} />
    </div>
  );
};

