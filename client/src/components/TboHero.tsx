import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';

interface TboHeroProps {
  onStartRun: () => void;
  onExplore: () => void;
}

export const TboHero: React.FC<TboHeroProps> = ({ onStartRun, onExplore }) => {
  const [activeTooltip, setActiveTooltip] = useState<number | null>(4);

  return (
    <section className="relative w-full bg-[#0b0f19] text-white pt-24 pb-20 px-6 md:px-12 overflow-hidden flex flex-col items-center">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-blue-600/15 via-cyan-500/10 to-transparent rounded-full blur-[120px] pointer-events-none" />

      {/* Main Hero Header */}
      <div className="max-w-4xl text-center z-10 mb-12">
        <h1 className="font-editorial text-4xl sm:text-6xl md:text-7xl lg:text-[76px] font-normal tracking-tight text-white leading-[1.08] mb-6">
          Great procurement starts <br className="hidden sm:block" />
          <span className="italic font-normal">with a clearer picture.</span>
        </h1>
        
        <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-400 font-normal leading-relaxed mb-8">
          Bring unconstrained search velocity, supplier contracts, and quantile demand together — 
          TBO Optima turns volatile travel demand into guaranteed, high-margin bookable inventory.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={onStartRun}
            className="px-8 py-3.5 rounded-full bg-white hover:bg-slate-100 text-slate-950 font-semibold text-sm transition-all duration-200 shadow-lg hover:shadow-cyan-500/10 active:scale-95 flex items-center gap-2"
          >
            <span>Start optimization run</span>
            <ArrowRight className="w-4 h-4 text-slate-900" />
          </button>
          
          <button
            onClick={onExplore}
            className="px-8 py-3.5 rounded-full bg-white/5 hover:bg-white/10 text-white font-medium text-sm border border-white/15 transition-all duration-200 backdrop-blur-sm active:scale-95"
          >
            See how it works
          </button>
        </div>
      </div>

      {/* 3D Laptop Device Mockup on Pedestal Stand */}
      <div className="relative w-full max-w-5xl z-10 mt-2 flex flex-col items-center">
        
        <div className="relative w-full max-w-4xl bg-slate-950 rounded-t-[28px] border-4 border-slate-700/80 p-3 sm:p-4 shadow-2xl shadow-cyan-900/20">
          <div className="flex items-center justify-center pb-2.5">
            <div className="w-2 h-2 rounded-full bg-slate-700/80 border border-slate-600" />
          </div>

          <div className="bg-[#f8fafc] text-slate-800 rounded-2xl p-4 sm:p-6 shadow-inner overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                  T
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                    Inventory Performance Overview
                  </h3>
                  <p className="text-[10px] text-slate-400">Live corridor: Middle East & South Asia</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-[10px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  MILP Optimal
                </span>
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                  Budget: $100K Cap
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-8 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Booking Pacing Trend</h4>
                    <p className="text-[10px] text-slate-400">Actual daily pacing vs P50 baseline</p>
                  </div>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    Ahead of pace (+24%)
                  </span>
                </div>

                <div className="h-32 sm:h-36 w-full relative">
                  <svg className="w-full h-full" viewBox="0 0 500 130" preserveAspectRatio="none">
                    <line x1="20" y1="20" x2="480" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="20" y1="60" x2="480" y2="60" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="20" y1="100" x2="480" y2="100" stroke="#f1f5f9" strokeWidth="1" />

                    <path
                      d="M 30 110 Q 150 90, 260 70 T 470 30"
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />

                    <path
                      d="M 30 110 Q 120 100, 220 75 T 350 45 T 470 25"
                      fill="none"
                      stroke="#0f172a"
                      strokeWidth="2.5"
                    />

                    {[
                      { x: 30, y: 110 },
                      { x: 140, y: 95 },
                      { x: 250, y: 70 },
                      { x: 350, y: 45 },
                      { x: 470, y: 25 },
                    ].map((pt, idx) => (
                      <g key={idx} onClick={() => setActiveTooltip(idx)} className="cursor-pointer">
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={activeTooltip === idx ? 5 : 3.5}
                          fill={activeTooltip === idx ? '#0ea5e9' : '#0f172a'}
                          stroke="#ffffff"
                          strokeWidth="2"
                        />
                      </g>
                    ))}
                  </svg>

                  {activeTooltip !== null && (
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-3 py-1.5 rounded-xl shadow-lg border border-slate-700 text-[11px] flex items-center gap-2">
                      <span className="font-bold text-cyan-300">Oct 28: 42 rooms</span>
                      <span className="text-slate-400">|</span>
                      <span className="text-emerald-400 font-semibold">+28.8% ROI</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between text-[9px] font-mono text-slate-400 pt-2 border-t border-slate-100">
                  <span>T-60d</span>
                  <span>T-45d</span>
                  <span>T-30d</span>
                  <span className="text-blue-600 font-bold">T-16d (Today)</span>
                  <span>T-0d (Check-in)</span>
                </div>
              </div>

              <div className="md:col-span-4 bg-[#0f172a] text-white p-4 sm:p-5 rounded-2xl flex flex-col justify-between shadow-md">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Expected Return
                    </span>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      ▲ +28.8%
                    </span>
                  </div>

                  <h4 className="text-2xl font-black text-white tracking-tight mt-1.5">
                    $24,350.00
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Net risk-adjusted profit under hard budget cap
                  </p>
                </div>

                <div className="space-y-2 mt-4 pt-3 border-t border-slate-800">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 text-[11px]">Allocated Capital:</span>
                    <span className="font-bold text-slate-200">$84,200</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 text-[11px]">Committed Rooms:</span>
                    <span className="font-bold text-cyan-400">450 rooms</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 text-[11px]">Monte Carlo VaR 95%:</span>
                    <span className="font-bold text-rose-400">-$3,850</span>
                  </div>
                </div>
              </div>

            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/80">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-2">
                <span>Recent Pre-Buy Allocations</span>
                <span className="text-blue-600 font-semibold cursor-pointer">View all 14 deals →</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { name: 'Taj Exotica Resort, Goa', dates: 'Dec 28 - Jan 2', qty: '35 rms', cost: '$85', margin: '+$60/rm' },
                  { name: 'Atlantis The Palm, Dubai', dates: 'Nov 20 - Nov 26', qty: '30 rms', cost: '$160', margin: '+$90/rm' },
                  { name: 'The Ritz, London', dates: 'Dec 15 - Dec 22', qty: '20 rms', cost: '$210', margin: '+$120/rm' },
                ].map((deal, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-left">
                    <p className="text-xs font-bold text-slate-900 truncate">{deal.name}</p>
                    <p className="text-[10px] text-slate-400">{deal.dates}</p>
                    <div className="flex items-center justify-between mt-1 text-[11px]">
                      <span className="font-semibold text-slate-700">{deal.qty}</span>
                      <span className="font-bold text-emerald-600">{deal.margin}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        <div className="w-[85%] h-3 bg-slate-800 rounded-b-xl border-t border-slate-700 shadow-xl" />
        <div className="w-36 h-2 bg-slate-900 rounded-b-lg border-t border-slate-800" />
      </div>

      <div className="w-full max-w-4xl mt-16 pt-8 border-t border-white/10 flex flex-col items-center text-center">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-6">
          Empowering inventory sourcing for leading travel distributors
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14 opacity-50 grayscale hover:grayscale-0 transition-all duration-300 text-xs font-black tracking-widest text-slate-400">
          <span>HOTELBEDS</span>
          <span>AMADEUS</span>
          <span>EXPEDIA PARTNER</span>
          <span>RATEGAIN</span>
          <span>SABRE GDS</span>
        </div>
      </div>

    </section>
  );
};
