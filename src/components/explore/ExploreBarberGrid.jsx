import { useEffect, useState } from 'react';
import { Search, Store, Sparkles } from 'lucide-react';
import BarberCard from '@/components/explore/BarberCard';
import BarberCardSkeleton from '@/components/explore/BarberCardSkeleton';
import ShopCard from '@/components/ui/shop-card';
import ShopCardSkeleton from '@/components/explore/ShopCardSkeleton';
import ExploreEmptyState from '@/components/explore/ExploreEmptyState';
import LoadMoreButton from '@/components/explore/LoadMoreButton';

const PAGE_SIZE = 12;
const SKELETON_COUNT = 8;

export default function ExploreBarberGrid({
  viewType,
  sortedBarbers,
  fallbackBarbers = [],
  fallbackMessage,
  filteredShops,
  promotions,
  pageConfig,
  exploreMode,
  searchTerm,
  sortBy,
  barbersError,
  barbersErr,
  barbersFetching,
  shopsFetching,
  barbersCount,
  shopsCount,
  shopsError,
  onRetryBarbers,
  onRetryShops,
  onPrefetchBarber,
  onClearFilters,
  isFavorited,
  onToggleFavorite,
}) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const dealSet = new Set(Array.isArray(promotions?.shop_ids) ? promotions.shop_ids : []);
  const hasPlatformPromos = !!promotions?.has_platform_promos;
  const isInitialBarberLoad = barbersFetching && barbersCount === 0 && viewType === 'professionals';
  const isInitialShopLoad = shopsFetching && shopsCount === 0 && viewType === 'shops';
  const hasFallback = fallbackBarbers.length > 0;

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [viewType, sortBy, searchTerm, sortedBarbers.length, filteredShops.length, exploreMode, fallbackBarbers.length]);

  const visibleBarbers = sortedBarbers.slice(0, visibleCount);
  const visibleShops = filteredShops.slice(0, visibleCount);
  const remainingProfessionals = Math.max(0, sortedBarbers.length - visibleCount);
  const remainingShops = Math.max(0, filteredShops.length - visibleCount);

  const renderBarberCard = (barber, index) => {
    const hasPromo = hasPlatformPromos || (!!barber.shop_id && dealSet.has(barber.shop_id));
    return (
      <div key={barber.id} onMouseEnter={() => onPrefetchBarber(barber.id)}>
        <BarberCard
          barber={barber}
          hasPromo={hasPromo}
          bookingLocation={pageConfig.bookingLocation}
          exploreMode={exploreMode}
          index={index}
          isFavorited={isFavorited?.(barber.id, 'barber') ?? false}
          onToggleFavorite={onToggleFavorite}
          compact
        />
      </div>
    );
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 lg:gap-6">
        {viewType === 'professionals' ? (
          <>
            {barbersError ? (
              <ExploreEmptyState
                icon={Search}
                title="Couldn't load professionals"
                message={barbersErr?.message || 'Make sure the backend is running.'}
                actionLabel="Try again"
                onAction={onRetryBarbers}
                variant="error"
              />
            ) : null}

            {isInitialBarberLoad
              ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                  <BarberCardSkeleton key={`skel-${i}`} compact />
                ))
              : null}

            {!barbersError && !isInitialBarberLoad && visibleBarbers.map(renderBarberCard)}

            {!barbersError && !barbersFetching && sortedBarbers.length === 0 && barbersCount > 0 ? (
              <ExploreEmptyState
                icon={Search}
                title={hasFallback ? 'No exact matches' : 'No matches'}
                message={
                  hasFallback
                    ? fallbackMessage || pageConfig.emptyFilteredMessage
                    : pageConfig.emptyFilteredMessage
                }
                onClearFilters={onClearFilters}
              />
            ) : null}

            {!barbersError && !barbersFetching && barbersCount === 0 ? (
              <ExploreEmptyState
                icon={Search}
                title="No professionals yet"
                message="We're growing in your area. Check back soon — new barbers join every week."
                actionLabel="Refresh"
                onAction={onRetryBarbers}
              />
            ) : null}
          </>
        ) : (
          <>
            {shopsError ? (
              <ExploreEmptyState
                icon={Store}
                title="Couldn't load shops"
                message="Make sure the backend is running."
                actionLabel="Try again"
                onAction={onRetryShops}
                variant="error"
              />
            ) : null}

            {isInitialShopLoad
              ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                  <ShopCardSkeleton key={`shop-skel-${i}`} />
                ))
              : null}

            {!shopsError &&
              !isInitialShopLoad &&
              visibleShops.map((shop) => (
                <div key={shop.id}>
                  <ShopCard shop={shop} />
                </div>
              ))}

            {!shopsError && !shopsFetching && filteredShops.length === 0 ? (
              <ExploreEmptyState
                icon={Store}
                title="No shops found"
                message="Try adjusting your search or filters."
                onClearFilters={onClearFilters}
              />
            ) : null}
          </>
        )}
      </div>

      {!barbersError && viewType === 'professionals' && hasFallback ? (
        <section className="mt-10 md:mt-12" aria-labelledby="explore-fallback-heading">
          <div className="flex items-center gap-2 mb-4 md:mb-5">
            <Sparkles className="w-5 h-5 text-primary shrink-0" aria-hidden />
            <h2 id="explore-fallback-heading" className="stb-title text-lg md:text-xl">
              Great professionals nearby
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 lg:gap-6">
            {fallbackBarbers.map((barber, index) => renderBarberCard(barber, index))}
          </div>
        </section>
      ) : null}

      {!barbersError && viewType === 'professionals' && sortedBarbers.length > 0 ? (
        <LoadMoreButton
          remaining={remainingProfessionals}
          onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
          loading={barbersFetching}
        />
      ) : null}

      {!shopsError && viewType === 'shops' && filteredShops.length > 0 ? (
        <LoadMoreButton
          remaining={remainingShops}
          onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
          loading={shopsFetching}
        />
      ) : null}
    </>
  );
}
