import { useState, useEffect } from 'react';
import { MainNavbar } from './components/MainNavbar';
import { OverviewHero } from './components/OverviewHero';
import { CleanDashboard } from './components/CleanDashboard';
import { Sidebar } from './components/Sidebar';

export default function App() {
  // Navigation active tab: 'overview' or 'dashboard'
  const [activePage, setActivePage] = useState<'overview' | 'dashboard'>('overview');
  const [isOverDashboard, setIsOverDashboard] = useState<boolean>(false);
  
  // Dynamic 3-bar Sidebar state (folded by default, toggles on click, folds on 2nd click)
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  // Smooth scroll handler
  const handleNavigate = (page: 'overview' | 'dashboard') => {
    setActivePage(page);
    if (page === 'overview') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const el = document.getElementById('dashboard-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Scroll listener to update active tab and navbar mode
  useEffect(() => {
    const onScroll = () => {
      const dashboardEl = document.getElementById('dashboard-section');
      if (dashboardEl) {
        const rect = dashboardEl.getBoundingClientRect();
        setIsOverDashboard(rect.top <= 52);
        if (rect.top <= window.innerHeight * 0.4) {
          setActivePage('dashboard');
        } else {
          setActivePage('overview');
        }
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-[#EF4444] selection:text-white flex antialiased">
      
      {/* 0. Collapsible Frosted Glass Sidebar (Toggled via 3-bar Hamburger Icon) */}
      <Sidebar 
        isOpen={isSidebarOpen}
        onToggle={toggleSidebar}
        onClose={closeSidebar}
        activeItem={activePage === 'dashboard' ? 'dashboard' : 'procurement'}
        onNavigate={(item) => {
          if (item === 'dashboard') {
            handleNavigate('dashboard');
          }
          closeSidebar();
        }}
      />

      {/* Main Content Area (Full width, no hardcoded offset) */}
      <div className="flex-1 flex flex-col min-w-0 w-full">
        {/* 1. Centered Top Navbar with 3-bar menu toggle */}
        <MainNavbar
          activePage={activePage}
          setActivePage={handleNavigate}
          isOverDashboard={isOverDashboard}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={toggleSidebar}
        />

        {/* 2. Overview Hero (Full view with background visible) */}
        <section id="overview-section" className="w-full relative">
          <OverviewHero
            onFindOpportunities={() => handleNavigate('dashboard')}
          />
        </section>

        {/* 3. Recreated Minimal Dashboard (Warm Alabaster Bento UI) */}
        <section id="dashboard-section" className="w-full bg-[#f5f2eb]">
          <CleanDashboard />
        </section>
      </div>

    </div>
  );
}