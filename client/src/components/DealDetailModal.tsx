import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Calendar, 
  User, 
  Globe, 
  Trash2,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import type { DealItem, DealStage } from '../types/deals';
import { FloorplanSvg } from './FloorplanSvg';

interface DealDetailModalProps {
  deal: DealItem | null;
  onClose: () => void;
  onUpdateDeal: (updatedDeal: DealItem) => void;
  onDeleteDeal: (id: string) => void;
}

interface DealDetailContentProps {
  deal: DealItem;
  onClose: () => void;
  onUpdateDeal: (updatedDeal: DealItem) => void;
  onDeleteDeal: (id: string) => void;
}

const DealDetailContent: React.FC<DealDetailContentProps> = ({
  deal,
  onClose,
  onUpdateDeal,
  onDeleteDeal,
}) => {
  const [wholesaleCost, setWholesaleCost] = useState(deal.wholesaleCost);
  const [targetPrice, setTargetPrice] = useState(deal.targetPrice);
  const [stage, setStage] = useState<DealStage>(deal.stage);
  const [isRecalculated, setIsRecalculated] = useState(false);

  // Recalculate ML predictions when inputs change
  const unitMargin = Math.max(0, targetPrice - wholesaleCost);
  const marginRatio = targetPrice > 0 ? unitMargin / targetPrice : 0.3;
  const cancellationRisk = Number((Math.min(0.35, Math.max(0.06, 0.22 - (marginRatio * 0.2)))).toFixed(2));
  const p50 = Math.round(deal.units * (0.85 + marginRatio * 0.3));
  const p10 = Math.round(p50 * 0.55);
  const p90 = Math.round(p50 * 1.5);

  const cu = unitMargin;
  const co = wholesaleCost * 0.4;
  const criticalFractile = (cu + co) > 0 ? cu / (cu + co) : 0.65;
  const recommendedQty = Math.round(p10 + (p90 - p10) * criticalFractile);
  const expectedProfit = Math.round(unitMargin * recommendedQty * (1 - cancellationRisk));

  const handleSave = () => {
    onUpdateDeal({
      ...deal,
      wholesaleCost,
      targetPrice,
      stage,
      p10,
      p50,
      p90,
      cancellationRisk,
      recommendedQty,
      expectedProfit,
      priority: cancellationRisk > 0.20 || unitMargin < 300 ? 'High' : cancellationRisk > 0.14 ? 'Medium' : 'Low',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 relative max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-gray-400 font-semibold">{deal.id}</span>
            <span className="text-xs font-bold text-gray-900">• {deal.hotelName}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onDeleteDeal(deal.id);
                onClose();
              }}
              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
              title="Delete deal"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="py-4 space-y-4">
          
          {/* Dual image preview */}
          <div className="grid grid-cols-2 gap-3 h-32 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 p-1.5">
            <div className="h-full w-full bg-white rounded-xl overflow-hidden flex items-center justify-center">
              <FloorplanSvg variant={deal.floorplanVariant} className="w-full h-full object-contain" />
            </div>
            <div className="h-full w-full rounded-xl overflow-hidden bg-gray-100">
              <img 
                src={deal.propertyPhoto} 
                alt={deal.title}
                className="w-full h-full object-cover" 
              />
            </div>
          </div>

          {/* Title & Specs */}
          <div>
            <h2 className="text-sm font-bold text-gray-900 leading-snug">{deal.title}</h2>
            <div className="text-lg font-extrabold text-gray-950 mt-1">
              {deal.priceValue.toLocaleString()} {deal.currency}
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-gray-50/70 rounded-xl text-xs border border-gray-100">
            <div className="flex items-center gap-1.5 text-gray-600">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <span>{deal.reservationDate}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600 truncate">
              <User className="w-3.5 h-3.5 text-gray-400" />
              <span className="truncate">{deal.client}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600 truncate">
              <Globe className="w-3.5 h-3.5 text-gray-400" />
              <span className="truncate">{deal.source}</span>
            </div>
          </div>

          {/* Pipeline Stage Transition */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Pipeline Stage
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'new', label: 'New' },
                { id: 'viewing', label: 'Scheduled' },
                { id: 'negotiation', label: 'Negotiation' },
                { id: 'legal', label: 'Legal / Done' },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStage(st.id as DealStage)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition ${
                    stage === st.id
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tweak Values & Re-predict */}
          <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">
                Adjust Variables & Re-predict
              </span>
              {isRecalculated && (
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Updated
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-gray-500 mb-1">
                  Wholesale Cost (AED)
                </label>
                <input
                  type="number"
                  value={wholesaleCost}
                  onChange={(e) => {
                    setWholesaleCost(Number(e.target.value));
                    setIsRecalculated(true);
                  }}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 font-semibold bg-white text-gray-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-500 mb-1">
                  Target Price (AED)
                </label>
                <input
                  type="number"
                  value={targetPrice}
                  onChange={(e) => {
                    setTargetPrice(Number(e.target.value));
                    setIsRecalculated(true);
                  }}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 font-semibold bg-white text-gray-900"
                />
              </div>
            </div>

            {/* ML Prediction Output */}
            <div className="pt-2 border-t border-gray-200/60">
              <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wide mb-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> ML Quantiles & Allocation
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-2xs">
                  <div className="text-[10px] text-gray-400">P10 Floor</div>
                  <div className="text-xs font-bold text-gray-900">{p10} units</div>
                </div>
                <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-2xs">
                  <div className="text-[10px] text-gray-400">P50 Expected</div>
                  <div className="text-xs font-bold text-blue-600">{p50} units</div>
                </div>
                <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-2xs">
                  <div className="text-[10px] text-gray-400">P(Cancel)</div>
                  <div className="text-xs font-bold text-amber-600">{(cancellationRisk * 100).toFixed(0)}%</div>
                </div>
                <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-2xs">
                  <div className="text-[10px] text-gray-400">Optimal Q*</div>
                  <div className="text-xs font-bold text-emerald-600">{recommendedQty} units</div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleSave}
              className="flex-1 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <span>Apply Changes & Save</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export const DealDetailModal: React.FC<DealDetailModalProps> = (props) => {
  if (!props.deal) return null;
  return <DealDetailContent {...props} deal={props.deal} />;
};
