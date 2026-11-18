import React from 'react';

interface FloorplanProps {
  variant?: 1 | 2 | 3 | 4 | 5;
  className?: string;
}

export const FloorplanSvg: React.FC<FloorplanProps> = ({ variant = 1, className = "w-full h-full" }) => {
  if (variant === 1) {
    // 3-bedroom terrace layout (like #DXB-04219)
    return (
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${className} bg-[#fcfcfd] border border-gray-200/60 rounded-lg p-1.5 select-none`}
      >
        {/* Outer boundary wall */}
        <rect x="15" y="15" width="170" height="170" stroke="#1e293b" strokeWidth="2.5" fill="#ffffff" />
        
        {/* Balcony / Terrace boundary */}
        <rect x="15" y="15" width="60" height="50" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 2" fill="#f8fafc" />
        <text x="25" y="42" fill="#94a3b8" fontSize="8" fontFamily="sans-serif" fontWeight="600">TERRACE</text>

        {/* Master Bedroom */}
        <rect x="75" y="15" width="55" height="70" stroke="#334155" strokeWidth="1.8" fill="#ffffff" />
        {/* Bed outline */}
        <rect x="85" y="25" width="35" height="30" stroke="#cbd5e1" strokeWidth="1.2" rx="2" fill="#f1f5f9" />
        <rect x="88" y="28" width="13" height="8" stroke="#cbd5e1" strokeWidth="1" rx="1" fill="#ffffff" />
        <rect x="104" y="28" width="13" height="8" stroke="#cbd5e1" strokeWidth="1" rx="1" fill="#ffffff" />
        <text x="83" y="75" fill="#64748b" fontSize="7" fontFamily="sans-serif">BEDROOM 1</text>

        {/* Bedroom 2 */}
        <rect x="130" y="15" width="55" height="70" stroke="#334155" strokeWidth="1.8" fill="#ffffff" />
        <rect x="140" y="25" width="35" height="30" stroke="#cbd5e1" strokeWidth="1.2" rx="2" fill="#f1f5f9" />
        <text x="138" y="75" fill="#64748b" fontSize="7" fontFamily="sans-serif">BEDROOM 2</text>

        {/* Living & Dining Area */}
        <rect x="15" y="85" width="115" height="100" stroke="#334155" strokeWidth="1.8" fill="#ffffff" />
        {/* Sofa L-shape */}
        <path d="M 30 110 L 65 110 L 65 135 L 55 135 L 55 120 L 30 120 Z" stroke="#cbd5e1" strokeWidth="1.2" fill="#f1f5f9" />
        {/* Dining table */}
        <rect x="80" y="120" width="35" height="20" rx="3" stroke="#cbd5e1" strokeWidth="1.2" fill="#f8fafc" />
        <circle cx="87" cy="115" r="3" stroke="#cbd5e1" strokeWidth="1" fill="#ffffff" />
        <circle cx="97" cy="115" r="3" stroke="#cbd5e1" strokeWidth="1" fill="#ffffff" />
        <circle cx="107" cy="115" r="3" stroke="#cbd5e1" strokeWidth="1" fill="#ffffff" />
        <circle cx="87" cy="145" r="3" stroke="#cbd5e1" strokeWidth="1" fill="#ffffff" />
        <circle cx="97" cy="145" r="3" stroke="#cbd5e1" strokeWidth="1" fill="#ffffff" />
        <circle cx="107" cy="145" r="3" stroke="#cbd5e1" strokeWidth="1" fill="#ffffff" />
        <text x="45" y="165" fill="#64748b" fontSize="8" fontFamily="sans-serif" fontWeight="600">LIVING & DINING</text>

        {/* Kitchen / Bathroom */}
        <rect x="130" y="85" width="55" height="50" stroke="#334155" strokeWidth="1.8" fill="#ffffff" />
        <text x="142" y="112" fill="#64748b" fontSize="7" fontFamily="sans-serif">KITCHEN</text>

        {/* Bathroom */}
        <rect x="130" y="135" width="55" height="50" stroke="#334155" strokeWidth="1.8" fill="#ffffff" />
        <rect x="155" y="145" width="20" height="30" rx="4" stroke="#cbd5e1" strokeWidth="1.2" fill="#f1f5f9" />
        <text x="138" y="165" fill="#64748b" fontSize="7" fontFamily="sans-serif">BATH</text>

        {/* Doors arcs */}
        <path d="M 75 40 A 15 15 0 0 1 90 25" stroke="#94a3b8" strokeWidth="1" fill="none" />
        <path d="M 130 40 A 15 15 0 0 1 145 25" stroke="#94a3b8" strokeWidth="1" fill="none" />
        <path d="M 130 110 A 15 15 0 0 1 145 95" stroke="#94a3b8" strokeWidth="1" fill="none" />

        {/* Scale stamp */}
        <rect x="20" y="172" width="25" height="8" fill="#e2e8f0" rx="1" />
        <text x="23" y="178" fill="#475569" fontSize="6" fontFamily="sans-serif" fontWeight="700">195 m²</text>
      </svg>
    );
  }

  if (variant === 2) {
    // 1-bedroom suite layout (like #DXB-04217)
    return (
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${className} bg-[#fcfcfd] border border-gray-200/60 rounded-lg p-1.5 select-none`}
      >
        <rect x="20" y="20" width="160" height="160" stroke="#1e293b" strokeWidth="2.5" fill="#ffffff" />
        
        {/* Balcony */}
        <rect x="20" y="20" width="80" height="40" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 2" fill="#f8fafc" />
        <text x="35" y="42" fill="#94a3b8" fontSize="8" fontFamily="sans-serif" fontWeight="600">BALCONY</text>

        {/* Suite Bedroom */}
        <rect x="100" y="20" width="80" height="90" stroke="#334155" strokeWidth="1.8" fill="#ffffff" />
        <rect x="115" y="35" width="45" height="40" stroke="#cbd5e1" strokeWidth="1.2" rx="2" fill="#f1f5f9" />
        <rect x="120" y="40" width="15" height="10" stroke="#cbd5e1" strokeWidth="1" rx="1" fill="#ffffff" />
        <rect x="140" y="40" width="15" height="10" stroke="#cbd5e1" strokeWidth="1" rx="1" fill="#ffffff" />
        <text x="115" y="98" fill="#64748b" fontSize="7.5" fontFamily="sans-serif">MASTER SUITE</text>

        {/* Lounge */}
        <rect x="20" y="60" width="80" height="120" stroke="#334155" strokeWidth="1.8" fill="#ffffff" />
        <path d="M 35 100 L 65 100 L 65 125 L 55 125 L 55 110 L 35 110 Z" stroke="#cbd5e1" strokeWidth="1.2" fill="#f1f5f9" />
        <text x="35" y="150" fill="#64748b" fontSize="8" fontFamily="sans-serif" fontWeight="600">LOUNGE</text>

        {/* Luxury Bath */}
        <rect x="100" y="110" width="80" height="70" stroke="#334155" strokeWidth="1.8" fill="#ffffff" />
        <ellipse cx="140" cy="145" rx="18" ry="12" stroke="#cbd5e1" strokeWidth="1.2" fill="#f8fafc" />
        <text x="122" y="172" fill="#64748b" fontSize="7.5" fontFamily="sans-serif">SPA BATH</text>

        {/* Door arc */}
        <path d="M 100 85 A 15 15 0 0 1 115 70" stroke="#94a3b8" strokeWidth="1" fill="none" />

        <rect x="25" y="165" width="22" height="8" fill="#e2e8f0" rx="1" />
        <text x="28" y="171" fill="#475569" fontSize="6" fontFamily="sans-serif" fontWeight="700">85 m²</text>
      </svg>
    );
  }

  if (variant === 3) {
    // 3-bedroom sea view layout (like #DXB-04208)
    return (
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${className} bg-[#fcfcfd] border border-gray-200/60 rounded-lg p-1.5 select-none`}
      >
        <rect x="15" y="15" width="170" height="170" stroke="#1e293b" strokeWidth="2.5" fill="#ffffff" />
        
        {/* Wraparound terrace */}
        <path d="M 15 15 L 185 15 L 185 45 L 145 45 L 145 75 L 15 75 Z" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 2" fill="#f8fafc" />
        <text x="25" y="45" fill="#94a3b8" fontSize="8" fontFamily="sans-serif" fontWeight="600">SEA VIEW TERRACE</text>

        {/* Living Hall */}
        <rect x="15" y="75" width="110" height="110" stroke="#334155" strokeWidth="1.8" fill="#ffffff" />
        <rect x="30" y="105" width="45" height="25" stroke="#cbd5e1" strokeWidth="1.2" rx="2" fill="#f1f5f9" />
        <text x="40" y="155" fill="#64748b" fontSize="8" fontFamily="sans-serif" fontWeight="600">GRAND SALON</text>

        {/* Bedroom East */}
        <rect x="125" y="45" width="60" height="70" stroke="#334155" strokeWidth="1.8" fill="#ffffff" />
        <rect x="135" y="55" width="35" height="30" stroke="#cbd5e1" strokeWidth="1.2" rx="2" fill="#f1f5f9" />
        <text x="135" y="102" fill="#64748b" fontSize="7" fontFamily="sans-serif">BEDROOM 1</text>

        {/* Bedroom West */}
        <rect x="125" y="115" width="60" height="70" stroke="#334155" strokeWidth="1.8" fill="#ffffff" />
        <rect x="135" y="125" width="35" height="30" stroke="#cbd5e1" strokeWidth="1.2" rx="2" fill="#f1f5f9" />
        <text x="135" y="172" fill="#64748b" fontSize="7" fontFamily="sans-serif">BEDROOM 2</text>

        <rect x="22" y="170" width="25" height="8" fill="#e2e8f0" rx="1" />
        <text x="25" y="176" fill="#475569" fontSize="6" fontFamily="sans-serif" fontWeight="700">120 m²</text>
      </svg>
    );
  }

  // Variant 4: 2-bedroom serviced (like #DXB-04207)
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} bg-[#fcfcfd] border border-gray-200/60 rounded-lg p-1.5 select-none`}
    >
      <rect x="18" y="18" width="164" height="164" stroke="#1e293b" strokeWidth="2.5" fill="#ffffff" />
      
      {/* Balcony */}
      <rect x="18" y="18" width="60" height="45" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 2" fill="#f8fafc" />
      <text x="25" y="42" fill="#94a3b8" fontSize="8" fontFamily="sans-serif" fontWeight="600">DECK</text>

      {/* Bed Suite */}
      <rect x="78" y="18" width="104" height="75" stroke="#334155" strokeWidth="1.8" fill="#ffffff" />
      <rect x="100" y="30" width="50" height="35" stroke="#cbd5e1" strokeWidth="1.2" rx="2" fill="#f1f5f9" />
      <text x="105" y="80" fill="#64748b" fontSize="7.5" fontFamily="sans-serif">SUITE 1</text>

      {/* Living */}
      <rect x="18" y="63" width="95" height="119" stroke="#334155" strokeWidth="1.8" fill="#ffffff" />
      <rect x="30" y="100" width="40" height="25" stroke="#cbd5e1" strokeWidth="1.2" rx="2" fill="#f1f5f9" />
      <text x="35" y="145" fill="#64748b" fontSize="8" fontFamily="sans-serif" fontWeight="600">LIVING</text>

      {/* Bed 2 */}
      <rect x="113" y="93" width="69" height="89" stroke="#334155" strokeWidth="1.8" fill="#ffffff" />
      <rect x="125" y="115" width="40" height="30" stroke="#cbd5e1" strokeWidth="1.2" rx="2" fill="#f1f5f9" />
      <text x="128" y="165" fill="#64748b" fontSize="7" fontFamily="sans-serif">SUITE 2</text>

      <rect x="25" y="168" width="22" height="8" fill="#e2e8f0" rx="1" />
      <text x="28" y="174" fill="#475569" fontSize="6" fontFamily="sans-serif" fontWeight="700">90 m²</text>
    </svg>
  );
};
