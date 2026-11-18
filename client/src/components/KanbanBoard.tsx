import React, { useState } from 'react';
import { 
  Plus, 
  Columns, 
  Grid, 
  List, 
  ArrowUpDown, 
  Filter as FilterIcon, 
  MoreHorizontal 
} from 'lucide-react';
import type { DealItem, DealStage } from '../types/deals';
import { DealCard } from './DealCard';

interface KanbanBoardProps {
  deals: DealItem[];
  onOpenNewDealModal: (stage?: DealStage) => void;
  onSelectDeal: (deal: DealItem) => void;
  onUpdateDealStage?: (id: string, newStage: DealStage) => void;
}

interface ColumnConfig {
  id: DealStage;
  title: string;
  dotColorClass: string;
  count: number;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  deals,
  onOpenNewDealModal,
  onSelectDeal,
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'grid' | 'list'>('kanban');
  const [sortKey, setSortKey] = useState<'default' | 'price-asc' | 'price-desc' | 'p50-desc'>('default');
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Sorting
  const sortedDeals = [...deals].sort((a, b) => {
    if (sortKey === 'price-desc') return b.priceValue - a.priceValue;
    if (sortKey === 'price-asc') return a.priceValue - b.priceValue;
    if (sortKey === 'p50-desc') return b.p50 - a.p50;
    return 0;
  });

  // 4 Columns matching screenshot
  const columns: ColumnConfig[] = [
    {
      id: 'new',
      title: 'New',
      dotColorClass: 'bg-purple-500',
      count: sortedDeals.filter((d) => d.stage === 'new').length,
    },
    {
      id: 'viewing',
      title: 'Viewing Scheduled',
      dotColorClass: 'bg-amber-400',
      count: sortedDeals.filter((d) => d.stage === 'viewing').length,
    },
    {
      id: 'negotiation',
      title: 'Negotiation',
      dotColorClass: 'bg-blue-500',
      count: sortedDeals.filter((d) => d.stage === 'negotiation').length,
    },
    {
      id: 'legal',
      title: 'Legal & Documentation',
      dotColorClass: 'bg-emerald-500',
      count: sortedDeals.filter((d) => d.stage === 'legal').length,
    },
  ];

  return (
    <div className="space-y-4 pt-1">
      {/* Controls Bar matching screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: + New Deals & View Switcher */}
        <div className="flex items-center gap-2.5">
          {/* + New Deals Button */}
          <button
            onClick={() => onOpenNewDealModal('new')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-gray-200/90 hover:bg-gray-50 text-xs font-semibold text-gray-800 rounded-xl shadow-2xs transition active:scale-98"
          >
            <Plus className="w-3.5 h-3.5 text-gray-500" />
            <span>New Deals</span>
          </button>

          {/* View Mode Switcher: [ ||| ] [ ⊞ ] [ ☰ ] */}
          <div className="flex items-center bg-white border border-gray-200/90 rounded-xl p-0.5 shadow-2xs">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'kanban' 
                  ? 'bg-gray-100 text-gray-900 shadow-2xs' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              title="Kanban Board"
            >
              <Columns className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'grid' 
                  ? 'bg-gray-100 text-gray-900 shadow-2xs' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              title="Grid View"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'list' 
                  ? 'bg-gray-100 text-gray-900 shadow-2xs' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Sort & Filter Buttons */}
        <div className="flex items-center gap-2 relative">
          {/* Sort Button */}
          <button
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200/90 hover:bg-gray-50 text-xs font-semibold text-gray-700 rounded-xl shadow-2xs transition"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-500" />
            <span>Sort</span>
          </button>

          {/* Sort Dropdown Menu */}
          {showSortMenu && (
            <div className="absolute right-20 top-10 bg-white border border-gray-200 rounded-xl shadow-lg p-1.5 z-30 text-xs w-44">
              <button
                onClick={() => { setSortKey('default'); setShowSortMenu(false); }}
                className={`w-full text-left px-3 py-1.5 rounded-lg ${sortKey === 'default' ? 'bg-gray-100 font-bold' : 'hover:bg-gray-50'}`}
              >
                Default Order
              </button>
              <button
                onClick={() => { setSortKey('price-desc'); setShowSortMenu(false); }}
                className={`w-full text-left px-3 py-1.5 rounded-lg ${sortKey === 'price-desc' ? 'bg-gray-100 font-bold' : 'hover:bg-gray-50'}`}
              >
                Price: High to Low
              </button>
              <button
                onClick={() => { setSortKey('price-asc'); setShowSortMenu(false); }}
                className={`w-full text-left px-3 py-1.5 rounded-lg ${sortKey === 'price-asc' ? 'bg-gray-100 font-bold' : 'hover:bg-gray-50'}`}
              >
                Price: Low to High
              </button>
              <button
                onClick={() => { setSortKey('p50-desc'); setShowSortMenu(false); }}
                className={`w-full text-left px-3 py-1.5 rounded-lg ${sortKey === 'p50-desc' ? 'bg-gray-100 font-bold' : 'hover:bg-gray-50'}`}
              >
                Demand P50: Highest
              </button>
            </div>
          )}

          {/* Filter Button */}
          <button
            onClick={() => setSortKey(sortKey === 'p50-desc' ? 'default' : 'p50-desc')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200/90 hover:bg-gray-50 text-xs font-semibold text-gray-700 rounded-xl shadow-2xs transition"
          >
            <FilterIcon className="w-3.5 h-3.5 text-gray-500" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Main Kanban Columns Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {columns.map((col) => {
          const colDeals = sortedDeals.filter((d) => d.stage === col.id);

          return (
            <div
              key={col.id}
              className="flex flex-col rounded-2xl bg-gray-50/50 p-2 sm:p-2.5 min-h-[500px]"
            >
              {/* Column Header matching screenshot */}
              <div className="flex items-center justify-between px-1.5 py-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${col.dotColorClass}`} />
                  <span className="text-xs font-bold text-gray-800">
                    {col.title}
                  </span>
                  <span className="text-xs text-gray-400 font-medium">
                    {col.count}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-gray-400">
                  <button
                    onClick={() => onOpenNewDealModal(col.id)}
                    className="p-1 hover:text-gray-700 hover:bg-white rounded-lg transition"
                    title={`Add deal to ${col.title}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    className="p-1 hover:text-gray-700 hover:bg-white rounded-lg transition"
                    title="Column options"
                  >
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Cards in Column */}
              <div className="space-y-3">
                {colDeals.map((deal) => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    onClick={onSelectDeal}
                  />
                ))}

                {colDeals.length === 0 && (
                  <div className="border border-dashed border-gray-200 rounded-2xl p-6 text-center text-xs text-gray-400 flex flex-col items-center justify-center gap-2">
                    <span>No deals in this stage</span>
                    <button
                      onClick={() => onOpenNewDealModal(col.id)}
                      className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add deal</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
