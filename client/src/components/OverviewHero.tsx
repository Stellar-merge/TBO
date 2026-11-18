import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  TrendingUp, 
  BarChart3, 
  Briefcase, 
  ShieldCheck
} from 'lucide-react';
import { StrategyInputPanel } from './StrategyInputPanel';
import type { AllocationStrategyConstraints } from './StrategyInputPanel';

export type { AllocationStrategyConstraints };

interface OverviewHeroProps {
  onFindOpportunities?: (constraints?: AllocationStrategyConstraints) => void;
  onRunStrategy?: (constraints: AllocationStrategyConstraints) => void;
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

export const OverviewHero: React.FC<OverviewHeroProps> = ({ 
  onFindOpportunities, 
  onRunStrategy 
}) => {
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

  const handleStrategySubmit = (constraints: AllocationStrategyConstraints) => {
    if (onRunStrategy) {
      onRunStrategy(constraints);
    } else if (onFindOpportunities) {
      onFindOpportunities(constraints);
    }
  };

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
      <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center text-center mt-[1.5cm] sm:mt-[2cm]">
        
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

        {/* Subtitle */}
        <p 
          className={`text-sm sm:text-base md:text-[17px] text-gray-100/95 font-normal sm:font-medium max-w-2xl mx-auto mb-6 sm:mb-8 leading-relaxed text-center drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)] transition-all duration-700 delay-150 ease-spring ${
            heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          Set institutional procurement constraints and optimize capital allocation across wholesale hotel inventory.
        </p>

        {/* B2B "Strategy Input" Panel (Refactored from consumer search bar) */}
        <div 
          className={`w-full transition-all duration-700 delay-300 ease-spring ${
            heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <StrategyInputPanel onSubmit={handleStrategySubmit} />
        </div>

        {/* Sub-label */}
        <div 
          className={`flex items-center justify-center gap-2 mt-3.5 text-[11px] text-gray-200/90 font-medium drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)] transition-all duration-700 delay-400 ease-spring ${
            heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>MILP Budget Optimization & Newsvendor Critical Fractile Model</span>
        </div>
      </div>

      {/* Bottom Metric Cards */}
      <div 
        className={`relative z-10 w-full max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-8 transition-all duration-700 delay-500 ease-spring ${
          heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >
        {metrics.map((m, idx) => (
          <div
            key={m.label}
            className="glass-dark rounded-xl p-3.5 sm:p-4 text-left transition-all duration-300 hover:bg-white/[0.12] hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] sm:text-xs text-gray-300/90 font-medium truncate">
                {m.label}
              </span>
              <m.icon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            </div>
            <div className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono tabular-nums">
              {counters[idx].display}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
