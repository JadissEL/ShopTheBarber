import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { MetaTags } from '@/components/seo/MetaTags';
import { SchemaMarkup } from '@/components/seo/SchemaMarkup';
import HeroSection from '@/components/explore/HeroSection';
import StickyFilterBar from '@/components/explore/StickyFilterBar';
import ExploreResultsToolbar from '@/components/explore/ExploreResultsToolbar';
import ExploreBarberGrid from '@/components/explore/ExploreBarberGrid';
import ExploreActiveFilters from '@/components/explore/ExploreActiveFilters';
import ExploreFeaturedSpotlight from '@/components/explore/ExploreFeaturedSpotlight';
import ExploreChampionshipLink from '@/components/explore/ExploreChampionshipLink';
import { parseSpokenLanguages, FALLBACK_LANGUAGE_OPTIONS } from '@/lib/languages';
import { parseChildrenFriendly } from '@/lib/childrenFriendly';
import { parseAttestationFlag } from '@/lib/providerAttestation';
import { resolveExploreMode, EXPLORE_PAGE_CONFIG } from '@/lib/explorePageConfig';
import { sortExploreBarbers } from '@/lib/exploreSort';
import { enrichExploreBarber } from '@/lib/exploreBarberFilter';
import { usePreferredLocation } from '@/hooks/usePreferredLocation';
import { useExploreFilters } from '@/hooks/useExploreFilters';
import { useBarberFavorites } from '@/hooks/useBarberFavorites';
import { useHomepage } from '@/hooks/useHomepage';
import { siteOrigin } from '@/lib/seoUtils';

export default function Explore() {
  const queryClient = useQueryClient();
  const { preferredLocation } = usePreferredLocation();
  const userCoords = preferredLocation
    ? { latitude: preferredLocation.latitude, longitude: preferredLocation.longitude }
    : null;

  const { data: languageOptions = FALLBACK_LANGUAGE_OPTIONS } = useQuery({
    queryKey: ['language-options'],
    queryFn: () => sovereign.languages.getOptions(),
    staleTime: 1000 * 60 * 60,
  });

  const {
    searchTerm,
    setSearchTerm,
    activeFilter,
    setActiveFilter,
    cityFilter,
    mobileOnly,
    shopOnly,
    groupOnly,
    viewType,
    setViewType,
    languageFilter,
    setLanguageFilter,
    kidsWelcomeOnly,
    toggleKidsWelcome,
    sortBy,
    setSortBy,
    highlightFilter,
    setHighlightFilter,
    setDiscoveryFlag,
    activeFilterItems,
    clearAllFilters,
  } = useExploreFilters({ languageOptions });

  const { isFavorited, toggleFavorite } = useBarberFavorites();
  const { data: homepageData } = useHomepage();
  const platformStats = homepageData?.stats;

  const exploreMode = resolveExploreMode({ mobileOnly, shopOnly, groupOnly, activeFilter });
  const pageConfig = EXPLORE_PAGE_CONFIG[exploreMode] ?? EXPLORE_PAGE_CONFIG.topRated;

  React.useEffect(() => {
    if (pageConfig.lockProfessionals) {
      setViewType('professionals');
    }
  }, [pageConfig.lockProfessionals, exploreMode, setViewType]);

  const exploreSearchParams = React.useMemo(
    () => ({
      q: searchTerm.trim() || undefined,
      city: cityFilter.trim() || undefined,
      service: activeFilter !== 'All' ? activeFilter : undefined,
      language: languageFilter || undefined,
      kids: kidsWelcomeOnly || undefined,
      mobile: mobileOnly || undefined,
      shop: shopOnly || undefined,
      group: groupOnly || undefined,
      highlight: highlightFilter || undefined,
    }),
    [
      searchTerm,
      cityFilter,
      activeFilter,
      languageFilter,
      kidsWelcomeOnly,
      mobileOnly,
      shopOnly,
      groupOnly,
      highlightFilter,
    ]
  );

  const {
    data: exploreResult,
    isFetching: barbersFetching,
    isError: barbersError,
    error: barbersErr,
    refetch: refetchBarbers,
  } = useQuery({
    queryKey: ['explore-barbers', exploreSearchParams],
    queryFn: () => sovereign.explore.searchBarbers(exploreSearchParams),
    staleTime: 1000 * 60 * 2,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  const normalizeExploreBarber = React.useCallback((b) => {
    const shop = b.shop ?? null;
    return {
      id: b.id,
      name: b.name || 'Unknown',
      location: b.location,
      city: b.city,
      image_url: b.image_url,
      rating: b.rating ?? 0,
      review_count: b.review_count ?? 0,
      title: b.title,
      shop_id: b.shop_id ?? shop?.id,
      services: b.services || [],
      auto_accept: b.auto_accept,
      type: b.type,
      offers_mobile_service: b.offers_mobile_service === true,
      offers_shop_service: b.offers_shop_service !== false,
      offers_group_booking: b.offers_group_booking === true,
      group_booking_discount_percent: b.group_booking_discount_percent ?? 0,
      is_vip: b.is_vip === true,
      spoken_languages: parseSpokenLanguages(b.spoken_languages),
      children_friendly: parseChildrenFriendly(b.children_friendly),
      attestation_licensed: parseAttestationFlag(b.attestation_licensed ?? shop?.attestation_licensed),
      attestation_insured: parseAttestationFlag(b.attestation_insured ?? shop?.attestation_insured),
      latitude: b.latitude,
      longitude: b.longitude,
      min_price: b.min_price ?? null,
    };
  }, []);

  const barbers = React.useMemo(() => {
    const list = exploreResult?.barbers ?? [];
    return list.map(normalizeExploreBarber);
  }, [exploreResult, normalizeExploreBarber]);

  const exploreFallback = React.useMemo(() => {
    const fb = exploreResult?.fallback;
    if (!fb?.barbers?.length) return null;
    return {
      ...fb,
      barbers: fb.barbers.map(normalizeExploreBarber),
    };
  }, [exploreResult, normalizeExploreBarber]);

  const barberIds = React.useMemo(() => barbers.map((b) => b.id).filter(Boolean), [barbers]);

  const { data: statsMap = {} } = useQuery({
    queryKey: ['explore-barber-stats', barberIds.slice(0, 100).join(',')],
    queryFn: () => sovereign.providerStats.getBarberPublicBatch(barberIds.slice(0, 100)),
    enabled: barberIds.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  const { data: discoveryPreviews = {} } = useQuery({
    queryKey: ['explore-discovery-previews', barberIds.slice(0, 100).join(',')],
    queryFn: () => sovereign.showcase.getDiscoveryPreviews(barberIds.slice(0, 100)),
    enabled: barberIds.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  const barbersWithStats = React.useMemo(
    () =>
      barbers.map((b) => ({
        ...b,
        completed_services: statsMap[b.id]?.completed_services ?? 0,
        completion_rate_percent: statsMap[b.id]?.completion_rate_percent ?? null,
        repeat_customer_rate_percent: statsMap[b.id]?.repeat_customer_rate_percent ?? null,
        years_on_platform: statsMap[b.id]?.years_on_platform ?? null,
        discovery_preview: discoveryPreviews[b.id] ?? null,
      })),
    [barbers, statsMap, discoveryPreviews]
  );

  const exploreShopSearchParams = React.useMemo(
    () => ({
      q: searchTerm.trim() || undefined,
      city: cityFilter.trim() || undefined,
      language: languageFilter || undefined,
      kids: kidsWelcomeOnly || undefined,
    }),
    [searchTerm, cityFilter, languageFilter, kidsWelcomeOnly]
  );

  const {
    data: exploreShopResult,
    isError: shopsError,
    isFetching: shopsFetching,
    refetch: refetchShops,
  } = useQuery({
    queryKey: ['explore-shops', exploreShopSearchParams],
    queryFn: () => sovereign.explore.searchShops(exploreShopSearchParams),
    staleTime: 1000 * 60 * 2,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  const normalizeExploreShop = React.useCallback(
    (s) => ({
      id: s.id,
      name: s.name,
      location: s.location,
      description: s.description,
      image_url: s.image_url,
      rating: s.rating ?? 0,
      review_count: s.review_count ?? 0,
      spoken_languages: parseSpokenLanguages(s.spoken_languages),
      children_friendly: parseChildrenFriendly(s.children_friendly),
      attestation_licensed: parseAttestationFlag(s.attestation_licensed),
      attestation_insured: parseAttestationFlag(s.attestation_insured),
    }),
    []
  );

  const shops = React.useMemo(() => {
    const list = exploreShopResult?.shops ?? [];
    return list.map(normalizeExploreShop);
  }, [exploreShopResult, normalizeExploreShop]);

  const shopById = React.useMemo(() => {
    const map = {};
    for (const s of shops) {
      map[s.id] = s;
    }
    for (const raw of exploreResult?.barbers ?? []) {
      if (!raw.shop?.id || map[raw.shop.id]) continue;
      map[raw.shop.id] = {
        id: raw.shop.id,
        name: raw.shop.name,
        spoken_languages: parseSpokenLanguages(raw.shop.spoken_languages),
        children_friendly: parseChildrenFriendly(raw.shop.children_friendly),
        attestation_licensed: parseAttestationFlag(raw.shop.attestation_licensed),
        attestation_insured: parseAttestationFlag(raw.shop.attestation_insured),
      };
    }
    return map;
  }, [shops, exploreResult]);

  const { data: promotions = { shop_ids: [], has_platform_promos: false } } = useQuery({
    queryKey: ['active-promotions'],
    queryFn: async () => {
      try {
        return await sovereign.public.getActivePromotions();
      } catch {
        return { shop_ids: [], has_platform_promos: false };
      }
    },
    retry: false,
  });

  const minPriceByBarber = React.useMemo(() => {
    const map = {};
    for (const barber of barbers) {
      if (barber.min_price != null) map[barber.id] = barber.min_price;
    }
    return map;
  }, [barbers]);

  const prefetchBarber = (id) => {
    queryClient.prefetchQuery({
      queryKey: ['barber', id],
      queryFn: () => sovereign.entities.Barber.get(id),
      staleTime: 1000 * 60 * 5,
    });
  };

  const exploreFilterDeps = React.useMemo(
    () => ({ shopById, minPriceByBarber, userCoords }),
    [shopById, minPriceByBarber, userCoords]
  );

  const filteredBarbers = React.useMemo(
    () => barbersWithStats.map((barber) => enrichExploreBarber(barber, exploreFilterDeps)),
    [barbersWithStats, exploreFilterDeps]
  );

  const filteredShops = shops;

  const sortedBarbers = React.useMemo(
    () =>
      sortExploreBarbers(
        filteredBarbers.map((b) => ({
          ...b,
          spoken_languages: b.effective_languages,
        })),
        sortBy,
        userCoords
      ),
    [filteredBarbers, sortBy, userCoords]
  );

  const sortedFallbackBarbers = React.useMemo(
    () =>
      exploreFallback?.barbers?.length
        ? sortExploreBarbers(
            exploreFallback.barbers
              .map((b) => ({
                ...enrichExploreBarber(b, exploreFilterDeps),
                spoken_languages: b.spoken_languages,
              }))
              .map((b) => ({
                ...b,
                spoken_languages: b.effective_languages,
              })),
            sortBy === 'distance' ? 'distance' : 'rating',
            userCoords
          )
        : [],
    [exploreFallback, exploreFilterDeps, sortBy, userCoords]
  );

  const resultCount = viewType === 'professionals' ? sortedBarbers.length : filteredShops.length;

  const featuredBarber = React.useMemo(() => {
    if (!pageConfig.showInspiration || sortedBarbers.length === 0) return null;
    return sortedBarbers.find((b) => (b.rating ?? 0) >= 4.5 && (b.review_count ?? 0) >= 5) ?? sortedBarbers[0];
  }, [pageConfig.showInspiration, sortedBarbers]);

  const resultsHeading = searchTerm.trim()
    ? `Results for "${searchTerm.trim()}"`
    : pageConfig.resultsHeading;

  const canonicalExploreUrl = () => {
    const params = new URLSearchParams();
    if (mobileOnly) params.set('mobile', '1');
    if (shopOnly) params.set('shop', '1');
    if (groupOnly) params.set('group', '1');
    if (cityFilter) params.set('city', cityFilter);
    if (activeFilter && activeFilter !== 'All') params.set('filter', activeFilter);
    if (searchTerm.trim()) params.set('q', searchTerm.trim());
    const qs = params.toString();
    return qs ? `${siteOrigin()}/Explore?${qs}` : `${siteOrigin()}/Explore`;
  };

  return (
    <div className="stb-page font-sans pb-16">
      <MetaTags
        title={pageConfig.metaTitle(cityFilter, searchTerm)}
        description={pageConfig.metaDescription(cityFilter)}
        canonicalUrl={canonicalExploreUrl()}
      />
      <SchemaMarkup
        type="CollectionPage"
        data={{
          name: pageConfig.schemaName,
          description: pageConfig.metaDescription(cityFilter),
          url: window.location.href,
        }}
      />

      <HeroSection
        pageConfig={pageConfig}
        cityFilter={cityFilter}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onClearSearch={() => setSearchTerm('')}
        platformStats={platformStats}
        locationLabel={preferredLocation?.address ?? (cityFilter || null)}
        spotlight={
          featuredBarber ? (
            <ExploreFeaturedSpotlight
              barber={featuredBarber}
              bookingLocation={pageConfig.bookingLocation}
            />
          ) : null
        }
      />

      <StickyFilterBar
        exploreMode={exploreMode}
        pageConfig={pageConfig}
        viewType={viewType}
        onViewTypeChange={setViewType}
        activeFilter={activeFilter}
        onActiveFilterChange={setActiveFilter}
        highlightFilter={highlightFilter}
        onHighlightFilterChange={setHighlightFilter}
        languageFilter={languageFilter}
        onLanguageFilterChange={setLanguageFilter}
        languageOptions={languageOptions}
        kidsWelcomeOnly={kidsWelcomeOnly}
        onKidsWelcomeToggle={toggleKidsWelcome}
        mobileOnly={mobileOnly}
        shopOnly={shopOnly}
        groupOnly={groupOnly}
        onDiscoveryFlag={setDiscoveryFlag}
      />

      <main className="w-full max-w-6xl lg:max-w-7xl mx-auto px-4 md:px-8 py-4 md:py-6">
        <ExploreChampionshipLink />
        <ExploreActiveFilters items={activeFilterItems} onClearAll={clearAllFilters} />

        <ExploreResultsToolbar
          viewType={viewType}
          resultsHeading={resultsHeading}
          resultCount={resultCount}
          searchTerm={searchTerm}
          pageConfigSubtext={pageConfig.resultsSubtext}
          sortBy={sortBy}
          onSortChange={setSortBy}
          isRefreshing={barbersFetching}
        />

        <ExploreBarberGrid
          viewType={viewType}
          sortedBarbers={sortedBarbers}
          fallbackBarbers={sortedFallbackBarbers}
          fallbackMessage={exploreFallback?.message}
          filteredShops={filteredShops}
          promotions={promotions}
          pageConfig={pageConfig}
          exploreMode={exploreMode}
          searchTerm={searchTerm}
          sortBy={sortBy}
          barbersError={barbersError}
          barbersErr={barbersErr}
          barbersFetching={barbersFetching}
          shopsFetching={shopsFetching}
          barbersCount={barbers.length}
          shopsCount={shops.length}
          shopsError={shopsError}
          onRetryBarbers={refetchBarbers}
          onRetryShops={refetchShops}
          onPrefetchBarber={prefetchBarber}
          onClearFilters={clearAllFilters}
          isFavorited={isFavorited}
          onToggleFavorite={toggleFavorite}
        />
      </main>
    </div>
  );
}
