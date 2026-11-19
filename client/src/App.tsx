import { useState } from 'react';
import { MainNavbar } from './components/MainNavbar';
import { OverviewHero } from './components/OverviewHero';
import { CleanDashboard } from './components/CleanDashboard';

export default function App() {
  // Navigation active tab: 'overview' or 'dashboard'
  const [activePage, setActivePage] = useState<'overview' | 'dashboard'>('overview');

  // Discrete Page Navigation Handler (Switches area and resets scroll to top)
  const handleNavigate = (page: 'overview' | 'dashboard') => {
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const isOverDashboard = activePage === 'dashboard';

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-[#EF4444] selection:text-white flex flex-col antialiased">
      
      {/* 1. Fixed Top Navbar */}
      <MainNavbar
        activePage={activePage}
        setActivePage={handleNavigate}
        isOverDashboard={isOverDashboard}
      />

      {/* 2. Discrete Page Views */}
      {activePage === 'overview' ? (
        <main id="overview-section" className="w-full relative min-h-screen">
          <OverviewHero
            onFindOpportunities={() => handleNavigate('dashboard')}
            onRunStrategy={() => handleNavigate('dashboard')}
          />
        </main>
      ) : (
        <main id="dashboard-section" className="w-full bg-[#f5f2eb] min-h-screen pt-[52px]">
          <CleanDashboard />
        </main>
      )}

    </div>
  );
}