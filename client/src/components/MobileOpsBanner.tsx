import { Apple, Smartphone } from 'lucide-react';

export const MobileOpsBanner: React.FC = () => {
  return (
    <section className="w-full bg-white text-white py-12 px-6 md:px-12">
      <div className="max-w-6xl mx-auto bg-[#0b0f19] rounded-[36px] p-8 md:p-14 border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10">
        
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[400px] h-[350px] bg-blue-600/15 rounded-full blur-[90px] pointer-events-none" />

        {/* Left Column: Text & Buttons */}
        <div className="max-w-lg z-10 text-left">
          <h3 className="font-editorial text-3xl sm:text-5xl font-normal tracking-tight text-white mb-4">
            Stay in sync. <br />
            From anywhere.
          </h3>
          
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-8">
            Approve emergency inventory allocations, monitor real-time booking pacing, 
            and trigger flash markdowns on the go — right from your mobile device.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button className="px-5 py-2.5 rounded-full bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md transition active:scale-95">
              <Apple className="w-4 h-4" />
              <span>Download for iOS</span>
            </button>
            <button className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 flex items-center gap-2 transition active:scale-95">
              <Smartphone className="w-4 h-4" />
              <span>Android APK</span>
            </button>
          </div>
        </div>

        {/* Right Column: Angled 3D Smartphone Device Mockup (Matching Video 00:24) */}
        <div className="relative z-10 w-64 sm:w-72 h-[340px] flex items-center justify-center transform md:rotate-3 hover:rotate-0 transition-transform duration-500">
          <div className="w-full h-full bg-slate-900 rounded-[38px] p-3 border-4 border-slate-700 shadow-2xl shadow-cyan-900/30 flex flex-col justify-between overflow-hidden">
            <div className="w-full h-full bg-[#f8fafc] text-slate-800 rounded-[28px] p-3.5 flex flex-col justify-between shadow-inner overflow-hidden text-[10px]">
              <div className="w-20 h-3.5 bg-slate-900 rounded-full mx-auto mb-2" />

              <div>
                <div className="flex justify-between items-center mb-1 font-bold">
                  <span className="text-slate-900">Pacing Overview</span>
                  <span className="text-emerald-600 font-mono">+28.8%</span>
                </div>
                <p className="text-[9px] text-slate-400">Taj Exotica Resort, Goa</p>
                
                <div className="h-16 w-full my-2 bg-white rounded-lg p-1.5 border border-slate-200">
                  <svg className="w-full h-full" viewBox="0 0 100 40">
                    <path d="M 5 35 Q 30 30, 50 20 T 95 8" fill="none" stroke="#0284c7" strokeWidth="2" />
                    <circle cx="95" cy="8" r="2.5" fill="#0284c7" />
                  </svg>
                </div>

                <div className="bg-slate-100 p-2 rounded-lg space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span>Sold / Committed:</span>
                    <span className="font-bold text-slate-900">27 / 35 rms</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Risk Dial:</span>
                    <span className="text-amber-600 font-bold">42 (Balanced)</span>
                  </div>
                </div>
              </div>

              <button className="w-full py-2 bg-slate-900 text-white rounded-xl font-bold text-[10px] text-center shadow-sm">
                1-Tap Approve Pre-Buy
              </button>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
