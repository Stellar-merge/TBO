import React from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';

interface TopNavbarProps {
  onRunOptimization: () => void;
  isOptimizing?: boolean;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ onRunOptimization, isOptimizing }) => {
  return (
    <header className="h-14 bg-white border-b border-gray-150 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-30 select-none">
      
      {/* Left Menu Items matching screenshot */}
      <nav className="flex items-center gap-5 text-xs text-gray-700 font-medium">
        <button className="flex items-center gap-1 hover:text-gray-950 transition">
          <span>Hotels</span>
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </button>
        <button className="flex items-center gap-1 hover:text-gray-950 transition">
          <span>Flights</span>
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </button>
        <button className="flex items-center gap-1 hover:text-gray-950 transition">
          <span>Destinations</span>
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </button>
        <button className="flex items-center gap-1 hover:text-gray-950 transition">
          <span>Travel Periods</span>
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </button>
        <button className="flex items-center gap-1 hover:text-gray-950 transition">
          <span>Suppliers</span>
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </button>
      </nav>

      {/* Center: TBO Brand Logo */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
        <span className="text-base font-extrabold tracking-tight text-gray-950">
          TBO
        </span>
      </div>

      {/* Right Menu Items + Run Optimization Button */}
      <div className="flex items-center gap-5 text-xs text-gray-700 font-medium">
        <button className="flex items-center gap-1 hover:text-gray-950 transition">
          <span>Analytics</span>
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </button>
        <button className="flex items-center gap-1 hover:text-gray-950 transition">
          <span>Reports</span>
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </button>
        <button className="flex items-center gap-1 hover:text-gray-950 transition">
          <span>Settings</span>
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </button>

        {/* Run Optimization Button matching reference */}
        <button
          onClick={onRunOptimization}
          disabled={isOptimizing}
          className="ml-2 px-3.5 py-1.5 rounded-md bg-gray-950 hover:bg-gray-800 text-white font-semibold text-xs shadow-2xs transition active:scale-98 flex items-center gap-1.5 disabled:opacity-70"
        >
          {isOptimizing ? (
            <>
              <Sparkles className="w-3 h-3 animate-spin" />
              <span>Optimizing...</span>
            </>
          ) : (
            <span>Run Optimization</span>
          )}
        </button>
      </div>

    </header>
  );
};
