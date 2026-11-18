import React from 'react';
import { Bookmark } from 'lucide-react';
import type { OpportunityCardItem } from '../data/opportunityDeals';

interface OpportunityCardProps {
  item: OpportunityCardItem;
  onSelect: (item: OpportunityCardItem) => void;
  onToggleBookmark: (id: string, e: React.MouseEvent) => void;
  index?: number;
}

/* ─── Semantic color for metric values ─── */
function metricColor(value: string): string {
  if (value.startsWith('+')) return 'text-emerald-600';
  if (value.startsWith('-')) return 'text-rose-600';
  if (value === 'Low') return 'text-emerald-600';
  if (value === 'Medium') return 'text-amber-600';
  if (value === 'High') return 'text-rose-600';
  return 'text-gray-950';
}

export const OpportunityCard: React.FC<OpportunityCardProps> = ({
  item,
  onSelect,
  onToggleBookmark,
  index = 0,
}) => {
  return (
    <div
      onClick={() => onSelect(item)}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${item.title}`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(item); } }}
      className="bg-white rounded-xl border border-gray-200/70 hover:border-gray-300/80 shadow-elevation-1 hover:shadow-card-hover transition-all duration-300 ease-spring overflow-hidden cursor-pointer flex flex-col group select-none hover:-translate-y-1 animate-fade-in-up opacity-0"
      style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'forwards' }}
    >
      {/* Photo with subtle zoom */}
      <div className="h-44 w-full relative overflow-hidden bg-gray-100">
        <img
          src={item.image}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-500 ease-spring group-hover:scale-[1.04]"
          loading="lazy"
        />
        {/* Subtle bottom gradient for text readability */}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        
        {/* Title & Bookmark */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-900 group-hover:text-gray-950 transition-colors leading-snug pr-2">
            {item.title}
          </h3>
          <button
            type="button"
            onClick={(e) => onToggleBookmark(item.id, e)}
            aria-label={item.bookmarked ? 'Remove bookmark' : 'Add bookmark'}
            className={`text-gray-400 hover:text-gray-900 transition-all duration-200 p-1 -mr-1 -mt-0.5 rounded-md hover:bg-gray-50 active:scale-90 ${
              item.bookmarked ? 'text-gray-900' : ''
            }`}
          >
            <Bookmark
              className={`w-4 h-4 transition-all duration-200 ${
                item.bookmarked ? 'fill-gray-900 text-gray-900 scale-110' : ''
              }`}
            />
          </button>
        </div>

        {/* 3 Metric Columns */}
        <div className="grid grid-cols-3 gap-2 border-t border-gray-100 pt-3">
          {[item.metric1, item.metric2, item.metric3].map((metric, i) => (
            <div key={i}>
              <div className="text-[10px] text-gray-400 font-medium truncate leading-tight">
                {metric.label}
              </div>
              <div className={`text-xs font-bold mt-0.5 ${metricColor(metric.value)}`}>
                {metric.value}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
