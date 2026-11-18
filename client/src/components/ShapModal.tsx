import { X, TrendingUp, AlertTriangle, Info, Sparkles } from 'lucide-react';

export interface ShapDriver {
  feature: string;
  impact: string;
  isPositive: boolean;
  explanation: string;
}

export interface RecommendationItem {
  id: string;
  hotel_name: string;
  city: string;
  stars: number;
  checkin: string;
  checkout: string;
  wholesale_cost: number;
  target_price: number;
  p10: number;
  p50: number;
  p90: number;
  cancellation_risk: number;
  opp_score: number;
  supplier_min_batch: number;
  recommended_qty: number;
  approved: boolean;
  shap_drivers: ShapDriver[];
}

interface ShapModalProps {
  item: RecommendationItem | null;
  onClose: () => void;
}

export const ShapModal: React.FC<ShapModalProps> = ({ item, onClose }) => {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-xl overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-blue-200 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1.5 transition"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-blue-500/30 text-blue-200 px-2.5 py-0.5 rounded-full border border-blue-400/30">
              <Sparkles className="w-3 h-3 text-cyan-300" />
              SHAP Reason Card
            </span>
            <span className="text-xs text-blue-200 font-medium">Model Attribution</span>
          </div>

          <h3 className="text-xl font-bold tracking-tight text-white mb-1">
            {item.hotel_name}
          </h3>
          <p className="text-xs text-blue-200">
            {item.city} • Travel Window: {item.checkin} to {item.checkout}
          </p>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5 text-slate-800">
          {/* Top Metric Summary */}
          <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center">
            <div>
              <p className="text-[11px] font-medium text-slate-400">Target Buy</p>
              <p className="text-lg font-bold text-slate-800">{item.recommended_qty} rms</p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400">Unit Margin</p>
              <p className="text-lg font-bold text-emerald-600">
                +${item.target_price - item.wholesale_cost}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400">Opp. Score</p>
              <p className="text-lg font-bold text-blue-600">{item.opp_score}/100</p>
            </div>
          </div>

          {/* Feature Drivers List */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Key Factors Driving Recommendation (TreeSHAP)
            </h4>

            <div className="space-y-3">
              {item.shap_drivers.map((driver, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 ${
                    driver.isPositive
                      ? 'bg-blue-50/50 border-blue-100'
                      : 'bg-rose-50/50 border-rose-100'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`mt-0.5 p-1 rounded-md ${
                        driver.isPositive
                          ? 'bg-blue-600 text-white'
                          : 'bg-rose-600 text-white'
                      }`}
                    >
                      {driver.isPositive ? (
                        <TrendingUp className="w-3.5 h-3.5" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900">
                        {driver.feature}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {driver.explanation}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-md self-center ${
                      driver.isPositive
                        ? 'text-blue-700 bg-blue-100'
                        : 'text-rose-700 bg-rose-100'
                    }`}
                  >
                    {driver.impact}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Model Recommendation Conclusion */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/70 text-xs text-slate-600 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p>
              <strong>Newsvendor Quantile Sizing:</strong> Based on historical L2B search surge and holiday calendar alignment, the critical fractile targets P68 demand. Recommend committing <strong>{item.recommended_qty} rooms</strong> to minimize stockout loss under a 95% confidence cap.
            </p>
          </div>

          {/* Action button */}
          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-full bg-slate-900 text-white font-medium text-xs hover:bg-slate-800 transition"
            >
              Done & Return
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

