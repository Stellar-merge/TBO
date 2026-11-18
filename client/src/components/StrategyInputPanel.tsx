import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Building2, 
  Plane, 
  ChevronDown, 
  Calendar, 
  Sparkles, 
  Scale, 
  DollarSign
} from 'lucide-react';

export interface AllocationStrategyConstraints {
  inventoryType: 'Hotels' | 'Flights';
  maxBudget: number;
  riskTolerance: 'Conservative' | 'Moderate' | 'Aggressive';
  targetHorizon: {
    preset: 'Next 3 Months' | 'Q1 2027' | 'Q2 2027' | 'Custom Dates';
    startDate: string;
    endDate: string;
  };
}

interface StrategyInputPanelProps {
  onSubmit: (constraints: AllocationStrategyConstraints) => void;
  className?: string;
}

export const StrategyInputPanel: React.FC<StrategyInputPanelProps> = ({ 
  onSubmit, 
  className = '' 
}) => {
  // 1. Inventory Type State
  const [inventoryType, setInventoryType] = useState<'Hotels' | 'Flights'>('Hotels');
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);

  // 2. Budget State (raw numeric & formatted string)
  const [budgetRaw, setBudgetRaw] = useState<number>(500000);
  const [budgetString, setBudgetString] = useState<string>('$500,000');

  // 3. Risk Tolerance State
  const [riskTolerance, setRiskTolerance] = useState<'Conservative' | 'Moderate' | 'Aggressive'>('Moderate');

  // 4. Target Horizon / Season State
  const [horizonPreset, setHorizonPreset] = useState<'Next 3 Months' | 'Q1 2027' | 'Q2 2027' | 'Custom Dates'>('Next 3 Months');
  const [startDate, setStartDate] = useState<string>('2026-12-01');
  const [endDate, setEndDate] = useState<string>('2027-02-28');
  const [isHorizonOpen, setIsHorizonOpen] = useState(false);

  // Formatting helpers
  const formatCurrency = (val: number): string => {
    return '$' + val.toLocaleString('en-US');
  };

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/[^0-9]/g, '');
    const num = rawDigits ? parseInt(rawDigits, 10) : 0;
    setBudgetRaw(num);
    setBudgetString(num > 0 ? formatCurrency(num) : '$');
  };

  const handleBudgetBlur = () => {
    if (budgetRaw <= 0) {
      setBudgetRaw(100000);
      setBudgetString(formatCurrency(100000));
    } else {
      setBudgetString(formatCurrency(budgetRaw));
    }
  };

  const handleQuickBudget = (val: number) => {
    setBudgetRaw(val);
    setBudgetString(formatCurrency(val));
  };

  // Calculated dynamic date range label
  const formattedDateRange = useMemo(() => {
    if (horizonPreset === 'Next 3 Months') {
      return 'Dec 2026 – Feb 2027';
    } else if (horizonPreset === 'Q1 2027') {
      return 'Jan 2027 – Mar 2027';
    } else if (horizonPreset === 'Q2 2027') {
      return 'Apr 2027 – Jun 2027';
    } else {
      return `${startDate} → ${endDate}`;
    }
  }, [horizonPreset, startDate, endDate]);

  // Handle Preset Selection
  const selectPreset = (preset: 'Next 3 Months' | 'Q1 2027' | 'Q2 2027' | 'Custom Dates') => {
    setHorizonPreset(preset);
    if (preset === 'Next 3 Months') {
      setStartDate('2026-12-01');
      setEndDate('2027-02-28');
      setIsHorizonOpen(false);
    } else if (preset === 'Q1 2027') {
      setStartDate('2027-01-01');
      setEndDate('2027-03-31');
      setIsHorizonOpen(false);
    } else if (preset === 'Q2 2027') {
      setStartDate('2027-04-01');
      setEndDate('2027-06-30');
      setIsHorizonOpen(false);
    }
    // If Custom Dates, keep open to let user set dates
  };

  // Risk profile micro-tooltips / sub-labels
  const riskSubLabel = useMemo(() => {
    switch (riskTolerance) {
      case 'Conservative':
        return 'P10 floor · <10% cancel risk · Capital preserved';
      case 'Moderate':
        return 'P50 yield · Balanced Sharpe · Standard terms';
      case 'Aggressive':
        return 'P90 surge · Max yield target · Dynamic pricing';
    }
  }, [riskTolerance]);

  // Close dropdowns on outside click
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsTypeDropdownOpen(false);
        setIsHorizonOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Primary Action trigger
  const handleRunStrategy = () => {
    onSubmit({
      inventoryType,
      maxBudget: budgetRaw > 0 ? budgetRaw : 500000,
      riskTolerance,
      targetHorizon: {
        preset: horizonPreset,
        startDate,
        endDate,
      },
    });
  };

  return (
    <div 
      ref={containerRef}
      className={`w-full max-w-5xl mx-auto bg-gray-950/85 backdrop-blur-2xl border border-white/15 rounded-2xl p-2.5 sm:p-3.5 shadow-2xl shadow-black/50 text-white font-sans ${className}`}
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-stretch">
        
        {/* ─── 1. Inventory Type (Asset Class Badge / Selector) ─── */}
        <div className="md:col-span-2 relative bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 rounded-xl p-2.5 flex flex-col justify-between transition-colors">
          <label className="text-[10px] font-bold tracking-wider text-gray-400 uppercase flex items-center gap-1 select-none">
            <Building2 className="w-3 h-3 text-gray-400" />
            <span>Asset Class</span>
          </label>
          
          <div className="relative mt-1">
            <button
              type="button"
              onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
              className="w-full flex items-center justify-between gap-1.5 py-1 px-1.5 text-xs font-bold text-white hover:text-white/90 rounded-md transition-colors"
              aria-haspopup="listbox"
              aria-expanded={isTypeDropdownOpen}
            >
              <span className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <span className="truncate">{inventoryType}</span>
              </span>
              <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${isTypeDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isTypeDropdownOpen && (
              <div 
                role="listbox"
                className="absolute left-0 top-full mt-2 w-44 bg-gray-950/95 backdrop-blur-xl border border-white/15 rounded-xl shadow-elevation-4 p-1.5 z-40 text-left text-xs animate-scale-in"
              >
                <button
                  type="button"
                  onClick={() => { setInventoryType('Hotels'); setIsTypeDropdownOpen(false); }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                    inventoryType === 'Hotels' ? 'bg-white/10 text-white font-semibold' : 'text-gray-300 hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Hotels</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium">Active</span>
                </button>

                <div 
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-gray-500 opacity-60 cursor-not-allowed select-none"
                  title="Coming Soon for Hackathon Scope"
                >
                  <span className="flex items-center gap-1.5">
                    <Plane className="w-3.5 h-3.5" />
                    <span>Flights</span>
                  </span>
                  <span className="text-[9px] bg-white/10 text-gray-400 px-1.5 py-0.5 rounded font-mono">
                    Soon
                  </span>
                </div>
              </div>
            )}
          </div>

          <span className="text-[9px] text-gray-500 font-medium truncate select-none mt-1">
            Pre-buy wholesale rooms
          </span>
        </div>

        {/* ─── 2. Total Investment Budget (Currency Numeric Input) ─── */}
        <div className="md:col-span-3 bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 rounded-xl p-2.5 flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between select-none">
            <label className="text-[10px] font-bold tracking-wider text-gray-400 uppercase flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-gray-400" />
              <span>Investment Budget</span>
            </label>
            <span className="text-[9px] text-gray-400 font-mono">USD</span>
          </div>

          {/* Formatted Currency Input */}
          <div className="relative mt-1">
            <input
              type="text"
              value={budgetString}
              onChange={handleBudgetChange}
              onBlur={handleBudgetBlur}
              className="w-full bg-black/30 border border-white/10 focus:border-white/30 focus:ring-1 focus:ring-white/20 rounded-lg px-2.5 py-1 text-sm font-bold text-white font-mono tabular-nums outline-none transition-all"
              placeholder="$500,000"
            />
          </div>

          {/* Quick Helper Pills */}
          <div className="flex items-center gap-1 mt-1.5 select-none overflow-x-auto no-scrollbar">
            {[100000, 250000, 500000, 1000000].map((amt) => {
              const label = amt >= 1000000 ? `$${amt / 1000000}M` : `$${amt / 1000}K`;
              const isCurrent = budgetRaw === amt;
              return (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleQuickBudget(amt)}
                  className={`text-[9px] font-semibold px-1.5 py-0.5 rounded transition-all ${
                    isCurrent 
                      ? 'bg-white/20 text-white font-bold' 
                      : 'bg-white/[0.04] hover:bg-white/[0.09] text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── 3. Risk Tolerance (Segmented Pill Selector) ─── */}
        <div className="md:col-span-3 bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 rounded-xl p-2.5 flex flex-col justify-between transition-colors">
          <label className="text-[10px] font-bold tracking-wider text-gray-400 uppercase flex items-center gap-1 select-none">
            <Scale className="w-3 h-3 text-gray-400" />
            <span>Risk Tolerance</span>
          </label>

          {/* Segmented Radio Pills */}
          <div className="grid grid-cols-3 gap-1 bg-black/40 border border-white/10 p-0.5 rounded-lg mt-1 select-none">
            {(['Conservative', 'Moderate', 'Aggressive'] as const).map((level) => {
              const isActive = riskTolerance === level;
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => setRiskTolerance(level)}
                  className={`text-[10px] font-semibold py-1 px-1 rounded-md transition-all text-center truncate ${
                    isActive
                      ? level === 'Conservative'
                        ? 'bg-sky-600 text-white font-bold shadow-sm'
                        : level === 'Moderate'
                          ? 'bg-brand-600 text-white font-bold shadow-sm'
                          : 'bg-emerald-600 text-white font-bold shadow-sm'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]'
                  }`}
                >
                  {level}
                </button>
              );
            })}
          </div>

          {/* Dynamic Micro-Label Subtitle */}
          <span className="text-[9px] text-gray-400 font-medium truncate mt-1.5 select-none" title={riskSubLabel}>
            {riskSubLabel}
          </span>
        </div>

        {/* ─── 4. Target Horizon / Season (Hybrid Presets + Custom Dates) ─── */}
        <div className="md:col-span-2 relative bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 rounded-xl p-2.5 flex flex-col justify-between transition-colors">
          <label className="text-[10px] font-bold tracking-wider text-gray-400 uppercase flex items-center gap-1 select-none">
            <Calendar className="w-3 h-3 text-gray-400" />
            <span>Target Horizon</span>
          </label>

          {/* Preset Trigger Button */}
          <div className="relative mt-1">
            <button
              type="button"
              onClick={() => setIsHorizonOpen(!isHorizonOpen)}
              className="w-full flex items-center justify-between gap-1 py-1 px-1.5 text-xs font-bold text-white hover:text-white/90 rounded-md transition-colors"
              aria-haspopup="true"
              aria-expanded={isHorizonOpen}
            >
              <span className="truncate">{horizonPreset}</span>
              <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${isHorizonOpen ? 'rotate-180' : ''}`} />
            </button>

            {isHorizonOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-gray-950/95 backdrop-blur-xl border border-white/15 rounded-xl shadow-elevation-4 p-2 z-40 text-left text-xs animate-scale-in">
                <span className="text-[10px] font-bold text-gray-400 uppercase px-2 mb-1 block">
                  Select Season Preset
                </span>
                {(['Next 3 Months', 'Q1 2027', 'Q2 2027', 'Custom Dates'] as const).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => selectPreset(preset)}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-left transition-colors flex items-center justify-between ${
                      horizonPreset === preset 
                        ? 'bg-white/10 text-white font-semibold' 
                        : 'text-gray-300 hover:bg-white/[0.06] hover:text-white'
                    }`}
                  >
                    <span>{preset}</span>
                    {horizonPreset === preset && <span className="text-emerald-400 text-[10px]">✓</span>}
                  </button>
                ))}

                {/* Custom Date Pickers when 'Custom Dates' is selected */}
                {horizonPreset === 'Custom Dates' && (
                  <div className="mt-2 pt-2 border-t border-white/10 flex flex-col gap-1.5">
                    <span className="text-[10px] text-gray-400 font-medium">Contract Date Range:</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div>
                        <span className="text-[9px] text-gray-500 block mb-0.5">Start</span>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded px-1.5 py-1 text-[11px] text-white outline-none"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-500 block mb-0.5">End</span>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded px-1.5 py-1 text-[11px] text-white outline-none"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsHorizonOpen(false)}
                      className="mt-1 w-full bg-white/10 hover:bg-white/20 text-white text-[10px] font-semibold py-1 rounded transition-colors"
                    >
                      Apply Contract Dates
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Calculated Date Range Display */}
          <span className="text-[9px] text-gray-400 font-mono truncate select-none mt-1">
            {formattedDateRange}
          </span>
        </div>

        {/* ─── 5. Primary Action Button (Run Allocation Strategy) ─── */}
        <div className="md:col-span-2 flex items-center">
          <button
            type="button"
            onClick={handleRunStrategy}
            className="w-full h-full min-h-[58px] bg-[#114978] hover:bg-[#0d3b62] active:scale-[0.98] text-white border border-[#256ca8]/40 font-bold text-xs rounded-xl shadow-elevation-3 hover:shadow-elevation-4 transition-all duration-200 flex flex-col sm:flex-row items-center justify-center gap-1.5 px-3 py-2 text-center group"
          >
            <Sparkles className="w-4 h-4 text-sky-300 transition-transform group-hover:rotate-12 duration-300 shrink-0" />
            <span className="leading-tight font-extrabold text-[12px] sm:text-xs text-white">
              Run Allocation Strategy
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};
