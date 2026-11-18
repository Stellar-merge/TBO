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

  return (
    <header 
      role="navigation"
      aria-label="Main navigation"
      className={`fixed top-0 left-0 right-0 z-50 w-full h-[52px] px-6 sm:px-8 flex items-center justify-between select-none font-sans transition-all duration-500 ease-spring ${
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      } ${
        isOverDashboard
          ? 'bg-white/80 backdrop-blur-xl backdrop-saturate-150 border-b border-gray-200/70 text-gray-900 shadow-elevation-1'
          : 'bg-black/25 backdrop-blur-xl backdrop-saturate-150 border-b border-white/[0.08] text-white'
      }`}
    >
      {/* Left: TBO Brand + 2 Page Tabs */}
      <div className="flex items-center gap-7">
        {/* Brand Logo */}
        <button
          onClick={() => setActivePage('overview')}
          className={`text-sm font-extrabold tracking-tight transition-all duration-200 hover:scale-105 active:scale-95 ${
            isOverDashboard ? 'text-gray-950' : 'text-white'
          }`}
        >
          TBO
        </button>

        {/* Two Page Tabs with animated underline */}
        <nav role="tablist" aria-label="Page sections" className="flex items-center gap-5 text-xs">
          {(['overview', 'dashboard'] as const).map((page) => {
            const isActive = activePage === page;
            const label = page.charAt(0).toUpperCase() + page.slice(1);
            return (
              <button
                key={page}
                role="tab"
                aria-selected={isActive}
                aria-controls={`${page}-section`}
                onClick={() => setActivePage(page)}
                className={`relative py-1 font-medium transition-colors duration-200 ${
                  isActive
                    ? isOverDashboard
                      ? 'text-gray-950 font-bold'
                      : 'text-white font-bold'
                    : isOverDashboard
                      ? 'text-gray-500 hover:text-gray-900'
                      : 'text-gray-300 hover:text-white'
                }`}
              >
                <span>{label}</span>
                {/* Animated underline indicator */}
                <span 
                  className={`absolute -bottom-0.5 left-0 h-[2px] rounded-full transition-all duration-300 ease-spring ${
                    isActive 
                      ? `w-full ${isOverDashboard ? 'bg-gray-950' : 'bg-white'}`
                      : 'w-0 bg-transparent'
                  }`}
                />
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right Side: Bell + Profile */}
      <div className="flex items-center gap-3.5">
        {/* Notifications */}
        <button
          type="button"
          aria-label="Notifications"
          className={`relative p-1.5 transition-all duration-200 rounded-lg group ${
            isOverDashboard
              ? 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              : 'text-gray-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <Bell className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
          {/* Notification dot with pulse ring */}
          <span className="absolute top-1 right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
          </span>
        </button>

        {/* Profile Avatar */}
        <button
          type="button"
          aria-label="User profile"
          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] shadow-elevation-1 cursor-pointer transition-all duration-200 hover:scale-110 active:scale-95 ${
            isOverDashboard
              ? 'bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200 hover:border-gray-300'
              : 'bg-white/15 border border-white/25 text-white hover:bg-white/25 hover:border-white/40'
          }`}
        >
          S
        </button>
      </div>
    </header>
  );
};
