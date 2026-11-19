import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Building2, 
  Plane,
  Search, 
  X, 
  ChevronDown, 
  ChevronLeft,
  ChevronRight,
  RotateCcw, 
  List as ListIcon, 
  Map as MapIcon, 
  Heart, 
  TrendingUp, 
  Percent, 
  Star, 
  Plus, 
  Minus, 
  Crosshair, 
  ExternalLink,
  Calendar,
  DollarSign,
  ShieldCheck,
  Check,
  Navigation,
  Landmark,
  Waves,
  Palmtree
} from 'lucide-react';
import { initialOpportunities } from '../data/opportunityDeals';
import type { OpportunityCardItem } from '../data/opportunityDeals';
import { OpportunityDetailModal } from './OpportunityDetailModal';

export const CleanDashboard: React.FC = () => {
  // Opportunities Data
  const [items, setItems] = useState<OpportunityCardItem[]>(initialOpportunities);
  const [selectedId, setSelectedId] = useState<string>('dumble-st');
  const [popupVisible, setPopupVisible] = useState<boolean>(true);
  const [modalItem, setModalItem] = useState<OpportunityCardItem | null>(null);

  // 1. Airbnb-Style Search Controls (Top: Hotels/Flights, Bottom: Budget, Dates, Location, Risk)
  const [activeAssetClass, setActiveAssetClass] = useState<'hotels' | 'flights'>('hotels');
  const [activeAirbnbSegment, setActiveAirbnbSegment] = useState<'budget' | 'dates' | 'location' | 'risk' | null>(null);
  const [airbnbBudget, setAirbnbBudget] = useState<number>(500000);
  const [airbnbStartDate, setAirbnbStartDate] = useState<string>('2026-11-19');
  const [airbnbEndDate, setAirbnbEndDate] = useState<string>('2026-11-25');
  const [airbnbLocation, setAirbnbLocation] = useState<string>('Nearby');
  const [airbnbRisk, setAirbnbRisk] = useState<'Conservative' | 'Moderate' | 'Aggressive'>('Moderate');
  const airbnbBarRef = useRef<HTMLDivElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);

  // Calendar State (November 2026 baseline matching screenshot)
  const [calendarBaseYear, setCalendarBaseYear] = useState<number>(2026);
  const [calendarBaseMonth, setCalendarBaseMonth] = useState<number>(10); // 10 = November (0-indexed)
  const [dateMode, setDateMode] = useState<'dates' | 'flexible'>('dates');
  const [dateFlexibility, setDateFlexibility] = useState<string>('Exact dates');

  // Month navigation handlers
  const handlePrevMonth = () => {
    setCalendarBaseMonth((prev) => {
      if (prev === 0) {
        setCalendarBaseYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    setCalendarBaseMonth((prev) => {
      if (prev === 11) {
        setCalendarBaseYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  const month2 = (calendarBaseMonth + 1) % 12;
  const year2 = calendarBaseMonth === 11 ? calendarBaseYear + 1 : calendarBaseYear;

  // Calendar date click selection logic
  const handleSelectCalendarDate = (dateStr: string) => {
    if (!airbnbStartDate || (airbnbStartDate && airbnbEndDate)) {
      setAirbnbStartDate(dateStr);
      setAirbnbEndDate('');
    } else if (airbnbStartDate && !airbnbEndDate) {
      if (dateStr >= airbnbStartDate) {
        setAirbnbEndDate(dateStr);
      } else {
        setAirbnbStartDate(dateStr);
      }
    }
  };

  // Suggested Destinations matching exact user screenshot
  const suggestedDestinations = [
    {
      name: 'Nearby',
      subtitle: "Find what’s around you",
      icon: Navigation,
      iconColor: 'text-sky-500',
      iconBg: 'bg-sky-50',
    },
    {
      name: 'Kolkata, West Bengal',
      subtitle: 'For sights like Victoria Memorial',
      icon: Landmark,
      iconColor: 'text-rose-500',
      iconBg: 'bg-rose-50',
    },
    {
      name: 'Puri, Odisha',
      subtitle: 'For its seaside allure',
      icon: Waves,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
    },
    {
      name: 'Varanasi, Uttar Pradesh',
      subtitle: 'Popular with travellers near you',
      icon: Landmark,
      iconColor: 'text-rose-500',
      iconBg: 'bg-rose-50',
    },
    {
      name: 'North Goa, Goa',
      subtitle: 'For its bustling nightlife',
      icon: Palmtree,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50',
    },
    {
      name: 'Mumbai, Maharashtra',
      subtitle: 'For sights like Gateway of India',
      icon: Building2,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
    },
    {
      name: 'Dubai, UAE',
      subtitle: 'For ultra-luxury high-yield allotments',
      icon: Building2,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50',
    },
    {
      name: 'Lisbon, Portugal',
      subtitle: 'For vibrant heritage & coastal commerce',
      icon: Landmark,
      iconColor: 'text-indigo-600',
      iconBg: 'bg-indigo-50',
    },
    {
      name: 'Tokyo, Japan',
      subtitle: 'For rapid turnover & business transit',
      icon: Building2,
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-50',
    },
    {
      name: 'All Destinations',
      subtitle: 'Global portfolio optimization across all markets',
      icon: Search,
      iconColor: 'text-stone-700',
      iconBg: 'bg-stone-100',
    },
  ];

  // Auto-suggestion filtered destinations based on typed query
  const filteredDestinations = useMemo(() => {
    const q = airbnbLocation.trim().toLowerCase();
    if (!q || q === 'nearby' || q === 'all destinations') {
      return suggestedDestinations;
    }
    return suggestedDestinations.filter(
      (dest) =>
        dest.name.toLowerCase().includes(q) ||
        dest.subtitle.toLowerCase().includes(q)
    );
  }, [suggestedDestinations, airbnbLocation]);

  // Helper to render one month of the dual-month calendar
  const renderCalendarMonth = (year: number, month: number, isLeft: boolean) => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanks = Array.from({ length: firstDay }, (_, i) => i);

    return (
      <div className="flex-1 min-w-[280px]">
        {/* Month Header */}
        <div className="flex items-center justify-between mb-4 h-8 px-1">
          {isLeft ? (
            <button
              type="button"
              onClick={handlePrevMonth}
              className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-700 transition-colors cursor-pointer"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            </button>
          ) : <div className="w-8" />}

          <h4 className="text-sm font-bold text-stone-900 tracking-tight select-none">
            {monthNames[month]} {year}
          </h4>

          {!isLeft ? (
            <button
              type="button"
              onClick={handleNextMonth}
              className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-700 transition-colors cursor-pointer"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          ) : <div className="w-8" />}
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 mb-2 text-center">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
            <span key={idx} className="text-xs font-medium text-stone-400 py-1 select-none">
              {day}
            </span>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-y-1 text-center">
          {blanks.map((b) => (
            <div key={`blank-${b}`} className="h-10" />
          ))}
          {days.map((d) => {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            // Match screenshot where dates before Nov 19 2026 are dimmed
            const isPast = year < 2026 || (year === 2026 && month < 10) || (year === 2026 && month === 10 && d < 19);
            const isStart = dateStr === airbnbStartDate;
            const isEnd = dateStr === airbnbEndDate;
            const isInRange = airbnbStartDate && airbnbEndDate && dateStr > airbnbStartDate && dateStr < airbnbEndDate;

            return (
              <div
                key={d}
                className={`h-10 flex items-center justify-center relative ${
                  isInRange ? 'bg-[#f7f7f7]' : ''
                } ${
                  isStart && airbnbEndDate ? 'bg-gradient-to-r from-transparent to-[#f7f7f7]' : ''
                } ${
                  isEnd && airbnbStartDate ? 'bg-gradient-to-l from-transparent to-[#f7f7f7]' : ''
                }`}
              >
                <button
                  type="button"
                  disabled={isPast}
                  onClick={() => handleSelectCalendarDate(dateStr)}
                  className={`w-9 h-9 text-xs flex items-center justify-center transition-all cursor-pointer ${
                    isStart || isEnd
                      ? 'bg-stone-900 text-white font-bold rounded-full shadow-xs z-10'
                      : isPast
                      ? 'text-stone-300 cursor-not-allowed font-normal'
                      : isInRange
                      ? 'text-stone-900 font-semibold z-10'
                      : 'text-stone-800 hover:border hover:border-stone-900 rounded-full font-semibold'
                  }`}
                >
                  {d}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Date formatter for Airbnb Dates display
  const formatDatesDisplay = (startStr: string, endStr: string) => {
    if (!startStr && !endStr) return 'Add dates';
    try {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      if (startStr && !endStr) {
        const s = new Date(startStr);
        return `${months[s.getMonth()]} ${String(s.getDate()).padStart(2, '0')}`;
      }
      const s = new Date(startStr);
      const e = new Date(endStr);
      const sMonth = months[s.getMonth()];
      const eMonth = months[e.getMonth()];
      const sDay = String(s.getDate()).padStart(2, '0');
      const eDay = String(e.getDate()).padStart(2, '0');
      if (sMonth === eMonth) {
        return `${sMonth} ${sDay} – ${eDay}`;
      }
      return `${sMonth} ${sDay} – ${eMonth} ${eDay}`;
    } catch {
      return 'Nov 19 – 25';
    }
  };

  // 2. Hotel Category Tabs
  const [activeCategory, setActiveCategory] = useState<
    'All' | 'Luxury Resorts' | 'City Business' | 'Boutique Stays' | 'Heritage Villas' | 'High Margin'
  >('All');

  // 3. Search & Model Parameters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDestination, setSelectedDestination] = useState<string>('All Destinations');
  const [travelWindowFilter, setTravelWindowFilter] = useState<string>('All');
  const [budgetCapFilter, setBudgetCapFilter] = useState<string>('All');
  const [riskTierFilter, setRiskTierFilter] = useState<string>('All');

  // Budget Tracker Bar State (Synchronized with airbnbBudget)
  const [budgetUsed] = useState<number>(120000);
  const budgetTotal = airbnbBudget;
  const budgetPercentage = Math.min(100, Math.round((budgetUsed / budgetTotal) * 100));

  // Popover state for the interactive constraint chips
  const [activeChipPopover, setActiveChipPopover] = useState<'destination' | 'window' | 'budget' | 'risk' | null>(null);

  // View Mode: 'split' | 'list' | 'map'
  const [viewMode, setViewMode] = useState<'split' | 'list' | 'map'>('split');

  // Map zoom and pan state
  const [mapZoom, setMapZoom] = useState<number>(1);
  const [mapPan, setMapPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Currently active hotel item
  const activeItem = useMemo(() => {
    return items.find((it) => it.id === selectedId) || items[0];
  }, [items, selectedId]);

  // Hotel category options list
  const hotelCategories = [
    { id: 'All', label: 'All Hotels' },
    { id: 'Luxury Resorts', label: 'Luxury Resorts' },
    { id: 'City Business', label: 'City Business' },
    { id: 'Boutique Stays', label: 'Boutique Stays' },
    { id: 'Heritage Villas', label: 'Heritage Villas' },
    { id: 'High Margin', label: 'High Margin' },
  ] as const;

  // Filtered Items (Hotels Only)
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Category Tab Filter
      if (activeCategory === 'High Margin') {
        if (parseInt(item.margin, 10) < 25) return false;
      } else if (activeCategory !== 'All') {
        if (item.hotelCategory !== activeCategory) return false;
      }

      // Destination / Market Search
      if (selectedDestination !== 'All Destinations') {
        const target = selectedDestination.toLowerCase();
        const matches = item.city.toLowerCase().includes(target) || 
                        item.title.toLowerCase().includes(target) ||
                        item.destination.toLowerCase().includes(target);
        if (!matches) return false;
      }

      // Text Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches = item.title.toLowerCase().includes(q) || 
                        item.city.toLowerCase().includes(q) || 
                        item.hotelCategory.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Travel Window Filter
      if (travelWindowFilter !== 'All') {
        if (item.travelWindow !== travelWindowFilter) return false;
      }

      // Budget Cap Filter
      if (budgetCapFilter === '< $280k' && item.priceNum >= 280000) return false;
      if (budgetCapFilter === '$280k - $350k' && (item.priceNum < 280000 || item.priceNum > 350000)) return false;
      if (budgetCapFilter === '> $350k' && item.priceNum <= 350000) return false;

      // Risk Strategy Filter
      if (riskTierFilter === 'Low Risk (P10)' && item.riskRating !== 'Low') return false;
      if (riskTierFilter === 'High Margin' && parseInt(item.margin, 10) < 25) return false;

      return true;
    });
  }, [items, activeCategory, selectedDestination, searchQuery, travelWindowFilter, budgetCapFilter, riskTierFilter]);

  // Aggregate Portfolio Metrics
  const totalAllocated = useMemo(() => {
    return filteredItems.reduce((acc, it) => acc + it.allocatedAmount, 0);
  }, [filteredItems]);

  const totalProfit = useMemo(() => {
    return filteredItems.reduce((acc, it) => acc + it.expectedProfitNum, 0);
  }, [filteredItems]);

  const projectedROI = totalAllocated > 0 ? ((totalProfit / totalAllocated) * 100).toFixed(1) : '24.8';

  // Toggle Bookmark
  const handleToggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, bookmarked: !it.bookmarked } : it))
    );
  };

  // Select Item
  const handleSelectItem = (id: string) => {
    setSelectedId(id);
    setPopupVisible(true);
  };

  // Reset all constraints to default
  const handleResetFilters = () => {
    setActiveCategory('All');
    setSearchQuery('');
    setSelectedDestination('All Destinations');
    setTravelWindowFilter('All');
    setBudgetCapFilter('All');
    setRiskTierFilter('All');
    setActiveChipPopover(null);
    setMapZoom(1);
    setMapPan({ x: 0, y: 0 });
  };

  // Zoom handlers
  const handleZoomIn = () => setMapZoom((prev) => Math.min(prev + 0.25, 2));
  const handleZoomOut = () => setMapZoom((prev) => Math.max(prev - 0.25, 0.8));
  const handleResetMap = () => {
    setMapZoom(1);
    setMapPan({ x: 0, y: 0 });
  };

  // Close popovers on outside click
  const headerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (airbnbBarRef.current && !airbnbBarRef.current.contains(e.target as Node)) {
        setActiveAirbnbSegment(null);
      }
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setActiveChipPopover(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="w-full min-h-screen bg-[#f5f2eb] text-stone-900 pb-16 font-sans select-none antialiased">
      
      {/* ─── Airbnb-Style Procurement Query Header (Exact replica of user reference image) ─── */}
      <div className="bg-[#f5f2eb] border-b border-stone-200/80 pt-6 pb-6 px-4 sm:px-8">
        <div ref={airbnbBarRef} className="max-w-[960px] mx-auto flex flex-col items-center">
          
          {/* TOP: Category Tabs (Hotels | Flights) with Active Underline */}
          <div className="flex items-center gap-12 mb-4 select-none">
            {/* Hotels Tab (Active by default) */}
            <button
              type="button"
              onClick={() => setActiveAssetClass('hotels')}
              className={`flex items-center gap-2 pb-2 text-sm font-semibold transition-all relative cursor-pointer ${
                activeAssetClass === 'hotels'
                  ? 'text-stone-950 font-bold'
                  : 'text-stone-400 hover:text-stone-700 font-medium'
              }`}
            >
              <Building2 className={`w-4 h-4 ${activeAssetClass === 'hotels' ? 'text-stone-950' : 'text-stone-400'}`} />
              <span>Hotels</span>
              {activeAssetClass === 'hotels' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-stone-900 rounded-full" />
              )}
            </button>

            {/* Flights Tab */}
            <button
              type="button"
              onClick={() => setActiveAssetClass('flights')}
              className={`flex items-center gap-2 pb-2 text-sm font-semibold transition-all relative cursor-pointer ${
                activeAssetClass === 'flights'
                  ? 'text-stone-950 font-bold'
                  : 'text-stone-400 hover:text-stone-700 font-medium'
              }`}
            >
              <Plane className={`w-4 h-4 ${activeAssetClass === 'flights' ? 'text-stone-950' : 'text-stone-400'}`} />
              <span>Flights</span>
              {activeAssetClass === 'flights' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-stone-900 rounded-full" />
              )}
            </button>
          </div>

          {/* BOTTOM: Airbnb Rounded-Full Pill Search Bar (Enlarged with Direct Typing & Auto-Suggestions) */}
          <div className={`w-full rounded-full transition-all p-2 sm:p-2.5 min-h-[68px] sm:min-h-[74px] flex items-center relative ${
            activeAirbnbSegment 
              ? 'bg-[#ebebeb] shadow-[0_3px_12px_rgba(0,0,0,0.06)]' 
              : 'bg-white border border-stone-200/90 shadow-[0_3px_14px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.12)]'
          }`}>
            
            {/* 1. Budget Segment */}
            <button
              type="button"
              onClick={() => setActiveAirbnbSegment(prev => prev === 'budget' ? null : 'budget')}
              className={`flex-1 px-5 sm:px-7 py-2.5 sm:py-3 rounded-full text-left transition-all cursor-pointer focus:outline-hidden ${
                activeAirbnbSegment === 'budget' 
                  ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.12)] border border-stone-900' 
                  : activeAirbnbSegment 
                    ? 'hover:bg-black/5' 
                    : 'hover:bg-stone-50'
              }`}
            >
              <span className="text-xs sm:text-[13px] font-bold text-stone-900 block leading-tight">Budget</span>
              <span className="text-sm sm:text-[15px] text-stone-600 font-semibold truncate block mt-0.5">
                ${airbnbBudget.toLocaleString()}
              </span>
            </button>

            {/* Vertical Divider 1 */}
            <div className={`w-[1px] h-7 sm:h-8 bg-stone-200 self-center shrink-0 ${
              activeAirbnbSegment === 'budget' || activeAirbnbSegment === 'dates' ? 'opacity-0' : 'opacity-100'
            }`} />

            {/* 2. Dates Segment (Like Airbnb with Start and End Dates) */}
            <button
              type="button"
              onClick={() => setActiveAirbnbSegment(prev => prev === 'dates' ? null : 'dates')}
              className={`flex-1 px-5 sm:px-7 py-2.5 sm:py-3 rounded-full text-left transition-all cursor-pointer focus:outline-hidden ${
                activeAirbnbSegment === 'dates' 
                  ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.12)] border border-stone-900' 
                  : activeAirbnbSegment 
                    ? 'hover:bg-black/5' 
                    : 'hover:bg-stone-50'
              }`}
            >
              <span className="text-xs sm:text-[13px] font-bold text-stone-900 block leading-tight">Dates</span>
              <span className="text-sm sm:text-[15px] text-stone-600 font-semibold truncate block mt-0.5">
                {formatDatesDisplay(airbnbStartDate, airbnbEndDate)}
              </span>
            </button>

            {/* Vertical Divider 2 */}
            <div className={`w-[1px] h-7 sm:h-8 bg-stone-200 self-center shrink-0 ${
              activeAirbnbSegment === 'dates' || activeAirbnbSegment === 'location' ? 'opacity-0' : 'opacity-100'
            }`} />

            {/* 3. Location Segment (Direct Typing & Auto-Suggestions like Airbnb) */}
            <div
              onClick={() => {
                setActiveAirbnbSegment('location');
                locationInputRef.current?.focus();
              }}
              className={`flex-1 px-5 sm:px-7 py-2.5 sm:py-3 rounded-full text-left transition-all cursor-pointer ${
                activeAirbnbSegment === 'location' 
                  ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.12)] border border-stone-900' 
                  : activeAirbnbSegment 
                    ? 'hover:bg-black/5' 
                    : 'hover:bg-stone-50'
              }`}
            >
              <label className="text-xs sm:text-[13px] font-bold text-stone-900 block leading-tight cursor-pointer select-none">
                Location
              </label>
              <div className="flex items-center justify-between mt-0.5">
                <input
                  ref={locationInputRef}
                  type="text"
                  value={airbnbLocation}
                  onChange={(e) => {
                    setAirbnbLocation(e.target.value);
                    if (activeAirbnbSegment !== 'location') {
                      setActiveAirbnbSegment('location');
                    }
                  }}
                  onFocus={() => setActiveAirbnbSegment('location')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (filteredDestinations.length > 0) {
                        const top = filteredDestinations[0];
                        setAirbnbLocation(top.name);
                        setSelectedDestination(top.name === 'Nearby' ? 'All Destinations' : top.name);
                      } else {
                        setSelectedDestination(airbnbLocation);
                      }
                      setActiveAirbnbSegment('dates');
                    }
                  }}
                  placeholder="Search destinations"
                  className="w-full bg-transparent text-sm sm:text-[15px] font-semibold text-stone-900 placeholder:text-stone-400 outline-none truncate"
                />
                {airbnbLocation && activeAirbnbSegment === 'location' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAirbnbLocation('');
                      locationInputRef.current?.focus();
                    }}
                    className="w-5 h-5 rounded-full bg-stone-200/80 hover:bg-stone-300 flex items-center justify-center shrink-0 ml-1 text-stone-600 transition-colors cursor-pointer"
                    title="Clear destination"
                  >
                    <X className="w-3 h-3 stroke-[2.5]" />
                  </button>
                )}
              </div>
            </div>

            {/* Vertical Divider 3 */}
            <div className={`w-[1px] h-7 sm:h-8 bg-stone-200 self-center shrink-0 ${
              activeAirbnbSegment === 'location' || activeAirbnbSegment === 'risk' ? 'opacity-0' : 'opacity-100'
            }`} />

            {/* 4. Risk Tolerance Segment */}
            <button
              type="button"
              onClick={() => setActiveAirbnbSegment(prev => prev === 'risk' ? null : 'risk')}
              className={`flex-1 px-5 sm:px-7 py-2.5 sm:py-3 rounded-full text-left transition-all cursor-pointer focus:outline-hidden ${
                activeAirbnbSegment === 'risk' 
                  ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.12)] border border-stone-900' 
                  : activeAirbnbSegment 
                    ? 'hover:bg-black/5' 
                    : 'hover:bg-stone-50'
              }`}
            >
              <span className="text-xs sm:text-[13px] font-bold text-stone-900 block leading-tight">Risk Tolerance</span>
              <span className="text-sm sm:text-[15px] text-stone-600 font-semibold truncate block mt-0.5">
                {airbnbRisk === 'Conservative' ? 'Conservative (P10)' : airbnbRisk === 'Aggressive' ? 'Aggressive (P90)' : 'Moderate (P50)'}
              </span>
            </button>

            {/* Far Right: Circular Red Search Action Button (Exact replica of Airbnb) */}
            <button
              type="button"
              onClick={() => {
                setActiveAirbnbSegment(null);
                setSelectedDestination(airbnbLocation === 'Nearby' ? 'All Destinations' : (airbnbLocation || 'All Destinations'));
                setSelectedId('dumble-st');
                setPopupVisible(true);
              }}
              className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-[#EF4444] hover:bg-[#DC2626] active:scale-95 text-white flex items-center justify-center shrink-0 shadow-md transition-all cursor-pointer ml-2 mr-1"
              aria-label="Search and run engine"
              title="Search and run engine"
            >
              <Search className="w-5 h-5 stroke-[2.8]" />
            </button>

            {/* ─── 1. Budget Popover ─── */}
            {activeAirbnbSegment === 'budget' && (
              <div className="absolute top-full left-0 mt-3 w-88 bg-white rounded-[32px] shadow-[0_12px_36px_rgba(0,0,0,0.16)] border border-stone-200/90 p-6 z-50 text-left animate-scale-in">
                <span className="text-xs font-bold text-stone-900 block mb-1">
                  Total Investment Budget
                </span>
                <p className="text-[11px] text-stone-500 mb-4">
                  Hard capital constraint enforced across wholesale hotel allocations ($B).
                </p>
                <div className="relative mb-4">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-sm">$</span>
                  <input
                    type="number"
                    value={airbnbBudget}
                    onChange={(e) => setAirbnbBudget(Math.max(0, parseInt(e.target.value || '0', 10)))}
                    className="w-full bg-stone-50 border border-stone-200/80 rounded-2xl pl-8 pr-3 py-2.5 text-sm font-bold text-stone-900 outline-none font-mono"
                  />
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[100000, 250000, 500000, 1000000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAirbnbBudget(val)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold font-mono transition-colors cursor-pointer ${
                        airbnbBudget === val ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      }`}
                    >
                      ${val >= 1000000 ? `${val / 1000000}M` : `${val / 1000}K`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ─── 2. Dates Popover (Exact Replica of Airbnb media_1795074622760_548e40f6.png) ─── */}
            {activeAirbnbSegment === 'dates' && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[720px] max-w-[95vw] bg-white rounded-[32px] shadow-[0_12px_36px_rgba(0,0,0,0.16)] border border-stone-200/90 p-7 z-50 text-left animate-scale-in">
                
                {/* Top Segmented Pill Toggle: [ Dates | Flexible ] */}
                <div className="bg-[#f0ece5] p-1 rounded-full flex items-center justify-center w-fit mx-auto mb-6">
                  <button
                    type="button"
                    onClick={() => setDateMode('dates')}
                    className={`rounded-full px-8 py-2 text-xs font-bold transition-all cursor-pointer ${
                      dateMode === 'dates' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Dates
                  </button>
                  <button
                    type="button"
                    onClick={() => setDateMode('flexible')}
                    className={`rounded-full px-8 py-2 text-xs font-bold transition-all cursor-pointer ${
                      dateMode === 'flexible' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Flexible
                  </button>
                </div>

                {dateMode === 'dates' ? (
                  <>
                    {/* Dual-Month Calendar View */}
                    <div className="flex flex-col md:flex-row gap-8 mb-6">
                      {renderCalendarMonth(calendarBaseYear, calendarBaseMonth, true)}
                      {renderCalendarMonth(year2, month2, false)}
                    </div>

                    {/* Bottom Flexibility Pills */}
                    <div className="flex items-center gap-2 pt-4 border-t border-stone-100 flex-wrap">
                      {[
                        'Exact dates',
                        '± 1 day',
                        '± 2 days',
                        '± 3 days',
                        '± 7 days',
                        '± 14 days'
                      ].map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => setDateFlexibility(chip)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                            dateFlexibility === chip
                              ? 'border border-stone-900 text-stone-900 font-bold bg-stone-50 shadow-xs'
                              : 'border border-stone-200 hover:border-stone-400 text-stone-700'
                          }`}
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  /* Flexible Duration View */
                  <div className="space-y-6 py-2">
                    <div>
                      <span className="text-xs font-bold text-stone-900 block mb-3">
                        How long would you like to stay?
                      </span>
                      <div className="flex items-center gap-2">
                        {['A weekend', 'A week', 'A month', 'Any length'].map((dur) => (
                          <button
                            key={dur}
                            type="button"
                            onClick={() => setDateFlexibility(dur)}
                            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                              dateFlexibility === dur
                                ? 'border border-stone-900 text-stone-900 font-bold bg-stone-50'
                                : 'border border-stone-200 hover:border-stone-400 text-stone-700'
                            }`}
                          >
                            {dur}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-xs font-bold text-stone-900 block mb-3">
                        When would you like to go?
                      </span>
                      <div className="grid grid-cols-4 gap-3">
                        {[
                          { name: 'November 2026', range: ['2026-11-01', '2026-11-30'] },
                          { name: 'December 2026', range: ['2026-12-01', '2026-12-31'] },
                          { name: 'January 2027', range: ['2027-01-01', '2027-01-31'] },
                          { name: 'Q1 2027 Peak', range: ['2027-01-01', '2027-03-31'] },
                        ].map((m) => (
                          <button
                            key={m.name}
                            type="button"
                            onClick={() => {
                              setAirbnbStartDate(m.range[0]);
                              setAirbnbEndDate(m.range[1]);
                              setActiveAirbnbSegment(null);
                            }}
                            className="p-4 rounded-2xl border border-stone-200 hover:border-stone-900 hover:bg-stone-50 transition-all text-left cursor-pointer group"
                          >
                            <Calendar className="w-5 h-5 text-stone-400 group-hover:text-stone-900 mb-2 transition-colors" />
                            <div className="text-xs font-bold text-stone-900">{m.name}</div>
                            <div className="text-[10.5px] text-stone-500 mt-0.5">Flexible Allotment</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* ─── 3. Location Popover (Exact Replica of Airbnb with Live Auto-Suggestions) ─── */}
            {activeAirbnbSegment === 'location' && (
              <div className="absolute top-full left-1/3 -translate-x-1/3 mt-3 w-[460px] max-w-[95vw] bg-white rounded-[32px] shadow-[0_12px_36px_rgba(0,0,0,0.16)] border border-stone-200/90 p-6 z-50 text-left animate-scale-in">
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-xs font-bold text-stone-900 tracking-tight">
                    {airbnbLocation.trim() && airbnbLocation !== 'Nearby' && airbnbLocation !== 'All Destinations'
                      ? 'Matching destinations'
                      : 'Suggested destinations'}
                  </span>
                  {filteredDestinations.length > 0 && (
                    <span className="text-[11px] text-stone-400 font-medium">
                      {filteredDestinations.length} available
                    </span>
                  )}
                </div>

                <div className="space-y-1 max-h-[380px] overflow-y-auto pr-1">
                  {filteredDestinations.length > 0 ? (
                    filteredDestinations.map((dest) => (
                      <button
                        key={dest.name}
                        type="button"
                        onClick={() => {
                          setAirbnbLocation(dest.name);
                          setSelectedDestination(dest.name === 'Nearby' ? 'All Destinations' : dest.name);
                          setActiveAirbnbSegment('dates');
                        }}
                        className="w-full flex items-center gap-4 p-2.5 rounded-2xl hover:bg-stone-100 transition-colors cursor-pointer text-left group"
                      >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${dest.iconBg} ${dest.iconColor}`}>
                          <dest.icon className="w-5 h-5 stroke-[2.2]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-stone-900 group-hover:text-black leading-snug">
                            {dest.name}
                          </div>
                          <div className="text-xs text-stone-500 truncate mt-0.5 font-normal">
                            {dest.subtitle}
                          </div>
                        </div>
                        {airbnbLocation === dest.name && (
                          <Check className="w-4 h-4 text-stone-900 shrink-0 mr-1" />
                        )}
                      </button>
                    ))
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDestination(airbnbLocation);
                        setActiveAirbnbSegment('dates');
                      }}
                      className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-stone-100 transition-colors cursor-pointer text-left group"
                    >
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-stone-100 text-stone-700">
                        <Search className="w-5 h-5 stroke-[2.2]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-stone-900 group-hover:text-black leading-snug">
                          Search "{airbnbLocation}"
                        </div>
                        <div className="text-xs text-stone-500 truncate mt-0.5 font-normal">
                          Discover hotel inventory in this destination
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ─── 4. Risk Tolerance Popover ─── */}
            {activeAirbnbSegment === 'risk' && (
              <div className="absolute top-full right-0 mt-3 w-88 bg-white rounded-[32px] shadow-[0_12px_36px_rgba(0,0,0,0.16)] border border-stone-200/90 p-5 z-50 text-left animate-scale-in">
                <span className="text-xs font-bold text-stone-900 block mb-3 px-1">
                  Select Risk Tolerance
                </span>
                <div className="space-y-2">
                  {[
                    { id: 'Conservative', label: 'Conservative (P10)', desc: 'P10 demand floor. Prioritizes locked-in margins & zero room spoilage risk.' },
                    { id: 'Moderate', label: 'Moderate (P50)', desc: 'P50 median baseline. Balanced Sharpe ratio across seasonal patterns (Default).' },
                    { id: 'Aggressive', label: 'Aggressive (P90)', desc: 'P90 upside surge. Pre-buys higher allotments to capture peak demand.' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        setAirbnbRisk(r.id as any);
                        setActiveAirbnbSegment(null);
                      }}
                      className={`w-full text-left p-3 rounded-2xl text-xs transition-colors border cursor-pointer ${
                        airbnbRisk === r.id
                          ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                          : 'bg-stone-50 hover:bg-stone-100 text-stone-800 border-stone-200/80'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-bold">{r.label}</span>
                        {airbnbRisk === r.id && <Check className="w-3.5 h-3.5 text-amber-300" />}
                      </div>
                      <p className={`text-[10.5px] leading-tight ${airbnbRisk === r.id ? 'text-stone-300' : 'text-stone-500'}`}>
                        {r.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* ─── Main Content Container ─── */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 pt-5 space-y-4">
        
        {/* ─── Budget Tracker Bar (Crucial) ─── */}
        <div className="bg-white rounded-2xl p-4 sm:px-6 sm:py-3.5 border border-black/[0.04] shadow-[0_4px_24px_rgba(0,0,0,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Left: Indicator & Budget Used Display */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1c1917] text-amber-400 flex items-center justify-center shrink-0 shadow-sm">
              <DollarSign className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-stone-900 tracking-tight">
                  Budget Used: <strong className="font-extrabold font-mono text-stone-950">${budgetUsed.toLocaleString()}</strong> / <span className="font-mono text-stone-500">${budgetTotal.toLocaleString()}</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200/60 font-mono">
                  {budgetPercentage}% Deployed
                </span>
              </div>
              <span className="text-[11px] text-stone-400 font-medium">
                ${(budgetTotal - budgetUsed).toLocaleString()} remaining liquidity for pre-buy commitments
              </span>
            </div>
          </div>

          {/* Center / Right: Progress Bar & Guardrail Status */}
          <div className="flex items-center gap-4 flex-1 max-w-md justify-end">
            <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden border border-stone-200/60 p-0.5">
              <div 
                className="h-full bg-[#1c1917] rounded-full transition-all duration-500 ease-spring"
                style={{ width: `${budgetPercentage}%` }}
              />
            </div>
            <span className="text-[11px] font-semibold text-stone-500 whitespace-nowrap hidden sm:inline">
              Hard Cap
            </span>
          </div>

        </div>

        {/* ─── Bento Overview & Model Strategy Card ─── */}
        <div ref={headerRef} className="bg-white rounded-3xl p-5 sm:p-6 border border-black/[0.04] shadow-[0_4px_24px_rgba(0,0,0,0.03)] relative">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            
            {/* Left: Greeting & Strategy Subtitle */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
                  Hello, Inventory Manager 👋
                </h2>
                <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200/60">
                  Hotel Wholesale AI
                </span>
              </div>
              <p className="text-xs text-stone-500 font-medium">
                Set allocation parameters to run LightGBM Quantile Forecasts & Newsvendor Sizing.
              </p>

              {/* Interactive Model Constraint Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                
                {/* 1. Destination Chip */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setActiveChipPopover(activeChipPopover === 'destination' ? null : 'destination')}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${
                      selectedDestination !== 'All Destinations'
                        ? 'bg-[#1c1917] text-white border-[#1c1917]'
                        : 'bg-[#f5f2eb] hover:bg-[#ede8df] text-stone-700 border-stone-200/80'
                    }`}
                  >
                    <span>Market: {selectedDestination}</span>
                    <ChevronDown className="w-3 h-3 text-stone-400" />
                  </button>

                  {activeChipPopover === 'destination' && (
                    <div className="absolute left-0 top-full mt-2 w-60 bg-white rounded-2xl shadow-elevation-4 border border-stone-200/80 p-2 z-40 animate-scale-in">
                      <span className="text-[10px] font-bold text-stone-400 uppercase px-2 mb-1 block">
                        Select Destination
                      </span>
                      {['All Destinations', 'New York City, US', 'Dubai, UAE', 'Singapore', 'Goa, India', 'Houston, TX 77023'].map((loc) => (
                        <button
                          key={loc}
                          onClick={() => { setSelectedDestination(loc); setActiveChipPopover(null); }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs transition-colors flex items-center justify-between ${
                            selectedDestination === loc ? 'bg-stone-100 font-bold text-stone-900' : 'text-stone-600 hover:bg-stone-50'
                          }`}
                        >
                          <span>{loc}</span>
                          {selectedDestination === loc && <Check className="w-3 h-3 text-stone-900" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Travel Window Chip */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setActiveChipPopover(activeChipPopover === 'window' ? null : 'window')}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${
                      travelWindowFilter !== 'All'
                        ? 'bg-[#1c1917] text-white border-[#1c1917]'
                        : 'bg-[#f5f2eb] hover:bg-[#ede8df] text-stone-700 border-stone-200/80'
                    }`}
                  >
                    <Calendar className="w-3 h-3 text-stone-400" />
                    <span>Horizon: {travelWindowFilter === 'All' ? 'All Dates' : travelWindowFilter}</span>
                    <ChevronDown className="w-3 h-3 text-stone-400" />
                  </button>

                  {activeChipPopover === 'window' && (
                    <div className="absolute left-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-elevation-4 border border-stone-200/80 p-2 z-40 animate-scale-in">
                      <span className="text-[10px] font-bold text-stone-400 uppercase px-2 mb-1 block">
                        Pre-Buy Booking Horizon
                      </span>
                      {['All', 'Next 30 Days', '31–60 Days', 'Holiday Peak'].map((opt) => (
                        <button
                          key={opt}
                          onClick={() => { setTravelWindowFilter(opt); setActiveChipPopover(null); }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs transition-colors flex items-center justify-between ${
                            travelWindowFilter === opt ? 'bg-stone-100 font-bold text-stone-900' : 'text-stone-600 hover:bg-stone-50'
                          }`}
                        >
                          <span>{opt === 'All' ? 'All Booking Windows' : opt}</span>
                          {travelWindowFilter === opt && <Check className="w-3 h-3 text-stone-900" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Budget Cap Chip */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setActiveChipPopover(activeChipPopover === 'budget' ? null : 'budget')}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${
                      budgetCapFilter !== 'All'
                        ? 'bg-[#1c1917] text-white border-[#1c1917]'
                        : 'bg-[#f5f2eb] hover:bg-[#ede8df] text-stone-700 border-stone-200/80'
                    }`}
                  >
                    <DollarSign className="w-3 h-3 text-stone-400" />
                    <span>Budget: {budgetCapFilter === 'All' ? '$500,000 Cap' : budgetCapFilter}</span>
                    <ChevronDown className="w-3 h-3 text-stone-400" />
                  </button>

                  {activeChipPopover === 'budget' && (
                    <div className="absolute left-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-elevation-4 border border-stone-200/80 p-2 z-40 animate-scale-in">
                      <span className="text-[10px] font-bold text-stone-400 uppercase px-2 mb-1 block">
                        Hard Budget Cap ($B)
                      </span>
                      {['All', '< $280k', '$280k - $350k', '> $350k'].map((opt) => (
                        <button
                          key={opt}
                          onClick={() => { setBudgetCapFilter(opt); setActiveChipPopover(null); }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs transition-colors flex items-center justify-between ${
                            budgetCapFilter === opt ? 'bg-stone-100 font-bold text-stone-900' : 'text-stone-600 hover:bg-stone-50'
                          }`}
                        >
                          <span>{opt === 'All' ? 'All Budgets' : opt}</span>
                          {budgetCapFilter === opt && <Check className="w-3 h-3 text-stone-900" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. Risk / Strategy Chip */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setActiveChipPopover(activeChipPopover === 'risk' ? null : 'risk')}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${
                      riskTierFilter !== 'All'
                        ? 'bg-[#1c1917] text-white border-[#1c1917]'
                        : 'bg-[#f5f2eb] hover:bg-[#ede8df] text-stone-700 border-stone-200/80'
                    }`}
                  >
                    <ShieldCheck className="w-3 h-3 text-stone-400" />
                    <span>Risk: {riskTierFilter === 'All' ? 'P50 Balanced' : riskTierFilter}</span>
                    <ChevronDown className="w-3 h-3 text-stone-400" />
                  </button>

                  {activeChipPopover === 'risk' && (
                    <div className="absolute left-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-elevation-4 border border-stone-200/80 p-2 z-40 animate-scale-in">
                      <span className="text-[10px] font-bold text-stone-400 uppercase px-2 mb-1 block">
                        Quantile Target Strategy
                      </span>
                      {['All', 'P50 Balanced', 'Low Risk (P10)', 'High Margin'].map((opt) => (
                        <button
                          key={opt}
                          onClick={() => { setRiskTierFilter(opt === 'P50 Balanced' ? 'All' : opt); setActiveChipPopover(null); }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs transition-colors flex items-center justify-between ${
                            riskTierFilter === opt || (opt === 'P50 Balanced' && riskTierFilter === 'All')
                              ? 'bg-stone-100 font-bold text-stone-900'
                              : 'text-stone-600 hover:bg-stone-50'
                          }`}
                        >
                          <span>{opt === 'All' ? 'All Strategies' : opt}</span>
                          {(riskTierFilter === opt || (opt === 'P50 Balanced' && riskTierFilter === 'All')) && (
                            <Check className="w-3 h-3 text-stone-900" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Reset Filters button */}
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="w-7 h-7 rounded-full bg-[#f5f2eb] hover:bg-stone-200 text-stone-500 hover:text-stone-900 flex items-center justify-center transition-colors"
                  title="Reset all filters"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>

              </div>
            </div>

            {/* Right: Portfolio Metrics Widget (Styled like the media player / progress card in reference) */}
            <div className="bg-[#f5f2eb] rounded-2xl p-3.5 flex items-center gap-4 shrink-0 border border-stone-200/60">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                  Capital Allocation
                </span>
                <div className="text-sm font-extrabold text-stone-900 font-mono tabular-nums">
                  ${totalAllocated.toLocaleString()} <span className="text-[11px] text-stone-400 font-normal">/ $500K</span>
                </div>
                {/* Mini Progress Bar */}
                <div className="w-32 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-stone-900 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (totalAllocated / 500000) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="h-8 w-[1px] bg-stone-300/80" />

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                  Expected ROI
                </span>
                <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-200/80 font-mono">
                  <TrendingUp className="w-3 h-3 text-amber-700" />
                  <span>+{projectedROI}%</span>
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* ─── Main Grid: Hotel Cards (Left) & Vector Map (Right) ─── */}
        <div className={`grid gap-5 ${
          viewMode === 'list' 
            ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4' 
            : viewMode === 'map' 
              ? 'grid-cols-1' 
              : 'grid-cols-1 lg:grid-cols-12'
        }`}>

          {/* ─── Left Side: Hotel Inventory Cards Grid ─── */}
          {viewMode !== 'map' && (
            <div className={viewMode === 'list' ? 'col-span-full' : 'lg:col-span-6 xl:col-span-6'}>
              
              {/* Category Pills & View Mode Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4 px-1">
                {/* Hotel category pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-xl">
                  {hotelCategories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveCategory(cat.id)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        activeCategory === cat.id
                          ? 'bg-stone-900 text-white shadow-xs'
                          : 'bg-white hover:bg-stone-100 text-stone-600 border border-stone-200/80'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* View Mode Switcher */}
                <div className="flex items-center bg-white border border-stone-200/80 p-0.5 rounded-full shadow-xs shrink-0">
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                      viewMode === 'list' 
                        ? 'bg-stone-900 text-white shadow-xs' 
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    <ListIcon className="w-3 h-3" />
                    <span>List</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('split')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                      viewMode === 'split'
                        ? 'bg-stone-900 text-white shadow-xs' 
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    <MapIcon className="w-3 h-3" />
                    <span>Map</span>
                  </button>
                </div>
              </div>

              {/* Results status header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-bold text-stone-800">
                  {filteredItems.length} Wholesale Hotel Allotments
                </span>
                <span className="text-[11px] text-stone-400 font-medium">
                  {activeCategory !== 'All' ? activeCategory : 'Global Hotel Portfolio'}
                </span>
              </div>

              {/* 2-Column Cards Grid with soft rounded-3xl styling */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredItems.map((item) => {
                  const isSelected = item.id === selectedId;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectItem(item.id)}
                      className={`group bg-white rounded-3xl p-3 border transition-all duration-300 overflow-hidden cursor-pointer flex flex-col select-none ${
                        isSelected 
                          ? 'border-stone-900 shadow-md ring-2 ring-stone-900/10' 
                          : 'border-black/[0.04] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5'
                      }`}
                    >
                      {/* Photo Container with Heart Button */}
                      <div className="relative h-36 sm:h-40 w-full rounded-2xl overflow-hidden bg-stone-100">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                        
                        {/* Bookmark Button */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleBookmark(item.id, e)}
                          aria-label={item.bookmarked ? 'Remove bookmark' : 'Bookmark hotel'}
                          className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 hover:bg-white backdrop-blur-md flex items-center justify-center text-stone-700 shadow-sm transition-all active:scale-90"
                        >
                          <Heart 
                            className={`w-3.5 h-3.5 transition-colors ${
                              item.bookmarked ? 'fill-rose-500 text-rose-500' : 'text-stone-700'
                            }`} 
                          />
                        </button>

                        {/* Booking Horizon Tag (Warm Sand Badge) */}
                        <div className="absolute bottom-2 left-2 bg-stone-900/80 backdrop-blur-md text-white font-medium text-[9px] px-2.5 py-0.5 rounded-full">
                          {item.travelWindow}
                        </div>
                      </div>

                      {/* Hotel Content */}
                      <div className="pt-3 px-1 flex flex-col justify-between flex-1">
                        
                        {/* Title and Wholesale Value */}
                        <div className="flex items-baseline justify-between gap-1.5 mb-0.5">
                          <h3 className="text-xs font-bold text-stone-900 group-hover:text-black tracking-tight truncate">
                            {item.title}
                          </h3>
                          <span className="text-xs font-black text-stone-950 font-mono tracking-tight shrink-0">
                            {item.price}
                          </span>
                        </div>

                        {/* Location and Profit */}
                        <div className="flex items-center justify-between text-[11px] mb-2.5">
                          <span className="text-stone-400 font-medium truncate pr-1">
                            {item.city}
                          </span>
                          <span className="text-emerald-700 font-bold shrink-0">
                            Profit {item.expectedProfit}
                          </span>
                        </div>

                        {/* 3 Hotel Specs Row with Warm Amber Demand Lift Tag */}
                        <div className="flex items-center justify-between text-[10px] text-stone-600 font-medium pt-2 border-t border-stone-100">
                          <div className="flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-stone-400 shrink-0" />
                            <span>{item.rooms} Rooms</span>
                          </div>
                          
                          {/* Warm Amber Demand Badge matching reference */}
                          <div className="bg-amber-50 text-amber-900 border border-amber-200/60 font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                            <TrendingUp className="w-2.5 h-2.5 text-amber-700" />
                            <span>{item.demandLift}</span>
                          </div>

                          <div className="flex items-center gap-0.5 text-stone-700 font-semibold">
                            <Percent className="w-3 h-3 text-stone-400 shrink-0" />
                            <span>{item.margin}</span>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* ─── Right Side: Vector Street Map (Harmonized with Alabaster Palette) ─── */}
          {viewMode !== 'list' && (
            <div className={`relative ${
              viewMode === 'map' ? 'col-span-full' : 'lg:col-span-6 xl:col-span-6'
            }`}>
              
              {/* Map Container in matching warm ivory theme */}
              <div className="sticky top-[135px] w-full h-[540px] rounded-3xl overflow-hidden border border-black/[0.04] shadow-[0_4px_24px_rgba(0,0,0,0.03)] bg-[#ece7dd] relative">
                
                {/* SVG Vector Map Canvas */}
                <svg
                  viewBox="0 0 1000 800"
                  className="w-full h-full object-cover transition-transform duration-300 ease-out select-none"
                  style={{
                    transform: `scale(${mapZoom}) translate(${mapPan.x}px, ${mapPan.y}px)`,
                    transformOrigin: '50% 50%',
                  }}
                >
                  {/* Background base */}
                  <rect width="1000" height="800" fill="#ede8de" />

                  {/* Parks / Green areas in subtle soft sage */}
                  <path
                    d="M 680,220 C 720,200 820,230 840,300 C 860,370 780,410 730,380 C 680,350 640,240 680,220 Z"
                    fill="#dde7db"
                    stroke="#cdd8cb"
                    strokeWidth="1.5"
                  />
                  <text x="735" y="310" fill="#4d7c58" fontSize="12" fontWeight="600" opacity="0.8" textAnchor="middle">
                    Clove Lakes Park
                  </text>

                  <path
                    d="M 60,650 C 120,600 220,620 250,720 C 200,780 90,790 50,730 Z"
                    fill="#dde7db"
                    stroke="#cdd8cb"
                    strokeWidth="1.5"
                  />

                  {/* Secondary Streets Network */}
                  <g stroke="#ffffff" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none">
                    <path d="M 0,160 Q 300,180 500,120 T 1000,140" />
                    <path d="M 120,0 Q 180,300 220,500 T 260,800" />
                    <path d="M 320,0 L 400,800" />
                    <path d="M 0,380 C 250,390 450,320 700,420 T 1000,450" />
                    <path d="M 520,0 C 560,250 620,520 680,800" />
                    <path d="M 0,620 Q 350,580 700,660 T 1000,620" />
                    <path d="M 800,0 C 820,280 860,540 890,800" />
                  </g>

                  {/* Main Arterial Road Network */}
                  <g stroke="#ffffff" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" fill="none">
                    <path d="M 0,80 Q 350,180 550,380 T 1000,720" />
                    <path d="M 200,800 C 450,650 650,450 780,0" />
                    <path d="M 0,480 C 320,490 550,560 1000,320" />
                  </g>

                  {/* Road Borders */}
                  <g stroke="#ddd7cc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none">
                    <path d="M 0,80 Q 350,180 550,380 T 1000,720" />
                    <path d="M 200,800 C 450,650 650,450 780,0" />
                    <path d="M 0,480 C 320,490 550,560 1000,320" />
                  </g>

                  {/* Street Labels */}
                  <text x="320" y="600" fill="#a8a29e" fontSize="10" fontWeight="600" transform="rotate(-34 320 600)">
                    Victory Blvd
                  </text>
                  <text x="560" y="555" fill="#a8a29e" fontSize="10" fontWeight="600" transform="rotate(8 560 555)">
                    Ocean Terrace
                  </text>
                  <text x="640" y="110" fill="#a8a29e" fontSize="10" fontWeight="600">
                    Henderson Ave
                  </text>
                </svg>

                {/* Floating Map Zoom Controls (Top Left) */}
                <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5">
                  <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-sm border border-stone-200/80 p-0.5 flex flex-col">
                    <button
                      type="button"
                      onClick={handleZoomIn}
                      className="w-7 h-7 flex items-center justify-center text-stone-700 hover:text-black hover:bg-stone-100 rounded-lg transition-colors"
                      title="Zoom In"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <div className="h-[1px] bg-stone-100 mx-0.5" />
                    <button
                      type="button"
                      onClick={handleZoomOut}
                      className="w-7 h-7 flex items-center justify-center text-stone-700 hover:text-black hover:bg-stone-100 rounded-lg transition-colors"
                      title="Zoom Out"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleResetMap}
                    className="w-8 h-8 bg-white/95 backdrop-blur-md rounded-xl shadow-sm border border-stone-200/80 flex items-center justify-center text-stone-700 hover:text-black hover:bg-stone-100 transition-colors"
                    title="Reset Map Position"
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Hotel Map Pins */}
                {items.map((item) => {
                  const isSelected = item.id === selectedId;
                  return (
                    <div
                      key={item.id}
                      style={{
                        left: `${item.mapCoords.x}%`,
                        top: `${item.mapCoords.y}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      className="absolute z-10 cursor-pointer group"
                      onClick={() => handleSelectItem(item.id)}
                    >
                      {/* Pulse Ring when Selected */}
                      {isSelected && (
                        <span className="absolute -inset-2.5 rounded-full bg-stone-900/30 animate-ping pointer-events-none" />
                      )}

                      {/* Pin Circle */}
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${
                          isSelected
                            ? 'bg-[#1c1917] text-amber-300 ring-4 ring-stone-900/20 scale-110'
                            : 'bg-white text-stone-800 hover:scale-110 opacity-90 hover:opacity-100 border border-stone-200 shadow-sm'
                        }`}
                      >
                        <Building2 className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  );
                })}

                {/* ─── Floating Popup Card over Active Pin ─── */}
                {popupVisible && activeItem && (
                  <div
                    style={{
                      left: `${activeItem.mapCoords.x}%`,
                      top: `${activeItem.mapCoords.y}%`,
                      transform: 'translate(-50%, -106%)',
                    }}
                    className="absolute z-30 w-60 sm:w-64 bg-white rounded-3xl shadow-elevation-4 border border-stone-200/80 overflow-hidden animate-scale-in transition-all"
                  >
                    {/* Image Header with Close Button */}
                    <div className="relative h-28 w-full bg-stone-100">
                      <img
                        src={activeItem.image}
                        alt={activeItem.title}
                        className="w-full h-full object-cover"
                      />
                      
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPopupVisible(false);
                        }}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors shadow-sm"
                        aria-label="Close popup"
                      >
                        <X className="w-3 h-3" />
                      </button>

                      {/* Translucent Dark Glass Overlay */}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-2.5 pt-4 text-white backdrop-blur-[2px]">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <h4 className="text-[11px] font-bold truncate tracking-tight text-white">
                            {activeItem.title}
                          </h4>
                          <div className="flex items-center gap-0.5 text-[10px] font-bold text-amber-300 shrink-0">
                            <Star className="w-2.5 h-2.5 fill-amber-300 text-amber-300" />
                            <span>{activeItem.rating.toFixed(1)}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-stone-300">
                          <span className="truncate pr-1 font-medium">
                            {activeItem.city}
                          </span>
                          <span className="font-extrabold text-white shrink-0 font-mono">
                            {activeItem.price}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Action Footer */}
                    <div className="px-3 py-2 bg-[#f5f2eb] flex items-center justify-between text-[11px]">
                      <span className="text-emerald-800 font-bold">
                        Profit: {activeItem.expectedProfit}
                      </span>
                      <button
                        type="button"
                        onClick={() => setModalItem(activeItem)}
                        className="font-bold text-stone-900 hover:text-black transition-colors flex items-center gap-0.5"
                      >
                        <span>Details</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    </div>

                  </div>
                )}

              </div>
            </div>
          )}

        </div>
      </div>

      {/* ─── Detail Modal (ML Quantiles, TreeSHAP, Allocation) ─── */}
      <OpportunityDetailModal
        item={modalItem}
        onClose={() => setModalItem(null)}
      />

    </div>
  );
};
