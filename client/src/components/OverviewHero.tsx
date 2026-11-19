import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Plane,
  Building2,
  MapPin,
  Calendar,
  ChevronDown,
  Globe,
  TrendingUp, 
  BarChart3, 
  Briefcase, 
  ShieldCheck,
  Check
} from 'lucide-react';

interface OverviewHeroProps {
  onFindOpportunities?: () => void;
  onRunStrategy?: () => void;
}

/* ─── Animated counter hook ─── */
function useCountUp(target: string, duration = 1200) {
  const [display, setDisplay] = useState('');
  const started = useRef(false);

  const start = useCallback(() => {
    if (started.current) return;
    started.current = true;

    // Extract numeric part
    const prefix = target.replace(/[0-9.,]+.*$/, '');
    const suffix = target.replace(/^[^0-9]*[0-9.,]+/, '');
    const numStr = target.replace(/[^0-9.]/g, '');
    const end = parseFloat(numStr);
    const hasDecimal = numStr.includes('.');
    const decimals = hasDecimal ? numStr.split('.')[1].length : 0;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = end * eased;

      if (hasDecimal) {
        setDisplay(`${prefix}${current.toFixed(decimals)}${suffix}`);
      } else {
        const formatted = Math.round(current).toLocaleString();
        setDisplay(`${prefix}${formatted}${suffix}`);
      }

      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);

  return { display: display || target, start };
}

/* ─── Metric card data (exact match to reference screenshot) ─── */
const metrics = [
  { icon: TrendingUp, value: '+18.5%', label: 'Projected Profit Uplift' },
  { icon: BarChart3, value: '2.4M', label: 'High-Demand Searches' },
  { icon: Briefcase, value: '$12.8M', label: 'Recommended Investment' },
  { icon: ShieldCheck, value: '92%', label: 'Demand Confidence' },
];

const DESTINATIONS = [
  'All Destinations',
  'Lisbon, Portugal',
  'Algarve, Portugal',
  'Dubai, UAE',
  'Tokyo, Japan',
  'Paris, France'
];

const HORIZONS = [
  'Next 3 Months',
  'Q1 2027',
  'Q2 2027',
  'Next 6 Months'
];

export const OverviewHero: React.FC<OverviewHeroProps> = ({ 
  onFindOpportunities, 
  onRunStrategy 
}) => {
  const [heroVisible, setHeroVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  // Search Bar Dropdown states
  const [activeDropdown, setActiveDropdown] = useState<'flights' | 'hotels' | 'destination' | 'dates' | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<string>('All Destinations');
  const [selectedHorizon, setSelectedHorizon] = useState<string>('Next 3 Months');
  const searchBarRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchBarRef.current && !searchBarRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Animated counters for each metric
  const counters = [
    useCountUp('+18.5%', 1400),
    useCountUp('2.4M', 1200),
    useCountUp('$12.8M', 1300),
    useCountUp('92%', 1100),
  ];

  useEffect(() => {
    // Trigger entrance animations
    const timer = setTimeout(() => {
      setHeroVisible(true);
      // Start counters with stagger
      counters.forEach((c, i) => setTimeout(() => c.start(), 600 + i * 150));
    }, 100);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => {
    if (onRunStrategy) {
      onRunStrategy();
    } else if (onFindOpportunities) {
      onFindOpportunities();
    }
  };

  return (
    <div 
      ref={heroRef} 
      className="relative min-h-screen w-full flex flex-col justify-between items-center text-white select-none font-sans px-4 sm:px-8 md:px-12 pt-28 sm:pt-32 pb-8 sm:pb-12"
    >
      
      {/* Background Image with Cinematic Grading */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src="/overview-hero-bg.jpg"
          alt="TBO Luxury Coastal Villa at Dusk"
          className={`w-full h-full object-cover object-center filter brightness-[0.88] contrast-[1.04] transition-transform duration-[2.2s] ease-out ${
            heroVisible ? 'scale-100' : 'scale-105'
          }`}
          loading="eager"
        />
        {/* Subtle Vignette Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/15 to-black/60 pointer-events-none" />
      </div>

      {/* ─── Center Hero Content (Full Width) ─── */}
      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col items-center text-center mt-6 sm:mt-10">
        
        {/* Headline — Balanced Editorial Staggered Layout (Matching Reference Image) */}
        <h1 
          className={`w-full max-w-[880px] mx-auto text-4xl sm:text-5xl md:text-[56px] lg:text-[64px] font-bold tracking-tight text-white mb-4 leading-[1.12] drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)] transition-all duration-700 ease-spring ${
            heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <span className="block text-left pl-2 sm:pl-8 md:pl-12 lg:pl-16">
            Smarter Procurement.
          </span>
          <span className="block text-right pr-2 sm:pr-8 md:pr-12 lg:pr-16 mt-1.5 sm:mt-2 text-white/95">
            Higher Returns.
          </span>
        </h1>

        {/* Subtitle */}
        <p 
          className={`text-sm sm:text-base md:text-[17px] text-gray-100/95 font-normal sm:font-medium max-w-2xl mx-auto mb-7 sm:mb-9 leading-relaxed text-center drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)] transition-all duration-700 delay-150 ease-spring ${
            heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          Discover high-opportunity travel inventory and optimize your investment strategy.
        </p>

        {/* ─── Frosted Glass Consumer Search Bar (Exact Replica of Reference Image) ─── */}
        <div 
          ref={searchBarRef}
          className={`relative z-30 w-full max-w-3xl mx-auto bg-black/40 hover:bg-black/50 backdrop-blur-2xl border border-white/15 rounded-2xl sm:rounded-full p-2 sm:p-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.55)] transition-all duration-700 delay-300 ease-spring ${
            heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-1 text-xs sm:text-sm">
            
            {/* 1. Flights */}
            <div className="relative w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setActiveDropdown(prev => prev === 'flights' ? null : 'flights')}
                className="w-full sm:w-auto flex items-center justify-center sm:justify-start gap-2 px-3.5 py-2 rounded-xl sm:rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <Plane className="w-4 h-4 text-white/70 shrink-0" />
                <span className="font-medium">Flights</span>
                <ChevronDown className="w-3.5 h-3.5 text-white/50 shrink-0 ml-0.5" />
              </button>

              {activeDropdown === 'flights' && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-slate-900/95 backdrop-blur-xl border border-white/15 rounded-xl shadow-2xl p-2 z-50 text-left animate-in fade-in zoom-in-95 duration-150">
                  <div className="text-[11px] font-semibold text-white/40 uppercase tracking-wider px-2 py-1">Asset Class</div>
                  <div className="px-2 py-1.5 text-xs text-white/90 font-medium rounded-lg bg-white/10 flex items-center justify-between">
                    <span>Flights (Coming Soon)</span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded">v2.0</span>
                  </div>
                </div>
              )}
            </div>

            {/* Subtle Divider */}
            <div className="hidden sm:block w-[1px] h-5 bg-white/15" />

            {/* 2. Hotels */}
            <div className="relative w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setActiveDropdown(prev => prev === 'hotels' ? null : 'hotels')}
                className="w-full sm:w-auto flex items-center justify-center sm:justify-start gap-2 px-3.5 py-2 rounded-xl sm:rounded-full text-white font-semibold hover:bg-white/10 transition-colors cursor-pointer"
              >
                <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Hotels</span>
                <ChevronDown className="w-3.5 h-3.5 text-white/50 shrink-0 ml-0.5" />
              </button>

              {activeDropdown === 'hotels' && (
                <div className="absolute top-full left-0 mt-2 w-52 bg-slate-900/95 backdrop-blur-xl border border-white/15 rounded-xl shadow-2xl p-2 z-50 text-left animate-in fade-in zoom-in-95 duration-150">
                  <div className="text-[11px] font-semibold text-white/40 uppercase tracking-wider px-2 py-1">Hotel Category</div>
                  {['All Hotels', 'Luxury Resorts', 'City Business', 'Boutique Stays'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setActiveDropdown(null)}
                      className="w-full text-left px-2.5 py-1.5 text-xs text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Subtle Divider */}
            <div className="hidden sm:block w-[1px] h-5 bg-white/15" />

            {/* 3. All Destinations */}
            <div className="relative w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setActiveDropdown(prev => prev === 'destination' ? null : 'destination')}
                className="w-full sm:w-auto flex items-center justify-center sm:justify-start gap-2 px-3.5 py-2 rounded-xl sm:rounded-full text-white/90 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <MapPin className="w-4 h-4 text-white/70 shrink-0" />
                <span className="font-medium truncate max-w-[130px]">{selectedDestination}</span>
                <ChevronDown className="w-3.5 h-3.5 text-white/50 shrink-0 ml-0.5" />
              </button>

              {activeDropdown === 'destination' && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-slate-900/95 backdrop-blur-xl border border-white/15 rounded-xl shadow-2xl p-2 z-50 text-left animate-in fade-in zoom-in-95 duration-150">
                  <div className="text-[11px] font-semibold text-white/40 uppercase tracking-wider px-2 py-1">Select Market</div>
                  {DESTINATIONS.map((dest) => (
                    <button
                      key={dest}
                      type="button"
                      onClick={() => {
                        setSelectedDestination(dest);
                        setActiveDropdown(null);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg transition-colors flex items-center justify-between cursor-pointer ${
                        selectedDestination === dest ? 'bg-white/15 text-white font-medium' : 'text-white/80 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <span className="truncate">{dest}</span>
                      {selectedDestination === dest && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Subtle Divider */}
            <div className="hidden sm:block w-[1px] h-5 bg-white/15" />

            {/* 4. Next 3 Months */}
            <div className="relative w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setActiveDropdown(prev => prev === 'dates' ? null : 'dates')}
                className="w-full sm:w-auto flex items-center justify-center sm:justify-start gap-2 px-3.5 py-2 rounded-xl sm:rounded-full text-white/90 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <Calendar className="w-4 h-4 text-white/70 shrink-0" />
                <span className="font-medium">{selectedHorizon}</span>
                <ChevronDown className="w-3.5 h-3.5 text-white/50 shrink-0 ml-0.5" />
              </button>

              {activeDropdown === 'dates' && (
                <div className="absolute top-full right-0 sm:left-0 mt-2 w-52 bg-slate-900/95 backdrop-blur-xl border border-white/15 rounded-xl shadow-2xl p-2 z-50 text-left animate-in fade-in zoom-in-95 duration-150">
                  <div className="text-[11px] font-semibold text-white/40 uppercase tracking-wider px-2 py-1">Target Horizon</div>
                  {HORIZONS.map((hor) => (
                    <button
                      key={hor}
                      type="button"
                      onClick={() => {
                        setSelectedHorizon(hor);
                        setActiveDropdown(null);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg transition-colors flex items-center justify-between cursor-pointer ${
                        selectedHorizon === hor ? 'bg-white/15 text-white font-medium' : 'text-white/80 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <span>{hor}</span>
                      {selectedHorizon === hor && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 5. Primary Action Button: "Find Opportunities" */}
            <button
              type="button"
              onClick={handleSearch}
              className="w-full sm:w-auto bg-white hover:bg-gray-100 text-gray-950 font-semibold px-6 py-2.5 rounded-xl sm:rounded-full shadow-lg transition-all duration-200 hover:scale-[1.03] active:scale-95 shrink-0 text-xs sm:text-sm cursor-pointer"
            >
              Find Opportunities
            </button>

          </div>
        </div>

        {/* Sub-label: Global Travel Market • Live Insights */}
        <div 
          className={`flex items-center justify-center gap-2 mt-4 text-[12px] text-gray-200/90 font-medium drop-shadow-[0_1px_6px_rgba(0,0,0,0.7)] transition-all duration-700 delay-400 ease-spring ${
            heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Global Travel Market • Live Insights</span>
        </div>

      </div>

      {/* ─── Bottom Metric Cards (Full Width Grid matching Reference Image) ─── */}
      <div 
        className={`relative z-10 w-full max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-5 mt-10 transition-all duration-700 delay-500 ease-spring ${
          heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >
        {metrics.map((m, idx) => (
          <div
            key={m.label}
            className="bg-black/45 hover:bg-black/55 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 sm:p-5 text-left transition-all duration-300 hover:border-white/20 hover:-translate-y-0.5 shadow-[0_12px_30px_rgba(0,0,0,0.45)] group"
          >
            {/* Top row: Icon */}
            <div className="mb-3">
              <m.icon className="w-4 h-4 text-white/70 group-hover:text-emerald-400 transition-colors" />
            </div>

            {/* Middle: Big Metric Value */}
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono tabular-nums mb-1">
              {counters[idx].display}
            </div>

            {/* Bottom: Label */}
            <div className="text-[11.5px] sm:text-xs text-gray-300/80 font-medium truncate">
              {m.label}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default OverviewHero;