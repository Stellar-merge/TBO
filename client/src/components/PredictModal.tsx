import React, { useState } from 'react';
import { X, Sparkles, TrendingUp, CheckCircle2 } from 'lucide-react';
import type { DealItem, DealStage, PriorityLevel } from '../types/deals';

interface PredictModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDeal: (deal: DealItem) => void;
  defaultStage?: DealStage;
}

export const PredictModal: React.FC<PredictModalProps> = ({
  isOpen,
  onClose,
  onAddDeal,
  defaultStage = 'new',
}) => {
  const [title, setTitle] = useState('3-bedrooms in UAE — Marina Bay Suite — 160 m²');
  const [hotelName, setHotelName] = useState('Marina Bay Luxury Residences');
  const [city, setCity] = useState('Dubai');
  const [wholesaleCost, setWholesaleCost] = useState<number>(1400);
  const [targetPrice, setTargetPrice] = useState<number>(2150);
  const [units, setUnits] = useState<number>(30);
  const [totalPriceValue, setTotalPriceValue] = useState<number>(2450000);
  const [client, setClient] = useState('James O\'Connor');
  const [source, setSource] = useState('bronex.com');
  const [reservationDate, setReservationDate] = useState('25 Nov 2025');
  const [selectedStage, setSelectedStage] = useState<DealStage>(defaultStage);

  if (!isOpen) return null;

  // ML Quantile & Allocation Calculation
  // Unit Margin
  const unitMargin = Math.max(0, targetPrice - wholesaleCost);
  const marginRatio = targetPrice > 0 ? unitMargin / targetPrice : 0.3;

  // Cancellation risk model
  const rawCancelRisk = Math.min(0.35, Math.max(0.06, 0.22 - (marginRatio * 0.2)));
  const cancellationRisk = Number(rawCancelRisk.toFixed(2));

  // Demand Quantiles: P10, P50, P90
  const p50 = Math.round(units * (0.85 + marginRatio * 0.3));
  const p10 = Math.round(p50 * 0.55);
  const p90 = Math.round(p50 * 1.5);

  // Newsvendor critical fractile CF = Cu / (Cu + Co)
  // Cu = targetPrice - wholesaleCost, Co = wholesaleCost * 0.5 (salvage)
  const cu = unitMargin;
  const co = wholesaleCost * 0.4;
  const criticalFractile = (cu + co) > 0 ? cu / (cu + co) : 0.65;
  const recommendedQty = Math.round(p10 + (p90 - p10) * criticalFractile);

  // Expected profit = unitMargin * recommendedQty * (1 - cancellationRisk)
  const expectedProfit = Math.round(unitMargin * recommendedQty * (1 - cancellationRisk));

  // Determine priority
  let priority: PriorityLevel = 'Low';
  if (cancellationRisk > 0.20 || unitMargin < 300) {
    priority = 'High';
  } else if (cancellationRisk > 0.14) {
    priority = 'Medium';
  }

  const handlePredictAndSave = (e: React.FormEvent) => {
    e.preventDefault();

    const randomId = `#DXB-${Math.floor(10000 + Math.random() * 90000)}`;
    const randomFloorplan = ((Math.floor(Math.random() * 4) + 1) as 1 | 2 | 3 | 4);

    const newDeal: DealItem = {
      id: randomId,
      stage: selectedStage,
      priority,
      title,
      propertyPhoto: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
      floorplanVariant: randomFloorplan,
      priceValue: totalPriceValue,
      currency: 'AED',
      reservationDate,
      isPendingReservation: selectedStage === 'viewing',
      client,
      source,
      commentsCount: 1,
      filesCount: 1,
      avatars: [
        { letter: 'K', bgClass: 'bg-sky-100', textClass: 'text-sky-700' },
        { letter: 'B', bgClass: 'bg-purple-100', textClass: 'text-purple-700' },
      ],
      hotelName,
      city,
      wholesaleCost,
      targetPrice,
      units,
      p10,
      p50,
      p90,
      cancellationRisk,
      recommendedQty,
      expectedProfit,
      shapReasons: [
        `High unit margin (+${Math.round(marginRatio * 100)}%)`,
        `Favorable Newsvendor ratio (${criticalFractile.toFixed(2)})`,
        `Calibrated cancellation risk ${(cancellationRisk * 100).toFixed(0)}%`,
      ],
    };

    onAddDeal(newDeal);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-blue-50 text-blue-600">
                <Sparkles className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-bold text-gray-900">
                Predict & Add Inventory Deal
              </h2>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Enter procurement details to predict demand quantiles and allocate.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handlePredictAndSave} className="space-y-4 pt-4">
          
          {/* Title / Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Deal Title & Specifications
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-200 focus:border-blue-500 focus:outline-hidden text-gray-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Property / Hotel Name
              </label>
              <input
                type="text"
                value={hotelName}
                onChange={(e) => setHotelName(e.target.value)}
                required
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-200 focus:border-blue-500 focus:outline-hidden text-gray-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                City / Destination
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-200 focus:border-blue-500 focus:outline-hidden text-gray-800"
              />
            </div>
          </div>

          {/* Pricing & Units (Where user puts in values) */}
          <div className="bg-gray-50/70 p-3.5 rounded-2xl border border-gray-100 space-y-3">
            <div className="text-[11px] font-bold text-gray-700 tracking-wide uppercase">
              Financial & Allotment Values
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-gray-500 mb-1">
                  Wholesale Cost (AED)
                </label>
                <input
                  type="number"
                  min={1}
                  value={wholesaleCost}
                  onChange={(e) => setWholesaleCost(Number(e.target.value))}
                  required
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-blue-500 focus:outline-hidden font-semibold text-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-500 mb-1">
                  Target Price (AED)
                </label>
                <input
                  type="number"
                  min={1}
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(Number(e.target.value))}
                  required
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-blue-500 focus:outline-hidden font-semibold text-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-500 mb-1">
                  Allotment Units
                </label>
                <input
                  type="number"
                  min={1}
                  value={units}
                  onChange={(e) => setUnits(Number(e.target.value))}
                  required
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-blue-500 focus:outline-hidden font-semibold text-gray-900 bg-white"
                />
              </div>
            </div>

            {/* Total Deal Asset Volume */}
            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-1">
                Total Deal Asset Volume (AED)
              </label>
              <input
                type="number"
                min={1000}
                value={totalPriceValue}
                onChange={(e) => setTotalPriceValue(Number(e.target.value))}
                required
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-blue-500 focus:outline-hidden font-bold text-gray-900 bg-white"
              />
            </div>
          </div>

          {/* Live ML Prediction Preview Card */}
          <div className="bg-blue-50/50 p-3.5 rounded-2xl border border-blue-100/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-blue-900 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                Live ML Forecast Preview
              </span>
              <span className="text-[10px] font-semibold text-blue-600 bg-blue-100/60 px-2 py-0.5 rounded-full">
                Auto-calculated
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-white p-2 rounded-xl border border-blue-100/60 shadow-2xs">
                <div className="text-[10px] text-gray-400 font-medium">P10 Floor</div>
                <div className="text-xs font-bold text-gray-800">{p10} units</div>
              </div>
              <div className="bg-white p-2 rounded-xl border border-blue-100/60 shadow-2xs">
                <div className="text-[10px] text-gray-400 font-medium">P50 Median</div>
                <div className="text-xs font-bold text-blue-600">{p50} units</div>
              </div>
              <div className="bg-white p-2 rounded-xl border border-blue-100/60 shadow-2xs">
                <div className="text-[10px] text-gray-400 font-medium">P(Cancel)</div>
                <div className="text-xs font-bold text-amber-600">{(cancellationRisk * 100).toFixed(0)}%</div>
              </div>
              <div className="bg-white p-2 rounded-xl border border-blue-100/60 shadow-2xs">
                <div className="text-[10px] text-gray-400 font-medium">Optimal Q*</div>
                <div className="text-xs font-bold text-emerald-600">{recommendedQty} units</div>
              </div>
            </div>
          </div>

          {/* Client, Source, Date */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-1">
                Client Name
              </label>
              <input
                type="text"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-800"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-1">
                Source Channel
              </label>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-800"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-1">
                Reservation Date
              </label>
              <input
                type="text"
                value={reservationDate}
                onChange={(e) => setReservationDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-800"
              />
            </div>
          </div>

          {/* Pipeline Stage Select */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Initial Pipeline Stage
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'new', label: 'New' },
                { id: 'viewing', label: 'Scheduled' },
                { id: 'negotiation', label: 'Negotiation' },
                { id: 'legal', label: 'Legal' },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setSelectedStage(st.id as DealStage)}
                  className={`py-1.5 rounded-xl text-xs font-semibold transition ${
                    selectedStage === st.id
                      ? 'bg-gray-900 text-white shadow-2xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gray-950 hover:bg-gray-800 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-xs active:scale-99"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Predict & Add Deal to Pipeline</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
