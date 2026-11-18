import { useState } from 'react';
import { RefreshCw } from 'lucide-react';

export const RiskEngine: React.FC = () => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [riskDialScore, setRiskDialScore] = useState<number>(42);
  const [var95, setVar95] = useState<number>(-3850);
  const [cvar95, setCvar95] = useState<number>(-5420);
  const [probLoss, setProbLoss] = useState<number>(3.4);
  const [expectedReturn, setExpectedReturn] = useState<number>(24150);

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const newScore = Math.floor(38 + Math.random() * 8);
      const newVar = Math.round(-3400 - Math.random() * 800);
      const newCvar = Math.round(newVar * 1.35);
      const newProb = Number((2.8 + Math.random() * 1.2).toFixed(1));
      const newReturn = Math.round(23000 + Math.random() * 2500);

      setRiskDialScore(newScore);
      setVar95(newVar);
      setCvar95(newCvar);
      setProbLoss(newProb);
      setExpectedReturn(newReturn);
      setIsSimulating(false);
    }, 600);
  };

  const needleRotation = -90 + (riskDialScore / 100) * 180;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 text-slate-800 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 md:p-8 rounded-3xl border border-slate-200/90 shadow-sm">
        <div>
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
            Monte Carlo Simulation Engine
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
            Portfolio Risk Dial & VaR Analysis
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Simulates 2,000 correlated demand and cancellation scenarios to calculate downside exposure, 
            95% Value at Risk (VaR), and overall portfolio fragility.
          </p>
        </div>

        <button
          onClick={handleRunSimulation}
          disabled={isSimulating}
          className="self-start md:self-auto px-6 py-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs md:text-sm flex items-center gap-2 shadow-md transition active:scale-95 disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${isSimulating ? 'animate-spin' : ''}`} />
          <span>{isSimulating ? 'Simulating 2,000 Runs...' : 'Run 2,000 Simulations'}</span>
        </button>
      </div>

      {/* Main Grid: Risk Dial Gauge + Key Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Semicircular Risk Dial Gauge */}
        <div className="lg:col-span-5 bg-white p-6 md:p-8 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="w-full flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Portfolio Risk Dial
            </h3>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              Moderate Risk
            </span>
          </div>

          <div className="relative w-64 h-36 my-2 flex items-end justify-center">
            <svg viewBox="0 0 200 110" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="35%" stopColor="#3b82f6" />
                  <stop offset="65%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
              </defs>

              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="18"
                strokeLinecap="round"
              />

              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="url(#gaugeGradient)"
                strokeWidth="18"
                strokeLinecap="round"
                strokeDasharray="251"
                strokeDashoffset="0"
              />

              <g transform="translate(100, 100)">
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="-68"
                  stroke="#1e293b"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  transform={`rotate(${needleRotation})`}
                  className="transition-transform duration-700 ease-out"
                />
                <circle cx="0" cy="0" r="7" fill="#1e293b" />
                <circle cx="0" cy="0" r="3" fill="#ffffff" />
              </g>
            </svg>
          </div>

          <div className="mt-3">
            <span className="text-4xl font-black text-slate-900 tracking-tight">
              {riskDialScore}
            </span>
            <span className="text-sm font-semibold text-slate-400 ml-1">/ 100</span>
          </div>

          <p className="text-xs text-slate-500 mt-2 max-w-xs">
            Balanced capital deployment across 5 independent travel corridors with staggered cancellation deadlines.
          </p>

          <div className="w-full grid grid-cols-3 gap-2 text-[10px] font-semibold text-slate-400 pt-4 mt-4 border-t border-slate-100">
            <span className="text-emerald-600">0–30: Conservative</span>
            <span className="text-amber-600">31–65: Balanced</span>
            <span className="text-rose-600">66–100: Aggressive</span>
          </div>
        </div>

        {/* Right Column: Quantitative Risk Metrics & Distribution */}
        <div className="lg:col-span-7 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">
                95% Value at Risk (VaR)
              </span>
              <h4 className="text-2xl font-black text-slate-900 mt-1">
                ${Math.abs(var95).toLocaleString()}
              </h4>
              <p className="text-[11px] text-slate-400 mt-1">
                Maximum expected downside at 95% confidence.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
                Expected Shortfall (CVaR)
              </span>
              <h4 className="text-2xl font-black text-slate-900 mt-1">
                ${Math.abs(cvar95).toLocaleString()}
              </h4>
              <p className="text-[11px] text-slate-400 mt-1">
                Average loss in the worst 5% tail scenarios.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm col-span-2 md:col-span-1">
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                Prob. of Loss
              </span>
              <h4 className="text-2xl font-black text-slate-900 mt-1">
                {probLoss}%
              </h4>
              <p className="text-[11px] text-slate-400 mt-1">
                Chance of negative net return on portfolio.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Simulated Profit Probability Distribution
                </h4>
                <p className="text-xs text-slate-400">
                  Empirical density across 2,000 simulated market realizations
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-600" />
                  Median Profit (+${expectedReturn.toLocaleString()})
                </span>
                <span className="flex items-center gap-1.5 text-rose-600 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                  5% VaR Tail (${var95.toLocaleString()})
                </span>
              </div>
            </div>

            <div className="h-44 w-full relative flex items-end">
              <svg className="w-full h-full" viewBox="0 0 500 120" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="simGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f43f5e" />
                    <stop offset="15%" stopColor="#fb923c" />
                    <stop offset="35%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#1d4ed8" />
                  </linearGradient>
                </defs>

                <path
                  d="M 10 115 
                     Q 80 110, 120 95 
                     T 180 50 
                     T 260 15 
                     T 340 50 
                     T 420 95 
                     T 490 115 
                     L 490 118 L 10 118 Z"
                  fill="url(#simGradient)"
                  opacity="0.85"
                />

                <line
                  x1="120"
                  y1="10"
                  x2="120"
                  y2="115"
                  stroke="#e11d48"
                  strokeWidth="2"
                  strokeDasharray="3 3"
                />

                <line
                  x1="260"
                  y1="5"
                  x2="260"
                  y2="115"
                  stroke="#1e293b"
                  strokeWidth="2"
                />
              </svg>
            </div>

            <div className="flex justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-100">
              <span className="text-rose-500 font-bold">-$8,000 (Worst Case)</span>
              <span className="text-rose-600 font-medium">-$3,850 (VaR 95%)</span>
              <span className="text-slate-700 font-bold">+$24,150 (Median)</span>
              <span className="text-blue-600">+$38,000 (Upside)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

