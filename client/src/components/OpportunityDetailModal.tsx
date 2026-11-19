import React, { useEffect, useRef } from 'react';
import { X, Sparkles } from 'lucide-react';
import type { OpportunityCardItem } from '../data/opportunityDeals';

interface OpportunityDetailModalProps {
  item: OpportunityCardItem | null;
  onClose: () => void;
}

/* ─── Inner content (separated to maintain hook order) ─── */
const ModalContent: React.FC<{ item: OpportunityCardItem; onClose: () => void }> = ({ item, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus trap + Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    // Focus the modal
    modalRef.current?.focus();
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  /* ─── Quantile progress bar percentage ─── */
  const maxUnits = item.p90 * 1.2;
  const p10Pct = (item.p10 / maxUnits) * 100;
  const p50Pct = (item.p50 / maxUnits) * 100;
  const p90Pct = (item.p90 / maxUnits) * 100;

  /* ─── Risk color ─── */
  const riskColor = item.riskRating === 'Low' 
    ? 'text-emerald-600 bg-emerald-50 border-emerald-200/60' 
    : item.riskRating === 'High' 
      ? 'text-rose-600 bg-rose-50 border-rose-200/60' 
      : 'text-amber-600 bg-amber-50 border-amber-200/60';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal Panel */}
      <div 
        ref={modalRef}
        tabIndex={-1}
        className="relative bg-white rounded-2xl max-w-lg w-full p-6 shadow-elevation-4 border border-gray-200/60 max-h-[90vh] overflow-y-auto font-sans animate-scale-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">
              {item.destination} • {item.inventoryType}
            </span>
            <h2 id="modal-title" className="text-base font-bold text-gray-900 mt-0.5">{item.title}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200 active:scale-90"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Image */}
        <div className="h-44 w-full rounded-xl overflow-hidden my-4 shadow-elevation-1">
          <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
        </div>

        {/* ML Breakdown */}
        <div className="space-y-4">
          {/* Section Header */}
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-gray-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              LightGBM Quantile Demand
            </span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${riskColor}`}>
              Risk: {item.riskRating}
            </span>
          </div>

          {/* Quantile Visual Bar */}
          <div className="relative">
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden relative">
              {/* P10–P90 range fill */}
              <div 
                className="absolute top-0 bottom-0 bg-blue-100 rounded-full transition-all duration-700 ease-spring"
                style={{ left: `${p10Pct}%`, width: `${p90Pct - p10Pct}%` }}
              />
              {/* P50 marker */}
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-blue-500 transition-all duration-700 ease-spring"
                style={{ left: `${p50Pct}%` }}
              />
            </div>
            {/* Labels */}
            <div className="flex justify-between mt-1.5 text-[10px] text-gray-400 font-medium">
              <span>P10: {item.p10}u</span>
              <span className="text-blue-600 font-bold">P50: {item.p50}u</span>
              <span>P90: {item.p90}u</span>
            </div>
          </div>

          {/* Allocation badge */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60">
              Allocated: ${item.allocatedAmount.toLocaleString()}
            </span>
            <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200/60">
              Q*: {item.recommendedUnits} units
            </span>
          </div>

          {/* Economics Table */}
          <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-100 space-y-2.5 text-xs">
            {[
              { label: item.inventoryType === 'Flights' ? 'Wholesale Seat Rate' : 'Wholesale Pre-buy Rate', value: `$${item.wholesaleCost} / ${item.inventoryType === 'Flights' ? 'seat' : 'unit'}`, bold: false },
              { label: item.inventoryType === 'Flights' ? 'Target Selling Price' : 'Target Distribution Price', value: `$${item.targetPrice} / ${item.inventoryType === 'Flights' ? 'seat' : 'unit'}`, bold: false },
              { 
                label: item.inventoryType === 'Flights' ? 'Model 3 Flight Cancellation Risk' : 'Calibrated Cancellation Risk', 
                value: `${item.cancellationRisk > 1 ? item.cancellationRisk.toFixed(0) : (item.cancellationRisk * 100).toFixed(0)}%`, 
                bold: false, 
                color: 'text-amber-600' 
              },
            ].map((row) => (
              <div key={row.label} className="flex justify-between text-gray-600">
                <span>{row.label}</span>
                <span className={`font-semibold ${row.color || 'text-gray-900'}`}>{row.value}</span>
              </div>
            ))}
            
            {/* Total */}
            <div className="flex justify-between text-gray-800 border-t border-gray-200/70 pt-2.5 font-bold">
              <span>Expected Net Profit</span>
              <span className="text-emerald-600 text-sm">{item.expectedProfit}</span>
            </div>
          </div>

          {/* Close button */}
          <div className="pt-1">
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-gray-950 hover:bg-gray-800 text-white rounded-xl text-xs font-semibold shadow-elevation-2 transition-all duration-200 active:scale-[0.98] hover:shadow-elevation-3"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const OpportunityDetailModal: React.FC<OpportunityDetailModalProps> = ({ item, onClose }) => {
  if (!item) return null;
  return <ModalContent item={item} onClose={onClose} />;
};
