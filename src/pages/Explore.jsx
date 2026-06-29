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
import { parseSpokenLanguages, effectiveBarberLanguages, matchesLanguageFilter, FALLBACK_LANGUAGE_OPTIONS } from '@/lib/languages';
import { parseChildrenFriendly, effectiveChildrenFriendly, matchesChildrenFriendlyFilter } from '@/lib/childrenFriendly';
import { parseAttestationFlag, effectiveLicensed, effectiveInsured } from '@/lib/providerAttestation';
import { matchesMobileServiceFilter, matchesShopServiceFilter } from '@/lib/mobileService';
import { resolveExploreMode, EXPLORE_PAGE_CONFIG } from '@/lib/explorePageConfig';
import { sortExploreBarbers, buildBarberMinPriceMap } from '@/lib/exploreSort';
import { barberDistanceKm } from '@/lib/geo';
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

  const {
    data: rawBarbers,
    isFetching: barbersFetching,
    isError: barbersError,
    error: barbersErr,
    refetch: refetchBarbers,
  } = useQuery({
    queryKey: ['explore-barbers'],
    queryFn: async () => {
      const list = await sovereign.entities.Barber.list();
      return Array.isArray(list) ? list : [];
    },
    staleTime: 1000 * 60 * 2,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  const barbers = React.useMemo(() => {
    const list = Array.isArray(rawBarbers) ? rawBarbers : [];
    return list.map((b) => {
      const data = b.data || {};
      return {
        id: b.id,
        name: data.name || b.name || 'Unknown',
        location: data.location || b.location,
        city: data.city || b.city,
        image_url: data.image_url || b.image_url,
        rating: data.rating ?? b.rating ?? 0,
        review_count: data.review_count ?? b.review_count ?? 0,
        title: data.title || b.title,
        shop_id: b.shop_id ?? data.shop_id,
        services: data.services || b.services,
        auto_accept: data.auto_accept || b.auto_accept,
        type: data.type || b.type,
        offers_mobile_service: data.offers_mobile_service === true || b.offers_mobile_service === true,
        offers_shop_service: data.offers_shop_service ?? b.offers_shop_service,
        offers_group_booking: data.offers_group_booking === true || b.offers_group_booking === true,
        group_booking_discount_percent: data.group_booking_discount_percent ?? b.group_booking_discount_percent ?? 0,
        is_vip: data.is_vip === true || b.is_vip === true,
        spoken_languages: parseSpokenLanguages(data.spoken_languages ?? b.spoken_languages),
        children_friendly: parseChildrenFriendly(data.children_friendly ?? b.children_friendly),
        attestation_licensed: parseAttestationFlag(data.attestation_licensed ?? b.attestation_licensed),
        attestation_insured: parseAttestationFlag(data.attestation_insured ?? b.attestation_insured),
        latitude: data.latitude ?? b.latitude,
        longitude: data.longitude ?? b.longitude,
      };
    });
  }, [rawBarbers]);

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

  const { data: rawShops, isError: shopsError, isFetching: shopsFetching, refetch: refetchShops } = useQuery({
    queryKey: ['explore-shops'],
    queryFn: async () => {
      const list = await sovereign.entities.Shop.list();
      return Array.isArray(list) ? list : [];
    },
    staleTime: 1000 * 60 * 2,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  const { data: servicesList = [] } = useQuery({
    queryKey: ['explore-services'],
    queryFn: async () => {
      try {
        const list = await sovereign.entities.Service.list();
        return Array.isArray(list) ? list : [];
      } catch {
        return [];
      }
    },
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });

  const shops = React.useMemo(() => {
    const list = Array.isArray(rawShops) ? rawShops : [];
    return list.map((s) => ({
      ...s,
      ...(s.data || {}),
      id: s.id,
      spoken_languages: parseSpokenLanguages(s.spoken_languages ?? s.data?.spoken_languages),
      children_friendly: parseChildrenFriendly(s.children_friendly ?? s.data?.children_friendly),
      attestation_licensed: parseAttestationFlag(s.attestation_licensed ?? s.data?.attestation_licensed),
      attestation_insured: parseAttestationFlag(s.attestation_insured ?? s.data?.attestation_insured),
    }));
  }, [rawShops]);

  const shopById = React.useMemo(() => {
    const map = {};
    for (const s of shops) {
      map[s.id] = {
        ...s,
        spoken_languages: parseSpokenLanguages(s.spoken_languages),
        children_friendly: parseChildrenFriendly(s.children_friendly),
        attestation_licensed: parseAttestationFlag(s.attestation_licensed),
        attestation_insured: parseAttestationFlag(s.attestation_insured),
      };
    }
    return map;
  }, [shops]);

  const shopIdsByService = React.useMemo(() => {
    const map = {};
    const list = Array.isArray(servicesList) ? servicesList : [];
    const tags = ['hair', 'haircut', 'beard', 'beard trim', 'shave', 'styling', 'facial'];
    for (const svc of list) {
      const cat = (svc.category || '').toLowerCase();
      const name = (svc.name || '').toLowerCase();
      const shopId = svc.shop_id;
      if (!shopId) continue;
      for (const tag of tags) {
        if (cat.includes(tag) || name.includes(tag)) {
          const key = tag.replace(/\s+/g, '');
          if (!map[key]) map[key] = new Set();
          map[key].add(shopId);
        }
      }
      if (cat.includes('hair') || name.includes('hair')) {
        if (!map.haircut) map.haircut = new Set();
        map.haircut.add(shopId);
      }
      if (cat.includes('beard') || name.includes('beard')) {
        if (!map.beardtrim) map.beardtrim = new Set();
        map.beardtrim.add(shopId);
      }
    }
    return map;
  }, [servicesList]);

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

  const minPriceByBarber = React.useMemo(
    () => buildBarberMinPriceMap(Array.isArray(servicesList) ? servicesList : [], barbers),
    [servicesList, barbers]
  );

  const prefetchBarber = (id) => {
    queryClient.prefetchQuery({
      queryKey: ['barber', id],
      queryFn: () => sovereign.entities.Barber.get(id),
      staleTime: 1000 * 60 * 5,
    });
  };

  const filteredBarbers = React.useMemo(() => {
    return barbersWithStats
      .filter((barber) => {
        const searchTermLower = searchTerm.toLowerCase();

        const matchesSearch =
          !searchTerm ||
          (barber.name || '').toLowerCase().includes(searchTermLower) ||
          (barber.location || '').toLowerCase().includes(searchTermLower) ||
          (barber.title || '').toLowerCase().includes(searchTermLower) ||
          (Array.isArray(barber.services) &&
            barber.services.some((s) =>
              (typeof s === 'string' ? s : '').toLowerCase().includes(searchTermLower)
            ));

        const shopDealIds = Array.isArray(promotions?.shop_ids) ? promotions.shop_ids : [];
        const dealSet = new Set(shopDealIds);
        const hasPlatform = !!promotions?.has_platform_promos;
        const hasPromotion = hasPlatform || (!!barber.shop_id && dealSet.has(barber.shop_id));

        let matchesTag = true;
        if (activeFilter === 'Deals') {
          matchesTag = hasPromotion;
        } else if (activeFilter !== 'All') {
          const tagKey = activeFilter.toLowerCase().replace(/\s+/g, '');
          const tagNorm = tagKey === 'beardtrim' ? 'beard' : tagKey === 'haircut' ? 'hair' : tagKey;
          const shopIds = shopIdsByService[tagNorm] || shopIdsByService[tagKey];
          const barberShopId = barber.shop_id;
          const matchesByService = barberShopId && shopIds && shopIds.has(barberShopId);
          const matchesByBarberServices =
            Array.isArray(barber.services) &&
            barber.services.some((s) =>
              (typeof s === 'string' ? s : '').toLowerCase().includes(activeFilter.toLowerCase())
            );
          matchesTag = !!(matchesByService || matchesByBarberServices);
        }

        const matchesLanguage =
          !languageFilter ||
          matchesLanguageFilter(
            barber.spoken_languages,
            barber.shop_id ? shopById[barber.shop_id]?.spoken_languages : [],
            [languageFilter]
          );

        const shopFriendly = barber.shop_id ? shopById[barber.shop_id]?.children_friendly : false;
        const matchesKids = matchesChildrenFriendlyFilter(barber.children_friendly, shopFriendly, kidsWelcomeOnly);
        const matchesMobile = matchesMobileServiceFilter(barber.offers_mobile_service, mobileOnly);
        const matchesShop = matchesShopServiceFilter(barber.offers_shop_service, shopOnly);
        const matchesGroup = !groupOnly || barber.offers_group_booking === true;
        const cityLower = cityFilter.toLowerCase();
        const matchesCity =
          !cityFilter ||
          (barber.city || '').toLowerCase().includes(cityLower) ||
          (barber.location || '').toLowerCase().includes(cityLower);

        let matchesHighlight = true;
        if (highlightFilter === 'topRated') {
          matchesHighlight = (barber.rating ?? 0) >= 4.5 && (barber.review_count ?? 0) >= 5;
        } else if (highlightFilter === 'new') {
          matchesHighlight = (barber.review_count ?? 0) === 0 && (barber.rating ?? 0) === 0;
        } else if (highlightFilter === 'trending') {
          matchesHighlight = (barber.review_count ?? 0) >= 15 && (barber.rating ?? 0) >= 4.0;
        }

        return (
          matchesSearch &&
          matchesTag &&
          matchesLanguage &&
          matchesKids &&
          matchesMobile &&
          matchesShop &&
          matchesGroup &&
          matchesCity &&
          matchesHighlight
        );
      })
      .map((barber) => ({
        ...barber,
        effective_languages: effectiveBarberLanguages(barber, shopById),
        children_friendly: effectiveChildrenFriendly(
          barber.children_friendly,
          barber.shop_id ? shopById[barber.shop_id]?.children_friendly : false
        ),
        licensed: effectiveLicensed(
          barber.attestation_licensed,
          barber.shop_id ? shopById[barber.shop_id]?.attestation_licensed : false
        ),
        insured: effectiveInsured(
          barber.attestation_insured,
          barber.shop_id ? shopById[barber.shop_id]?.attestation_insured : false
        ),
        min_price: minPriceByBarber[barber.id] ?? null,
        distance_km: barberDistanceKm(userCoords, barber),
      }));
  }, [
    barbersWithStats,
    searchTerm,
    activeFilter,
    highlightFilter,
    promotions,
    shopIdsByService,
    languageFilter,
    kidsWelcomeOnly,
    mobileOnly,
    shopOnly,
    groupOnly,
    cityFilter,
    shopById,
    minPriceByBarber,
    userCoords,
  ]);

  const filteredShops = React.useMemo(() => {
    return shops
      .filter((shop) => {
        const searchTermLower = searchTerm.toLowerCase();
        const matchesSearch =
          !searchTerm ||
          (shop.name || '').toLowerCase().includes(searchTermLower) ||
          (shop.location || '').toLowerCase().includes(searchTermLower) ||
          (shop.description || '').toLowerCase().includes(searchTermLower);
        const cityLower = cityFilter.toLowerCase();
        const matchesCity = !cityFilter || (shop.location || '').toLowerCase().includes(cityLower);
        const shopLangs = parseSpokenLanguages(shop.spoken_languages);
        const matchesLanguage = !languageFilter || shopLangs.includes(languageFilter);
        const matchesKids = matchesChildrenFriendlyFilter(false, shop.children_friendly, kidsWelcomeOnly);
        return matchesSearch && matchesLanguage && matchesKids && matchesCity;
      })
      .map((shop) => ({
        ...shop,
        spoken_languages: parseSpokenLanguages(shop.spoken_languages),
      }));
  }, [shops, searchTerm, languageFilter, kidsWelcomeOnly, cityFilter]);

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
