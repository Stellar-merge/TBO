import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  LayoutGrid, 
  ShoppingCart, 
  BarChart3, 
  Settings,
  MoreVertical,
  Menu,
  X
} from 'lucide-react';

export type SidebarNavItem = 'dashboard' | 'procurement' | 'insights' | 'settings';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  activeItem?: SidebarNavItem;
  onNavigate?: (item: SidebarNavItem) => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen,
  onToggle,
  onClose,
  activeItem = 'dashboard', 
  onNavigate,
  className = ''
}) => {
  const [currentActive, setCurrentActive] = useState<SidebarNavItem>(activeItem);

  useEffect(() => {
    setCurrentActive(activeItem);
  }, [activeItem]);

  const handleItemClick = (item: SidebarNavItem) => {
    setCurrentActive(item);
    if (onNavigate) {
      onNavigate(item);
    }
  };

  return (
    <>
      {/* ─── Translucent click-away backdrop (dismisses sidebar when clicking outside) ─── */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1.5px] transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* ─── Floating Frosted Glass Sidebar Drawer ─── */}
      <aside 
        className={`fixed top-0 left-0 bottom-0 w-72 h-screen z-50 flex flex-col justify-between font-sans select-none transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } bg-slate-950/75 backdrop-blur-2xl border-r border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.65)] text-white ${className}`}
        aria-label="Sidebar navigation"
        aria-hidden={!isOpen}
      >
        {/* ─── Top & Middle Container ─── */}
        <div className="flex flex-col flex-1 min-h-0">
          
          {/* Top Section: 3-Bar Toggle + Brand Logo Area */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              {/* 3-bar toggle button inside sidebar (folds back on 2nd click) */}
              <button
                type="button"
                onClick={onToggle}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                aria-label="Fold menu"
                title="Fold menu (click 3 bars)"
              >
                <Menu className="w-5 h-5 stroke-[2.2]" />
              </button>

              {/* Minimalist Green Compass Icon */}
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-xs">
                <Compass className="w-5 h-5 text-emerald-400 stroke-[2.2]" />
              </div>

              {/* Bold Brand Text */}
              <span className="font-bold text-white text-base tracking-tight">
                Meridian B2B
              </span>
            </div>

            {/* Quick Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 active:scale-95 transition-colors cursor-pointer"
              aria-label="Close sidebar"
              title="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Middle Section: Vertical Navigation Links with Ample Spacing */}
          <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto" aria-label="Main menu">
            
            {/* 1. Dashboard */}
            <button
              type="button"
              onClick={() => handleItemClick('dashboard')}
              className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-lg text-sm transition-all duration-150 cursor-pointer ${
                currentActive === 'dashboard'
                  ? 'bg-emerald-500/20 border border-emerald-500/35 text-emerald-300 font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10 font-medium'
              }`}
              aria-current={currentActive === 'dashboard' ? 'page' : undefined}
            >
              <LayoutGrid 
                className={`w-4 h-4 shrink-0 transition-colors ${
                  currentActive === 'dashboard' ? 'text-emerald-400 stroke-[2.4]' : 'text-slate-400'
                }`} 
              />
              <span className="truncate">Dashboard</span>
            </button>

            {/* 2. Procurement (with red notification badge '3') */}
            <button
              type="button"
              onClick={() => handleItemClick('procurement')}
              className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-lg text-sm transition-all duration-150 cursor-pointer ${
                currentActive === 'procurement'
                  ? 'bg-emerald-500/20 border border-emerald-500/35 text-emerald-300 font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10 font-medium'
              }`}
              aria-current={currentActive === 'procurement' ? 'page' : undefined}
            >
              <div className="relative inline-flex items-center justify-center shrink-0">
                <ShoppingCart 
                  className={`w-4 h-4 transition-colors ${
                    currentActive === 'procurement' ? 'text-emerald-400 stroke-[2.4]' : 'text-slate-400'
                  }`} 
                />
                {/* Notification Badge '3' on top right of icon */}
                <span 
                  className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none shadow-xs pointer-events-none"
                  aria-label="3 new procurement notifications"
                >
                  3
                </span>
              </div>
              <span className="truncate">Procurement</span>
            </button>

            {/* 3. Insights (Inactive, simple bar chart icon) */}
            <button
              type="button"
              onClick={() => handleItemClick('insights')}
              className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-lg text-sm transition-all duration-150 cursor-pointer ${
                currentActive === 'insights'
                  ? 'bg-emerald-500/20 border border-emerald-500/35 text-emerald-300 font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10 font-medium'
              }`}
              aria-current={currentActive === 'insights' ? 'page' : undefined}
            >
              <BarChart3 
                className={`w-4 h-4 shrink-0 transition-colors ${
                  currentActive === 'insights' ? 'text-emerald-400 stroke-[2.4]' : 'text-slate-400'
                }`} 
              />
              <span className="truncate">Insights</span>
            </button>

            {/* 4. Settings (Inactive, gear/cogwheel icon) */}
            <button
              type="button"
              onClick={() => handleItemClick('settings')}
              className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-lg text-sm transition-all duration-150 cursor-pointer ${
                currentActive === 'settings'
                  ? 'bg-emerald-500/20 border border-emerald-500/35 text-emerald-300 font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10 font-medium'
              }`}
              aria-current={currentActive === 'settings' ? 'page' : undefined}
            >
              <Settings 
                className={`w-4 h-4 shrink-0 transition-colors ${
                  currentActive === 'settings' ? 'text-emerald-400 stroke-[2.4]' : 'text-slate-400'
                }`} 
              />
              <span className="truncate">Settings</span>
            </button>

          </nav>
        </div>

        {/* ─── Bottom Section: User Profile Card with Subtle Top Border ─── */}
        <div className="p-4 border-t border-white/10 shrink-0">
          <div className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group">
            
            <div className="flex items-center gap-3 min-w-0">
              {/* Circular Avatar of Professional Woman */}
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80"
                alt="Sarah Jenkins"
                className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-white/20 shadow-xs"
                loading="lazy"
              />
              
              {/* User Info */}
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-white truncate leading-tight group-hover:text-emerald-300 transition-colors">
                  Sarah Jenkins
                </span>
                <span className="text-[11px] text-slate-400 font-normal truncate leading-tight mt-0.5">
                  Senior Inventory Manager
                </span>
              </div>
            </div>

            <MoreVertical className="w-4 h-4 text-slate-400 group-hover:text-white shrink-0" />
          </div>
        </div>

      </aside>
    </>
  );
};

export default Sidebar;