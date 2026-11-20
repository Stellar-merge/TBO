import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  ShieldCheck,
  Check,
  Landmark,
  Palmtree,
  Zap,
  Globe,
  MapPin,
  RefreshCw,
  Sparkles,
  Bed
} from 'lucide-react';
import { initialOpportunities } from '../data/opportunityDeals';
import type { OpportunityCardItem } from '../data/opportunityDeals';
import { OpportunityDetailModal } from './OpportunityDetailModal';
import { ChatbotWidget } from './ChatbotWidget';
import { BudgetAllocationCard } from './BudgetAllocationCard';
import { optimizeProcurement } from '../services/api';

// Static Curated Destinations matching exact user screenshot
const SUGGESTED_DESTINATIONS = [
  {
    name: 'Mumbai, Maharashtra',
    subtitle: 'For sights like Gateway of India & luxury coastal stays',
    icon: Building2,
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50',
  },
  {
    name: 'Kolkata, West Bengal',
    subtitle: 'For colonial heritage, cultural stays & business hubs',
    icon: Landmark,
    iconColor: 'text-amber-700',
    iconBg: 'bg-amber-50',
  },
  {
    name: 'North Goa, Goa',
    subtitle: 'For its bustling nightlife & beach resorts',
    icon: Palmtree,
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50',
  },
  {
    name: 'Bengaluru, Karnataka',
    subtitle: 'For tech corporate summits & luxury garden stays',
    icon: Building2,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50',
  },
  {
    name: 'Jaipur, Rajasthan',
    subtitle: 'For royal palace heritage & wedding tourism peaks',
    icon: Landmark,
    iconColor: 'text-rose-600',
    iconBg: 'bg-rose-50',
  },
  {
    name: 'Dubai, UAE',
    subtitle: 'For ultra-luxury high-yield allotments',
    icon: Building2,
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50',
  },
  {
    name: 'Varanasi, Uttar Pradesh',
    subtitle: 'Popular with travellers near you',
    icon: Landmark,
    iconColor: 'text-rose-500',
    iconBg: 'bg-rose-50',
  },
  {
    name: 'New Delhi, Delhi',
    subtitle: 'For diplomatic & airport hub allotments',
    icon: Building2,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50',
  },
  {
    name: 'London, UK',
    subtitle: 'For historic luxury & international business',
    icon: Landmark,
    iconColor: 'text-indigo-600',
    iconBg: 'bg-indigo-50',
  },
  {
    name: 'Paris, France',
    subtitle: 'For vibrant European fashion & tourism demand',
    icon: Landmark,
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-50',
  },
  {
    name: 'Tokyo, Japan',
    subtitle: 'For rapid turnover & transit blocks',
    icon: Building2,
    iconColor: 'text-stone-700',
    iconBg: 'bg-stone-100',
  },
  {
    name: 'All Destinations',
    subtitle: 'Global portfolio optimization across all markets',
    icon: Search,
    iconColor: 'text-stone-700',
    iconBg: 'bg-stone-100',
  },
];

export const CleanDashboard: React.FC = () => {
  // Entrance Animation Trigger (Staggered cinematic entrance matching OverviewHero)
  const [dashboardVisible, setDashboardVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDashboardVisible(true);
    }, 40);
    return () => clearTimeout(timer);
  }, []);

  // Opportunities Data
  const [items, setItems] = useState<OpportunityCardItem[]>(initialOpportunities);
  const [selectedId, setSelectedId] = useState<string>('dumble-st');
  const [popupVisible, setPopupVisible] = useState<boolean>(true);
  const [modalItem, setModalItem] = useState<OpportunityCardItem | null>(null);

  // 1. Airbnb-Style Search Controls (Top: Hotels/Flights, Bottom: Budget, Dates, Location, Risk)
  const [activeAssetClass, setActiveAssetClass] = useState<'hotels' | 'flights'>('hotels');
  const [activeAirbnbSegment, setActiveAirbnbSegment] = useState<'budget' | 'dates' | 'location' | 'risk' | null>(null);
  const [airbnbBudget, setAirbnbBudget] = useState<number>(5000000);
  const [budgetInputText, setBudgetInputText] = useState<string>('');
  const [airbnbStartDate, setAirbnbStartDate] = useState<string>('2026-11-19');
  const [airbnbEndDate, setAirbnbEndDate] = useState<string>('2026-11-25');
  const [airbnbLocation, setAirbnbLocation] = useState<string>('');
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

  // Auto-suggestion filtered destinations based on typed query
  const filteredDestinations = useMemo(() => {
    const q = airbnbLocation.trim().toLowerCase();
    if (!q || q === 'nearby' || q === 'all destinations') {
      return SUGGESTED_DESTINATIONS;
    }
    return SUGGESTED_DESTINATIONS.filter(
      (dest) =>
        dest.name.toLowerCase().includes(q) ||
        dest.subtitle.toLowerCase().includes(q)
    );
  }, [airbnbLocation]);

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

  // 2. Category Tabs (Hotels & Flights)
  const [activeCategory, setActiveCategory] = useState<string>('All');

  // 3. Sub-section Constraints, Sorting & Map Layers (Image 2 UI Reference)
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [minMarginFilter, setMinMarginFilter] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'roi' | 'profit' | 'priceAsc' | 'rooms'>('roi');
  const [isSortOpen, setIsSortOpen] = useState<boolean>(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState<boolean>(false);
  const [mapLayer, setMapLayer] = useState<'maps' | 'satellite'>('maps');
  const sortRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);

  // Optimization Engine State
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [budgetUsed, setBudgetUsed] = useState<number>(120000);
  const [backendRoi, setBackendRoi] = useState<string>('24.8');
  const [backendRiskDial, setBackendRiskDial] = useState<number>(42);

  // Run Optimization Engine against FastAPI Backend (or fallback gracefully to seed catalog)
  const runOptimization = React.useCallback(async () => {
    setIsOptimizing(true);
    try {
      const res = await optimizeProcurement({
        location: airbnbLocation || 'Mumbai, Maharashtra',
        dates: { startDate: airbnbStartDate, endDate: airbnbEndDate },
        budget: airbnbBudget,
        riskTolerance: airbnbRisk === 'Conservative' ? 'P10 Conservative' : airbnbRisk === 'Aggressive' ? 'P90 Aggressive' : 'P50 Balanced',
        category: activeCategory === 'All' ? 'All Hotels' : activeCategory,
        targetType: activeAssetClass,
      });

      if (res && res.status === 'success') {
        setBudgetUsed(res.summary.allocatedBudget);
        setBackendRoi(res.summary.expectedRoi.toFixed(1));
        setBackendRiskDial(res.summary.riskDialScore);

        if (res.items && res.items.length > 0) {
          const mapped: OpportunityCardItem[] = res.items.map((it, idx) => ({
            id: it.id,
            title: it.name,
            city: it.location,
            destination: it.location.includes(',') ? it.location.split(',')[1].trim() : 'India',
            inventoryType: activeAssetClass === 'flights' ? 'Flights' : 'Hotels',
            hotelCategory: (it.category as any) || (activeAssetClass === 'flights' ? 'Direct Carrier' : 'Luxury Resorts'),
            travelWindow: 'Next 30 Days',
            image: it.image,
            bookmarked: false,
            price: `₹${Math.round(it.batchCost).toLocaleString('en-IN')}`,
            priceNum: it.batchCost,
            expectedProfit: `+₹${Math.round(it.expectedProfit).toLocaleString('en-IN')}`,
            expectedProfitNum: it.expectedProfit,
            allocatedAmount: it.batchCost,
            rooms: it.roomsOrSeats,
            demandLift: `+${Math.round(it.opportunityScore)}% Demand`,
            margin: `${Math.round(it.profitMargin)}% Margin`,
            rating: it.rating,
            reviews: it.reviewsCount,
            mapCoords: {
              x: 18 + ((idx * 24) % 65),
              y: 22 + ((idx * 29) % 55),
            },
            metric1: { label: 'Allocated', value: `${it.procuredUnits} Units` },
            metric2: { label: 'Wholesale', value: activeAssetClass === 'flights' ? `₹${Math.round(it.wholesaleCostPerUnit).toLocaleString('en-IN')}/seat` : `₹${Math.round(it.wholesaleCostPerUnit).toLocaleString('en-IN')}/nt` },
            metric3: { label: 'P50 Forecast', value: activeAssetClass === 'flights' ? `${it.demandQuantileP50} s/d` : `${it.demandQuantileP50} r/d` },
            wholesaleCost: it.wholesaleCostPerUnit,
            targetPrice: it.targetSellingPrice,
            recommendedUnits: it.procuredUnits,
            roomType: it.roomType || (activeAssetClass === 'flights' ? 'Direct Carrier Block' : 'Executive Deluxe Room'),
            optimalTiming: it.optimalTiming || 'Pre-buy 21-28 days ahead',
            reasonCard: it.reasonCard,
            p10: it.demandQuantileP10,
            p50: it.demandQuantileP50,
            p90: it.demandQuantileP90,
            cancellationRisk: Math.round(it.cancellationProb * 100),
            riskRating: it.riskClass === 'BALANCED' ? 'Low' : it.riskClass === 'SHORTAGE' ? 'Medium' : 'High',
          }));
          setItems(mapped);
          setSelectedId(mapped[0].id);
        }
      }
    } catch (e) {
      console.warn('Backend call failed:', e);
    } finally {
      setIsOptimizing(false);
    }
  }, [airbnbLocation, airbnbStartDate, airbnbEndDate, airbnbBudget, airbnbRisk, activeCategory, activeAssetClass]);

  // View Mode: 'split' | 'list' | 'map' (List view default as requested)
  const [viewMode, setViewMode] = useState<'split' | 'list' | 'map'>('list');

  // Map zoom and pan state
  const [mapZoom, setMapZoom] = useState<number>(1);
  const [mapPan, setMapPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Currently active hotel item
  const activeItem = useMemo(() => {
    return items.find((it) => it.id === selectedId) || items[0];
  }, [items, selectedId]);

  // Dynamic Categories based on Active Asset Class
  const hotelCategories = useMemo(() => {
    if (activeAssetClass === 'flights') {
      return [
        { id: 'All', label: 'All Flights' },
        { id: 'First & Business', label: 'First & Business' },
        { id: 'Direct Carrier', label: 'Direct Carrier' },
        { id: 'Economy Blocks', label: 'Economy Blocks' },
      ];
    }
    return [
      { id: 'All', label: 'All Hotels' },
      { id: 'Luxury Resorts', label: 'Luxury Resorts' },
      { id: 'City Business', label: 'City Business' },
      { id: 'Boutique Stays', label: 'Boutique Stays' },
      { id: 'Heritage Villas', label: 'Heritage Villas' },
      { id: 'High Margin', label: 'High Margin' },
    ];
  }, [activeAssetClass]);

  // Filtered & Sorted Items
  const filteredAndSortedItems = useMemo(() => {
    let result = items.filter((item) => {
      // Asset class filter
      if (item.inventoryType) {
        if (activeAssetClass === 'flights' && item.inventoryType !== 'Flights') return false;
        if (activeAssetClass === 'hotels' && item.inventoryType !== 'Hotels') return false;
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
  }, [items, activeAssetClass, activeCategory, minMarginFilter, airbnbRisk, searchQuery, sortBy]);

  // Aggregate Portfolio Metrics
  const totalAllocated = useMemo(() => {
    return filteredAndSortedItems.reduce((acc, it) => acc + it.allocatedAmount, 0);
  }, [filteredAndSortedItems]);

  const totalProfit = useMemo(() => {
    return filteredAndSortedItems.reduce((acc, it) => acc + it.expectedProfitNum, 0);
  }, [filteredAndSortedItems]);

  const projectedROI = totalAllocated > 0 ? ((totalProfit / totalAllocated) * 100).toFixed(1) : backendRoi;

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
    setAirbnbLocation('');
    setAirbnbRisk('Moderate');
    setAirbnbBudget(500000);
    setBudgetInputText('');
    setAirbnbStartDate('2026-11-19');
    setAirbnbEndDate('2026-11-25');
    setSortBy('roi');
    setMapZoom(1);
    setMapPan({ x: 0, y: 0 });
  };

  // Map pin price format helper (₹28.4L or ₹2.84k)
  const formatPinPrice = (num: number) => {
    if (num >= 10000000) {
      return `₹${(num / 10000000).toFixed(1)}Cr`;
    }
    if (num >= 100000) {
      return `₹${(num / 100000).toFixed(1)}L`;
    }
    if (num >= 1000) {
      return `₹${Math.round(num / 1000)}k`;
    }
    return `₹${num}`;
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
    <div className="w-full min-h-screen bg-gradient-to-br from-[#F4FAF5] via-[#EBF6EE] to-[#F1F9F3] text-slate-900 pb-16 font-sans select-none antialiased relative overflow-hidden">
      
      {/* Ambient background soft light glows inspired by Crextio palette */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[400px] bg-emerald-200/25 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-48 left-10 w-[500px] h-[350px] bg-teal-200/20 blur-[100px] rounded-full pointer-events-none" />

      {/* ─── Airbnb-Style Procurement Query Header (Exact replica of user reference image) ─── */}
      <div className={`relative ${activeAirbnbSegment ? 'z-50' : 'z-30'} bg-gradient-to-b from-white/70 via-[#EBF7EF]/50 to-transparent border-b border-[#D2EBD9]/80 pt-6 pb-6 px-4 sm:px-8 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        dashboardVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5'
      }`}>
        <div ref={airbnbBarRef} className={`max-w-[960px] mx-auto flex flex-col items-center relative ${activeAirbnbSegment ? 'z-50' : 'z-30'} transition-all duration-700 delay-75 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          dashboardVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.98]'
        }`}>
          
          {/* TOP: Category Tabs (Hotels | Flights) Centered with Crextio Contrast Pill Style */}
          <div className="flex items-center justify-center p-1 bg-[#E4F3E8]/80 border border-[#CCE8D5] rounded-full mb-4 shadow-xs select-none">
            {/* Hotels Tab */}
            <button
              type="button"
              onClick={() => setActiveAssetClass('hotels')}
              className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold transition-all cursor-pointer ${
                activeAssetClass === 'hotels'
                  ? 'bg-[#18231E] text-white shadow-[0_2px_10px_rgba(24,35,30,0.25)]'
                  : 'text-[#2D5A40] hover:text-[#143823] hover:bg-white/50 font-semibold'
              }`}
            >
              <Building2 className="w-4 h-4 stroke-[2.4]" />
              <span className="text-sm tracking-tight">Hotels</span>
            </button>

            {/* Flights Tab */}
            <button
              type="button"
              onClick={() => setActiveAssetClass('flights')}
              className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold transition-all cursor-pointer ${
                activeAssetClass === 'flights'
                  ? 'bg-[#18231E] text-white shadow-[0_2px_10px_rgba(24,35,30,0.25)]'
                  : 'text-[#2D5A40] hover:text-[#143823] hover:bg-white/50 font-semibold'
              }`}
            >
              <Plane className="w-4 h-4 stroke-[2.4]" />
              <span className="text-sm tracking-tight">Flights</span>
            </button>
          </div>

          {/* BOTTOM: Airbnb Rounded-Full Pill Search Bar (Enlarged with Direct Typing & Auto-Suggestions) */}
          <div className={`w-full rounded-full transition-all p-2 sm:p-2.5 min-h-[68px] sm:min-h-[74px] flex items-center relative ${activeAirbnbSegment ? 'z-50' : 'z-20'} ${
            activeAirbnbSegment 
              ? 'bg-white shadow-[0_8px_32px_rgba(34,139,84,0.14)] border border-[#2E8B57]' 
              : 'bg-white/95 backdrop-blur-md border border-[#CCE8D5] shadow-[0_8px_30px_rgba(34,139,84,0.06)] hover:shadow-[0_12px_36px_rgba(34,139,84,0.11)] hover:border-[#9ED6B3]'
          }`}>
            
            {/* 1. Budget Segment (Direct Inline Typing) */}
            <div
              onClick={() => {
                setActiveAirbnbSegment('budget');
                budgetInputRef.current?.focus();
              }}
              className={`flex-1 px-5 sm:px-7 py-2.5 sm:py-3 rounded-full text-left transition-all cursor-pointer ${
                activeAirbnbSegment === 'budget' 
                  ? 'bg-white shadow-[0_4px_16px_rgba(34,139,84,0.12)] border border-[#2E8B57]' 
                  : activeAirbnbSegment 
                    ? 'hover:bg-[#EBF6EE]' 
                    : 'hover:bg-[#F2FAF4]'
              }`}
            >
              <label className="text-xs sm:text-[14px] font-black text-slate-900 block leading-tight cursor-pointer select-none">
                Budget
              </label>
              <div className="flex items-center text-sm sm:text-base font-bold text-slate-950 mt-0.5">
                {budgetInputText ? <span className="text-slate-400 mr-0.5 select-none font-bold">₹</span> : null}
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
                  placeholder="Add budget (e.g. ₹50,00,000)"
                  className="w-full bg-transparent text-sm sm:text-base font-bold text-slate-950 placeholder:text-slate-400 outline-none focus:outline-none focus:ring-0 truncate"
                />
                {budgetInputText && activeAirbnbSegment === 'budget' && (
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
            <div className={`w-[1px] h-7 sm:h-8 bg-[#D5EADB] self-center shrink-0 ${
              activeAirbnbSegment === 'budget' || activeAirbnbSegment === 'dates' ? 'opacity-0' : 'opacity-100'
            }`} />

            {/* 2. Dates Segment (Like Airbnb with Start and End Dates) */}
            <button
              type="button"
              onClick={() => setActiveAirbnbSegment(prev => prev === 'dates' ? null : 'dates')}
              className={`flex-1 px-5 sm:px-7 py-2.5 sm:py-3 rounded-full text-left transition-all cursor-pointer focus:outline-hidden ${
                activeAirbnbSegment === 'dates' 
                  ? 'bg-white shadow-[0_4px_16px_rgba(34,139,84,0.12)] border border-[#2E8B57]' 
                  : activeAirbnbSegment 
                    ? 'hover:bg-[#EBF6EE]' 
                    : 'hover:bg-[#F2FAF4]'
              }`}
            >
              <span className="text-xs sm:text-[14px] font-black text-slate-900 block leading-tight">Dates</span>
              <span className="text-sm sm:text-base text-slate-950 font-bold truncate block mt-0.5">
                {formatDatesDisplay(airbnbStartDate, airbnbEndDate)}
              </span>
            </button>

            {/* Vertical Divider 2 */}
            <div className={`w-[1px] h-7 sm:h-8 bg-[#D5EADB] self-center shrink-0 ${
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
                  ? 'bg-white shadow-[0_4px_16px_rgba(34,139,84,0.12)] border border-[#2E8B57]' 
                  : activeAirbnbSegment 
                    ? 'hover:bg-[#EBF6EE]' 
                    : 'hover:bg-[#F2FAF4]'
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
                      e.preventDefault();
                      if (filteredDestinations.length > 0 && !airbnbLocation.includes(',')) {
                        const top = filteredDestinations[0];
                        setAirbnbLocation(top.name);
                      }
                      setActiveAirbnbSegment(null);
                      runOptimization();
                      setPopupVisible(true);
                    }
                  }}
                  placeholder="Search destinations (e.g. Mumbai, Goa, Dubai)"
                  className="w-full bg-transparent text-sm sm:text-base font-bold text-slate-950 placeholder:text-slate-400 outline-none focus:outline-none focus:ring-0 truncate"
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
            <div className={`w-[1px] h-7 sm:h-8 bg-[#D5EADB] self-center shrink-0 ${
              activeAirbnbSegment === 'location' || activeAirbnbSegment === 'risk' ? 'opacity-0' : 'opacity-100'
            }`} />

            {/* 4. Risk Tolerance Segment */}
            <button
              type="button"
              onClick={() => setActiveAirbnbSegment(prev => prev === 'risk' ? null : 'risk')}
              className={`flex-1 px-5 sm:px-7 py-2.5 sm:py-3 rounded-full text-left transition-all cursor-pointer focus:outline-hidden ${
                activeAirbnbSegment === 'risk' 
                  ? 'bg-white shadow-[0_4px_16px_rgba(34,139,84,0.12)] border border-[#2E8B57]' 
                  : activeAirbnbSegment 
                    ? 'hover:bg-[#EBF6EE]' 
                    : 'hover:bg-[#F2FAF4]'
              }`}
            >
              <span className="text-xs sm:text-[14px] font-black text-slate-900 block leading-tight">Risk Tolerance</span>
              <span className="text-sm sm:text-base text-slate-950 font-bold truncate block mt-0.5">
                {airbnbRisk === 'Conservative' ? 'Conservative (P10–P25)' : airbnbRisk === 'Aggressive' ? 'Aggressive (P90–P97.5)' : 'Moderate (P50)'}
              </span>
            </button>

            {/* Far Right: Crextio Gradient Emerald Action Button */}
            <button
              type="button"
              onClick={() => {
                setActiveAirbnbSegment(null);
                runOptimization();
                setPopupVisible(true);
              }}
              disabled={isOptimizing}
              className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-gradient-to-br from-[#2E8B57] via-[#237A49] to-[#155A34] hover:from-[#349D63] hover:to-[#1B6F40] active:scale-95 text-white flex items-center justify-center shrink-0 shadow-[0_6px_20px_rgba(36,122,74,0.35)] hover:shadow-[0_8px_24px_rgba(36,122,74,0.45)] transition-all cursor-pointer ml-2 mr-1 disabled:opacity-80"
              aria-label="Search and run engine"
              title="Search and run engine"
            >
              {isOptimizing ? (
                <RefreshCw className="w-5 h-5 stroke-[2.8] animate-spin" />
              ) : (
                <Search className="w-5 h-5 stroke-[2.8]" />
              )}
            </button>

            {/* ─── 1. Budget Popover (Clean Airbnb Pills Matching Dates Flexibility Style) ─── */}
            <AnimatePresence>
              {activeAirbnbSegment === 'budget' && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute top-full left-0 mt-3 w-88 bg-white rounded-[32px] shadow-[0_24px_60px_rgba(0,0,0,0.18)] border border-stone-200/90 p-6 z-50 text-left origin-top-left"
                >
                  <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-xs font-bold text-stone-900 tracking-tight">
                      Suggested budgets
                    </span>
                    <span className="text-[11px] text-stone-400 font-medium">
                      Max capital cap (₹B)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {[1000000, 2500000, 5000000, 10000000, 25000000].map((val) => (
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
                        {val >= 10000000 ? `₹${val / 10000000} Cr` : val >= 100000 ? `₹${val / 100000} L` : `₹${val / 1000}k`}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ─── 2. Dates Popover (Exact Replica of Airbnb media_1795074622760_548e40f6.png) ─── */}
            <AnimatePresence>
              {activeAirbnbSegment === 'dates' && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98, x: '-50%' }}
                  animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
                  exit={{ opacity: 0, y: 8, scale: 0.98, x: '-50%' }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute top-full left-1/2 mt-3 w-[720px] max-w-[95vw] bg-white rounded-[32px] shadow-[0_24px_60px_rgba(0,0,0,0.18)] border border-stone-200/90 p-7 z-50 text-left origin-top"
                >
                
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
                    {/* AI Recommended Demand Surge Windows */}
                    <div className="mb-5 p-3.5 bg-gradient-to-r from-[#EBF6EE] via-[#F2FAF4] to-[#EBF6EE] rounded-2xl border border-[#CCE8D5] flex items-center justify-between flex-wrap gap-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#2E8B57] text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Sparkles className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="text-xs font-black text-slate-950 block leading-tight">AI Recommended Surge Windows</span>
                          <span className="text-[10px] text-slate-500 font-medium">Click to lock optimal procurement timing</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => {
                            setAirbnbStartDate('2026-11-24');
                            setAirbnbEndDate('2026-11-30');
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            airbnbStartDate === '2026-11-24' && airbnbEndDate === '2026-11-30'
                              ? 'bg-[#18452B] text-white shadow-xs'
                              : 'bg-white hover:bg-white/90 text-slate-800 border border-[#CCE8D5]'
                          }`}
                        >
                          <span>🔥 Nov 24 – 30 (Holiday Peak)</span>
                          <span className="text-[10px] text-[#2E8B57] font-black">+28% margin</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAirbnbStartDate('2026-12-24');
                            setAirbnbEndDate('2026-12-31');
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            airbnbStartDate === '2026-12-24' && airbnbEndDate === '2026-12-31'
                              ? 'bg-[#18452B] text-white shadow-xs'
                              : 'bg-white hover:bg-white/90 text-slate-800 border border-[#CCE8D5]'
                          }`}
                        >
                          <span>🎄 Dec 24 – 31 (Year-End)</span>
                          <span className="text-[10px] text-[#2E8B57] font-black">95% sell-thru</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAirbnbStartDate('2027-01-22');
                            setAirbnbEndDate('2027-01-28');
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            airbnbStartDate === '2027-01-22' && airbnbEndDate === '2027-01-28'
                              ? 'bg-[#18452B] text-white shadow-xs'
                              : 'bg-white hover:bg-white/90 text-slate-800 border border-[#CCE8D5]'
                          }`}
                        >
                          <span>☀️ Jan 22 – 28 (Weekend)</span>
                          <span className="text-[10px] text-[#2E8B57] font-black">Low risk</span>
                        </button>
                      </div>
                    </div>

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

                </motion.div>
              )}
            </AnimatePresence>

            {/* ─── 3. Location Popover (Exact Replica of Airbnb with Live Auto-Suggestions) ─── */}
            <AnimatePresence>
              {activeAirbnbSegment === 'location' && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98, x: '-33%' }}
                  animate={{ opacity: 1, y: 0, scale: 1, x: '-33%' }}
                  exit={{ opacity: 0, y: 8, scale: 0.98, x: '-33%' }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute top-full left-1/3 mt-3 w-[460px] max-w-[95vw] bg-white rounded-[32px] shadow-[0_24px_60px_rgba(0,0,0,0.18)] border border-stone-200/90 p-6 z-50 text-left origin-top"
                >
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
                        setActiveAirbnbSegment(null);
                        runOptimization();
                        setPopupVisible(true);
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
                </motion.div>
              )}
            </AnimatePresence>

            {/* ─── 4. Risk Tolerance Popover (Matching Location & Dates Design & Typography) ─── */}
            <AnimatePresence>
              {activeAirbnbSegment === 'risk' && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute top-full right-0 mt-3 w-[460px] max-w-[95vw] bg-white rounded-[32px] shadow-[0_24px_60px_rgba(0,0,0,0.18)] border border-stone-200/90 p-6 z-50 text-left origin-top-right"
                >
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
                      name: 'Conservative (P10–P25 Safe Floor)',
                      subtitle: 'Locked-in margins • Zero room spoilage risk',
                      icon: ShieldCheck,
                      iconBg: 'bg-sky-50',
                      iconColor: 'text-sky-500',
                    },
                    {
                      id: 'Moderate',
                      name: 'Moderate (P50 Balanced Baseline)',
                      subtitle: 'Full distribution Sharpe ratio across seasonal patterns',
                      icon: TrendingUp,
                      iconBg: 'bg-rose-50',
                      iconColor: 'text-rose-500',
                    },
                    {
                      id: 'Aggressive',
                      name: 'Aggressive (P90–P97.5 Holiday Surge)',
                      subtitle: 'Pre-buys higher allotments to capture peak holiday surges',
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
                </motion.div>
              )}
            </AnimatePresence>

          </div>

        </div>
      </div>

      {/* ─── Main Content Container ─── */}
      <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-8 pt-5 space-y-4">
        
        {/* ─── Exact Redesigned Budget Allocation Component (Replica of media_1795114216608_4a18ecae.jpg) ─── */}
        <div className={`transition-all duration-700 delay-100 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          dashboardVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
        }`}>
          <BudgetAllocationCard
            budgetUsed={budgetUsed}
            budgetTotal={airbnbBudget}
            capitalAllocated={2043610}
            projectedROI={projectedROI || '16.1'}
            riskDial={backendRiskDial || 42}
          />
        </div>

        {/* ─── Results Header & Dismissable Active Constraint Tags (Image 2 Replica) ─── */}
        <div className={`pt-2 transition-all duration-700 delay-150 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          dashboardVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          {/* Top Line: Heading and Sort by Dropdown */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-[2rem] font-black text-slate-950 tracking-tight leading-tight">
                {filteredAndSortedItems.length > 0 ? (filteredAndSortedItems.length * 142).toLocaleString() : '1,420'} Allotments in {airbnbLocation === 'Nearby' ? 'Global Portfolio' : airbnbLocation.split(',')[0]}
              </h1>
            </div>

            {/* Sort by dropdown */}
            <div ref={sortRef} className="relative self-start sm:self-auto z-30">
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

              <AnimatePresence>
                {isSortOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-1.5 z-50 origin-top-right"
                  >
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
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Dismissable Active Filter Tags Row (Replicating Image 2 tags: [ Villa, Bungalow ✕ ] etc.) */}
          <div className="flex flex-wrap items-center gap-2 pb-2">
            {/* Tag 1: Active Category / Allotment */}
            <span className="bg-white/90 backdrop-blur-xs border border-[#CCE8D5] text-[#16452B] text-xs sm:text-[13px] font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-2xs hover:border-[#9ED6B3] transition-all">
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
              className={`text-xs sm:text-[13px] font-bold px-3.5 py-1.5 rounded-full border transition-all flex items-center gap-1.5 cursor-pointer ${
                minMarginFilter
                  ? 'bg-[#18231E] text-white border-[#18231E] shadow-[0_2px_8px_rgba(24,35,30,0.25)]'
                  : 'bg-white/90 backdrop-blur-xs text-[#16452B] border-[#CCE8D5] hover:border-[#9ED6B3] shadow-2xs'
              }`}
            >
              <span>Min. 20% Net Margin</span>
              {minMarginFilter ? (
                <X className="w-3.5 h-3.5 text-slate-300" />
              ) : null}
            </button>

            {/* Tag 3: Budget Constraint Tag */}
            <span className="bg-white/90 backdrop-blur-xs border border-[#CCE8D5] text-[#16452B] text-xs sm:text-[13px] font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-2xs hover:border-[#9ED6B3] transition-all">
              <span>Budget: &lt; {formatPinPrice(airbnbBudget)}</span>
              {airbnbBudget !== 5000000 && (
                <button
                  type="button"
                  onClick={() => {
                    setAirbnbBudget(5000000);
                    setBudgetInputText('50,00,000');
                  }}
                  className="text-slate-400 hover:text-slate-900 ml-0.5 cursor-pointer"
                  title="Reset budget cap"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </span>

            {/* Tag 4: Risk Strategy Tag */}
            <span className="bg-white/90 backdrop-blur-xs border border-[#CCE8D5] text-[#16452B] text-xs sm:text-[13px] font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-2xs hover:border-[#9ED6B3] transition-all">
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
              <span className="bg-white/90 backdrop-blur-xs border border-[#CCE8D5] text-[#16452B] text-xs sm:text-[13px] font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-2xs hover:border-[#9ED6B3] transition-all">
                <MapPin className="w-3.5 h-3.5 text-[#247A49]" />
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
            <span className="bg-white/90 backdrop-blur-xs border border-[#CCE8D5] text-[#16452B] text-xs sm:text-[13px] font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-2xs hover:border-[#9ED6B3] transition-all">
              <Calendar className="w-3.5 h-3.5 text-[#247A49]" />
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
              className="text-xs sm:text-[13px] text-[#247A49] hover:text-[#14472A] underline font-bold ml-2 cursor-pointer transition-colors"
            >
              Reset all
            </button>
          </div>
        </div>

        {/* ─── Controls Toolbar: Hotel Category Condensed Dropdown (Left) & ALWAYS ON RIGHT List/Map Switcher ─── */}
        <div className={`flex items-center justify-between gap-3 pt-3 pb-1 transition-all duration-700 delay-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          dashboardVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          {/* Left: Hotel Category Condensed Dropdown with Icon */}
          <div ref={categoryRef} className="relative z-30">
            <button
              type="button"
              onClick={() => setIsCategoryOpen(!isCategoryOpen)}
              className="flex items-center gap-2.5 px-4 py-2 bg-white/90 hover:bg-white border border-[#CCE8D5] hover:border-[#9ED6B3] rounded-full text-xs sm:text-sm font-extrabold text-[#143B23] shadow-2xs transition-all cursor-pointer"
            >
              <div className="w-5 h-5 rounded-md bg-[#E4F5EB] text-[#247A49] flex items-center justify-center shrink-0">
                {activeAssetClass === 'flights' ? (
                  <Plane className="w-3.5 h-3.5 stroke-[2.5]" />
                ) : (
                  <Building2 className="w-3.5 h-3.5 stroke-[2.5]" />
                )}
              </div>
              <span>
                {activeCategory === 'All' ? (activeAssetClass === 'flights' ? 'All Flight Categories' : 'All Hotel Categories') : activeCategory}
              </span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isCategoryOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isCategoryOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute left-0 top-full mt-2 w-64 bg-white/98 backdrop-blur-md rounded-2xl shadow-2xl border border-[#CCE8D5] p-1.5 z-50 origin-top-left"
                >
                  <span className="text-[11px] font-black text-slate-400 uppercase px-3 py-1.5 block tracking-wider">
                    Select {activeAssetClass === 'flights' ? 'Flight' : 'Hotel'} Category
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
                          ? 'bg-[#EBF7EE] font-black text-[#143B23]'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-950 font-semibold'
                      }`}
                    >
                      <span>{cat.label}</span>
                      {activeCategory === cat.id && (
                        <Check className="w-4 h-4 text-[#2E8B57] stroke-[2.5]" />
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: ALWAYS ON RIGHT HAND SIDE List / Map Switcher */}
          <div className="flex items-center bg-[#E3F2E8] border border-[#CCE8D5] p-1 rounded-full shadow-inner shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                viewMode === 'list' 
                  ? 'bg-[#18231E] text-white shadow-[0_2px_8px_rgba(24,35,30,0.2)]' 
                  : 'text-[#2D5A40] hover:text-[#143823]'
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
                  ? 'bg-[#18231E] text-white shadow-[0_2px_8px_rgba(24,35,30,0.2)]' 
                  : 'text-[#2D5A40] hover:text-[#143823]'
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
                {filteredAndSortedItems.map((item, idx) => {
                  const isSelected = item.id === selectedId;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectItem(item.id)}
                      style={{
                        transitionDelay: `${dashboardVisible ? 240 + Math.min(idx, 8) * 60 : 0}ms`,
                      }}
                      className={`group bg-white/95 backdrop-blur-xs rounded-2xl p-3.5 border transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden cursor-pointer flex flex-col select-none ${
                        dashboardVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-[0.98]'
                      } ${
                        isSelected 
                          ? 'border-[#18231E] shadow-[0_8px_30px_rgba(24,35,30,0.12)] ring-2 ring-[#2E8B57]/30' 
                          : 'border-[#D5EBDC] shadow-[0_4px_20px_rgba(25,75,45,0.05)] hover:shadow-[0_16px_40px_rgba(25,75,45,0.12)] hover:border-[#8FD3A8] hover:-translate-y-1'
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
                        <div className="absolute top-2.5 right-2.5 bg-white/95 backdrop-blur-md text-slate-950 font-black text-xs sm:text-[13px] px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1 border border-[#D5EBDC]">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{item.rating.toFixed(1)}</span>
                        </div>

                        {/* 📍 Location Pill (Bottom Left) - Image 2 Style */}
                        <div className="absolute bottom-2.5 left-2.5 bg-white/95 backdrop-blur-md text-[#18452B] font-bold text-xs sm:text-[13px] px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5 max-w-[85%] truncate border border-[#D5EBDC]">
                          <MapPin className="w-3.5 h-3.5 text-[#247A49] shrink-0" />
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

                        {/* Recommended Room & Q* Allocation Badge */}
                        <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
                          <span className="font-bold text-slate-800 truncate flex items-center gap-1.5">
                            <Bed className="w-3.5 h-3.5 text-[#2E8B57] shrink-0" />
                            <span className="truncate">{item.roomType || 'Executive Deluxe Room'}</span>
                          </span>
                          <span className="text-[11px] font-black text-[#18452B] bg-[#E8F8EE] border border-[#C5E8D2] px-2 py-0.5 rounded-md shrink-0">
                            Q*: {item.recommendedUnits} of {item.rooms} {item.inventoryType === 'Flights' ? 'seats' : 'rooms'}
                          </span>
                        </div>

                        {/* Optimal Timing and Profit Uplift */}
                        <div className="flex items-center justify-between text-xs mb-2.5">
                          <span className="text-slate-500 font-semibold truncate pr-1 text-[11px] flex items-center gap-1">
                            <Zap className="w-3 h-3 text-amber-500 shrink-0" />
                            <span>{item.optimalTiming || 'Pre-buy 21-28 days ahead'}</span>
                          </span>
                          <span className="text-[#1A6B3D] font-mono font-black shrink-0 bg-[#E8F8EE] px-2 py-0.5 rounded-full border border-[#C5E8D2] text-[11px]">
                            Profit {item.expectedProfit}
                          </span>
                        </div>

                        {/* Specs Row with Clean Icons (Image 2 Specs Style) */}
                        <div className="flex items-center justify-between text-xs sm:text-sm text-slate-700 font-bold pt-2 border-t border-[#E1F2E6]">
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] text-slate-500 font-semibold">Wholesale:</span>
                            <span className="font-mono text-slate-900 font-bold">{item.metric2.value}</span>
                          </div>
                          
                          <div className="flex items-center gap-1 text-slate-800 font-black">
                            <TrendingUp className="w-3.5 h-3.5 text-[#2E8B57] shrink-0 stroke-[2.5]" />
                            <span>{item.demandLift}</span>
                          </div>

                          <div className="flex items-center gap-1 text-slate-800 font-bold">
                            <Percent className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{item.margin}</span>
                          </div>
                        </div>

                        {/* Action Link to Inspect Deep ML Reason Card */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setModalItem(item);
                          }}
                          className="mt-2.5 w-full py-1.5 rounded-xl bg-slate-50 hover:bg-[#EBF6EE] border border-[#CCE8D5] text-[#18452B] hover:text-[#0D4E43] text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 group-hover:border-[#2E8B57]/50"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-[#2E8B57]" />
                          <span>View Room Allocation & Reason Card</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </button>

                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* ─── Right Side: Interactive Vector Map (Image 2 Replica) ─── */}
          {viewMode !== 'list' && (
            <div className={`relative transition-all duration-700 delay-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              dashboardVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-[0.98]'
            } ${
              viewMode === 'map' ? 'col-span-full' : 'lg:col-span-6 xl:col-span-6'
            }`}>
              
              {/* Map Container */}
              <div className="sticky top-[135px] w-full h-[580px] rounded-3xl overflow-hidden border border-[#CCE8D5] shadow-[0_8px_32px_rgba(25,75,45,0.06)] bg-[#EBF6EE] relative select-none">
                
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
                    fill={mapLayer === 'satellite' ? '#0f172a' : '#E8F5EC'} 
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

      {/* ─── Floating Support & AI Chatbot Widget (Cute Teddy Bear Trigger) ─── */}
      <ChatbotWidget
        activeAssetClass={activeAssetClass}
        currentDestination={airbnbLocation}
      />

    </div>
  );
};
