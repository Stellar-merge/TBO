import React from 'react';
import { 
  LayoutGrid, 
  ShieldAlert, 
  TrendingUp, 
  MessageSquare, 
  Bell, 
  Settings, 
  HelpCircle,
  ChevronsUpDown
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  return (
    <aside className="w-60 min-w-[240px] h-screen bg-white border-r border-gray-150 flex flex-col justify-between select-none fixed top-0 left-0 z-30 p-3.5 font-sans">
      
      {/* Top and Middle Navigation Container */}
      <div className="flex flex-col space-y-1">
        
        {/* Top Section: Necessary MVP Pages */}
        <div className="space-y-1">
          {/* 1. Deals Pipeline / Dashboard */}
          <button
            onClick={() => setActiveTab('deals')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition duration-150 ${
              activeTab === 'deals'
                ? 'bg-white border border-gray-200/90 shadow-2xs text-gray-900 font-semibold'
                : 'text-gray-600 hover:text-gray-950 hover:bg-gray-50/80 font-medium'
            }`}
          >
            <LayoutGrid className={`w-4 h-4 ${activeTab === 'deals' ? 'text-gray-900' : 'text-gray-500'}`} />
            <span>Deals Pipeline</span>
          </button>

          {/* 2. Risk & Budget */}
          <button
            onClick={() => setActiveTab('risk_budget')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition duration-150 ${
              activeTab === 'risk_budget'
                ? 'bg-white border border-gray-200/90 shadow-2xs text-gray-900 font-semibold'
                : 'text-gray-600 hover:text-gray-950 hover:bg-gray-50/80 font-medium'
            }`}
          >
            <ShieldAlert className={`w-4 h-4 ${activeTab === 'risk_budget' ? 'text-amber-600' : 'text-gray-500'}`} />
            <span>Risk & Budget</span>
          </button>

          {/* 3. Monitor & Pacing */}
          <button
            onClick={() => setActiveTab('monitor_pacing')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition duration-150 ${
              activeTab === 'monitor_pacing'
                ? 'bg-white border border-gray-200/90 shadow-2xs text-gray-900 font-semibold'
                : 'text-gray-600 hover:text-gray-950 hover:bg-gray-50/80 font-medium'
            }`}
          >
            <TrendingUp className={`w-4 h-4 ${activeTab === 'monitor_pacing' ? 'text-blue-600' : 'text-gray-500'}`} />
            <span>Monitor & Pacing</span>
          </button>
        </div>

        {/* Divider 1 */}
        <div className="pt-2 pb-2">
          <div className="border-t border-gray-150" />
        </div>

        {/* Middle Section: Messages & Notifications (Team removed) */}
        <div className="space-y-1">
          {/* Messages */}
          <button
            onClick={() => setActiveTab('messages')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition duration-150 ${
              activeTab === 'messages'
                ? 'bg-white border border-gray-200/90 shadow-2xs text-gray-900 font-semibold'
                : 'text-gray-600 hover:text-gray-950 hover:bg-gray-50/80 font-medium'
            }`}
          >
            <MessageSquare className={`w-4 h-4 ${activeTab === 'messages' ? 'text-gray-900' : 'text-gray-500'}`} />
            <span>Messages</span>
          </button>

          {/* Notifications with black circle badge 5 matching screenshot */}
          <button
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] transition duration-150 ${
              activeTab === 'notifications'
                ? 'bg-white border border-gray-200/90 shadow-2xs text-gray-900 font-semibold'
                : 'text-gray-600 hover:text-gray-950 hover:bg-gray-50/80 font-medium'
            }`}
          >
            <div className="flex items-center gap-3">
              <Bell className={`w-4 h-4 ${activeTab === 'notifications' ? 'text-gray-900' : 'text-gray-500'}`} />
              <span>Notifications</span>
            </div>
            {/* Black round badge matching reference */}
            <span className="w-5 h-5 rounded-full bg-gray-950 text-white text-[10px] font-bold flex items-center justify-center">
              5
            </span>
          </button>
        </div>

        {/* Divider 2 */}
        <div className="pt-2 pb-2">
          <div className="border-t border-gray-150" />
        </div>

        {/* Bottom Section: Settings (NO dropdown arrow) & Help & support */}
        <div className="space-y-1">
          {/* Settings - No dropdown arrow, directly opens page */}
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition duration-150 ${
              activeTab === 'settings'
                ? 'bg-white border border-gray-200/90 shadow-2xs text-gray-900 font-semibold'
                : 'text-gray-600 hover:text-gray-950 hover:bg-gray-50/80 font-medium'
            }`}
          >
            <Settings className={`w-4 h-4 ${activeTab === 'settings' ? 'text-gray-900' : 'text-gray-500'}`} />
            <span>Settings</span>
          </button>

          {/* Help & support */}
          <button
            onClick={() => setActiveTab('help')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition duration-150 ${
              activeTab === 'help'
                ? 'bg-white border border-gray-200/90 shadow-2xs text-gray-900 font-semibold'
                : 'text-gray-600 hover:text-gray-950 hover:bg-gray-50/80 font-medium'
            }`}
          >
            <HelpCircle className={`w-4 h-4 ${activeTab === 'help' ? 'text-gray-900' : 'text-gray-500'}`} />
            <span>Help & support</span>
          </button>
        </div>

      </div>

      {/* Bottom Workspace Card matching screenshot (e.g. Omni Estate / TBO Inventory) */}
      <div className="pt-3">
        <button className="w-full flex items-center justify-between p-2.5 rounded-lg border border-gray-200/90 bg-white hover:bg-gray-50 shadow-2xs transition group">
          <div className="flex items-center gap-2.5">
            {/* Black circle logo mark with white symbol */}
            <div className="w-6 h-6 rounded-full bg-gray-950 text-white flex items-center justify-center shadow-xs">
              <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="w-3.5 h-3.5 text-white"
              >
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <span className="text-xs font-bold text-gray-900">
              TBO Inventory
            </span>
          </div>
          <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 transition" />
        </button>
      </div>

    </aside>
  );
};
