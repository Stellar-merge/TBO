import { useState } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';

export const NoiseToPlanInteractive: React.FC = () => {
  const [sliderVal, setSliderVal] = useState<number>(0);

  const isClear = sliderVal >= 75;

  const handleToggleState = () => {
    setSliderVal((prev) => (prev > 50 ? 0 : 100));
  };

  const planBars = [
    { height: 65, color: '#38bdf8', label: 'Goa Taj' },
    { height: 85, color: '#3b82f6', label: 'Dubai Palm' },
    { height: 50, color: '#60a5fa', label: 'London Ritz' },
    { height: 75, color: '#10b981', label: 'Bali Ayana' },
    { height: 40, color: '#34d399', label: 'Sing. Sands' },
    { height: 90, color: '#0284c7', label: 'Goa HardRock' },
    { height: 70, color: '#0ea5e9', label: 'Maldives' },
    { height: 55, color: '#38bdf8', label: 'Phuket' },
    { height: 80, color: '#6366f1', label: 'Paris' },
    { height: 45, color: '#818cf8', label: 'Tokyo' },
    { height: 60, color: '#a855f7', label: 'Bangkok' },
    { height: 35, color: '#ec4899', label: 'New York' },
  ];

  const particles = Array.from({ length: 42 }).map((_, i) => {
    const angle = (i / 42) * Math.PI * 2;
    const baseRadius = 60 + (i % 7) * 22;
    const scatterX = Math.cos(angle) * baseRadius;
    const scatterY = Math.sin(angle) * (baseRadius * 0.55);
    
    const targetX = 140 + (i % 12) * 18;
    const targetY = 30 - ((i * 4) % 90);

    const currentX = scatterX + (targetX - scatterX) * (sliderVal / 100);
    const currentY = scatterY + (targetY - scatterY) * (sliderVal / 100);
    const currentOpacity = 0.35 + (sliderVal / 100) * 0.65;

    return {
      id: i,
      x: currentX,
      y: currentY,
      opacity: currentOpacity,
      color: i % 3 === 0 ? '#38bdf8' : i % 3 === 1 ? '#34d399' : '#818cf8',
    };
  });

  return (
    <section className="w-full bg-[#0b0f19] text-white py-20 px-6 md:px-12 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] bg-gradient-to-tr from-cyan-500/10 via-blue-600/10 to-transparent rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[450px] h-[400px] bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-full blur-[90px] pointer-events-none" />

      <div className="max-w-6xl mx-auto flex flex-col items-center text-center relative z-10">
        
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-cyan-300 font-medium mb-6">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Noise-to-Plan Optimization Engine</span>
        </div>

        <h2 className="font-editorial text-4xl md:text-6xl font-normal tracking-tight text-white max-w-3xl leading-[1.1] mb-5">
          Watch the noise turn into a plan.
        </h2>

        <p className="text-slate-400 text-sm md:text-base max-w-2xl leading-relaxed mb-12">
          Every search ping, cancellation notice, and spot rate arrives chaotically. Move through the noise — 
          TBO Optima resolves it into a deterministic, high-margin pre-buy portfolio.
        </p>

        <div className="w-full max-w-4xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-white/10 rounded-[32px] p-6 md:p-12 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          
          <div className="w-full h-64 md:h-72 relative flex items-center justify-center">
            
            <div className={`relative z-20 flex items-center justify-center w-14 h-14 rounded-full transition-all duration-500 ${
              isClear 
                ? 'bg-blue-600 shadow-[0_0_35px_rgba(37,99,235,0.7)]' 
                : 'bg-slate-800 border border-white/20 shadow-[0_0_20px_rgba(56,189,248,0.3)]'
            }`}>
              <Sparkles className="w-6 h-6 text-white" />
              
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full text-[11px] font-semibold text-cyan-200">
                {sliderVal < 50 ? 'Incoming: 2,480 search logs' : 'MILP Solved: 450 rooms'}
              </div>
            </div>

            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="-250 -130 500 260"
            >
              {particles.map((p) => (
                <circle
                  key={p.id}
                  cx={p.x}
                  cy={p.y}
                  r={sliderVal > 70 ? 2 : 2.8}
                  fill={p.color}
                  opacity={p.opacity}
                  className="transition-all duration-300"
                />
              ))}

              {sliderVal > 40 && (
                <g opacity={(sliderVal - 40) / 60}>
                  {planBars.map((_, idx) => (
                    <line
                      key={idx}
                      x1={0}
                      y1={0}
                      x2={70 + idx * 14}
                      y2={-20}
                      stroke="#38bdf8"
                      strokeWidth="0.5"
                      strokeDasharray="2 3"
                    />
                  ))}
                </g>
              )}
            </svg>

            <div 
              className="absolute right-6 md:right-16 flex items-end gap-2 md:gap-3 h-44 transition-all duration-500"
              style={{
                opacity: 0.15 + (sliderVal / 100) * 0.85,
                transform: `translateX(${(100 - sliderVal) * 0.3}px)`,
              }}
            >
              {planBars.map((bar, idx) => {
                const activeHeight = Math.max(10, (bar.height * sliderVal) / 100);
                return (
                  <div key={idx} className="flex flex-col items-center gap-1.5 h-full justify-end">
                    <span 
                      className="text-[9px] font-mono text-slate-400 transition-opacity duration-300"
                      style={{ opacity: isClear ? 1 : 0 }}
                    >
                      {Math.round((bar.height * sliderVal) / 100)}
                    </span>
                    <div
                      className="w-3.5 md:w-5 rounded-t-md transition-all duration-300 shadow-md"
                      style={{
                        height: `${activeHeight}%`,
                        backgroundColor: bar.color,
                        boxShadow: isClear ? `0 0 15px ${bar.color}66` : 'none',
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-left w-full md:w-auto">
              <p className="text-xs font-semibold text-slate-400">
                {sliderVal < 50 ? '244 signals' : 'All sorted'}
              </p>
              <p className="text-lg font-bold text-white mt-0.5">
                {sliderVal < 50 ? 'Chaotic GDS & Search Logs' : '100% Demand Quantiles Mapped'}
              </p>
            </div>

            <div className="flex flex-col items-center gap-2 w-full md:w-80">
              <div className="flex items-center justify-between w-full text-xs font-bold text-slate-400 px-1">
                <span className={sliderVal < 40 ? 'text-cyan-400' : ''}>Scattered</span>
                <span className={sliderVal >= 75 ? 'text-emerald-400' : ''}>Clear picture</span>
              </div>

              <input
                type="range"
                min={0}
                max={100}
                value={sliderVal}
                onChange={(e) => setSliderVal(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />

              <p className="text-[10px] text-slate-500 tracking-wide mt-1">
                Drag slider to let TBO Optima sort the noise
              </p>
            </div>

            <div className="text-right w-full md:w-auto flex items-center justify-between md:justify-end gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-400">
                  {sliderVal < 50 ? '0 pre-buys' : '41 contracts'}
                </p>
                <p className="text-lg font-bold text-emerald-400 mt-0.5">
                  {sliderVal < 50 ? '0% Capital Deployed' : '+$24,350 Expected Margin'}
                </p>
              </div>

              <button
                onClick={handleToggleState}
                className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white transition flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{sliderVal > 50 ? 'Scatter noise' : 'Clear picture'}</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
