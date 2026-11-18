import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Plane, 
  Building2, 
  MapPin, 
  Calendar, 
  ChevronDown, 
  TrendingUp, 
  BarChart3, 
  Briefcase, 
  ShieldCheck 
} from 'lucide-react';

interface OverviewHeroProps {
  onFindOpportunities: () => void;
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

/* ─── Metric card data ─── */
const metrics = [
  { icon: TrendingUp, value: '+18.5%', label: 'Projected Profit Uplift' },
  { icon: BarChart3, value: '2.4M', label: 'High-Demand Searches' },
  { icon: Briefcase, value: '$12.8M', label: 'Recommended Investment' },
  { icon: ShieldCheck, value: '92%', label: 'Demand Confidence' },
];

export const OverviewHero: React.FC<OverviewHeroProps> = ({ onFindOpportunities }) => {
  const [selectedFlight, setSelectedFlight] = useState('Flights');
  const [selectedHotel, setSelectedHotel] = useState('Hotels');
  const [selectedDestination, setSelectedDestination] = useState('All Destinations');
  const [selectedPeriod, setSelectedPeriod] = useState('Next 3 Months');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [heroVisible, setHeroVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (activeDropdown && heroRef.current && !heroRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdown]);

  // Close dropdown on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveDropdown(null);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  const toggleDropdown = (name: string) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  const dropdownItems: Record<string, { options: string[]; setter: (v: string) => void }> = {
    flights: {
      options: ['Direct Wholesale', 'Charter Allotments', 'Round-trip Packages'],
      setter: setSelectedFlight,
    },
    hotels: {
      options: ['5-Star Luxury Resorts', 'City Business Hotels', 'Boutique Villas', 'All Hotel Tiers'],
      setter: setSelectedHotel,
    },
    destinations: {
      options: ['All Destinations', 'Dubai & UAE', 'Goa, India', 'Swiss Alps', 'Bali, Indonesia', 'Phuket, Thailand'],
      setter: setSelectedDestination,
    },
    period: {
      options: ['Next 30 Days', 'Next 3 Months', '3–6 Months', 'Holiday Season Peak'],
      setter: setSelectedPeriod,
    },
  };

  const searchSegments = [
    { key: 'flights', icon: Plane, value: selectedFlight, border: true },
    { key: 'hotels', icon: Building2, value: selectedHotel, border: true },
    { key: 'destinations', icon: MapPin, value: selectedDestination, border: true },
    { key: 'period', icon: Calendar, value: selectedPeriod, border: false },
  ];

  return (
    <div ref={heroRef} className="relative min-h-screen w-full flex flex-col justify-between items-center text-white select-none font-sans px-4 sm:px-6 md:px-8 pt-24 sm:pt-28 md:pt-32 pb-8 sm:pb-12">
      
      {/* Background Image */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src="/overview-hero-bg.jpg"
          alt="TBO Luxury Coastal Villa at Dusk"
          className={`w-full h-full object-cover object-center filter brightness-[0.85] contrast-[1.04] transition-transform duration-[2s] ease-out ${
            heroVisible ? 'scale-100' : 'scale-105'
          }`}
          loading="eager"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/15 to-black/55 pointer-events-none" />
      </div>

      {/* Center Hero Content */}
      <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center text-center mt-[2cm]">
        
        {/* Headline — balanced editorial staggered layout with symmetric optical anchoring */}
        <h1 
          className={`w-full max-w-[860px] mx-auto text-4xl sm:text-5xl md:text-[54px] lg:text-[62px] font-bold tracking-tight text-white mb-4 leading-[1.1] drop-shadow-[0_4px_20px_rgba(0,0,0,0.85)] transition-all duration-700 ease-spring ${
            heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <span className="block text-left pl-3 sm:pl-8 md:pl-12 lg:pl-14">
            Smarter Procurement.
          </span>
          <span className="block text-right pr-3 sm:pr-8 md:pr-12 lg:pr-14 mt-1.5 sm:mt-2 text-white/95">
            Higher Returns.
          </span>
        </h1>

        {/* Subtitle — restored font size with optical center alignment */}
        <p 
          className={`text-sm sm:text-base md:text-[17px] text-gray-100/95 font-normal sm:font-medium max-w-2xl mx-auto mb-8 leading-relaxed text-center drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)] transition-all duration-700 delay-150 ease-spring ${
            heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          Discover high-opportunity travel inventory and optimize your investment strategy.
        </p>

        {/* Search Bar */}
        <div 
          className={`w-full max-w-[800px] glass-dark rounded-xl p-1.5 flex flex-col sm:flex-row items-stretch sm:items-center shadow-glass relative transition-all duration-700 delay-300 ease-spring ${
            heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {searchSegments.map((seg) => (
            <div key={seg.key} className="relative flex-1">
              <button
                type="button"
                onClick={() => toggleDropdown(seg.key)}
                aria-expanded={activeDropdown === seg.key}
                aria-haspopup="listbox"
                className={`w-full h-full px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs font-medium text-gray-200 hover:text-white transition-all duration-200 rounded-lg hover:bg-white/[0.06] ${
                  seg.border ? 'sm:border-r sm:border-white/10' : ''
                } ${activeDropdown === seg.key ? 'bg-white/[0.08] text-white' : ''}`}
              >
                <div className="flex items-center gap-2 truncate">
                  <seg.icon className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                  <span className="truncate">{seg.value}</span>
                </div>
                <ChevronDown className={`w-3 h-3 text-gray-400 shrink-0 transition-transform duration-200 ${
                  activeDropdown === seg.key ? 'rotate-180' : ''
                }`} />
              </button>

              {/* Dropdown with animated entrance */}
              {activeDropdown === seg.key && (
                <div 
                  role="listbox"
                  className="absolute left-0 top-full mt-2 w-48 bg-gray-950/95 backdrop-blur-xl border border-white/15 rounded-xl shadow-elevation-4 p-1.5 z-30 text-left text-xs animate-scale-in origin-top"
                >
                  {dropdownItems[seg.key].options.map((opt) => (
                    <button
                      key={opt}
                      role="option"
                      aria-selected={seg.value === opt}
                      onClick={() => { dropdownItems[seg.key].setter(opt); setActiveDropdown(null); }}
                      className={`w-full px-3 py-2 rounded-lg text-left transition-all duration-150 ${
                        seg.value === opt 
                          ? 'text-white bg-white/10 font-medium' 
                          : 'text-gray-300 hover:text-white hover:bg-white/[0.06]'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* CTA Button */}
          <div className="sm:pl-1 mt-1 sm:mt-0">
            <button
              type="button"
              onClick={onFindOpportunities}
              className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-gray-50 text-gray-950 font-semibold text-xs rounded-lg shadow-elevation-2 transition-all duration-200 active:scale-[0.97] hover:shadow-elevation-3 whitespace-nowrap"
            >
              Find Opportunities
            </button>
          </div>
        </div>

        {/* Sub-label */}
        <div 
          className={`flex items-center justify-center gap-1.5 mt-3.5 text-[11px] text-gray-200/90 font-medium drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)] transition-all duration-700 delay-400 ease-spring ${
            heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          <MapPin className="w-3 h-3 text-gray-300/80" />
          <span>Global Travel Market • Live Insights</span>
        </div>
      </div>

      {/* Bottom 4 Metric Cards — staggered entrance */}
      <div className="relative z-10 w-full max-w-[1020px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-12 sm:mt-16 md:mt-20">
        {metrics.map((metric, i) => {
          const Icon = metric.icon;
          return (
            <div 
              key={metric.label}
              className={`group glass-dark rounded-xl p-4 sm:p-5 flex flex-col justify-between text-left h-[115px] sm:h-[125px] shadow-glass transition-all duration-500 ease-spring cursor-default hover:border-white/25 hover:-translate-y-1 hover:shadow-elevation-4 ${
                heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: heroVisible ? `${500 + i * 120}ms` : '0ms' }}
            >
              <div>
                <Icon className="w-4 h-4 text-white/80 group-hover:text-white transition-colors duration-200" />
              </div>
              <div>
                <div className="text-2xl sm:text-[28px] font-bold text-white tracking-tight leading-none mb-1">
                  {counters[i].display}
                </div>
                <div className="text-[11px] text-gray-300/90 font-medium truncate">
                  {metric.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
