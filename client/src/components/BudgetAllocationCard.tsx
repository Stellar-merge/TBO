import React, { useState } from 'react';
import { DollarSign, ShieldCheck, TrendingUp } from 'lucide-react';

interface CategoryData {
  id: string;
  name: string;
  percentage: number;
  color: string;
  lineColor: string;
  labelX: number;
  labelY: number;
  linePoints: string;
  textAnchor: 'start' | 'end' | 'middle';
}

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
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const deployedPercentage = Math.min(
    100,
    Math.round((budgetUsed / (budgetTotal || 1)) * 100)
  );

  // Exact 6 categories from user reference image
  const categories: CategoryData[] = [
    {
      id: 'salaries',
      name: 'Salaries',
      percentage: 48,
      color: '#C62828', // Crimson Red
      lineColor: '#C62828',
      labelX: 250,
      labelY: 130,
      linePoints: '198,135 240,135',
      textAnchor: 'start',
    },
    {
      id: 'marketing',
      name: 'Marketing',
      percentage: 19,
      color: '#007A78', // Deep Teal
      lineColor: '#007A78',
      labelX: 98,
      labelY: 236,
      linePoints: '118,198 108,222 88,222',
      textAnchor: 'end',
    },
    {
      id: 'operations',
      name: 'Operations',
      percentage: 16,
      color: '#E5A910', // Golden Yellow
      lineColor: '#E5A910',
      labelX: 74,
      labelY: 140,
      linePoints: '88,140 68,140',
      textAnchor: 'end',
    },
    {
      id: 'technology',
      name: 'Technology',
      percentage: 11,
      color: '#E65100', // Warm Orange
      lineColor: '#E65100',
      labelX: 84,
      labelY: 58,
      linePoints: '104,80 96,62 80,62',
      textAnchor: 'end',
    },
    {
      id: 'travel',
      name: 'Travel',
      percentage: 4,
      color: '#689F38', // Lime Green
      lineColor: '#689F38',
      labelX: 130,
      labelY: 24,
      linePoints: '136,70 132,38 126,38',
      textAnchor: 'end',
    },
    {
      id: 'other',
      name: 'Other',
      percentage: 2,
      color: '#D84315', // Coral Orange
      lineColor: '#D84315',
      labelX: 165,
      labelY: 24,
      linePoints: '152,70 156,38 162,38',
      textAnchor: 'start',
    },
  ];

  // Helper to calculate arc path for donut slice
  const getSlicePath = (
    startAngleDeg: number,
    endAngleDeg: number,
    innerRadius: number,
    outerRadius: number,
    isHovered: boolean
  ) => {
    const cx = 145;
    const cy = 135;
    const rIn = isHovered ? innerRadius - 2 : innerRadius;
    const rOut = isHovered ? outerRadius + 6 : outerRadius;

    // Small angle gap between slices
    const gap = 3.5;
    const sDeg = startAngleDeg + gap / 2;
    const eDeg = endAngleDeg - gap / 2;

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

  // Compute angle offsets for each category
  // Order around circle matching reference image:
  // Other (2%): 15° to 22.2°
  // Salaries (48%): 22.2° to 195°
  // Marketing (19%): 195° to 263.4°
  // Operations (16%): 263.4° to 321°
  // Technology (11%): 321° to 360.6°
  // Travel (4%): 0.6° to 15°
  const sliceAngles: Record<string, { start: number; end: number }> = {
    other: { start: 10, end: 17.2 },
    salaries: { start: 18, end: 190.8 },
    marketing: { start: 191.5, end: 259.9 },
    operations: { start: 260.5, end: 318.1 },
    technology: { start: 318.8, end: 358.4 },
    travel: { start: 359, end: 373.4 }, // wrapping around top
  };

  return (
    <div className="w-full bg-white/95 backdrop-blur-md rounded-3xl border border-[#D0EADB] shadow-[0_8px_30px_rgba(34,139,84,0.06)] hover:shadow-[0_12px_36px_rgba(34,139,84,0.09)] p-5 sm:p-6 transition-all duration-300 font-sans select-none antialiased">
      
      {/* ─── Top Header: Icon + Title + Categories Pill ─── */}
      <div className="flex items-start justify-between gap-4 mb-4">
        
        {/* Left Title with Green Icon Badge */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#2E8B57] via-[#237A49] to-[#155A34] text-white flex items-center justify-center font-black text-lg shadow-[0_4px_12px_rgba(36,122,74,0.25)] shrink-0">
            <DollarSign className="w-5 h-5 stroke-[2.8]" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-950 tracking-tight leading-tight">
              Budget Allocation
            </h2>
            <p className="text-xs sm:text-[13px] text-slate-500 font-medium">
              Distribution of your budget across categories
            </p>
          </div>
        </div>

        {/* Right Badge: • 6 Categories */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F6ED] border border-[#C5E8D2] text-xs font-black text-[#174D2E] shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2E8B57]" />
          <span>6 Categories</span>
        </div>

      </div>

      {/* ─── Main Content Split: Donut Chart (Left) + 4 Metrics (Right) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center pt-2">
        
        {/* ─── LEFT: Interactive Donut Chart with Callout Labels ─── */}
        <div className="lg:col-span-5 flex items-center justify-center relative">
          <svg
            viewBox="0 0 310 260"
            className="w-full max-w-[320px] h-auto overflow-visible"
          >
            <defs>
              {/* Fine hatch texture matching the screenshot */}
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
                  opacity="0.3"
                />
              </pattern>
            </defs>

            {/* Slices */}
            {categories.map((cat) => {
              const angles = sliceAngles[cat.id];
              const isHovered = hoveredId === cat.id;
              const path = getSlicePath(
                angles.start,
                angles.end,
                30,
                55,
                isHovered
              );

              return (
                <g
                  key={cat.id}
                  className="cursor-pointer transition-all duration-300"
                  onMouseEnter={() => setHoveredId(cat.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {/* Base colored slice */}
                  <path
                    d={path}
                    fill={cat.color}
                    className="transition-all duration-200"
                    style={{
                      filter: isHovered
                        ? `drop-shadow(0 4px 10px ${cat.color}88)`
                        : 'none',
                    }}
                  />
                  {/* Subtle hatch overlay for aesthetic texture */}
                  <path
                    d={path}
                    fill="url(#fineHatch)"
                    className="pointer-events-none"
                  />
                </g>
              );
            })}

            {/* Callout Lines & Labels */}
            {categories.map((cat) => {
              const isHovered = hoveredId === cat.id;
              const expenseAmount = Math.round(
                (budgetUsed * cat.percentage) / 100
              );

              return (
                <g
                  key={`label-${cat.id}`}
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHoveredId(cat.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {/* Connecting Callout Line */}
                  <polyline
                    points={cat.linePoints}
                    fill="none"
                    stroke={cat.lineColor}
                    strokeWidth={isHovered ? '1.8' : '1.2'}
                    strokeDasharray={cat.id === 'travel' || cat.id === 'other' ? '2,2' : 'none'}
                    className="transition-all duration-200"
                    opacity={isHovered ? 1 : 0.75}
                  />

                  {/* Category Name Label */}
                  <text
                    x={cat.labelX}
                    y={cat.labelY}
                    textAnchor={cat.textAnchor}
                    className={`text-[10px] sm:text-[11px] font-bold transition-all duration-200 ${
                      isHovered ? 'fill-slate-950 font-black' : 'fill-slate-700'
                    }`}
                  >
                    {cat.name}
                  </text>

                  {/* Percentage Label */}
                  <text
                    x={cat.labelX}
                    y={cat.labelY + 12}
                    textAnchor={cat.textAnchor}
                    className={`text-[11px] sm:text-[12px] font-black transition-all duration-200 ${
                      isHovered ? 'fill-[#0D4E43]' : 'fill-slate-900'
                    }`}
                  >
                    {cat.percentage}%
                  </text>

                  {/* Active Tooltip showing exact dollar allocation on hover */}
                  {isHovered && (
                    <text
                      x={cat.labelX}
                      y={cat.labelY + 23}
                      textAnchor={cat.textAnchor}
                      className="text-[9px] font-mono font-black fill-[#0D4E43]"
                    >
                      ${expenseAmount.toLocaleString()}
                    </text>
                  )}
                </g>
              );
            })}
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
                ${budgetUsed.toLocaleString()}
              </span>
            </div>
            <div className="text-xs font-bold text-slate-400 font-mono mt-1 mb-2">
              / ${budgetTotal.toLocaleString()}
            </div>

            {/* Progress Bar with Green Gradient */}
            <div className="w-full max-w-[130px] h-2 bg-[#E4F3E8] rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-[#247A49] via-[#32985C] to-[#48BB78] rounded-full shadow-[0_1px_6px_rgba(46,139,87,0.35)] transition-all duration-700 ease-out"
                style={{ width: `${deployedPercentage}%` }}
              />
            </div>

            {/* Deployed Pill */}
            <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-[#E6F7ED] text-[#165130] border border-[#BCE6CB] font-mono shadow-2xs">
              <span className="text-[#247A49]">↗</span>
              <span>{deployedPercentage}% Deployed</span>
            </span>
          </div>

          {/* Column 2: Capital Allocated */}
          <div className="flex-1 md:px-5 pt-3 md:pt-0">
            <span className="text-xs sm:text-[13px] font-bold text-slate-500 block mb-1">
              Capital Allocated
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-950 font-mono tracking-tight leading-none block">
              ${capitalAllocated.toLocaleString()}
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
