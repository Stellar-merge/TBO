import React, { useState } from 'react';
import { Clock, Heart, Plus, ChevronLeft, ArrowRight, Building2 } from 'lucide-react';
import { initialOpportunities } from '../data/opportunityDeals';
import type { OpportunityCardItem } from '../data/opportunityDeals';

interface WishlistsViewProps {
  onSelectOpportunity?: (id: string) => void;
  onNavigateToDashboard?: () => void;
}

interface WishlistCollection {
  id: string;
  title: string;
  subtitle: string;
  isRecentlyViewed?: boolean;
  itemIds: string[];
}

export const WishlistsView: React.FC<WishlistsViewProps> = ({
  onSelectOpportunity,
  onNavigateToDashboard
}) => {
  // Collections list
  const [collections, setCollections] = useState<WishlistCollection[]>([
    {
      id: 'recently-viewed',
      title: 'Recently viewed',
      subtitle: '4 wholesale allotments',
      isRecentlyViewed: true,
      itemIds: ['cove-drive', 'dumble-st', 'harbor-point', 'sol-marina']
    },
    {
      id: 'high-yield',
      title: 'High-Yield Opportunities',
      subtitle: 'P50 +18.5% projected ROI • 3 properties',
      isRecentlyViewed: false,
      itemIds: ['dumble-st', 'harbor-point', 'pine-ridge']
    },
    {
      id: 'urban-business',
      title: 'Urban Business Hubs',
      subtitle: 'Low cancellation risk (12.4%) • 2 properties',
      isRecentlyViewed: false,
      itemIds: ['cove-drive', 'grand-central']
    }
  ]);

  // Active collection opened (null means viewing all collections)
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);

  // New collection modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');

  const activeCollection = collections.find(c => c.id === activeCollectionId);

  // Get items for active collection
  const activeItems: OpportunityCardItem[] = activeCollection
    ? activeCollection.itemIds
        .map(id => initialOpportunities.find(o => o.id === id))
        .filter((item): item is OpportunityCardItem => item !== undefined)
    : [];

  const handleCreateCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;
    const newCol: WishlistCollection = {
      id: `custom-${Date.now()}`,
      title: newCollectionName.trim(),
      subtitle: '0 wholesale allotments',
      isRecentlyViewed: false,
      itemIds: []
    };
    setCollections(prev => [...prev, newCol]);
    setNewCollectionName('');
    setShowCreateModal(false);
  };

  const handleRemoveItem = (collectionId: string, itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollections(prev => prev.map(c => {
      if (c.id === collectionId) {
        const nextIds = c.itemIds.filter(id => id !== itemId);
        return {
          ...c,
          itemIds: nextIds,
          subtitle: `${nextIds.length} wholesale allotments`
        };
      }
      return c;
    }));
  };

  return (
    <div className="w-full min-h-screen bg-[#f5f2eb] text-stone-900 pb-24 font-sans select-none antialiased">
      <div className="max-w-[1240px] mx-auto px-6 sm:px-10 pt-10">

        {/* ─── Breadcrumb / Back button when viewing a specific collection ─── */}
        {activeCollection ? (
          <div className="mb-8">
            <button
              type="button"
              onClick={() => setActiveCollectionId(null)}
              className="inline-flex items-center gap-2 text-xs font-bold text-stone-600 hover:text-stone-950 transition-colors mb-4 group cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              <span>Back to all Wishlists</span>
            </button>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">
                  {activeCollection.title}
                </h1>
                <p className="text-xs text-stone-500 font-medium mt-1">
                  {activeCollection.subtitle}
                </p>
              </div>

              {onNavigateToDashboard && (
                <button
                  type="button"
                  onClick={onNavigateToDashboard}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  <span>Explore More Hotel Opportunities</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ) : (
          /* ─── Top Main Wishlists Header (Matches Screenshot) ─── */
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">
                Wishlists
              </h1>
              <p className="text-xs text-stone-500 font-medium mt-1">
                Saved wholesale inventory, watchlisted room blocks & custom allocation portfolios
              </p>
            </div>
            
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-stone-300 hover:border-stone-900 bg-white text-xs font-bold text-stone-800 hover:text-black transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Wishlist</span>
            </button>
          </div>
        )}

        {/* ─── Collections Grid (Exact Replica of Airbnb Reference) ─── */}
        {!activeCollection ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {collections.map((col) => {
              // Find first item image for preview if not recently viewed
              const firstItem = initialOpportunities.find(o => col.itemIds.includes(o.id));
              const previewImg = firstItem?.image;

              return (
                <div
                  key={col.id}
                  onClick={() => setActiveCollectionId(col.id)}
                  className="group flex flex-col cursor-pointer"
                >
                  {/* Card Container (Square rounded-3xl) */}
                  <div className="w-full aspect-square rounded-3xl overflow-hidden relative shadow-sm border border-black/[0.04] group-hover:shadow-md transition-all duration-300 group-hover:scale-[1.02]">
                    {col.isRecentlyViewed ? (
                      /* Exact Replica of Gray Card with Clock Icon from Screenshot */
                      <div className="w-full h-full bg-[#9c9a96] flex items-center justify-center">
                        <Clock className="w-16 h-16 text-white stroke-[1.8]" />
                      </div>
                    ) : previewImg ? (
                      /* Featured Image Card */
                      <div className="w-full h-full relative">
                        <img
                          src={previewImg}
                          alt={col.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                        <div className="absolute bottom-3 left-3 bg-stone-900/80 backdrop-blur-md text-white font-mono text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                          {col.itemIds.length} Allotments
                        </div>
                      </div>
                    ) : (
                      /* Empty Custom Card */
                      <div className="w-full h-full bg-stone-200 flex items-center justify-center text-stone-400">
                        <Building2 className="w-12 h-12 stroke-[1.5]" />
                      </div>
                    )}
                  </div>

                  {/* Title and Subtitle underneath (Exact Airbnb layout) */}
                  <div className="mt-3 px-1">
                    <h3 className="text-base font-bold text-stone-900 group-hover:text-black tracking-tight leading-snug">
                      {col.title}
                    </h3>
                    <p className="text-xs text-stone-500 font-medium mt-0.5">
                      {col.subtitle}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Create New Wishlist Card */}
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="w-full aspect-square rounded-3xl border-2 border-dashed border-stone-300 hover:border-stone-900 flex flex-col items-center justify-center gap-3 text-stone-500 hover:text-stone-900 transition-all cursor-pointer group bg-stone-100/50 hover:bg-stone-100"
            >
              <div className="w-12 h-12 rounded-full bg-white shadow-xs border border-stone-200 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5 text-stone-800" />
              </div>
              <span className="text-xs font-bold">Create new wishlist</span>
            </button>
          </div>
        ) : (
          /* ─── Active Collection Hotel Items List ─── */
          <div>
            {activeItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {activeItems.map((item) => (
                  <div
                    key={item.id}
                    className="group bg-white rounded-3xl p-3 border border-black/[0.04] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Photo with remove button */}
                      <div className="relative h-40 w-full rounded-2xl overflow-hidden bg-stone-100 mb-3">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <button
                          type="button"
                          onClick={(e) => handleRemoveItem(activeCollection.id, item.id, e)}
                          title="Remove from wishlist"
                          className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 hover:bg-white backdrop-blur-md flex items-center justify-center text-rose-500 shadow-sm transition-all active:scale-90 cursor-pointer"
                        >
                          <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                        </button>
                        <div className="absolute bottom-2 left-2 bg-stone-900/80 backdrop-blur-md text-white font-medium text-[9px] px-2.5 py-0.5 rounded-full">
                          {item.travelWindow}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="px-1">
                        <div className="flex items-baseline justify-between gap-1 mb-0.5">
                          <h4 className="text-xs font-bold text-stone-900 truncate">
                            {item.title}
                          </h4>
                          <span className="text-xs font-extrabold text-stone-950 font-mono">
                            {item.price}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-400 font-medium mb-3">
                          {item.city}
                        </p>

                        <div className="grid grid-cols-2 gap-2 p-2 rounded-xl bg-stone-50 border border-stone-200/60 mb-3">
                          <div>
                            <span className="text-[9.5px] uppercase font-bold text-stone-400 block">
                              Profit Lift
                            </span>
                            <span className="text-xs font-bold text-emerald-600 font-mono">
                              {item.demandLift}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9.5px] uppercase font-bold text-stone-400 block">
                              Net Margin
                            </span>
                            <span className="text-xs font-bold text-stone-900 font-mono">
                              {item.margin}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (onSelectOpportunity) onSelectOpportunity(item.id);
                        if (onNavigateToDashboard) onNavigateToDashboard();
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <span>Optimize Allocation</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-3xl border border-stone-200/80 p-8">
                <Heart className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-stone-900 mb-1">
                  No items in this wishlist yet
                </h3>
                <p className="text-xs text-stone-500 mb-4 max-w-sm mx-auto">
                  Click the heart icon on any hotel opportunity in the Procurement Dashboard to save it to your wishlist.
                </p>
                {onNavigateToDashboard && (
                  <button
                    type="button"
                    onClick={onNavigateToDashboard}
                    className="px-5 py-2.5 rounded-full bg-stone-900 hover:bg-black text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
                  >
                    Browse Opportunities
                  </button>
                )}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ─── Modal to Create New Wishlist ─── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-elevation-4 border border-stone-200 max-w-md w-full p-6 animate-scale-in">
            <h3 className="text-base font-bold text-stone-900 mb-1">
              Create New Wishlist
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Group wholesale hotel opportunities by market, season, or investment strategy.
            </p>
            <form onSubmit={handleCreateCollection}>
              <input
                type="text"
                autoFocus
                placeholder="e.g. Summer 2027 Mediterranean Portfolio"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:border-stone-900 text-sm font-medium outline-none mb-4"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-full text-xs font-bold text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newCollectionName.trim()}
                  className="px-5 py-2 rounded-full bg-stone-900 hover:bg-black disabled:bg-stone-300 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
