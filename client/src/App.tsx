import { useState, useMemo, useEffect } from 'react';
import { MainNavbar } from './components/MainNavbar';
import { OverviewHero } from './components/OverviewHero';
import { FilterSidebar } from './components/FilterSidebar';
import { WorldMapGraphic } from './components/WorldMapGraphic';
import { OpportunityCard } from './components/OpportunityCard';
import { OpportunityDetailModal } from './components/OpportunityDetailModal';
import { initialOpportunities } from './data/opportunityDeals';
import type { OpportunityCardItem } from './data/opportunityDeals';
import { ChevronDown, List as ListIcon, LayoutGrid, MapPin, Sparkles } from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   Scroll-reveal hook — fades elements in when they
   enter the viewport. Uses a callback ref to avoid
   accessing ref.current during render.
   ═══════════════════════════════════════════════════════ */
function useScrollReveal(threshold = 0.1): [boolean, (node: HTMLElement | null) => void] {
  const [visible, setVisible] = useState(false);

  // Stable callback ref using useCallback
  const setRef = (node: HTMLElement | null) => {
    if (!node || visible) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(node);
  };

  return [visible, setRef];
}

export default function App() {
  // Navigation active tab: 'overview' or 'dashboard'
  const [activePage, setActivePage] = useState<'overview' | 'dashboard'>('overview');
  const [isOverDashboard, setIsOverDashboard] = useState<boolean>(false);

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

  // Scroll-reveal for dashboard sections
  const [mapVisible, mapRef] = useScrollReveal(0.15);
  const [cardsVisible, cardsRef] = useScrollReveal(0.08);

  // Dashboard Filters & States
  const [segment, setSegment] = useState<'Overview' | 'Hotels' | 'Flights'>('Overview');
  const [inventoryTypes, setInventoryTypes] = useState<string[]>(['Hotels']);
  const [destinations, setDestinations] = useState<string[]>([]);
  const [travelPeriod, setTravelPeriod] = useState<string>('31–90 days');
  const [demandSignals, setDemandSignals] = useState<string[]>([]);
  const [budgetMax, setBudgetMax] = useState<number>(100000);
  const [riskTolerance, setRiskTolerance] = useState<'Low' | 'Balanced' | 'High'>('Balanced');
  const [supplierTypes, setSupplierTypes] = useState<string[]>([]);

  // Opportunities State
  const [opportunities, setOpportunities] = useState<OpportunityCardItem[]>(initialOpportunities);
  const [selectedOpportunity, setSelectedOpportunity] = useState<OpportunityCardItem | null>(null);
  const [selectedPin, setSelectedPin] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [sortKey, setSortKey] = useState<'profit' | 'demand'>('profit');

  // Filtered Opportunities
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((item) => {
      if (inventoryTypes.length > 0 && !inventoryTypes.includes('Both')) {
        if (!inventoryTypes.includes(item.inventoryType) && item.inventoryType !== 'Both') {
          return false;
        }
      }
      if (destinations.length > 0) {
        if (!destinations.includes(item.destination)) {
          return false;
        }
      }
      return true;
    });
  }, [opportunities, inventoryTypes, destinations]);

  // Dynamic Portfolio Calculations
  const totalAllocated = useMemo(() => {
    const raw = filteredOpportunities.reduce((sum, item) => sum + item.allocatedAmount, 0);
    const riskFactor = riskTolerance === 'Low' ? 0.85 : riskTolerance === 'High' ? 1.15 : 1.0;
    const scaled = Math.round((raw * (budgetMax / 100000)) * riskFactor);
    return Math.min(budgetMax, scaled);
  }, [filteredOpportunities, budgetMax, riskTolerance]);

  const projectedROI = useMemo(() => {
    const totalProfit = filteredOpportunities.reduce((sum, item) => sum + item.expectedProfitNum, 0);
    if (totalAllocated <= 0) return 18.6;
    const base = (totalProfit / totalAllocated) * 100;
    return Number(Math.min(26.5, Math.max(12.4, (base * 0.186 / 1.4))).toFixed(1));
  }, [filteredOpportunities, totalAllocated]);

  // Budget utilization percentage for progress bar
  const budgetUtilPct = Math.min(100, Math.round((totalAllocated / budgetMax) * 100));

  // Optimization Trigger
  const handleRunOptimization = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      const multiplier = riskTolerance === 'Low' ? 0.9 : riskTolerance === 'High' ? 1.2 : 1.0;
      const budgetRatio = budgetMax / 100000;

      setOpportunities((prev) =>
        prev.map((item) => {
          const newProfitNum = Math.round(item.expectedProfitNum * multiplier * Math.sqrt(budgetRatio));
          const newAllocated = Math.round(item.allocatedAmount * budgetRatio * multiplier);
          return {
            ...item,
            expectedProfitNum: newProfitNum,
            expectedProfit: `+$${newProfitNum.toLocaleString()}`,
            allocatedAmount: newAllocated,
            metric1: { ...item.metric1, value: `+$${newProfitNum.toLocaleString()}` },
          };
        })
      );
      setIsOptimizing(false);
    }, 450);
  };

  const handleToggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpportunities((prev) =>
      prev.map((item) => (item.id === id ? { ...item, bookmarked: !item.bookmarked } : item))
    );
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-brand-500 selection:text-white flex flex-col antialiased">
      
      {/* 1. Navbar */}
      <MainNavbar
        activePage={activePage}
        setActivePage={handleNavigate}
        isOverDashboard={isOverDashboard}
      />

      {/* 2. Overview Hero */}
      <section id="overview-section" className="w-full relative">
        <OverviewHero
          onFindOpportunities={() => handleNavigate('dashboard')}
        />
      </section>

      {/* 3. Dashboard Section */}
      <section id="dashboard-section" className="w-full bg-white text-gray-900">
        
        {/* Header Action Bar */}
        <div className="border-b border-gray-200/70 bg-white/80 backdrop-blur-xl backdrop-saturate-150 px-6 sm:px-8 py-3 flex items-center justify-between sticky top-[52px] z-20 shadow-elevation-1">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs font-bold text-gray-900">Inventory Procurement Engine</span>
            <span className="text-[10px] text-gray-400 font-medium">• Live Market Feed</span>
          </div>

          <button
            onClick={handleRunOptimization}
            disabled={isOptimizing}
            className="px-4 py-1.5 rounded-lg bg-gray-950 hover:bg-gray-800 text-white font-semibold text-xs shadow-elevation-2 transition-all duration-200 active:scale-[0.97] hover:shadow-elevation-3 hover:-translate-y-0.5 flex items-center gap-1.5 disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {isOptimizing ? (
              <>
                <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-300" />
                <span>Solving Allocation…</span>
              </>
            ) : (
              <span>Run Optimization</span>
            )}
          </button>
        </div>

        {/* Dashboard 2-Column Layout */}
        <div className="max-w-[1550px] w-full mx-auto px-6 sm:px-8 py-8 flex flex-col md:flex-row gap-8">
          
          {/* Left Filter Panel */}
          <div className="shrink-0">
            <FilterSidebar
              segment={segment}
              setSegment={setSegment}
              inventoryTypes={inventoryTypes}
              setInventoryTypes={setInventoryTypes}
              destinations={destinations}
              setDestinations={setDestinations}
              travelPeriod={travelPeriod}
              setTravelPeriod={setTravelPeriod}
              demandSignals={demandSignals}
              setDemandSignals={setDemandSignals}
              budgetMax={budgetMax}
              setBudgetMax={setBudgetMax}
              riskTolerance={riskTolerance}
              setRiskTolerance={setRiskTolerance}
              supplierTypes={supplierTypes}
              setSupplierTypes={setSupplierTypes}
            />
          </div>

          {/* Right Main Area */}
          <div className="flex-1 flex flex-col space-y-6 min-w-0">
            
            {/* World Map with scroll-reveal */}
            <div 
              ref={mapRef}
              className={`transition-all duration-700 ease-spring ${
                mapVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
            >
              <WorldMapGraphic
                selectedPin={selectedPin}
                onSelectPin={(pinId) => setSelectedPin(selectedPin === pinId ? null : pinId)}
              />
            </div>

            {/* Status Allocation Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 text-xs">
              
              {/* Left: Budget + ROI with inline progress */}
              <div className="flex items-center gap-3 font-sans font-medium text-gray-900">
                <div className="flex items-center gap-2">
                  <span>
                    Budget allocated: <strong className="font-bold">${totalAllocated.toLocaleString()}</strong> / ${budgetMax.toLocaleString()}
                  </span>
                  {/* Mini progress bar */}
                  <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gray-900 rounded-full transition-all duration-500 ease-spring"
                      style={{ width: `${budgetUtilPct}%` }}
                    />
                  </div>
                </div>
                <span className="text-gray-200">|</span>
                <span>
                  Projected ROI: <strong className="font-bold text-emerald-600">{projectedROI}%</strong>
                </span>
              </div>

              {/* Right: Dropdowns + View Toggles */}
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-1.5 text-gray-600 hover:text-gray-950 font-medium transition-colors duration-150">
                  <span>Recommended inventory opportunities</span>
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                </button>

                <button 
                  onClick={() => setSortKey(sortKey === 'profit' ? 'demand' : 'profit')}
                  className="flex items-center gap-1.5 text-gray-600 hover:text-gray-950 font-medium transition-colors duration-150"
                >
                  <span>Sort by: Expected profit</span>
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                </button>

                <div className="flex items-center gap-0.5 text-gray-400 pl-1 bg-gray-50 rounded-lg p-0.5 border border-gray-100">
                  <button className="p-1.5 rounded-md hover:text-gray-700 hover:bg-white transition-all duration-150" title="List View" aria-label="List view">
                    <ListIcon className="w-3.5 h-3.5" />
                  </button>
                  <button className="p-1.5 rounded-md text-gray-950 bg-white shadow-elevation-1 transition-all duration-150" title="Grid View" aria-label="Grid view">
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button className="p-1.5 rounded-md hover:text-gray-700 hover:bg-white transition-all duration-150" title="Map View" aria-label="Map view">
                    <MapPin className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Grid of 6 Cards with scroll-reveal and stagger */}
            <div 
              ref={cardsRef}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {filteredOpportunities.map((item, i) => (
                <OpportunityCard
                  key={item.id}
                  item={item}
                  index={cardsVisible ? i : -1}
                  onSelect={(selected) => setSelectedOpportunity(selected)}
                  onToggleBookmark={handleToggleBookmark}
                />
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* Modal */}
      <OpportunityDetailModal
        item={selectedOpportunity}
        onClose={() => setSelectedOpportunity(null)}
      />

    </div>
  );
}
