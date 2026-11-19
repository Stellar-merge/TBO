import { useState } from 'react';
import { MainNavbar } from './components/MainNavbar';
import { OverviewHero } from './components/OverviewHero';
import { CleanDashboard } from './components/CleanDashboard';
import { WishlistsView } from './components/WishlistsView';

export default function App() {
  // Navigation active tab: 'overview' | 'dashboard' | 'wishlists'
  const [activePage, setActivePage] = useState<'overview' | 'dashboard' | 'wishlists'>('overview');

  // Discrete Page Navigation Handler (Switches area and resets scroll to top)
  const handleNavigate = (page: 'overview' | 'dashboard' | 'wishlists') => {
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const isOverDashboard = activePage === 'dashboard' || activePage === 'wishlists';

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-[#EF4444] selection:text-white flex flex-col antialiased">
      
      {/* 1. Fixed Top Navbar with Account Dropdown & Page Switcher */}
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
      ) : activePage === 'wishlists' ? (
        <main id="wishlists-section" className="w-full bg-[#F8F9FA] min-h-screen pt-[56px]">
          <WishlistsView
            onNavigateToDashboard={() => handleNavigate('dashboard')}
          />
        </main>
      ) : (
        <main id="dashboard-section" className="w-full bg-[#F8F9FA] min-h-screen pt-[56px]">
          <CleanDashboard />
        </main>
      )}

    </div>
  );
}