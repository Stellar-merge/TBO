import React from 'react';
import { Info, Plus } from 'lucide-react';
import type { MetricSummary } from '../types/deals';

interface MetricCardsProps {
  metrics: MetricSummary;
  onInviteMember?: () => void;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ metrics, onInviteMember }) => {
  return (
    <div className="space-y-5">
      {/* Title Row with Avatars and Invite Member */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Deals pipeline
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Avatar stack */}
          <div className="flex items-center -space-x-2">
            <img 
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80" 
              alt="Member 1" 
              className="w-7 h-7 rounded-full border-2 border-white object-cover ring-1 ring-gray-100" 
            />
            <img 
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80" 
              alt="Member 2" 
              className="w-7 h-7 rounded-full border-2 border-white object-cover ring-1 ring-gray-100" 
            />
            <img 
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80" 
              alt="Member 3" 
              className="w-7 h-7 rounded-full border-2 border-white object-cover ring-1 ring-gray-100" 
            />
            <div className="w-7 h-7 rounded-full border-2 border-white bg-gray-100 text-gray-600 text-[10px] font-bold flex items-center justify-center ring-1 ring-gray-100">
              +2
            </div>
          </div>

          {/* Invite Member Button */}
          <button 
            onClick={onInviteMember}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200/90 hover:bg-gray-50 text-xs font-semibold text-gray-800 rounded-xl shadow-2xs transition"
          >
            <Plus className="w-3.5 h-3.5 text-gray-500" />
            <span>Invite Member</span>
          </button>
        </div>
      </div>

      {/* Top 3 Summary Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: Pipeline Value */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-gray-800 mb-4">
            <span>Pipeline Value</span>
            <Info className="w-3.5 h-3.5 text-gray-300 hover:text-gray-500 cursor-pointer" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Total Asset Volume */}
            <div>
              <div className="text-[11px] font-medium text-gray-400 mb-1">
                Total Asset Volume
              </div>
              <div className="text-xl font-bold text-gray-950 tracking-tight">
                {metrics.pipelineValue.totalAssetVolume}
              </div>
              <div className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-1">
                {metrics.pipelineValue.volumeDelta}
              </div>
            </div>

            {/* Commission */}
            <div className="border-l border-gray-100 pl-4">
              <div className="text-[11px] font-medium text-gray-400 mb-1">
                Commission
              </div>
              <div className="text-xl font-bold text-gray-950 tracking-tight">
                {metrics.pipelineValue.commission}
              </div>
              <div className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-1">
                {metrics.pipelineValue.commissionDelta}
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Deal Activity */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-gray-800 mb-4">
            <span>Deal Activity</span>
            <Info className="w-3.5 h-3.5 text-gray-300 hover:text-gray-500 cursor-pointer" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Viewings Booked */}
            <div>
              <div className="text-[11px] font-medium text-gray-400 mb-1">
                Viewings Booked
              </div>
              <div className="text-xl font-bold text-gray-950 tracking-tight">
                {metrics.dealActivity.viewingsBooked}
              </div>
              <div className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-1">
                {metrics.dealActivity.viewingsDelta}
              </div>
            </div>

            {/* Offers Sent */}
            <div className="border-l border-gray-100 pl-4">
              <div className="text-[11px] font-medium text-gray-400 mb-1">
                Offers Sent
              </div>
              <div className="text-xl font-bold text-gray-950 tracking-tight">
                {metrics.dealActivity.offersSent}
              </div>
              <div className="text-[11px] font-semibold text-amber-600 mt-1 flex items-center gap-1">
                {metrics.dealActivity.offersDelta}
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Conversion & Speed */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-gray-800 mb-4">
            <span>Conversion & Speed</span>
            <Info className="w-3.5 h-3.5 text-gray-300 hover:text-gray-500 cursor-pointer" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Avg. Days to Close */}
            <div>
              <div className="text-[11px] font-medium text-gray-400 mb-1">
                Avg. Days to Close
              </div>
              <div className="text-xl font-bold text-gray-950 tracking-tight">
                {metrics.conversionSpeed.avgDaysToClose}
              </div>
              <div className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-1">
                {metrics.conversionSpeed.daysDelta}
              </div>
            </div>

            {/* Win Rate */}
            <div className="border-l border-gray-100 pl-4">
              <div className="text-[11px] font-medium text-gray-400 mb-1">
                Win Rate
              </div>
              <div className="text-xl font-bold text-gray-950 tracking-tight">
                {metrics.conversionSpeed.winRate}
              </div>
              <div className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-1">
                {metrics.conversionSpeed.winRateDelta}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
