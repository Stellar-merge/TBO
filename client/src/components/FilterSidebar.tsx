import React, { useState, useEffect } from 'react';

interface FilterSidebarProps {
  segment: 'Overview' | 'Hotels' | 'Flights';
  setSegment: (seg: 'Overview' | 'Hotels' | 'Flights') => void;
  inventoryTypes: string[];
  setInventoryTypes: React.Dispatch<React.SetStateAction<string[]>>;
  destinations: string[];
  setDestinations: React.Dispatch<React.SetStateAction<string[]>>;
  travelPeriod: string;
  setTravelPeriod: (tp: string) => void;
  demandSignals: string[];
  setDemandSignals: React.Dispatch<React.SetStateAction<string[]>>;
  budgetMax: number;
  setBudgetMax: (b: number) => void;
  riskTolerance: 'Low' | 'Balanced' | 'High';
  setRiskTolerance: (r: 'Low' | 'Balanced' | 'High') => void;
  supplierTypes: string[];
  setSupplierTypes: React.Dispatch<React.SetStateAction<string[]>>;
}

// 32-bar bell curve distribution for the budget histogram
const histogramBars = [
  8, 12, 18, 25, 34, 45, 60, 75, 88, 98, 100, 95, 88, 78, 68, 58, 
  50, 42, 35, 28, 22, 18, 14, 11, 9, 7, 5, 4, 3, 2, 2, 1
];

/* ─── Reusable filter section wrapper ─── */
const FilterSection: React.FC<{ 
  title: string; 
  children: React.ReactNode; 
  delay?: number;
}> = ({ title, children, delay = 0 }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div 
      className={`transition-all duration-500 ease-spring ${
        visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-3'
      }`}
    >
      <h4 className="font-semibold text-gray-900 mb-2.5 text-[11px] uppercase tracking-wider">{title}</h4>
      {children}
    </div>
  );
};

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  segment,
  setSegment,
  inventoryTypes,
  setInventoryTypes,
  destinations,
  setDestinations,
  travelPeriod,
  setTravelPeriod,
  demandSignals,
  setDemandSignals,
  budgetMax,
  setBudgetMax,
  riskTolerance,
  setRiskTolerance,
  supplierTypes,
  setSupplierTypes,
}) => {
  const toggleItem = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    if (list.includes(item)) {
      setList(list.filter((x) => x !== item));
    } else {
      setList([...list, item]);
    }
  };

  const [barsAnimated, setBarsAnimated] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setBarsAnimated(true), 400);
    return () => clearTimeout(timer);
  }, []);

  // Calculate cutoff bar for budget
  const cutoffIndex = Math.min(
    histogramBars.length,
    Math.round((budgetMax / 120000) * histogramBars.length)
  );

  return (
    <aside className="w-64 min-w-[256px] space-y-6 text-gray-900 select-none font-sans text-xs" role="complementary" aria-label="Filters">
      
      {/* 1. Top Segment Switcher */}
      <div className="bg-gray-100/80 p-1 rounded-xl grid grid-cols-3 text-center font-medium border border-gray-200/50">
        {(['Overview', 'Hotels', 'Flights'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setSegment(tab)}
            className={`py-1.5 rounded-lg transition-all duration-200 text-xs ${
              segment === tab
                ? 'bg-gray-950 text-white font-semibold shadow-elevation-2'
                : 'text-gray-500 hover:text-gray-900 hover:bg-white/60'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 2. Inventory Type */}
      <FilterSection title="Inventory type" delay={50}>
        <div className="space-y-2 text-gray-700">
          {['Hotels', 'Flights', 'Both'].map((type) => (
            <label key={type} className="flex items-center gap-2.5 cursor-pointer hover:text-gray-950 transition-colors duration-150 group">
              <input
                type="checkbox"
                checked={inventoryTypes.includes(type)}
                onChange={() => toggleItem(inventoryTypes, setInventoryTypes, type)}
                className="w-[15px] h-[15px]"
              />
              <span className="group-hover:translate-x-0.5 transition-transform duration-150">{type}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* 3. Destination */}
      <FilterSection title="Destination" delay={100}>
        <div className="space-y-2 text-gray-700">
          {['India', 'Europe', 'Southeast Asia', 'Middle East'].map((dest) => (
            <label key={dest} className="flex items-center gap-2.5 cursor-pointer hover:text-gray-950 transition-colors duration-150 group">
              <input
                type="checkbox"
                checked={destinations.includes(dest)}
                onChange={() => toggleItem(destinations, setDestinations, dest)}
                className="w-[15px] h-[15px]"
              />
              <span className="group-hover:translate-x-0.5 transition-transform duration-150">{dest}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* 4. Travel Period */}
      <FilterSection title="Travel period" delay={150}>
        <div className="space-y-2 text-gray-700">
          {['Next 30 days', '31–90 days', '3–6 months'].map((period) => (
            <label key={period} className="flex items-center gap-2.5 cursor-pointer hover:text-gray-950 transition-colors duration-150 group">
              <input
                type="radio"
                name="travelPeriod"
                checked={travelPeriod === period}
                onChange={() => setTravelPeriod(period)}
                className="w-[15px] h-[15px]"
              />
              <span className="group-hover:translate-x-0.5 transition-transform duration-150">{period}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* 5. Demand Signals */}
      <FilterSection title="Demand signals" delay={200}>
        <div className="space-y-2 text-gray-700">
          {['High look-to-book', 'Rising searches', 'Sold-out / unmet demand'].map((signal) => (
            <label key={signal} className="flex items-center gap-2.5 cursor-pointer hover:text-gray-950 transition-colors duration-150 group">
              <input
                type="checkbox"
                checked={demandSignals.includes(signal)}
                onChange={() => toggleItem(demandSignals, setDemandSignals, signal)}
                className="w-[15px] h-[15px]"
              />
              <span className="group-hover:translate-x-0.5 transition-transform duration-150">{signal}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* 6. Budget with Animated Histogram & Slider */}
      <FilterSection title="Budget" delay={250}>
        {/* Histogram Distribution Bars with grow animation */}
        <div className="h-11 flex items-end gap-[3px] mb-1.5 px-0.5">
          {histogramBars.map((height, i) => {
            const isFilled = i <= cutoffIndex;
            return (
              <div
                key={i}
                className={`flex-1 rounded-t-sm origin-bottom transition-colors duration-200 ${
                  isFilled ? 'bg-gray-900' : 'bg-gray-200'
                } ${barsAnimated ? 'animate-bar-grow' : ''}`}
                style={{ 
                  height: `${height}%`,
                  animationDelay: barsAnimated ? `${i * 20}ms` : '0ms',
                  animationFillMode: 'both',
                }}
              />
            );
          })}
        </div>

        {/* Range Slider */}
        <div className="relative mb-3 px-0.5">
          <input
            type="range"
            min={10000}
            max={120000}
            step={5000}
            value={budgetMax}
            onChange={(e) => setBudgetMax(Number(e.target.value))}
            aria-label="Maximum budget"
            className="w-full"
          />
        </div>

        {/* Min / Max Input Boxes */}
        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <div>
            <div className="text-[10px] text-gray-400 mb-1 font-medium">Min</div>
            <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50/50 font-medium text-gray-700 transition-colors duration-150">
              $0
            </div>
          </div>
          <div>
            <div className="text-[10px] text-gray-400 mb-1 font-medium">Max</div>
            <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50/50 font-bold text-gray-950 transition-colors duration-150">
              ${budgetMax.toLocaleString()}
            </div>
          </div>
        </div>
      </FilterSection>

      {/* 7. Risk Tolerance Segmented Switcher */}
      <FilterSection title="Risk tolerance" delay={300}>
        <div className="bg-gray-100/80 p-0.5 rounded-lg grid grid-cols-3 text-center border border-gray-200/50 font-medium">
          {(['Low', 'Balanced', 'High'] as const).map((level) => (
            <button
              key={level}
              onClick={() => setRiskTolerance(level)}
              className={`py-1.5 rounded-md text-xs transition-all duration-200 ${
                riskTolerance === level
                  ? 'bg-gray-950 text-white font-semibold shadow-elevation-2'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-white/60'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* 8. Supplier Type */}
      <FilterSection title="Supplier type" delay={350}>
        <div className="space-y-2 text-gray-700">
          {['Direct', 'Aggregator'].map((supp) => (
            <label key={supp} className="flex items-center gap-2.5 cursor-pointer hover:text-gray-950 transition-colors duration-150 group">
              <input
                type="checkbox"
                checked={supplierTypes.includes(supp)}
                onChange={() => toggleItem(supplierTypes, setSupplierTypes, supp)}
                className="w-[15px] h-[15px]"
              />
              <span className="group-hover:translate-x-0.5 transition-transform duration-150">{supp}</span>
            </label>
          ))}
        </div>
      </FilterSection>

    </aside>
  );
};
