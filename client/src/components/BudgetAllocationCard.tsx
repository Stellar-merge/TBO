import React, { useState } from 'react';
import { DollarSign, ShieldCheck, TrendingUp } from 'lucide-react';

interface BudgetAllocationCardProps {
  budgetUsed?: number;
  budgetTotal?: number;
  capitalAllocated?: number;
  projectedROI?: string | number;
  riskDial?: number;
}

export const BudgetAllocationCard: React.FC<BudgetAllocationCardProps> = ({
  budgetUsed = 120000,
  budgetTotal = 500000,
  capitalAllocated = 2043610,
  projectedROI = 16.1,
  riskDial = 42,
}) => {
  const [hoveredSlice, setHoveredSlice] = useState<'used' | 'remaining' | null>(null);

  const safeTotal = budgetTotal > 0 ? budgetTotal : 500000;
  const safeUsed = Math.min(safeTotal, Math.max(0, budgetUsed));
  const safeRemaining = Math.max(0, safeTotal - safeUsed);

  const usedPercentage = Math.min(100, Math.max(0, Math.round((safeUsed / safeTotal) * 100)));
  const remainingPercentage = 100 - usedPercentage;

  // Arc path generator for 2-slice donut
  const getSliceArc = (startDeg: number, endDeg: number, innerR: number, outerR: number, isHovered: boolean) => {
    const cx = 150;
    const cy = 125;
    const rIn = isHovered ? innerR - 2 : innerR;
    const rOut = isHovered ? outerR + 6 : outerR;

    const gap = 3.0;
    const sDeg = startDeg + gap / 2;
    const eDeg = endDeg - gap / 2;

    const sRad = ((sDeg - 90) * Math.PI) / 180;
    const eRad = ((eDeg - 90) * Math.PI) / 180;

    const x1 = cx + rOut * Math.cos(sRad);
    const y1 = cy + rOut * Math.sin(sRad);
    const x2 = cx + rOut * Math.cos(eRad);
    const y2 = cy + rOut * Math.sin(eRad);

    const x3 = cx + rIn * Math.cos(eRad);
    const y3 = cy + rIn * Math.sin(eRad);
    const x4 = cx + rIn * Math.cos(sRad);
    const y4 = cy + rIn * Math.sin(sRad);

    const largeArc = eDeg - sDeg > 180 ? 1 : 0;

    return `M ${x1} ${y1} A ${rOut} ${rOut} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${rIn} ${rIn} 0 ${largeArc} 0 ${x4} ${y4} Z`;
  };

  const usedAngle = (usedPercentage / 100) * 360;

  return (
    <div className="w-full bg-white/95 backdrop-blur-md rounded-3xl border border-[#D0EADB] shadow-[0_8px_30px_rgba(34,139,84,0.06)] hover:shadow-[0_12px_36px_rgba(34,139,84,0.09)] p-5 sm:p-6 transition-all duration-300 font-sans select-none antialiased">
      
      {/* ─── Top Header: Icon + Title + Segments Pill ─── */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#2E8B57] via-[#237A49] to-[#155A34] text-white flex items-center justify-center font-black text-lg shadow-[0_4px_12px_rgba(36,122,74,0.25)] shrink-0">
            <DollarSign className="w-5 h-5 stroke-[2.8]" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-950 tracking-tight leading-tight">
              Budget Allocation
            </h2>
            <p className="text-xs sm:text-[13px] text-slate-500 font-medium">
              Distribution of budget used vs. remaining capital
            </p>
          </div>
        </div>

        {/* Right Badge: • 2 Segments */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F6ED] border border-[#C5E8D2] text-xs font-black text-[#174D2E] shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2E8B57]" />
          <span>Budget Used & Allocated</span>
        </div>
      </div>

      {/* ─── Main Content: Donut Chart (Left) + 4 Metrics (Right) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center pt-2">
        
        {/* ─── LEFT: Interactive 2-Slice Donut Chart ─── */}
        <div className="lg:col-span-5 flex items-center justify-center relative">
          <svg
            viewBox="0 0 310 250"
            className="w-full max-w-[320px] h-auto overflow-visible"
          >
            <defs>
              <pattern
                id="fineHatch"
                width="4"
                height="4"
                patternTransform="rotate(45 0 0)"
                patternUnits="userSpaceOnUse"
              >
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="4"
                  stroke="#FFFFFF"
                  strokeWidth="0.8"
                  opacity="0.25"
                />
              </pattern>
            </defs>

            {/* Slice 1: Budget Used (Deep Forest Green) */}
            <g
              className="cursor-pointer transition-all duration-300"
              onMouseEnter={() => setHoveredSlice('used')}
              onMouseLeave={() => setHoveredSlice(null)}
            >
              <path
                d={getSliceArc(0, usedAngle, 38, 68, hoveredSlice === 'used')}
                fill="#0D4E43"
                className="transition-all duration-200"
                style={{
                  filter: hoveredSlice === 'used' ? 'drop-shadow(0 6px 14px rgba(13,78,67,0.45))' : 'none',
                }}
              />
              <path
                d={getSliceArc(0, usedAngle, 38, 68, hoveredSlice === 'used')}
                fill="url(#fineHatch)"
                className="pointer-events-none"
              />
            </g>

            {/* Slice 2: Remaining Budget (Mint/Sage Light Green) */}
            <g
              className="cursor-pointer transition-all duration-300"
              onMouseEnter={() => setHoveredSlice('remaining')}
              onMouseLeave={() => setHoveredSlice(null)}
            >
              <path
                d={getSliceArc(usedAngle, 360, 38, 68, hoveredSlice === 'remaining')}
                fill="#34A853"
                className="transition-all duration-200"
                style={{
                  filter: hoveredSlice === 'remaining' ? 'drop-shadow(0 6px 14px rgba(52,168,83,0.35))' : 'none',
                }}
              />
              <path
                d={getSliceArc(usedAngle, 360, 38, 68, hoveredSlice === 'remaining')}
                fill="url(#fineHatch)"
                className="pointer-events-none"
              />
            </g>

            {/* Donut Center Display */}
            <circle cx="150" cy="125" r="34" fill="#FFFFFF" />
            <text x="150" y="120" textAnchor="middle" className="text-[10px] font-bold fill-slate-400 select-none">
              Total Cap
            </text>
            <text x="150" y="136" textAnchor="middle" className="text-[12px] font-black fill-slate-900 font-mono select-none">
              {safeTotal >= 10000000 ? `₹${(safeTotal / 10000000).toFixed(1)}Cr` : safeTotal >= 100000 ? `₹${(safeTotal / 100000).toFixed(0)}L` : `₹${Math.round(safeTotal / 1000)}k`}
            </text>

            {/* Callout 1: Budget Used (Right side) */}
            <g
              className="cursor-pointer transition-all duration-200"
              onMouseEnter={() => setHoveredSlice('used')}
              onMouseLeave={() => setHoveredSlice(null)}
            >
              <polyline
                points="218,105 240,105 250,95"
                fill="none"
                stroke="#0D4E43"
                strokeWidth={hoveredSlice === 'used' ? '2.2' : '1.4'}
                className="transition-all duration-200"
              />
              <circle cx="218" cy="105" r="2.5" fill="#0D4E43" />
              <text
                x="254"
                y="92"
                textAnchor="start"
                className={`text-[11px] font-bold transition-all duration-200 ${
                  hoveredSlice === 'used' ? 'fill-slate-950 font-black' : 'fill-slate-700'
                }`}
              >
                Budget Used
              </text>
              <text
                x="254"
                y="106"
                textAnchor="start"
                className={`text-[13px] font-black transition-all duration-200 ${
                  hoveredSlice === 'used' ? 'fill-[#0D4E43]' : 'fill-slate-900'
                }`}
              >
                {usedPercentage}%
              </text>
              <text
                x="254"
                y="119"
                textAnchor="start"
                className="text-[10px] font-mono font-bold fill-[#0D4E43]"
              >
                ₹{safeUsed.toLocaleString('en-IN')}
              </text>
            </g>

            {/* Callout 2: Remaining Budget (Left side) */}
            <g
              className="cursor-pointer transition-all duration-200"
              onMouseEnter={() => setHoveredSlice('remaining')}
              onMouseLeave={() => setHoveredSlice(null)}
            >
              <polyline
                points="82,145 60,145 50,155"
                fill="none"
                stroke="#34A853"
                strokeWidth={hoveredSlice === 'remaining' ? '2.2' : '1.4'}
                className="transition-all duration-200"
              />
              <circle cx="82" cy="145" r="2.5" fill="#34A853" />
              <text
                x="46"
                y="152"
                textAnchor="end"
                className={`text-[11px] font-bold transition-all duration-200 ${
                  hoveredSlice === 'remaining' ? 'fill-slate-950 font-black' : 'fill-slate-700'
                }`}
              >
                Remaining Budget
              </text>
              <text
                x="46"
                y="166"
                textAnchor="end"
                className={`text-[13px] font-black transition-all duration-200 ${
                  hoveredSlice === 'remaining' ? 'fill-[#247A49]' : 'fill-slate-900'
                }`}
              >
                {remainingPercentage}%
              </text>
              <text
                x="46"
                y="179"
                textAnchor="end"
                className="text-[10px] font-mono font-bold fill-[#247A49]"
              >
                ₹{safeRemaining.toLocaleString('en-IN')}
              </text>
            </g>
          </svg>
        </div>

        {/* ─── RIGHT: 4 Clean Metrics with Vertical Dividers ─── */}
        <div className="lg:col-span-7 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-5 divide-y md:divide-y-0 md:divide-x divide-[#E2F2E7]">
          
          {/* Column 1: Budget Used */}
          <div className="flex-1 md:pr-4 pt-3 md:pt-0">
            <span className="text-xs sm:text-[13px] font-bold text-slate-500 block mb-1">
              Budget Used
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-[28px] font-black text-slate-950 font-mono tracking-tight leading-none">
                ₹{safeUsed.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="text-xs font-bold text-slate-400 font-mono mt-1 mb-2">
              / ₹{safeTotal.toLocaleString('en-IN')}
            </div>

            {/* Progress Bar with Green Gradient */}
            <div className="w-full max-w-[130px] h-2 bg-[#E4F3E8] rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-[#0D4E43] via-[#247A49] to-[#34A853] rounded-full shadow-[0_1px_6px_rgba(46,139,87,0.35)] transition-all duration-700 ease-out"
                style={{ width: `${usedPercentage}%` }}
              />
            </div>

            {/* Deployed Pill */}
            <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-[#E6F7ED] text-[#165130] border border-[#BCE6CB] font-mono shadow-2xs">
              <span className="text-[#247A49]">↗</span>
              <span>{usedPercentage}% Deployed</span>
            </span>
          </div>

          {/* Column 2: Capital Allocated */}
          <div className="flex-1 md:px-5 pt-3 md:pt-0">
            <span className="text-xs sm:text-[13px] font-bold text-slate-500 block mb-1">
              Capital Allocated
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-950 font-mono tracking-tight leading-none block">
              ₹{capitalAllocated.toLocaleString('en-IN')}
            </span>
            <span className="text-xs font-semibold text-slate-400 mt-1 block">
              Remaining: ₹{safeRemaining.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Column 3: Projected ROI */}
          <div className="flex-1 md:px-5 pt-3 md:pt-0">
            <span className="text-xs sm:text-[13px] font-bold text-slate-500 block mb-1">
              Projected ROI
            </span>
            <span className="inline-flex items-center gap-1 text-xl sm:text-2xl font-black text-[#227A4B] font-mono tracking-tight leading-none">
              <TrendingUp className="w-5 h-5 stroke-[2.8]" />
              <span>+{projectedROI}%</span>
            </span>
          </div>

          {/* Column 4: Risk Dial */}
          <div className="flex-1 md:pl-5 pt-3 md:pt-0">
            <span className="text-xs sm:text-[13px] font-bold text-slate-500 block mb-1">
              Risk Dial
            </span>
            <span className="inline-flex items-center gap-1.5 text-xl sm:text-2xl font-black text-slate-950 font-mono tracking-tight leading-none">
              <ShieldCheck className="w-5 h-5 text-[#227A4B] stroke-[2.5]" />
              <span>{riskDial}/100</span>
            </span>
          </div>

        </div>

      </div>

    </div>
  );
};
