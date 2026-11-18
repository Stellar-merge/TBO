import { Database, Cpu, TrendingUp, ArrowRight } from 'lucide-react';

export const ThreeStepWorkflow: React.FC = () => {
  const steps = [
    {
      step: 'Step 1',
      title: 'Ingest Market Signals',
      description: 'Stream unconstrained search velocity, GDS booking logs, competitor spot pricing, and holiday calendars directly into the Feature Store.',
      icon: Database,
      badge: 'Data Layer',
      mockup: (
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-slate-700 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Search Velocity Feed (14:1 L2B)</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700 font-semibold">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Supplier Wholesale Rates (Tier-1)</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700 font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Holiday & Festival Calendar Signals</span>
          </div>
        </div>
      ),
    },
    {
      step: 'Step 2',
      title: 'Solve MILP Allocation',
      description: 'The engine evaluates P10/P50/P90 quantile demand, calculates Newsvendor critical fractiles, and solves the MILP under a strict budget cap.',
      icon: Cpu,
      badge: 'Optimization Core',
      mockup: (
        <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Budget Constraint:</span>
            <span className="font-bold text-white">$100,000 Cap</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Optimal Allocation:</span>
            <span className="font-bold text-cyan-300">450 Rooms</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Projected Margin:</span>
            <span className="font-bold text-emerald-400">+$24,350 (+28.8%)</span>
          </div>
        </div>
      ),
    },
    {
      step: 'Step 3',
      title: 'Monitor & Clear Inventory',
      description: 'Track cumulative booking pace in real time. Automated dynamic markdowns liquidate lagging inventory before supplier penalty deadlines.',
      icon: TrendingUp,
      badge: 'Operations & Feedback',
      mockup: (
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
          <div className="flex justify-between font-bold text-slate-800">
            <span>Pacing Health:</span>
            <span className="text-emerald-600">On Track (+14%)</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div className="bg-blue-600 h-full w-[77%]" />
          </div>
          <p className="text-[10px] text-slate-400">27 / 35 rooms sold • T-16 days to check-in</p>
        </div>
      ),
    },
  ];

  return (
    <section className="w-full bg-white text-slate-900 py-24 px-6 md:px-12 border-t border-slate-200/60">
      <div className="max-w-6xl mx-auto flex flex-col items-center text-center">
        
        {/* Section Heading in Editorial Serif */}
        <h2 className="font-editorial text-4xl sm:text-5xl md:text-6xl font-normal tracking-tight text-slate-900 max-w-3xl leading-[1.1] mb-5">
          From scattered search logs to one clear portfolio.
        </h2>
        
        <p className="text-slate-500 text-sm sm:text-base max-w-2xl leading-relaxed mb-16">
          A seamless 3-stage intelligence loop converting raw market signals into approved purchase orders 
          and closed-loop model retraining.
        </p>

        {/* 3 Step Cards Grid (Matching Video 00:08 - 00:11) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full text-left">
          {steps.map((st, idx) => (
            <div
              key={idx}
              className="bg-[#f8fafc] rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Step Mockup Area */}
                <div className="mb-6">{st.mockup}</div>

                {/* Step Number & Badge */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
                    {st.step}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                    {st.badge}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {st.title}
                </h3>

                {/* Description */}
                <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
                  {st.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer">
                <span>Learn how it operates</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
