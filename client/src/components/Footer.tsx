import { Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#0b0f19] text-slate-400 py-16 px-6 md:px-12 border-t border-slate-800">
      <div className="max-w-6xl mx-auto flex flex-col justify-between">
        
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-slate-800/80">
          
          {/* Brand Col */}
          <div className="md:col-span-4">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4 text-cyan-300" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                TBO Optima
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm mb-6">
              Plan, track, and procure high-margin travel inventory — powered by Newsvendor quantiles, 
              MILP budget optimization, and explainable AI.
            </p>

            <div className="flex items-center gap-3 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>TBO Hackathon 2026 Challenge Platform</span>
            </div>
          </div>

          {/* Links Cols */}
          <div className="md:col-span-8 grid grid-cols-3 gap-6 text-xs">
            <div>
              <h5 className="font-bold text-white uppercase tracking-wider mb-4 text-[11px]">
                Product
              </h5>
              <ul className="space-y-2.5">
                <li className="hover:text-white cursor-pointer transition">Demand Forecaster (P10-P90)</li>
                <li className="hover:text-white cursor-pointer transition">Cancellation Risk Engine</li>
                <li className="hover:text-white cursor-pointer transition">Price Elasticity OLS</li>
                <li className="hover:text-white cursor-pointer transition">PuLP MILP Budget Solver</li>
                <li className="hover:text-white cursor-pointer transition">Monte Carlo 2,000 Runs</li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-white uppercase tracking-wider mb-4 text-[11px]">
                Features
              </h5>
              <ul className="space-y-2.5">
                <li className="hover:text-white cursor-pointer transition">Look-to-Book (L2B) Ratios</li>
                <li className="hover:text-white cursor-pointer transition">Censored Demand Reconstruction</li>
                <li className="hover:text-white cursor-pointer transition">TreeSHAP Reason Cards</li>
                <li className="hover:text-white cursor-pointer transition">P10–P90 Pacing Curves</li>
                <li className="hover:text-white cursor-pointer transition">Dynamic Markdown Liquidation</li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-white uppercase tracking-wider mb-4 text-[11px]">
                Solutions
              </h5>
              <ul className="space-y-2.5">
                <li className="hover:text-white cursor-pointer transition">For Travel Wholesalers</li>
                <li className="hover:text-white cursor-pointer transition">For Bedbanks & Aggregators</li>
                <li className="hover:text-white cursor-pointer transition">For Online Travel Agencies (OTAs)</li>
                <li className="hover:text-white cursor-pointer transition">For Hotel Chain Revenue Desks</li>
                <li className="hover:text-white cursor-pointer transition">Supplier Extranet API</li>
              </ul>
            </div>
          </div>

        </div>

        {/* Bottom Strip */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 TBO Optima. Built for TBO.com Intelligent Inventory Optimization.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-400 cursor-pointer">Terms of Use</span>
            <span className="hover:text-slate-400 cursor-pointer">Cookie Preferences</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
