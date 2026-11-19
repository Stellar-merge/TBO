import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

      {/* 2. Discrete Page Views with Smooth Spring Transitions */}
      <AnimatePresence mode="wait">
        {activePage === 'overview' ? (
          <motion.main 
            key="overview"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            id="overview-section" 
            className="w-full relative min-h-screen"
          >
            <OverviewHero
              onFindOpportunities={() => handleNavigate('dashboard')}
              onRunStrategy={() => handleNavigate('dashboard')}
            />
          </motion.main>
        ) : activePage === 'wishlists' ? (
          <motion.main 
            key="wishlists"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            id="wishlists-section" 
            className="w-full bg-gradient-to-br from-[#F4FAF5] via-[#EBF6EE] to-[#F1F9F3] min-h-screen pt-[56px]"
          >
            <WishlistsView
              onNavigateToDashboard={() => handleNavigate('dashboard')}
            />
          </motion.main>
        ) : (
          <motion.main 
            key="dashboard"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            id="dashboard-section" 
            className="w-full bg-gradient-to-br from-[#F3FAF4] via-[#EAF5ED] to-[#F0F8F2] min-h-screen pt-[56px]"
          >
            <CleanDashboard />
          </motion.main>
        )}
      </AnimatePresence>

    </div>
  );
}