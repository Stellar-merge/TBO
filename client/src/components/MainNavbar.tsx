import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';

interface MainNavbarProps {
  activePage: 'overview' | 'dashboard';
  setActivePage: (page: 'overview' | 'dashboard') => void;
  isOverDashboard?: boolean;
}

export const MainNavbar: React.FC<MainNavbarProps> = ({ 
  activePage, 
  setActivePage,
  isOverDashboard = false
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Trigger entrance animation after hydration
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const navTabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'dashboard', label: 'Dashboard' },
  ] as const;

  return (
    <header 
      role="navigation"
      aria-label="Main navigation"
      className={`fixed top-0 left-0 right-0 z-40 h-[52px] px-6 sm:px-8 flex items-center justify-between select-none font-sans transition-all duration-500 ease-spring ${
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      } ${
        isOverDashboard
          ? 'bg-white/90 backdrop-blur-xl backdrop-saturate-150 border-b border-gray-200/80 text-gray-900 shadow-elevation-1'
          : 'bg-black/25 backdrop-blur-xl backdrop-saturate-150 border-b border-white/[0.08] text-white'
      }`}
    >
      {/* Left: TBO Brand Mark (Matches reference screenshot) */}
      <div className="flex items-center min-w-[140px]">
        <button
          onClick={() => setActivePage('overview')}
          className={`flex items-center gap-2 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer ${
            isOverDashboard ? 'text-gray-950' : 'text-white'
          }`}
          title="Go to Overview"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] inline-block shadow-sm ring-2 ring-[#EF4444]/25 shrink-0" />
          <span className="text-[16px] tracking-[-0.025em] font-extrabold leading-none">
            TBO
          </span>
        </button>
      </div>

      {/* Center: Two Page Tabs with animated underline (Overview | Dashboard) */}
      <nav role="tablist" aria-label="Page sections" className="flex items-center justify-center gap-8 text-[13px]">
        {navTabs.map((tab) => {
          const isActive = activePage === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`${tab.id}-section`}
              onClick={() => setActivePage(tab.id)}
              className={`relative py-1 font-medium transition-colors duration-200 tracking-[-0.01em] cursor-pointer ${
                isActive
                  ? isOverDashboard
                    ? 'text-gray-950 font-semibold'
                    : 'text-white font-semibold'
                  : isOverDashboard
                    ? 'text-gray-400 hover:text-gray-800'
                    : 'text-gray-300 hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              {/* Animated underline indicator */}
              <span 
                className={`absolute -bottom-1 left-0 h-[2px] rounded-full transition-all duration-300 ease-spring ${
                  isActive 
                    ? `w-full ${isOverDashboard ? 'bg-[#EF4444]' : 'bg-white'}`
                    : 'w-0 bg-transparent'
                }`}
              />
            </button>
          );
        })}
      </nav>

      {/* Right: Notifications & User Profile (Matches reference screenshot with $) */}
      <div className="flex items-center justify-end gap-3 min-w-[140px]">
        {/* Notification Bell with red indicator */}
        <button
          type="button"
          aria-label="View notifications"
          className={`relative p-2 rounded-full transition-colors duration-200 focus-visible:outline-none cursor-pointer ${
            isOverDashboard
              ? 'text-gray-600 hover:text-gray-950 hover:bg-gray-100'
              : 'text-gray-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <Bell className="w-4 h-4 stroke-[1.8]" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#EF4444] rounded-full ring-2 ring-black/40" />
        </button>

        {/* User Avatar Circle with '$' (Matches reference screenshot) */}
        <div 
          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold cursor-pointer transition-transform duration-200 hover:scale-105 select-none ${
            isOverDashboard
              ? 'bg-gray-100 border border-gray-200 text-gray-700 shadow-sm'
              : 'bg-white/10 border border-white/20 text-white shadow-xs backdrop-blur-md'
          }`}
          title="Account profile"
        >
          $
        </div>
      </div>
    </header>
  );
};

export default MainNavbar;