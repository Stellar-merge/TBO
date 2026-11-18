import React, { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';

interface DestinationPin {
  id: string;
  name: string;
  xPercent: number;
  yPercent: number;
  expectedProfit: string;
}

const pins: DestinationPin[] = [
  { id: 'swiss', name: 'Swiss Alps', xPercent: 54, yPercent: 22, expectedProfit: '+$15,600' },
  { id: 'dubai', name: 'Dubai', xPercent: 62, yPercent: 36, expectedProfit: '+$21,750' },
  { id: 'goa', name: 'Goa', xPercent: 71, yPercent: 44, expectedProfit: '+$28,400' },
  { id: 'phuket', name: 'Phuket', xPercent: 81, yPercent: 49, expectedProfit: '+$10,450' },
  { id: 'singapore', name: 'Singapore', xPercent: 83, yPercent: 55, expectedProfit: '+$12,900' },
  { id: 'bali', name: 'Bali', xPercent: 88, yPercent: 66, expectedProfit: '+$18,200' },
];

interface WorldMapGraphicProps {
  onSelectPin?: (pinId: string) => void;
  selectedPin?: string | null;
}

export const WorldMapGraphic: React.FC<WorldMapGraphicProps> = ({ onSelectPin, selectedPin }) => {
  const [pinsVisible, setPinsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setPinsVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative w-full h-[220px] sm:h-[240px] md:h-[260px] bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] border border-gray-200/60 rounded-2xl overflow-hidden select-none shadow-elevation-1 transition-shadow duration-300 hover:shadow-elevation-2">
      
      {/* Top Left Badge */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur-md border border-gray-200/70 rounded-full shadow-elevation-1 text-xs font-semibold text-gray-800 animate-fade-in-down">
        <MapPin className="w-3.5 h-3.5 text-gray-700" />
        <span>High-opportunity destinations</span>
      </div>

      {/* Bottom Left Button */}
      <button 
        type="button"
        className="absolute bottom-4 left-4 z-10 px-3.5 py-1.5 bg-gray-950 hover:bg-gray-800 text-white rounded-lg text-xs font-semibold shadow-elevation-2 transition-all duration-200 active:scale-[0.97] hover:shadow-elevation-3 hover:-translate-y-0.5"
      >
        Explore on Map
      </button>

      {/* World Map SVG */}
      <svg
        viewBox="0 0 1000 480"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full object-cover opacity-90"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <pattern id="dotGrid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="0.8" fill="#e2e8f0" />
          </pattern>
        </defs>

        <rect width="1000" height="480" fill="url(#dotGrid)" />

        <g fill="#edf0f4" stroke="#dce1e8" strokeWidth="0.8" strokeLinejoin="round">
          {/* North America */}
          <path d="M 120 70 Q 180 50 240 70 Q 280 110 260 160 Q 220 200 170 210 Q 150 250 180 270 Q 140 260 120 220 Q 90 170 100 120 Z" />
          {/* South America */}
          <path d="M 230 260 Q 270 260 290 300 Q 300 370 270 420 Q 240 450 220 400 Q 210 320 230 260 Z" />
          {/* Europe */}
          <path d="M 470 70 Q 540 60 570 100 Q 560 140 510 160 Q 480 140 460 110 Z" />
          <path d="M 450 120 Q 470 120 480 140 Q 460 160 440 140 Z" />
          {/* Africa */}
          <path d="M 470 170 Q 540 160 560 210 Q 570 280 530 350 Q 490 370 470 300 Q 440 230 470 170 Z" />
          {/* Asia / Russia */}
          <path d="M 570 60 Q 750 40 880 80 Q 910 140 850 190 Q 770 180 730 160 Q 640 140 570 120 Z" />
          {/* Middle East & Central Asia */}
          <path d="M 570 150 Q 640 150 670 190 Q 640 230 590 220 Q 570 180 570 150 Z" />
          {/* India */}
          <path d="M 680 190 Q 730 200 740 240 Q 720 290 690 300 Q 670 250 680 190 Z" />
          {/* Southeast Asia */}
          <path d="M 750 210 Q 820 210 830 260 Q 790 300 760 270 Z" />
          <path d="M 770 300 Q 830 300 860 330 Q 800 350 770 320 Z" />
          {/* Australia */}
          <path d="M 790 340 Q 890 330 910 390 Q 860 440 800 420 Q 770 380 790 340 Z" />
        </g>
      </svg>

      {/* Destination Pins with staggered entrance */}
      <div className="absolute inset-0 pointer-events-none">
        {pins.map((pin, index) => {
          const isSelected = selectedPin === pin.id;
          return (
            <div
              key={pin.id}
              style={{ 
                left: `${pin.xPercent}%`, 
                top: `${pin.yPercent}%`,
                transitionDelay: pinsVisible ? `${index * 80}ms` : '0ms',
              }}
              className={`absolute -translate-x-1 -translate-y-1 pointer-events-auto cursor-pointer group transition-all duration-500 ease-spring ${
                pinsVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
              }`}
              onClick={() => onSelectPin?.(pin.id)}
            >
              <div className="flex items-center gap-1.5 relative">
                {/* Pulse ring on selected */}
                {isSelected && (
                  <span className="absolute -left-1.5 -top-1.5 w-5 h-5 rounded-full animate-pulse-ring bg-blue-400/40" />
                )}
                
                {/* Pin dot */}
                <div className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ring-2 ${
                  isSelected 
                    ? 'bg-blue-500 ring-blue-200 scale-125' 
                    : 'bg-gray-900 ring-white group-hover:scale-125 group-hover:bg-blue-500 group-hover:ring-blue-200'
                }`} />

                {/* Label */}
                <span className={`text-[11px] sm:text-xs font-bold tracking-tight whitespace-nowrap transition-colors duration-200 ${
                  isSelected ? 'text-blue-600' : 'text-gray-800 group-hover:text-blue-600'
                }`}>
                  {pin.name}
                </span>

                {/* Tooltip on hover */}
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-20">
                  <div className="bg-gray-950 text-white text-[10px] font-semibold px-2.5 py-1.5 rounded-lg shadow-elevation-3 whitespace-nowrap">
                    {pin.expectedProfit}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
