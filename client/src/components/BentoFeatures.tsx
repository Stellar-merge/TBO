import { useState } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

export const BentoFeatures: React.FC = () => {
  const [activeTabPill, setActiveTabPill] = useState('P10-P90 Quantiles');

  const pills = [
    'P10-P90 Quantiles',
    'L2B Search Velocity',
    'Unconstrained Demand',
    'Newsvendor Q*',
    'SHAP Reason Cards',
  ];

  return (
    <section className="w-full bg-[#f8fafc] text-slate-900 py-24 px-6 md:px-12">
      <div className="max-w-6xl mx-auto">
        
        {/* Section Headline */}
        <div className="text-left mb-12">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            Intelligent Procurement Capabilities
          </span>
          <h2 className="font-editorial text-4xl sm:text-5xl md:text-6xl font-normal tracking-tight text-slate-900 mt-4">
            Better procurement. Guaranteed availability.
          </h2>
          <p className="text-slate-500 text-sm sm:text-base max-w-2xl mt-3">
            Transform high-velocity travel searches, volatile cancellations, and wholesale contracting terms 
            into actionable, risk-adjusted inventory investments.
          </p>
        </div>

        {/* Bento Grid Layout (Matching Video 00:03 - 00:07) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Card 1: Top Hero Bento (Span 12) - Smarter Pre-Buys with Quantile AI */}
          <div className="md:col-span-12 bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-8 overflow-hidden">
            
            {/* Left Column: Description & Pills */}
            <div className="flex-1 max-w-xl">
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-3">
                Smarter Sourcing With Quantile AI
              </h3>
              <p className="text-slate-500 text-sm sm:text-base leading-relaxed mb-6">
                Size procurement batches effortlessly using LightGBM Quantile Regressors (P10, P50, P90) 
                and Newsvendor critical fractiles. Never over-commit on perishable room nights.
              </p>

              {/* Feature Pills (Matching Video 00:03) */}
              <div className="flex flex-wrap gap-2 mb-6">
                {pills.map((pill) => (
                  <button
                    key={pill}
                    onClick={() => setActiveTabPill(pill)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                      activeTabPill === pill
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {pill}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-blue-600 cursor-pointer hover:underline">
                <span>Inspect model Pinball Loss equations</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Right Column: Visual AI Plan Container */}
            <div className="w-full lg:w-[420px] bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 text-white p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  SHAP Reason Attribution
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-900/50 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  +38% Confidence
                </span>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/15 p-3 rounded-xl mb-4 text-xs">
                <p className="font-semibold text-white">All sorted! 35 rooms allocated for Taj Exotica.</p>
                <p className="text-[10px] text-slate-300 mt-0.5">
                  Search velocity spiked 4.2x during Dec 28–Jan 2 holiday window.
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg">
                  <span className="text-slate-300 text-[11px]">Diwali & NYE Search Momentum</span>
                  <span className="text-cyan-300 font-bold">+38%</span>
                </div>
                <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg">
                  <span className="text-slate-300 text-[11px]">Wholesale Pre-Buy Discount</span>
                  <span className="text-emerald-400 font-bold">+26%</span>
                </div>
                <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg">
                  <span className="text-slate-300 text-[11px]">Lead-time Cancellation Friction</span>
                  <span className="text-rose-400 font-bold">-9%</span>
                </div>
              </div>
            </div>

          </div>

          {/* Card 2: Bottom-Left Bento - Clear Performance Insights */}
          <div className="md:col-span-6 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm flex flex-col justify-between">
            <div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 mb-6">
                <div className="flex justify-between items-center text-xs mb-2">
                  <span className="font-bold text-slate-800">Productivity & Booking Pace</span>
                  <span className="text-[10px] text-blue-600 font-bold">Daily pacing: Aug 02 - Aug 08</span>
                </div>

                <div className="h-28 w-full relative flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 350 90" preserveAspectRatio="none">
                    <path
                      d="M 10 75 Q 80 65, 160 50 T 250 25 T 340 15"
                      fill="none"
                      stroke="#0284c7"
                      strokeWidth="2.5"
                    />
                    <circle cx="250" cy="25" r="4.5" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
                  </svg>
                  <div className="absolute top-1 right-12 bg-slate-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-md">
                    Day 16: 35 rooms sold
                  </div>
                </div>
              </div>

              <h4 className="text-xl font-bold text-slate-900 mb-2">
                Clear Performance Insights
              </h4>
              <p className="text-slate-500 text-sm leading-relaxed">
                Track room inventory sell-through effectively, monitor booking pace against P10–P90 cones, 
                and turn real-time market data into timely clearance actions.
              </p>
            </div>
          </div>

          {/* Card 3: Bottom-Right Bento - Seamless Supplier Contracting */}
          <div className="md:col-span-6 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm flex flex-col justify-between">
            <div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 mb-6 space-y-2.5">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-bold text-slate-800">Contracted Wholesalers</span>
                  <span className="text-[10px] text-slate-400">5 active tiers</span>
                </div>

                {[
                  { name: 'Taj Hospitality Group', tier: 'Tier-1 Guaranteed', rooms: '75 rooms' },
                  { name: 'Kerzner International (Dubai)', tier: 'Wholesale Bulk', rooms: '30 rooms' },
                  { name: 'Marriott Bonvoy Partner', tier: 'Direct Extranet API', rooms: '50 rooms' },
                ].map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200/80 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px]">
                        {s.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{s.name}</p>
                        <p className="text-[10px] text-slate-400">{s.tier}</p>
                      </div>
                    </div>
                    <span className="font-bold text-emerald-600 text-[11px]">{s.rooms}</span>
                  </div>
                ))}
              </div>

              <h4 className="text-xl font-bold text-slate-900 mb-2">
                Seamless Supplier Contracting
              </h4>
              <p className="text-slate-500 text-sm leading-relaxed">
                Keep wholesale suppliers, contracting tiers, and minimum guarantee batches aligned 
                in one unified, automated decision-support engine.
              </p>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
