import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Building2, 
  Plane,
  Search, 
  X, 
  ChevronDown, 
  ChevronLeft,
  ChevronRight,
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
  Palmtree,
  Zap,
  Globe,
  MapPin
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
  const [budgetInputText, setBudgetInputText] = useState<string>('500,000');
  const [airbnbStartDate, setAirbnbStartDate] = useState<string>('2026-11-19');
  const [airbnbEndDate, setAirbnbEndDate] = useState<string>('2026-11-25');
  const [airbnbLocation, setAirbnbLocation] = useState<string>('Nearby');
  const [airbnbRisk, setAirbnbRisk] = useState<'Conservative' | 'Moderate' | 'Aggressive'>('Moderate');
  const airbnbBarRef = useRef<HTMLDivElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const budgetInputRef = useRef<HTMLInputElement>(null);

  // Budget change handlers
  const handleBudgetChange = (newVal: number) => {
    setAirbnbBudget(newVal);
    setBudgetInputText(newVal ? newVal.toLocaleString() : '');
  };

  const handleBudgetTyping = (val: string) => {
    const clean = val.replace(/[^0-9]/g, '');
    const num = parseInt(clean || '0', 10);
    setAirbnbBudget(num);
    setBudgetInputText(clean ? Number(clean).toLocaleString() : '');
  };

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

  // 3. Sub-section Constraints, Sorting & Map Layers (Image 2 UI Reference)
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [minMarginFilter, setMinMarginFilter] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'roi' | 'profit' | 'priceAsc' | 'rooms'>('roi');
  const [isSortOpen, setIsSortOpen] = useState<boolean>(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState<boolean>(false);
  const [mapLayer, setMapLayer] = useState<'maps' | 'satellite'>('maps');
  const sortRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);

  // Budget Tracker Bar State (Synchronized with airbnbBudget)
  const [budgetUsed] = useState<number>(120000);
  const budgetTotal = airbnbBudget;
  const budgetPercentage = Math.min(100, Math.round((budgetUsed / budgetTotal) * 100));

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

  // Filtered & Sorted Items
  const filteredAndSortedItems = useMemo(() => {
    let result = items.filter((item) => {
      // Asset class
      if (activeAssetClass === 'flights') {
        return false;
      }

      // Category Tab Filter
      if (activeCategory === 'High Margin') {
        if (parseInt(item.margin, 10) < 25) return false;
      } else if (activeCategory !== 'All') {
        if (item.hotelCategory !== activeCategory) return false;
      }

      // Min Margin Tag Filter
      if (minMarginFilter && parseInt(item.margin, 10) < 20) {
        return false;
      }

      // Location Filter (from Airbnb search bar)
      if (airbnbLocation && airbnbLocation !== 'Nearby') {
        const locClean = airbnbLocation.split(',')[0].trim().toLowerCase();
        const matchesAny = items.some((it) =>
          it.city.toLowerCase().includes(locClean) ||
          it.title.toLowerCase().includes(locClean) ||
          it.destination.toLowerCase().includes(locClean)
        );
        if (matchesAny) {
          const matched = item.city.toLowerCase().includes(locClean) || 
                          item.title.toLowerCase().includes(locClean) ||
                          item.destination.toLowerCase().includes(locClean);
          if (!matched) return false;
        }
      }

      // Risk Strategy Filter (from Airbnb search bar)
      if (airbnbRisk === 'Conservative' && item.riskRating === 'High') {
        return false;
      }

      // Text Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches = item.title.toLowerCase().includes(q) || 
                        item.city.toLowerCase().includes(q) || 
                        item.hotelCategory.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });

    // Apply Sorting
    result.sort((a, b) => {
      if (sortBy === 'roi') {
        return (b.expectedProfitNum / b.allocatedAmount) - (a.expectedProfitNum / a.allocatedAmount);
      }
      if (sortBy === 'profit') {
        return b.expectedProfitNum - a.expectedProfitNum;
      }
      if (sortBy === 'priceAsc') {
        return a.priceNum - b.priceNum;
      }
      if (sortBy === 'rooms') {
        return b.rooms - a.rooms;
      }
      return 0;
    });

    return result;
  }, [items, activeAssetClass, activeCategory, minMarginFilter, airbnbLocation, airbnbRisk, searchQuery, sortBy]);

  // Aggregate Portfolio Metrics
  const totalAllocated = useMemo(() => {
    return filteredAndSortedItems.reduce((acc, it) => acc + it.allocatedAmount, 0);
  }, [filteredAndSortedItems]);

  const totalProfit = useMemo(() => {
    return filteredAndSortedItems.reduce((acc, it) => acc + it.expectedProfitNum, 0);
  }, [filteredAndSortedItems]);

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
    setMinMarginFilter(false);
    setAirbnbLocation('Nearby');
    setAirbnbRisk('Moderate');
    setAirbnbBudget(500000);
    setBudgetInputText('500,000');
    setAirbnbStartDate('2026-11-19');
    setAirbnbEndDate('2026-11-25');
    setSortBy('roi');
    setMapZoom(1);
    setMapPan({ x: 0, y: 0 });
  };

  // Map pin price format helper ($284k)
  const formatPinPrice = (num: number) => {
    if (num >= 1000) {
      return `$${Math.round(num / 1000)}k`;
    }
    return `$${num}`;
  };

  // Zoom handlers
  const handleZoomIn = () => setMapZoom((prev) => Math.min(prev + 0.25, 2));
  const handleZoomOut = () => setMapZoom((prev) => Math.max(prev - 0.25, 0.8));
  const handleResetMap = () => {
    setMapZoom(1);
    setMapPan({ x: 0, y: 0 });
  };

  // Close popovers on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (airbnbBarRef.current && !airbnbBarRef.current.contains(e.target as Node)) {
        setActiveAirbnbSegment(null);
      }
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setIsSortOpen(false);
      }
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) {
        setIsCategoryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sortByOptions = [
    { id: 'roi', label: 'Projected ROI' },
    { id: 'profit', label: 'Expected Profit' },
    { id: 'priceAsc', label: 'Price: Low to High' },
    { id: 'rooms', label: 'Rooms Allotment' },
  ] as const;

  return (
    <div className="w-full min-h-screen bg-[#F8F9FA] text-slate-900 pb-16 font-sans select-none antialiased">
      
      {/* ─── Airbnb-Style Procurement Query Header (Exact replica of user reference image) ─── */}
      <div className="bg-[#F8F9FA] border-b border-slate-200/80 pt-6 pb-6 px-4 sm:px-8">
        <div ref={airbnbBarRef} className="max-w-[960px] mx-auto flex flex-col items-center">
          
          {/* TOP: Category Tabs (Hotels | Flights) with Active Underline */}
          <div className="flex items-center gap-12 mb-4 select-none">
            {/* Hotels Tab (Active by default) */}
            <button
              type="button"
              onClick={() => setActiveAssetClass('hotels')}
              className={`flex items-center gap-2.5 pb-2.5 font-bold transition-all relative cursor-pointer ${
                activeAssetClass === 'hotels'
                  ? 'text-slate-950 font-black'
                  : 'text-slate-400 hover:text-slate-700 font-semibold'
              }`}
            >
              <Building2 className={`w-5 h-5 ${activeAssetClass === 'hotels' ? 'text-slate-950' : 'text-slate-400'}`} />
              <span className="text-[1.5rem] leading-none tracking-tight">Hotels</span>
              {activeAssetClass === 'hotels' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#0D4E43] rounded-full" />
              )}
            </button>

            {/* Flights Tab */}
            <button
              type="button"
              onClick={() => setActiveAssetClass('flights')}
              className={`flex items-center gap-2.5 pb-2.5 font-bold transition-all relative cursor-pointer ${
                activeAssetClass === 'flights'
                  ? 'text-slate-950 font-black'
                  : 'text-slate-400 hover:text-slate-700 font-semibold'
              }`}
            >
              <Plane className={`w-5 h-5 ${activeAssetClass === 'flights' ? 'text-slate-950' : 'text-slate-400'}`} />
              <span className="text-[1.5rem] leading-none tracking-tight">Flights</span>
              {activeAssetClass === 'flights' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#0D4E43] rounded-full" />
              )}
            </button>
          </div>

          {/* BOTTOM: Airbnb Rounded-Full Pill Search Bar (Enlarged with Direct Typing & Auto-Suggestions) */}
          <div className={`w-full rounded-full transition-all p-2 sm:p-2.5 min-h-[68px] sm:min-h-[74px] flex items-center relative ${
            activeAirbnbSegment 
              ? 'bg-[#F1F5F9] shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-slate-300' 
              : 'bg-white border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_28px_rgba(0,0,0,0.1)]'
          }`}>
            
            {/* 1. Budget Segment (Direct Inline Typing) */}
            <div
              onClick={() => {
                setActiveAirbnbSegment('budget');
                budgetInputRef.current?.focus();
              }}
              className={`flex-1 px-5 sm:px-7 py-2.5 sm:py-3 rounded-full text-left transition-all cursor-pointer ${
                activeAirbnbSegment === 'budget' 
                  ? 'bg-white shadow-[0_4px_16px_rgba(0,0,0,0.1)] border border-[#0D4E43]' 
                  : activeAirbnbSegment 
                    ? 'hover:bg-slate-200/60' 
                    : 'hover:bg-slate-100/60'
              }`}
            >
              <label className="text-xs sm:text-[14px] font-black text-slate-900 block leading-tight cursor-pointer select-none">
                Budget
              </label>
              <div className="flex items-center text-sm sm:text-base font-bold text-slate-950 mt-0.5">
                <span className="text-slate-400 mr-0.5 select-none font-bold">$</span>
                <input
                  ref={budgetInputRef}
                  type="text"
                  inputMode="numeric"
                  value={budgetInputText}
                  onChange={(e) => handleBudgetTyping(e.target.value)}
                  onFocus={() => setActiveAirbnbSegment('budget')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setActiveAirbnbSegment('dates');
                    }
                  }}
                  placeholder="Add budget"
                  className="w-full bg-transparent text-sm sm:text-base font-bold text-slate-950 placeholder:text-slate-400 outline-none truncate"
                />
                {airbnbBudget > 0 && activeAirbnbSegment === 'budget' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBudgetChange(0);
                      budgetInputRef.current?.focus();
                    }}
                    className="w-5 h-5 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center shrink-0 ml-1 text-slate-600 transition-colors cursor-pointer"
                    title="Clear budget"
                  >
                    <X className="w-3 h-3 stroke-[2.5]" />
                  </button>
                )}
              </div>
            </div>

            {/* Vertical Divider 1 */}
            <div className={`w-[1px] h-7 sm:h-8 bg-slate-200 self-center shrink-0 ${
              activeAirbnbSegment === 'budget' || activeAirbnbSegment === 'dates' ? 'opacity-0' : 'opacity-100'
            }`} />

            {/* 2. Dates Segment (Like Airbnb with Start and End Dates) */}
            <button
              type="button"
              onClick={() => setActiveAirbnbSegment(prev => prev === 'dates' ? null : 'dates')}
              className={`flex-1 px-5 sm:px-7 py-2.5 sm:py-3 rounded-full text-left transition-all cursor-pointer focus:outline-hidden ${
                activeAirbnbSegment === 'dates' 
                  ? 'bg-white shadow-[0_4px_16px_rgba(0,0,0,0.1)] border border-[#0D4E43]' 
                  : activeAirbnbSegment 
                    ? 'hover:bg-slate-200/60' 
                    : 'hover:bg-slate-100/60'
              }`}
            >
              <span className="text-xs sm:text-[14px] font-black text-slate-900 block leading-tight">Dates</span>
              <span className="text-sm sm:text-base text-slate-950 font-bold truncate block mt-0.5">
                {formatDatesDisplay(airbnbStartDate, airbnbEndDate)}
              </span>
            </button>

            {/* Vertical Divider 2 */}
            <div className={`w-[1px] h-7 sm:h-8 bg-slate-200 self-center shrink-0 ${
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
                  ? 'bg-white shadow-[0_4px_16px_rgba(0,0,0,0.1)] border border-[#0D4E43]' 
                  : activeAirbnbSegment 
                    ? 'hover:bg-slate-200/60' 
                    : 'hover:bg-slate-100/60'
              }`}
            >
              <label className="text-xs sm:text-[14px] font-black text-slate-900 block leading-tight cursor-pointer select-none">
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
                      }
                      setActiveAirbnbSegment('dates');
                    }
                  }}
                  placeholder="Search destinations"
                  className="w-full bg-transparent text-sm sm:text-base font-bold text-slate-950 placeholder:text-slate-400 outline-none truncate"
                />
                {airbnbLocation && activeAirbnbSegment === 'location' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAirbnbLocation('');
                      locationInputRef.current?.focus();
                    }}
                    className="w-5 h-5 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center shrink-0 ml-1 text-slate-600 transition-colors cursor-pointer"
                    title="Clear destination"
                  >
                    <X className="w-3 h-3 stroke-[2.5]" />
                  </button>
                )}
              </div>
            </div>

            {/* Vertical Divider 3 */}
            <div className={`w-[1px] h-7 sm:h-8 bg-slate-200 self-center shrink-0 ${
              activeAirbnbSegment === 'location' || activeAirbnbSegment === 'risk' ? 'opacity-0' : 'opacity-100'
            }`} />

            {/* 4. Risk Tolerance Segment */}
            <button
              type="button"
              onClick={() => setActiveAirbnbSegment(prev => prev === 'risk' ? null : 'risk')}
              className={`flex-1 px-5 sm:px-7 py-2.5 sm:py-3 rounded-full text-left transition-all cursor-pointer focus:outline-hidden ${
                activeAirbnbSegment === 'risk' 
                  ? 'bg-white shadow-[0_4px_16px_rgba(0,0,0,0.1)] border border-[#0D4E43]' 
                  : activeAirbnbSegment 
                    ? 'hover:bg-slate-200/60' 
                    : 'hover:bg-slate-100/60'
              }`}
            >
              <span className="text-xs sm:text-[14px] font-black text-slate-900 block leading-tight">Risk Tolerance</span>
              <span className="text-sm sm:text-base text-slate-950 font-bold truncate block mt-0.5">
                {airbnbRisk === 'Conservative' ? 'Conservative (P10)' : airbnbRisk === 'Aggressive' ? 'Aggressive (P90)' : 'Moderate (P50)'}
              </span>
            </button>

            {/* Far Right: Dark Emerald Search Action Button (Signature Theme) */}
            <button
              type="button"
              onClick={() => {
                setActiveAirbnbSegment(null);
                setSelectedId('dumble-st');
                setPopupVisible(true);
              }}
              className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-[#0D4E43] hover:bg-[#09352e] active:scale-95 text-white flex items-center justify-center shrink-0 shadow-md hover:shadow-lg transition-all cursor-pointer ml-2 mr-1"
              aria-label="Search and run engine"
              title="Search and run engine"
            >
              <Search className="w-5 h-5 stroke-[2.8]" />
            </button>

            {/* ─── 1. Budget Popover (Clean Airbnb Pills Matching Dates Flexibility Style) ─── */}
            {activeAirbnbSegment === 'budget' && (
              <div className="absolute top-full left-0 mt-3 w-88 bg-white rounded-[32px] shadow-[0_12px_36px_rgba(0,0,0,0.16)] border border-stone-200/90 p-6 z-50 text-left animate-scale-in">
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-xs font-bold text-stone-900 tracking-tight">
                    Suggested budgets
                  </span>
                  <span className="text-[11px] text-stone-400 font-medium">
                    Max capital cap ($B)
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {[100000, 250000, 500000, 1000000, 2500000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        handleBudgetChange(val);
                        setActiveAirbnbSegment('dates');
                      }}
                      className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        airbnbBudget === val
                          ? 'border border-stone-900 text-stone-900 font-bold bg-stone-50 shadow-xs'
                          : 'border border-stone-200 hover:border-stone-400 text-stone-700 hover:bg-stone-50'
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

            {/* ─── 4. Risk Tolerance Popover (Matching Location & Dates Design & Typography) ─── */}
            {activeAirbnbSegment === 'risk' && (
              <div className="absolute top-full right-0 mt-3 w-[460px] max-w-[95vw] bg-white rounded-[32px] shadow-[0_12px_36px_rgba(0,0,0,0.16)] border border-stone-200/90 p-6 z-50 text-left animate-scale-in">
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-xs font-bold text-stone-900 tracking-tight">
                    Select risk tolerance
                  </span>
                  <span className="text-[11px] text-stone-400 font-medium">
                    Quantile allocation strategy
                  </span>
                </div>

                <div className="space-y-1">
                  {[
                    {
                      id: 'Conservative',
                      name: 'Conservative (P10 Floor)',
                      subtitle: 'Locked-in margins • Zero room spoilage risk',
                      icon: ShieldCheck,
                      iconBg: 'bg-sky-50',
                      iconColor: 'text-sky-500',
                    },
                    {
                      id: 'Moderate',
                      name: 'Moderate (P50 Baseline)',
                      subtitle: 'Balanced Sharpe ratio across seasonal patterns',
                      icon: TrendingUp,
                      iconBg: 'bg-rose-50',
                      iconColor: 'text-rose-500',
                    },
                    {
                      id: 'Aggressive',
                      name: 'Aggressive (P90 Upside)',
                      subtitle: 'Pre-buys higher allotments to capture peak demand',
                      icon: Zap,
                      iconBg: 'bg-amber-50',
                      iconColor: 'text-amber-600',
                    },
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        setAirbnbRisk(r.id as any);
                        setActiveAirbnbSegment(null);
                      }}
                      className="w-full flex items-center gap-4 p-2.5 rounded-2xl hover:bg-stone-100 transition-colors cursor-pointer text-left group"
                    >
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${r.iconBg} ${r.iconColor}`}>
                        <r.icon className="w-5 h-5 stroke-[2.2]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-stone-900 group-hover:text-black leading-snug">
                          {r.name}
                        </div>
                        <div className="text-xs text-stone-500 truncate mt-0.5 font-normal">
                          {r.subtitle}
                        </div>
                      </div>
                      {airbnbRisk === r.id && (
                        <Check className="w-4 h-4 text-stone-900 shrink-0 mr-1" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* ─── Main Content Container ─── */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 pt-5 space-y-4">
        
        {/* ─── Wholesale Capital Liquidity & Portfolio Bar (Valuable Revenue Management Strip) ─── */}
        <div className="bg-white rounded-2xl p-4 sm:px-6 sm:py-4 border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Left: Indicator & Budget Used Display */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#0D4E43] text-emerald-100 flex items-center justify-center shrink-0 shadow-xs">
              <DollarSign className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                  Budget Used: <strong className="font-black font-mono text-slate-950 text-base sm:text-lg">${budgetUsed.toLocaleString()}</strong> / <span className="font-mono text-slate-500 font-bold">${budgetTotal.toLocaleString()}</span>
                </span>
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#0D4E43] border border-emerald-300/80 font-mono">
                  {budgetPercentage}% Deployed
                </span>
              </div>
              <span className="text-xs sm:text-sm text-slate-600 font-semibold">
                ${(budgetTotal - budgetUsed).toLocaleString()} remaining liquidity for pre-buy commitments
              </span>
            </div>
          </div>

          {/* Center / Right: Progress Bar & Portfolio Metrics */}
          <div className="flex items-center gap-6 flex-1 max-w-xl justify-end">
            <div className="flex items-center gap-3 flex-1 max-w-xs">
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60 p-0.5">
                <div 
                  className="h-full bg-[#0D4E43] rounded-full transition-all duration-500 ease-spring"
                  style={{ width: `${budgetPercentage}%` }}
                />
              </div>
              <span className="text-xs font-bold text-slate-600 whitespace-nowrap hidden sm:inline">
                Hard Cap
              </span>
            </div>

            <div className="h-7 w-[1px] bg-slate-200 hidden md:block" />

            <div className="hidden md:flex items-center gap-5 text-sm font-semibold">
              <div>
                <span className="text-slate-400 block text-[11px] uppercase font-black tracking-wider">Capital Allocated</span>
                <span className="font-mono font-black text-slate-950 text-base sm:text-lg">${totalAllocated.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] uppercase font-black tracking-wider">Projected ROI</span>
                <span className="inline-flex items-center gap-0.5 text-emerald-800 font-black font-mono text-sm sm:text-base">
                  <TrendingUp className="w-4 h-4 text-emerald-700 stroke-[2.5]" />
                  +{projectedROI}%
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* ─── Results Header & Dismissable Active Constraint Tags (Image 2 Replica) ─── */}
        <div className="pt-2">
          {/* Top Line: Heading and Sort by Dropdown */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-[2rem] font-black text-slate-950 tracking-tight leading-tight">
                {filteredAndSortedItems.length > 0 ? (filteredAndSortedItems.length * 142).toLocaleString() : '1,420'} Allotments in {airbnbLocation === 'Nearby' ? 'Global Portfolio' : airbnbLocation.split(',')[0]}
              </h1>
            </div>

            {/* Sort by dropdown */}
            <div ref={sortRef} className="relative self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-800 hover:text-slate-950 bg-white border border-slate-200/90 hover:border-slate-300 px-4 py-2 rounded-full shadow-xs transition-all cursor-pointer"
              >
                <span className="text-slate-400 font-semibold">Sort by:</span>
                <span className="font-black text-slate-950">
                  {sortByOptions.find((o) => o.id === sortBy)?.label || 'Projected ROI'}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {isSortOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200/90 p-1.5 z-40 animate-scale-in">
                  <span className="text-[11px] font-black text-slate-400 uppercase px-3 py-1.5 block tracking-wider">
                    Sort Opportunities
                  </span>
                  {sortByOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setSortBy(opt.id);
                        setIsSortOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm transition-colors flex items-center justify-between cursor-pointer ${
                        sortBy === opt.id ? 'bg-slate-100 font-black text-slate-950' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-950 font-semibold'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {sortBy === opt.id && <Check className="w-4 h-4 text-[#0D4E43] stroke-[2.5]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Dismissable Active Filter Tags Row (Replicating Image 2 tags: [ Villa, Bungalow ✕ ] etc.) */}
          <div className="flex flex-wrap items-center gap-2 pb-2">
            {/* Tag 1: Active Category / Allotment */}
            <span className="bg-white border border-slate-200/90 text-slate-800 text-xs sm:text-[13px] font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-xs">
              <span>{activeCategory === 'All' ? 'Wholesale Allotments' : activeCategory}</span>
              {activeCategory !== 'All' && (
                <button
                  type="button"
                  onClick={() => setActiveCategory('All')}
                  className="text-slate-400 hover:text-slate-900 ml-0.5 cursor-pointer"
                  title="Clear category filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </span>

            {/* Tag 2: Net Margin Tag */}
            <button
              type="button"
              onClick={() => setMinMarginFilter(!minMarginFilter)}
              className={`text-xs sm:text-[13px] font-bold px-3.5 py-1.5 rounded-full border transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
                minMarginFilter
                  ? 'bg-slate-950 text-white border-slate-950'
                  : 'bg-white text-slate-800 border-slate-200/90 hover:border-slate-300'
              }`}
            >
              <span>Min. 20% Net Margin</span>
              {minMarginFilter ? (
                <X className="w-3.5 h-3.5 text-slate-300" />
              ) : null}
            </button>

            {/* Tag 3: Budget Constraint Tag */}
            <span className="bg-white border border-slate-200/90 text-slate-800 text-xs sm:text-[13px] font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-xs">
              <span>Budget: &lt; ${(airbnbBudget / 1000).toLocaleString()}k</span>
              {airbnbBudget !== 500000 && (
                <button
                  type="button"
                  onClick={() => {
                    setAirbnbBudget(500000);
                    setBudgetInputText('500,000');
                  }}
                  className="text-slate-400 hover:text-slate-900 ml-0.5 cursor-pointer"
                  title="Reset budget cap"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </span>

            {/* Tag 4: Risk Strategy Tag */}
            <span className="bg-white border border-slate-200/90 text-slate-800 text-xs sm:text-[13px] font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-xs">
              <span>{airbnbRisk} Risk Strategy</span>
              {airbnbRisk !== 'Moderate' && (
                <button
                  type="button"
                  onClick={() => setAirbnbRisk('Moderate')}
                  className="text-slate-400 hover:text-slate-900 ml-0.5 cursor-pointer"
                  title="Reset risk strategy"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </span>

            {/* Tag 5: Location Tag */}
            {airbnbLocation && airbnbLocation !== 'Nearby' && (
              <span className="bg-white border border-slate-200/90 text-slate-800 text-xs sm:text-[13px] font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-xs">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>{airbnbLocation}</span>
                <button
                  type="button"
                  onClick={() => setAirbnbLocation('Nearby')}
                  className="text-slate-400 hover:text-slate-900 ml-0.5 cursor-pointer"
                  title="Reset location"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {/* Tag 6: Dates / Horizon Tag */}
            <span className="bg-white border border-slate-200/90 text-slate-800 text-xs sm:text-[13px] font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>{formatDatesDisplay(airbnbStartDate, airbnbEndDate)}</span>
              {(airbnbStartDate !== '2026-11-19' || airbnbEndDate !== '2026-11-25') && (
                <button
                  type="button"
                  onClick={() => {
                    setAirbnbStartDate('2026-11-19');
                    setAirbnbEndDate('2026-11-25');
                  }}
                  className="text-slate-400 hover:text-slate-900 ml-0.5 cursor-pointer"
                  title="Reset dates"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </span>

            {/* Reset All Filters Button */}
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs sm:text-[13px] text-slate-500 hover:text-slate-950 underline font-bold ml-2 cursor-pointer transition-colors"
            >
              Reset all
            </button>
          </div>
        </div>

        {/* ─── Controls Toolbar: Hotel Category Condensed Dropdown (Left) & ALWAYS ON RIGHT List/Map Switcher ─── */}
        <div className="flex items-center justify-between gap-3 pt-3 pb-1">
          {/* Left: Hotel Category Condensed Dropdown with Icon */}
          <div ref={categoryRef} className="relative">
            <button
              type="button"
              onClick={() => setIsCategoryOpen(!isCategoryOpen)}
              className="flex items-center gap-2.5 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-slate-300 rounded-full text-xs sm:text-sm font-extrabold text-slate-900 shadow-xs transition-all cursor-pointer"
            >
              <div className="w-5 h-5 rounded-md bg-[#0D4E43]/10 text-[#0D4E43] flex items-center justify-center shrink-0">
                <Building2 className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <span>
                {activeCategory === 'All' ? 'All Hotel Categories' : activeCategory}
              </span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isCategoryOpen ? 'rotate-180' : ''}`} />
            </button>

            {isCategoryOpen && (
              <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/90 p-1.5 z-40 animate-scale-in">
                <span className="text-[11px] font-black text-slate-400 uppercase px-3 py-1.5 block tracking-wider">
                  Select Hotel Category
                </span>
                {hotelCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setActiveCategory(cat.id);
                      setIsCategoryOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm transition-colors flex items-center justify-between cursor-pointer ${
                      activeCategory === cat.id
                        ? 'bg-slate-100 font-black text-slate-950'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-950 font-semibold'
                    }`}
                  >
                    <span>{cat.label}</span>
                    {activeCategory === cat.id && (
                      <Check className="w-4 h-4 text-[#0D4E43] stroke-[2.5]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: ALWAYS ON RIGHT HAND SIDE List / Map Switcher */}
          <div className="flex items-center bg-white border border-slate-200/90 p-1 rounded-full shadow-xs shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                viewMode === 'list' 
                  ? 'bg-[#0D4E43] text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <ListIcon className="w-3.5 h-3.5 stroke-[2.2]" />
              <span>List</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                viewMode === 'split' || viewMode === 'map'
                  ? 'bg-[#0D4E43] text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5 stroke-[2.2]" />
              <span>Map</span>
            </button>
          </div>
        </div>

        {/* ─── Main Grid: Hotel Cards (Left) & Vector Map (Right) ─── */}
        <div className={`grid gap-6 ${
          viewMode === 'list' 
            ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4' 
            : viewMode === 'map' 
              ? 'grid-cols-1' 
              : 'grid-cols-1 lg:grid-cols-12'
        }`}>

          {/* ─── Left Side: Hotel Inventory Cards Grid ─── */}
          {viewMode !== 'map' && (
            <div className={viewMode === 'list' ? 'col-span-full' : 'lg:col-span-6 xl:col-span-6'}>
              
              {/* Cards Grid (Image 2 Replica with prominent typography, crisp badges, and specs) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredAndSortedItems.map((item) => {
                  const isSelected = item.id === selectedId;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectItem(item.id)}
                      className={`group bg-white rounded-2xl p-3.5 border transition-all duration-300 overflow-hidden cursor-pointer flex flex-col select-none ${
                        isSelected 
                          ? 'border-slate-950 shadow-md ring-2 ring-slate-950/10' 
                          : 'border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-lg hover:-translate-y-1 hover:border-slate-300'
                      }`}
                    >
                      {/* Photo Container with Top-Right ⭐ Rating & Bottom-Left 📍 City Pill */}
                      <div className="relative h-44 sm:h-48 w-full rounded-xl overflow-hidden bg-slate-100">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                        
                        {/* Bookmark Heart Button (Top Left) */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleBookmark(item.id, e)}
                          aria-label={item.bookmarked ? 'Remove bookmark' : 'Bookmark hotel'}
                          className="absolute top-2.5 left-2.5 w-7 h-7 rounded-full bg-white/90 hover:bg-white backdrop-blur-md flex items-center justify-center text-slate-700 shadow-sm transition-all active:scale-90 cursor-pointer"
                        >
                          <Heart 
                            className={`w-3.5 h-3.5 transition-colors ${
                              item.bookmarked ? 'fill-rose-500 text-rose-500' : 'text-slate-700'
                            }`} 
                          />
                        </button>

                        {/* ⭐ Rating Badge (Top Right) - Image 2 Style */}
                        <div className="absolute top-2.5 right-2.5 bg-white/95 backdrop-blur-md text-slate-950 font-black text-xs sm:text-[13px] px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{item.rating.toFixed(1)}</span>
                        </div>

                        {/* 📍 Location Pill (Bottom Left) - Image 2 Style */}
                        <div className="absolute bottom-2.5 left-2.5 bg-white/95 backdrop-blur-md text-slate-900 font-bold text-xs sm:text-[13px] px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5 max-w-[85%] truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="truncate">{item.city}</span>
                        </div>
                      </div>

                      {/* Hotel Content */}
                      <div className="pt-3 px-1 flex flex-col justify-between flex-1">
                        
                        {/* Title and Wholesale Value */}
                        <div className="flex items-baseline justify-between gap-1.5 mb-1">
                          <h3 className="text-base sm:text-lg font-black text-slate-950 group-hover:text-black tracking-tight truncate">
                            {item.title}
                          </h3>
                          <span className="text-base sm:text-lg font-black text-slate-950 font-mono tracking-tight shrink-0">
                            {item.price}
                          </span>
                        </div>

                        {/* Subtitle and Profit Uplift */}
                        <div className="flex items-center justify-between text-xs sm:text-sm mb-3">
                          <span className="text-slate-500 font-semibold truncate pr-1">
                            Wholesale Allotment • {item.travelWindow}
                          </span>
                          <span className="text-emerald-800 font-black shrink-0 font-mono">
                            Profit {item.expectedProfit}
                          </span>
                        </div>

                        {/* Specs Row with Clean Icons (Image 2 Specs Style) */}
                        <div className="flex items-center justify-between text-xs sm:text-sm text-slate-700 font-bold pt-2.5 border-t border-slate-100">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                            <span>{item.rooms} Rooms</span>
                          </div>
                          
                          <div className="flex items-center gap-1 text-slate-800 font-black">
                            <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0 stroke-[2.5]" />
                            <span>{item.demandLift}</span>
                          </div>

                          <div className="flex items-center gap-1 text-slate-800 font-bold">
                            <Percent className="w-3.5 h-3.5 text-slate-400 shrink-0" />
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

          {/* ─── Right Side: Interactive Vector Map (Image 2 Replica) ─── */}
          {viewMode !== 'list' && (
            <div className={`relative ${
              viewMode === 'map' ? 'col-span-full' : 'lg:col-span-6 xl:col-span-6'
            }`}>
              
              {/* Map Container */}
              <div className="sticky top-[135px] w-full h-[580px] rounded-3xl overflow-hidden border border-slate-200/80 shadow-[0_2px_16px_rgba(0,0,0,0.04)] bg-[#F1F5F9] relative select-none">
                
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
                  <rect 
                    width="1000" 
                    height="800" 
                    fill={mapLayer === 'satellite' ? '#0f172a' : '#F1F5F9'} 
                  />

                  {/* Water Bodies / Oceans */}
                  <path
                    d="M 0,0 L 240,0 C 260,180 180,320 220,500 C 250,620 180,720 0,780 Z"
                    fill={mapLayer === 'satellite' ? '#082f49' : '#E0F2FE'}
                    stroke={mapLayer === 'satellite' ? '#0369a1' : '#BAE6FD'}
                    strokeWidth="1.5"
                  />

                  {/* Parks / Green areas in subtle soft sage */}
                  <path
                    d="M 680,220 C 720,200 820,230 840,300 C 860,370 780,410 730,380 C 680,350 640,240 680,220 Z"
                    fill={mapLayer === 'satellite' ? '#14532d' : '#DCFCE7'}
                    stroke={mapLayer === 'satellite' ? '#166534' : '#BBF7D0'}
                    strokeWidth="1.5"
                  />
                  <text 
                    x="735" 
                    y="310" 
                    fill={mapLayer === 'satellite' ? '#86efac' : '#15803d'} 
                    fontSize="11" 
                    fontWeight="600" 
                    opacity="0.85" 
                    textAnchor="middle"
                  >
                    Hawaldarpara Nature Reserve
                  </text>

                  <path
                    d="M 360,650 C 420,600 520,620 550,720 C 500,780 390,790 350,730 Z"
                    fill={mapLayer === 'satellite' ? '#14532d' : '#DCFCE7'}
                    stroke={mapLayer === 'satellite' ? '#166534' : '#BBF7D0'}
                    strokeWidth="1.5"
                  />

                  {/* Secondary Streets Network */}
                  <g 
                    stroke={mapLayer === 'satellite' ? '#1e293b' : '#FFFFFF'} 
                    strokeWidth="8" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    fill="none"
                  >
                    <path d="M 0,160 Q 300,180 500,120 T 1000,140" />
                    <path d="M 120,0 Q 180,300 220,500 T 260,800" />
                    <path d="M 320,0 L 400,800" />
                    <path d="M 0,380 C 250,390 450,320 700,420 T 1000,450" />
                    <path d="M 520,0 C 560,250 620,520 680,800" />
                    <path d="M 0,620 Q 350,580 700,660 T 1000,620" />
                    <path d="M 800,0 C 820,280 860,540 890,800" />
                  </g>

                  {/* Main Arterial Road Network */}
                  <g 
                    stroke={mapLayer === 'satellite' ? '#334155' : '#FFFFFF'} 
                    strokeWidth="16" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    fill="none"
                  >
                    <path d="M 0,80 Q 350,180 550,380 T 1000,720" />
                    <path d="M 200,800 C 450,650 650,450 780,0" />
                    <path d="M 0,480 C 320,490 550,560 1000,320" />
                  </g>

                  {/* Road Borders */}
                  <g 
                    stroke={mapLayer === 'satellite' ? '#475569' : '#CBD5E1'} 
                    strokeWidth="1.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    fill="none"
                  >
                    <path d="M 0,80 Q 350,180 550,380 T 1000,720" />
                    <path d="M 200,800 C 450,650 650,450 780,0" />
                    <path d="M 0,480 C 320,490 550,560 1000,320" />
                  </g>

                  {/* Street Labels */}
                  <text 
                    x="320" 
                    y="600" 
                    fill={mapLayer === 'satellite' ? '#94a3b8' : '#64748B'} 
                    fontSize="10" 
                    fontWeight="600" 
                    transform="rotate(-34 320 600)"
                  >
                    Sunset Coastal Way
                  </text>
                  <text 
                    x="560" 
                    y="555" 
                    fill={mapLayer === 'satellite' ? '#94a3b8' : '#64748B'} 
                    fontSize="10" 
                    fontWeight="600" 
                    transform="rotate(8 560 555)"
                  >
                    Ocean View Boulevard
                  </text>
                </svg>

                {/* Top Right: [ 🗺️ Maps | 🌐 Satelit ] Toggle Pill (Image 2 Replica) */}
                <div className="absolute top-4 right-4 z-20 flex items-center bg-white/95 backdrop-blur-md rounded-full border border-slate-200/90 shadow-sm p-1">
                  <button
                    type="button"
                    onClick={() => setMapLayer('maps')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      mapLayer === 'maps'
                        ? 'bg-[#0D4E43] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <MapIcon className="w-3.5 h-3.5" />
                    <span>Maps</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapLayer('satellite')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      mapLayer === 'satellite'
                        ? 'bg-[#0D4E43] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Satelit</span>
                  </button>
                </div>

                {/* Bottom Right: [ + ] and [ - ] Zoom Controls (Image 2 Replica) */}
                <div className="absolute bottom-4 right-4 z-20 flex flex-col bg-white/95 backdrop-blur-md rounded-xl shadow-md border border-slate-200/90 overflow-hidden">
                  <button
                    type="button"
                    onClick={handleZoomIn}
                    className="w-8 h-8 flex items-center justify-center text-slate-700 hover:text-black hover:bg-slate-50 transition-colors cursor-pointer"
                    title="Zoom In"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <div className="h-[1px] bg-slate-100" />
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    className="w-8 h-8 flex items-center justify-center text-slate-700 hover:text-black hover:bg-slate-50 transition-colors cursor-pointer"
                    title="Zoom Out"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>

                {/* Reset Crosshair (Top Left) */}
                <div className="absolute top-4 left-4 z-20">
                  <button
                    type="button"
                    onClick={handleResetMap}
                    className="w-8 h-8 bg-white/95 backdrop-blur-md rounded-xl shadow-sm border border-slate-200/90 flex items-center justify-center text-slate-700 hover:text-black hover:bg-slate-50 transition-colors cursor-pointer"
                    title="Reset Map Position"
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Hotel Map Price Pins (Image 2 Replica: Black Rectangular Badges with Downward Triangle Pointer) */}
                {items.map((item) => {
                  const isSelected = item.id === selectedId;
                  return (
                    <div
                      key={item.id}
                      style={{
                        left: `${item.mapCoords.x}%`,
                        top: `${item.mapCoords.y}%`,
                        transform: 'translate(-50%, -100%)',
                      }}
                      className="absolute z-10 cursor-pointer group transition-transform duration-200"
                      onClick={() => handleSelectItem(item.id)}
                    >
                      {/* Price Badge with downward pointer */}
                      <div className={`relative px-3 py-1 rounded-md text-xs sm:text-[13px] font-black tracking-tight transition-all duration-200 shadow-md flex items-center justify-center whitespace-nowrap ${
                        isSelected
                          ? 'bg-[#0D4E43] text-white ring-2 ring-[#0D4E43]/40 scale-110 shadow-lg z-20'
                          : 'bg-[#18181b] text-white hover:bg-black hover:scale-105'
                      }`}>
                        <span>{formatPinPrice(item.priceNum)}</span>
                        
                        {/* Downward Pointer Triangle */}
                        <span 
                          className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] transition-colors ${
                            isSelected ? 'border-t-[#0D4E43]' : 'border-t-[#18181b]'
                          }`} 
                        />
                      </div>
                    </div>
                  );
                })}

                {/* ─── Floating Popup Card over Active Pin (Image 2 'Silver Meadow' Replica) ─── */}
                {popupVisible && activeItem && (
                  <div
                    style={{
                      left: `${activeItem.mapCoords.x}%`,
                      top: `${activeItem.mapCoords.y}%`,
                      transform: 'translate(-50%, -115%)',
                    }}
                    className="absolute z-30 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-3 animate-scale-in transition-all flex items-center gap-3.5 select-none"
                  >
                    {/* Thumbnail Image */}
                    <div className="relative w-24 h-20 rounded-xl overflow-hidden shrink-0 bg-slate-100">
                      <img
                        src={activeItem.image}
                        alt={activeItem.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm sm:text-base font-black text-slate-950 truncate tracking-tight">
                          {activeItem.title}
                        </h4>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPopupVisible(false);
                          }}
                          className="text-slate-400 hover:text-slate-700 ml-1 p-0.5 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 font-semibold truncate mt-0.5">
                        {activeItem.city}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1 text-xs">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-black text-slate-950">{activeItem.rating.toFixed(1)}</span>
                        <span className="text-slate-400 font-medium">({activeItem.reviews || 184})</span>
                      </div>
                      <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-slate-100">
                        <span className="text-sm sm:text-base font-black text-slate-950 font-mono">
                          {formatPinPrice(activeItem.priceNum)}<span className="text-[10px] font-normal text-slate-500">/lot</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setModalItem(activeItem)}
                          className="text-xs sm:text-sm font-extrabold text-[#0D4E43] hover:text-[#09352e] flex items-center gap-0.5 hover:underline cursor-pointer"
                        >
                          <span>Details</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
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
