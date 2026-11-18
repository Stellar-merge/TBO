import React from 'react';
import { Search, Bell, MoreHorizontal, ChevronDown } from 'lucide-react';

interface TopHeaderProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCountry: string;
  setSelectedCountry: (c: string) => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  searchQuery,
  setSearchQuery,
  selectedCountry,
  setSelectedCountry,
}) => {
  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-20">
      {/* Search Input matching screenshot */}
      <div className="flex-1 max-w-lg">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by client, phone or property ID"
            className="w-full bg-transparent pl-9 pr-4 py-2 text-xs md:text-sm text-gray-800 placeholder-gray-400 focus:outline-hidden transition"
          />
        </div>
      </div>

      {/* Right Controls: Country selector, Notifications, Triple dots */}
      <div className="flex items-center gap-3">
        {/* Country & Currency Selector */}
        <div className="relative">
          <button 
            onClick={() => setSelectedCountry(selectedCountry === 'United Arab Emirates' ? 'Global' : 'United Arab Emirates')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200/80 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 transition"
          >
            <span className="text-sm">🇦🇪</span>
            <span className="hidden sm:inline">{selectedCountry}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </div>

        {/* Notifications */}
        <button 
          aria-label="Notifications"
          className="relative p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition border border-gray-200/80"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1.5 right-1.5 ring-2 ring-white" />
        </button>

        {/* Triple Dots */}
        <button 
          aria-label="More options"
          className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition border border-gray-200/80"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
