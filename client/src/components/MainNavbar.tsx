import React, { useEffect, useState, useRef } from 'react';
import { 
  Menu, 
  Heart, 
  Briefcase, 
  MessageSquare, 
  User, 
  Settings, 
  Globe, 
  HelpCircle, 
  LogOut, 
  Building2,
  X,
  Check,
  Bell
} from 'lucide-react';

interface MainNavbarProps {
  activePage: 'overview' | 'dashboard' | 'wishlists';
  setActivePage: (page: 'overview' | 'dashboard' | 'wishlists') => void;
  isOverDashboard?: boolean;
}

export const MainNavbar: React.FC<MainNavbarProps> = ({ 
  activePage, 
  setActivePage,
  isOverDashboard = false
}) => {
  const [mounted, setMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<
    'messages' | 'profile' | 'notifications' | 'settings' | 'currency' | 'help' | 'supplier' | 'referral' | 'cohost' | null
  >(null);
  const [selectedCurrency, setSelectedCurrency] = useState('USD ($)');
  const [selectedLanguage, setSelectedLanguage] = useState('English (US)');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Trigger entrance animation after hydration
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Only Overview & Dashboard in the center navbar (Wishlists is exclusively accessed via hamburger)
  const navTabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'dashboard', label: 'Dashboard' },
  ] as const;

  return (
    <>
      <header 
        role="navigation"
        aria-label="Main navigation"
        className={`fixed top-0 left-0 right-0 z-40 h-[56px] px-6 sm:px-8 flex items-center justify-between select-none font-sans transition-all duration-500 ease-spring ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
        } ${
          isOverDashboard
            ? 'bg-[#F4FAF5]/90 backdrop-blur-xl backdrop-saturate-150 border-b border-[#D2EBD9]/80 text-stone-900 shadow-2xs'
            : 'bg-black/30 backdrop-blur-xl backdrop-saturate-150 border-b border-white/[0.08] text-white'
        }`}
      >
        {/* Left: TBO Brand Mark */}
        <div className="flex items-center min-w-[140px]">
          <button
            onClick={() => setActivePage('overview')}
            className={`flex items-center gap-2 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer ${
              isOverDashboard ? 'text-stone-950' : 'text-white'
            }`}
            title="Go to Overview"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] inline-block shadow-sm ring-2 ring-[#EF4444]/25 shrink-0" />
            <span className="text-[17px] tracking-[-0.03em] font-extrabold leading-none">
              TBO
            </span>
          </button>
        </div>

        {/* Center: Two Main Navigation Tabs (Overview | Dashboard) */}
        <nav role="tablist" aria-label="Page sections" className="flex items-center justify-center gap-8 text-[1rem]">
          {navTabs.map((tab) => {
            const isActive = activePage === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`${tab.id}-section`}
                onClick={() => setActivePage(tab.id)}
                className={`relative py-1 font-medium transition-colors duration-200 tracking-[-0.01em] cursor-pointer text-[1rem] ${
                  isActive
                    ? isOverDashboard
                      ? 'text-stone-950 font-bold'
                      : 'text-white font-bold'
                    : isOverDashboard
                      ? 'text-stone-400 hover:text-stone-800'
                      : 'text-stone-300 hover:text-white'
                }`}
              >
                <span className="text-[1rem] leading-none">{tab.label}</span>
                {/* Animated underline indicator */}
                <span 
                  className={`absolute -bottom-1 left-0 h-[2px] rounded-full transition-all duration-300 ease-spring ${
                    isActive 
                      ? `w-full ${isOverDashboard ? 'bg-stone-950' : 'bg-white'}`
                      : 'w-0 bg-transparent'
                  }`}
                />
              </button>
            );
          })}
        </nav>

        {/* Right: Separate Profile Icon (Left) & Hamburger Menu Button (Extreme Right) */}
        <div ref={menuRef} className="relative flex items-center justify-end gap-2 min-w-[140px]">
          
          {/* 1. Profile Avatar Icon (Directly on the left of the hamburger) */}
          <button
            type="button"
            onClick={() => {
              setActiveModal('profile');
              setIsMenuOpen(false);
            }}
            aria-label="User profile"
            className="w-8 h-8 rounded-full bg-[#E5D5F2] hover:bg-[#DAC4EC] text-[#4A2574] font-bold text-xs flex items-center justify-center shrink-0 select-none shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title="David Vance (Chief Procurement Officer)"
          >
            D
          </button>

          {/* 2. Hamburger Menu Button (On the extreme right) */}
          <button
            type="button"
            onClick={() => setIsMenuOpen(prev => !prev)}
            aria-expanded={isMenuOpen}
            aria-label="Main navigation menu"
            className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-200 cursor-pointer shadow-xs ${
              isMenuOpen
                ? 'bg-stone-900 text-white border-stone-900'
                : isOverDashboard
                ? 'bg-white hover:bg-stone-100 border-stone-300 text-stone-800 hover:border-stone-400'
                : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
            }`}
            title="Menu"
          >
            <Menu className="w-4 h-4 stroke-[2.2]" />
          </button>

          {/* ─── Airbnb Dropdown Menu (Exact Replica of Reference Image media_1795076077686_405b4488.png) ─── */}
          {isMenuOpen && (
            <div className="absolute top-full right-0 mt-2.5 w-72 bg-white rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.16)] border border-stone-200/90 py-2 z-50 text-left animate-scale-in text-stone-800 font-sans">
              
              {/* Primary Section */}
              <div className="py-1">
                {/* 1. Wishlists -> Opens Wishlists Page (Matching Airbnb) */}
                <button
                  type="button"
                  onClick={() => {
                    setActivePage('wishlists');
                    setIsMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3.5 px-4 py-2.5 hover:bg-stone-50 transition-colors text-sm text-left cursor-pointer ${
                    activePage === 'wishlists' ? 'font-bold text-stone-950 bg-stone-50' : 'font-medium'
                  }`}
                >
                  <Heart className="w-4 h-4 text-stone-700 stroke-[2]" />
                  <span>Wishlists</span>
                </button>

                {/* 2. Trips & Allotments -> Opens Dashboard */}
                <button
                  type="button"
                  onClick={() => {
                    setActivePage('dashboard');
                    setIsMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3.5 px-4 py-2.5 hover:bg-stone-50 transition-colors text-sm text-left cursor-pointer ${
                    activePage === 'dashboard' ? 'font-bold text-stone-950 bg-stone-50' : 'font-medium'
                  }`}
                >
                  <Briefcase className="w-4 h-4 text-stone-700 stroke-[2]" />
                  <span>Trips & Allotments</span>
                </button>

                {/* 3. Messages */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveModal('messages');
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3.5 px-4 py-2.5 hover:bg-stone-50 transition-colors text-sm font-medium text-left cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-stone-700 stroke-[2]" />
                  <span>Messages</span>
                </button>

                {/* 4. Profile */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveModal('profile');
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3.5 px-4 py-2.5 hover:bg-stone-50 transition-colors text-sm font-medium text-left cursor-pointer"
                >
                  <User className="w-4 h-4 text-stone-700 stroke-[2]" />
                  <span>Profile</span>
                </button>
              </div>

              {/* Divider 1 */}
              <div className="h-[1px] bg-stone-150 my-1" />

              {/* Utility & Settings Section */}
              <div className="py-1">
                {/* 5. Notifications */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveModal('notifications');
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3.5 px-4 py-2.5 hover:bg-stone-50 transition-colors text-sm font-medium text-left cursor-pointer"
                >
                  <Bell className="w-4 h-4 text-stone-700 stroke-[2]" />
                  <span>Notifications</span>
                </button>

                {/* 6. Account settings */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveModal('settings');
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3.5 px-4 py-2.5 hover:bg-stone-50 transition-colors text-sm font-medium text-left cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-stone-700 stroke-[2]" />
                  <span>Account settings</span>
                </button>

                {/* 7. Languages & currency */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveModal('currency');
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3.5 px-4 py-2.5 hover:bg-stone-50 transition-colors text-sm font-medium text-left cursor-pointer"
                >
                  <Globe className="w-4 h-4 text-stone-700 stroke-[2]" />
                  <span>Languages & currency</span>
                </button>

                {/* 8. Help Centre */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveModal('help');
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3.5 px-4 py-2.5 hover:bg-stone-50 transition-colors text-sm font-medium text-left cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4 text-stone-700 stroke-[2]" />
                  <span>Help Centre</span>
                </button>
              </div>

              {/* Divider 2 */}
              <div className="h-[1px] bg-stone-150 my-1" />

              {/* Supplier Section (Exact Card + Partner links from reference) */}
              <div className="py-1">
                <div 
                  onClick={() => {
                    setActiveModal('supplier');
                    setIsMenuOpen(false);
                  }}
                  className="px-4 py-2.5 hover:bg-stone-50 transition-colors cursor-pointer group flex items-start justify-between"
                >
                  <div className="pr-2">
                    <div className="text-xs font-bold text-stone-900 group-hover:text-black leading-snug">
                      Become a supplier
                    </div>
                    <div className="text-[11px] text-stone-500 font-normal leading-tight mt-0.5">
                      Supply wholesale rooms to TBO's algorithmic liquidity pool.
                    </div>
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 mt-0.5">
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveModal('referral');
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-stone-50 text-xs font-medium text-stone-700 cursor-pointer"
                >
                  Refer a supplier
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveModal('cohost');
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-stone-50 text-xs font-medium text-stone-700 cursor-pointer"
                >
                  Find an agentic co-host
                </button>
              </div>

              {/* Divider 3 */}
              <div className="h-[1px] bg-stone-150 my-1" />

              {/* Log out */}
              <div className="pt-1 pb-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setActivePage('overview');
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-stone-50 text-xs font-medium text-stone-700 hover:text-red-600 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-stone-500" />
                  <span>Log out</span>
                </button>
              </div>

            </div>
          )}

        </div>
      </header>

      {/* ─── Modal Dialogs for All Hamburger Menu Tabs ─── */}

      {/* 1. Languages & Currency Modal */}
      {activeModal === 'currency' && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-elevation-4 border border-stone-200 max-w-lg w-full p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-stone-900">Languages & currency</h3>
              <button 
                onClick={() => setActiveModal(null)} 
                className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-500 hover:text-stone-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="mb-5">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-2">Currency</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'USD ($)', label: 'United States Dollar' },
                  { id: 'EUR (€)', label: 'Euro' },
                  { id: 'GBP (£)', label: 'British Pound' },
                  { id: 'INR (₹)', label: 'Indian Rupee' },
                  { id: 'AED (AED)', label: 'Emirati Dirham' },
                  { id: 'JPY (¥)', label: 'Japanese Yen' },
                ].map((cur) => (
                  <button
                    key={cur.id}
                    onClick={() => setSelectedCurrency(cur.id)}
                    className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-colors cursor-pointer ${
                      selectedCurrency === cur.id ? 'border-stone-900 bg-stone-50' : 'border-stone-200 hover:border-stone-400'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-stone-900">{cur.id}</div>
                      <div className="text-[11px] text-stone-500">{cur.label}</div>
                    </div>
                    {selectedCurrency === cur.id && <Check className="w-4 h-4 text-stone-900" />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-2">Language & Region</span>
              <div className="grid grid-cols-2 gap-2">
                {['English (US)', 'English (UK)', 'Español', 'Français', 'Deutsch', 'हिन्दी'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setSelectedLanguage(lang)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                      selectedLanguage === lang ? 'border-stone-900 bg-stone-50 font-bold' : 'border-stone-200 hover:border-stone-400'
                    }`}
                  >
                    <span>{lang}</span>
                    {selectedLanguage === lang && <Check className="w-3.5 h-3.5 text-stone-900" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Account Settings Modal */}
      {activeModal === 'settings' && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-elevation-4 border border-stone-200 max-w-md w-full p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-stone-900">Account settings</h3>
              <button onClick={() => setActiveModal(null)} className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-500 hover:text-stone-900 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80">
                <span className="text-[10px] font-bold uppercase text-stone-400 block mb-0.5">Organization</span>
                <span className="text-xs font-bold text-stone-900">TBO Global Wholesale Travel Network</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80">
                <span className="text-[10px] font-bold uppercase text-stone-400 block mb-0.5">Optimization Engine</span>
                <span className="text-xs font-bold text-stone-900">LightGBM Pinball Quantile + PuLP MILP</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80">
                <span className="text-[10px] font-bold uppercase text-stone-400 block mb-0.5">Risk Threshold</span>
                <span className="text-xs font-bold text-emerald-700 font-mono">Conservative Floor (P10) &bull; Maximum Room Allotments</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80">
                <span className="text-[10px] font-bold uppercase text-stone-400 block mb-0.5">API REST Gateway</span>
                <span className="text-xs font-mono text-stone-700">https://api.tbo.internal/v1/optimize</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Messages Modal */}
      {activeModal === 'messages' && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-elevation-4 border border-stone-200 max-w-md w-full p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-stone-900">Supplier Messages & RFQs</h3>
              <button onClick={() => setActiveModal(null)} className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-500 hover:text-stone-900 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2.5">
              {[
                { sender: 'Marriott Lisbon Central', time: '10m ago', msg: 'Allotment release confirmed for 45 rooms at €165/night.' },
                { sender: 'Hilton Tokyo Shinjuku', time: '1h ago', msg: 'Wholesale batch inquiry approved with 18% margin discount.' },
                { sender: 'Taj Heritage Goa', time: '3h ago', msg: 'Holiday peak season demand surge notice attached.' },
              ].map((m, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-stone-50 hover:bg-stone-100 border border-stone-200/70 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-stone-900">{m.sender}</span>
                    <span className="text-[10px] text-stone-400 font-mono">{m.time}</span>
                  </div>
                  <p className="text-xs text-stone-600 line-clamp-2">{m.msg}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Profile Modal */}
      {activeModal === 'profile' && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-elevation-4 border border-stone-200 max-w-sm w-full p-6 animate-scale-in text-center">
            <div className="flex justify-end mb-2">
              <button onClick={() => setActiveModal(null)} className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-500 hover:text-stone-900 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="w-16 h-16 rounded-full bg-[#E5D5F2] text-[#4A2574] font-black text-xl flex items-center justify-center mx-auto mb-3 shadow-sm">
              D
            </div>
            <h3 className="text-base font-extrabold text-stone-900">David Vance</h3>
            <p className="text-xs text-stone-500 font-medium mb-4">Chief Procurement & Revenue Officer</p>
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-left text-xs space-y-1.5 mb-4">
              <div className="flex justify-between"><span className="text-stone-400">Trading Desk:</span><span className="font-bold text-stone-900">Global Wholesale Allotments</span></div>
              <div className="flex justify-between"><span className="text-stone-400">Capital Limit:</span><span className="font-bold font-mono text-stone-900">$2,500,000</span></div>
              <div className="flex justify-between"><span className="text-stone-400">Active Deals:</span><span className="font-bold text-emerald-600">8 Markets</span></div>
            </div>
            <button 
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 rounded-full bg-stone-900 hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* 5. Notifications Modal */}
      {activeModal === 'notifications' && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-elevation-4 border border-stone-200 max-w-md w-full p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-stone-900">Opportunity & Risk Notifications</h3>
              <button onClick={() => setActiveModal(null)} className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-500 hover:text-stone-900 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2.5">
              {[
                { title: 'Newsvendor Reallocation Alert', text: 'Lisbon hotel rates projected to climb 18.5% over the next 45 days. Increased allotment recommendation from 35 to 55 rooms.', tag: 'Opportunity' },
                { title: 'Cancellation Risk Alert (Dubai)', text: 'Isotonic calibration flagged 24% cancellation rate on non-refundable corporate allotments in Dubai Marina.', tag: 'Risk' },
              ].map((n, i) => (
                <div key={i} className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/70">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-stone-900">{n.title}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${n.tag === 'Opportunity' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {n.tag}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600">{n.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. Help Centre Modal */}
      {activeModal === 'help' && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-elevation-4 border border-stone-200 max-w-lg w-full p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-stone-900">Help Centre & Optimization Guide</h3>
              <button onClick={() => setActiveModal(null)} className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-500 hover:text-stone-900 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1 text-xs text-stone-700">
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200">
                <div className="font-bold text-stone-900 mb-1">How is Q* Calculated?</div>
                <p className="text-stone-600">The Newsvendor model balances underage cost Cu against overage cost Co using critical fractile CF = Cu / (Cu + Co).</p>
              </div>
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200">
                <div className="font-bold text-stone-900 mb-1">What is the 95% Value-at-Risk (VaR)?</div>
                <p className="text-stone-600">Our 2,000-run Monte Carlo engine determines worst-case capital drawdown under stochastic demand and cancellation shocks.</p>
              </div>
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200">
                <div className="font-bold text-stone-900 mb-1">How does the Hard Budget Cap ($B$) operate?</div>
                <p className="text-stone-600">The PuLP MILP solver strictly bounds total procurement outlay $\sum c_i q_i \le B$ across selected hotels.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Supplier Onboarding Modal */}
      {activeModal === 'supplier' && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-elevation-4 border border-stone-200 max-w-md w-full p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-stone-900">Become a Wholesale Supplier</h3>
              <button onClick={() => setActiveModal(null)} className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-500 hover:text-stone-900 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-stone-500 mb-4">
              Connect your CRS/PMS (Amadeus, Sabre, Oracle Opera) directly to TBO's algorithmic procurement liquidity pool.
            </p>
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 mb-4 space-y-2 text-xs">
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /><span>Guaranteed wholesale allotment liquidity</span></div>
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /><span>Automated dynamic clearance & pacing</span></div>
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /><span>Instant settlements & locked margins</span></div>
            </div>
            <button 
              onClick={() => {
                setActiveModal(null);
                setActivePage('dashboard');
              }}
              className="w-full py-2.5 rounded-full bg-stone-900 hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Start Supplier Onboarding
            </button>
          </div>
        </div>
      )}

      {/* 8. Referral & Co-host Modals */}
      {(activeModal === 'referral' || activeModal === 'cohost') && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-elevation-4 border border-stone-200 max-w-md w-full p-6 animate-scale-in text-center">
            <div className="flex justify-end mb-2">
              <button onClick={() => setActiveModal(null)} className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-500 hover:text-stone-900 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <h3 className="text-base font-bold text-stone-900 mb-2">
              {activeModal === 'referral' ? 'Partner Referral Program' : 'Agentic Swarms & Copilot Access'}
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              {activeModal === 'referral' 
                ? 'Refer hoteliers and wholesale chains to earn liquidity rewards across our travel network.'
                : 'Empower multi-agent swarms to independently monitor price pacing, execute clearance markdowns, and arbitrate OTA spreads.'}
            </p>
            <button 
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 rounded-full bg-stone-900 hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default MainNavbar;
