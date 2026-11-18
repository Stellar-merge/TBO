import React from 'react';
import { 
  GripVertical, 
  Calendar, 
  User, 
  Globe, 
  MessageSquare, 
  Paperclip,
  Sparkles
} from 'lucide-react';
import type { DealItem } from '../types/deals';
import { FloorplanSvg } from './FloorplanSvg';

interface DealCardProps {
  deal: DealItem;
  onClick: (deal: DealItem) => void;
}

export const DealCard: React.FC<DealCardProps> = ({ deal, onClick }) => {
  // Format price e.g. 2,450,000 AED
  const formattedPrice = `${deal.priceValue.toLocaleString()} ${deal.currency}`;

  // Priority badge styling matching screenshot
  const priorityBadgeStyle = () => {
    switch (deal.priority) {
      case 'High':
        return 'text-rose-600 bg-rose-50 border-rose-200/70';
      case 'Medium':
        return 'text-amber-600 bg-amber-50 border-amber-200/70';
      case 'Low':
      default:
        return 'text-amber-600/90 bg-amber-50/60 border-amber-200/50';
    }
  };

  return (
    <div
      onClick={() => onClick(deal)}
      className="bg-white rounded-2xl p-3.5 border border-gray-100 hover:border-gray-200 shadow-2xs hover:shadow-sm transition-all duration-150 cursor-pointer group select-none relative"
    >
      {/* Top Header: ID, Priority, Drag Handle */}
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[11px] font-mono text-gray-400 tracking-tight">
          {deal.id}
        </span>

        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${priorityBadgeStyle()}`}>
            {deal.priority}
          </span>
          <button 
            type="button" 
            aria-label="Drag deal card" 
            className="text-gray-300 group-hover:text-gray-500 cursor-grab active:cursor-grabbing p-0.5"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Dual Image Preview: Left Floorplan + Right Property Photo */}
      <div className="grid grid-cols-2 gap-2 h-28 mb-3 overflow-hidden rounded-xl">
        {/* Left: Schematic / Floorplan */}
        <div className="h-full w-full bg-[#fbfcfd] flex items-center justify-center overflow-hidden">
          <FloorplanSvg variant={deal.floorplanVariant} className="w-full h-full object-contain" />
        </div>

        {/* Right: Property photo */}
        <div className="h-full w-full relative overflow-hidden rounded-lg bg-gray-100">
          <img
            src={deal.propertyPhoto}
            alt={deal.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>
      </div>

      {/* Deal Title & Specs */}
      <h3 className="text-xs font-semibold text-gray-900 leading-snug line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
        {deal.title}
      </h3>

      {/* Price */}
      <div className="text-sm sm:text-[15px] font-bold text-gray-950 mb-3 tracking-tight">
        {formattedPrice}
      </div>

      {/* Metadata Attributes */}
      <div className="space-y-1.5 text-[11px] border-t border-gray-50 pt-2.5 mb-3">
        {/* Reservation Date */}
        <div className="flex items-center justify-between text-gray-500">
          <div className="flex items-center gap-1.5 text-gray-400">
            <Calendar className="w-3 h-3 text-gray-400" />
            <span>Reservation</span>
          </div>
          <span className="font-medium text-gray-700">
            {deal.isPendingReservation ? (
              <span className="text-amber-600 font-semibold mr-1.5">Pending</span>
            ) : null}
            {deal.reservationDate}
          </span>
        </div>

        {/* Client */}
        <div className="flex items-center justify-between text-gray-500">
          <div className="flex items-center gap-1.5 text-gray-400">
            <User className="w-3 h-3 text-gray-400" />
            <span>Client</span>
          </div>
          <span className="font-medium text-gray-800 truncate max-w-[130px]">
            {deal.client}
          </span>
        </div>

        {/* Source */}
        <div className="flex items-center justify-between text-gray-500">
          <div className="flex items-center gap-1.5 text-gray-400">
            <Globe className="w-3 h-3 text-gray-400" />
            <span>Source</span>
          </div>
          <span className="font-medium text-gray-500 truncate">
            {deal.source}
          </span>
        </div>
      </div>

      {/* Card Footer: Avatars + Comments + Files / ML Score */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100/80 text-[11px] text-gray-400">
        {/* Left: Avatar Badges */}
        <div className="flex items-center gap-1">
          {deal.avatars.map((av, idx) => (
            <span
              key={idx}
              className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${av.bgClass} ${av.textClass}`}
            >
              {av.letter}
            </span>
          ))}
        </div>

        {/* Right: Comments & Files */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 hover:text-gray-600 transition">
            <MessageSquare className="w-3 h-3 text-gray-400" />
            <span>{deal.commentsCount} Comments</span>
          </div>

          <div className="flex items-center gap-1 hover:text-gray-600 transition">
            <Paperclip className="w-3 h-3 text-gray-400" />
            <span>{deal.filesCount} Files</span>
          </div>

          {/* Subtle ML badge */}
          <div className="hidden sm:flex items-center text-blue-600 font-semibold" title={`P50 Demand: ${deal.p50}`}>
            <Sparkles className="w-3 h-3" />
          </div>
        </div>
      </div>
    </div>
  );
};
