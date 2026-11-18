import { Sparkles, Sliders, ShieldCheck, Activity } from 'lucide-react';

interface SofiaNavbarProps {
  activeView: 'landing' | 'procurement' | 'risk' | 'monitor';
  setActiveView: (view: 'landing' | 'procurement' | 'risk' | 'monitor') => void;
  onScrollToSection: (sectionId: string) => void;
}

export const SofiaNavbar: React.FC<SofiaNavbarProps> = ({
  activeView,
  setActiveView,
  onScrollToSection,
}) => {
  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 w-[92%] max-w-5xl z-50 transition-all duration-300">
      <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-full py-2.5 px-4 sm:px-6 shadow-2xl flex items-center justify-between text-white text-xs">
        
        {/* Brand Logo & Name */}
        <div 
          onClick={() => setActiveView('landing')}
          className="flex items-center gap-2 cursor-pointer select-none group"
        >
          <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
          </div>
          <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">
            TBO Optima
          </span>
        </div>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-6 font-medium text-slate-300">
          <button
            onClick={() => {
              setActiveView('landing');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`hover:text-white transition ${activeView === 'landing' ? 'text-white font-bold' : ''}`}
          >
            Product
          </button>

          <button
            onClick={() => {
              setActiveView('landing');
              onScrollToSection('workflow-section');
            }}
            className="hover:text-white transition"
          >
            How it works
          </button>

          <button
            onClick={() => {
              setActiveView('landing');
              onScrollToSection('noise-section');
            }}
            className="hover:text-white transition"
          >
            Noise to Plan
          </button>

          <button
            onClick={() => {
              setActiveView('landing');
              onScrollToSection('pricing-section');
            }}
            className="hover:text-white transition"
          >
            Pricing
          </button>

          {/* Quick Switcher into Live Interactive Workspaces */}
          <div className="h-4 w-[1px] bg-slate-700" />

          <button
            onClick={() => setActiveView('procurement')}
            className={`hover:text-cyan-300 transition flex items-center gap-1 ${
              activeView === 'procurement' ? 'text-cyan-400 font-bold' : ''
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>MILP Solver</span>
          </button>

          <button
            onClick={() => setActiveView('risk')}
            className={`hover:text-cyan-300 transition flex items-center gap-1 ${
              activeView === 'risk' ? 'text-cyan-400 font-bold' : ''
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Risk Dial</span>
          </button>

          <button
            onClick={() => setActiveView('monitor')}
            className={`hover:text-cyan-300 transition flex items-center gap-1 ${
              activeView === 'monitor' ? 'text-cyan-400 font-bold' : ''
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Pacing</span>
          </button>
        </nav>

        {/* Right CTA Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveView('procurement')}
            className="px-4 py-1.5 rounded-full text-slate-300 hover:text-white text-xs font-semibold transition"
          >
            Log in
          </button>
          
          <button
            onClick={() => setActiveView('procurement')}
            className="px-4 py-2 rounded-full bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs shadow-md transition active:scale-95"
          >
            Get started
          </button>
        </div>

      </div>
    </header>
  );
};
