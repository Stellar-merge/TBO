import { useState } from 'react';
import { 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  Percent 
} from 'lucide-react';

export const MonitorRecover: React.FC = () => {
  const [selectedDeal, setSelectedDeal] = useState('Taj Exotica Goa (Dec 28 - Jan 2)');
  const [isRetraining, setIsRetraining] = useState(false);
  const [markdownApplied, setMarkdownApplied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleApplyMarkdown = () => {
    setMarkdownApplied(true);
    setToastMessage('Dynamic 15% markdown push published to B2B channels to clear remaining 8 rooms.');
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleRetrain = () => {
    setIsRetraining(true);
    setTimeout(() => {
      setIsRetraining(false);
      setToastMessage('Feedback loop complete: Actual booking trajectory appended to Feature Store. Retrained LightGBM Quantile models.');
      setTimeout(() => setToastMessage(null), 4500);
    }, 1200);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 text-slate-800 animate-in fade-in duration-300">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 md:p-8 rounded-3xl border border-slate-200/90 shadow-sm">
        <div>
          <span className="text-xs font-bold text-sky-700 uppercase tracking-wider bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200/60">
            Operations & Closed-Loop Feedback
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
            Monitor & Recover (Actual vs. Forecast)
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Tracks real-time booking pace against predicted P10–P90 cones. Triggers automated clearance markdowns 
            for lagging contracts and feeds drift back to the Feature Store.
          </p>
        </div>

        <button
          onClick={handleRetrain}
          disabled={isRetraining}
          className="self-start md:self-auto px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs md:text-sm flex items-center gap-2 shadow-md shadow-blue-500/20 active:scale-95 transition disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${isRetraining ? 'animate-spin' : ''}`} />
          <span>{isRetraining ? 'Retraining Feature Store...' : 'Retrain Models (Feedback Loop)'}</span>
        </button>
      </div>

      {/* Contract Selector & Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">
            Select Active Pre-Bought Inventory
          </label>
          <select
            value={selectedDeal}
            onChange={(e) => setSelectedDeal(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option>Taj Exotica Goa (Dec 28 - Jan 2)</option>
            <option>Atlantis The Palm Dubai (Nov 20 - Nov 26)</option>
            <option>The Ritz London (Dec 15 - Dec 22)</option>
            <option>Ayana Resort Bali (Dec 24 - Dec 30)</option>
          </select>
        </div>

        <div>
          <p className="text-[11px] font-medium text-slate-400">Sold / Procured</p>
          <p className="text-xl font-extrabold text-slate-900 mt-1">
            27 <span className="text-xs font-normal text-slate-400">/ 35 rooms (77%)</span>
          </p>
          <p className="text-[10px] text-emerald-600 font-semibold mt-1">Ahead of P50 pace</p>
        </div>

        <div>
          <p className="text-[11px] font-medium text-slate-400">Days to Check-in</p>
          <p className="text-xl font-extrabold text-slate-900 mt-1">16 days</p>
          <p className="text-[10px] text-slate-400 mt-1">Refund penalty at T-7d</p>
        </div>
      </div>

      {/* Booking Pacing Chart (Actual vs P10-P90 Cone) */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/90 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Cumulative Booking Pacing Trajectory
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Observed booking velocity plotted against the probabilistic quantile forecast
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-blue-700 font-bold">
              <span className="w-3 h-0.5 bg-blue-600 rounded-full" />
              Actual Realized Pace (27 rms)
            </span>
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className="w-3 h-0.5 bg-slate-400 border-b border-dashed border-slate-600" />
              P50 Expected Baseline
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-100 border border-blue-200" />
              P10–P90 Quantile Cone
            </span>
          </div>
        </div>

        {/* SVG Pacing Visualization */}
        <div className="h-64 w-full relative">
          <svg className="w-full h-full" viewBox="0 0 700 240" preserveAspectRatio="none">
            <defs>
              <linearGradient id="coneGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.6" />
              </linearGradient>
            </defs>

            <line x1="50" y1="30" x2="680" y2="30" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="50" y1="90" x2="680" y2="90" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="50" y1="150" x2="680" y2="150" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="50" y1="210" x2="680" y2="210" stroke="#f1f5f9" strokeWidth="1" />

            <path
              d="M 50 210 
                 Q 250 200, 420 160 
                 T 680 50 
                 L 680 140 
                 Q 420 195, 250 205 
                 L 50 210 Z"
              fill="url(#coneGradient)"
            />

            <path
              d="M 50 210 
                 Q 250 202, 420 180 
                 T 680 90"
              fill="none"
              stroke="#64748b"
              strokeWidth="2"
              strokeDasharray="4 4"
            />

            <path
              d="M 50 210 
                 Q 180 205, 300 170 
                 T 480 115"
              fill="none"
              stroke="#0284c7"
              strokeWidth="3.5"
            />

            <circle cx="480" cy="115" r="5" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
            
            <line
              x1="50"
              y1="50"
              x2="680"
              y2="50"
              stroke="#10b981"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
            <text x="55" y="44" fill="#059669" fontSize="10" fontWeight="bold">
              Capacity: 35 Rooms
            </text>
          </svg>
        </div>

        <div className="flex justify-between text-[11px] font-mono text-slate-400 pt-3 border-t border-slate-100">
          <span>T-60 Days</span>
          <span>T-45 Days</span>
          <span>T-30 Days</span>
          <span className="text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded">T-16 (Today)</span>
          <span>T-7 Days (Penalty Cutoff)</span>
          <span>T-0 (Check-in)</span>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">
                Pacing Alert: 8 Unsold Rooms with 9 Days to Supplier Cutoff
              </p>
              <p className="text-[11px] text-slate-500">
                Estimated unrecovered inventory risk is $680. Recommend proactive dynamic discounting.
              </p>
            </div>
          </div>

          <button
            onClick={handleApplyMarkdown}
            disabled={markdownApplied}
            className={`px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 transition ${
              markdownApplied
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm'
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>{markdownApplied ? 'Markdown Active (15% Off)' : 'Trigger Dynamic Markdown (-15%)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
