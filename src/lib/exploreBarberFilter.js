import { effectiveBarberLanguages, matchesLanguageFilter } from '@/lib/languages';
import { effectiveChildrenFriendly, matchesChildrenFriendlyFilter } from '@/lib/childrenFriendly';
import { effectiveLicensed, effectiveInsured } from '@/lib/providerAttestation';
import { matchesMobileServiceFilter, matchesShopServiceFilter } from '@/lib/mobileService';
import { barberDistanceKm } from '@/lib/geo';
import {
  normalizeExploreFilterTag,
  barberServicesMatchExploreFilter,
} from '@/lib/exploreServiceTags';

const RELAXATION_STEPS = [
  { key: 'highlightFilter', value: '', label: 'highlight filter' },
  { key: 'cityFilter', value: '', label: 'city' },
  { key: 'kidsWelcomeOnly', value: false, label: 'kids welcome' },
  { key: 'mobileOnly', value: false, label: 'mobile visits' },
  { key: 'shopOnly', value: false, label: 'in-shop only' },
  { key: 'groupOnly', value: false, label: 'group booking' },
  { key: 'languageFilter', value: '', label: 'language' },
  { key: 'activeFilter', value: 'All', label: 'service type' },
  { key: 'searchTerm', value: '', label: 'search' },
];

export function isExploreFilterActive(key, value) {
  switch (key) {
    case 'highlightFilter':
      return !!value;
    case 'cityFilter':
    case 'languageFilter':
    case 'searchTerm':
      return typeof value === 'string' && value.trim().length > 0;
    case 'kidsWelcomeOnly':
    case 'mobileOnly':
    case 'shopOnly':
    case 'groupOnly':
      return value === true;
    case 'activeFilter':
      return value && value !== 'All';
    default:
      return false;
  }
}

function barberMatchesTag(barber, activeFilter, shopIdsByService, promotions) {
  if (activeFilter === 'Deals') {
    const shopDealIds = Array.isArray(promotions?.shop_ids) ? promotions.shop_ids : [];
    const dealSet = new Set(shopDealIds);
    const hasPlatform = !!promotions?.has_platform_promos;
    return hasPlatform || (!!barber.shop_id && dealSet.has(barber.shop_id));
  }

  if (!activeFilter || activeFilter === 'All') return true;

  const tagNorm = normalizeExploreFilterTag(activeFilter);
  const tagKey = activeFilter.toLowerCase().replace(/\s+/g, '');
  const shopIds = shopIdsByService[tagNorm] || shopIdsByService[tagKey];
  const barberShopId = barber.shop_id;
  const matchesByService = barberShopId && shopIds && shopIds.has(barberShopId);
  const matchesByBarberServices = barberServicesMatchExploreFilter(barber.services, activeFilter);

  return !!(matchesByService || matchesByBarberServices);
}

function barberMatchesHighlight(barber, highlightFilter) {
  if (!highlightFilter) return true;
  if (highlightFilter === 'topRated') {
    return (barber.rating ?? 0) >= 4.5 && (barber.review_count ?? 0) >= 5;
  }
  if (highlightFilter === 'new') {
    return (barber.review_count ?? 0) === 0 && (barber.rating ?? 0) === 0;
  }
  if (highlightFilter === 'trending') {
    return (barber.review_count ?? 0) >= 15 && (barber.rating ?? 0) >= 4.0;
  }
  return true;
}

export function enrichExploreBarber(barber, { shopById, minPriceByBarber, userCoords }) {
  const shop = barber.shop_id ? shopById[barber.shop_id] : null;
  return {
    ...barber,
    effective_languages: effectiveBarberLanguages(barber, shopById),
    children_friendly: effectiveChildrenFriendly(
      barber.children_friendly,
      shop?.children_friendly ?? false
    ),
    licensed: effectiveLicensed(barber.attestation_licensed, shop?.attestation_licensed ?? false),
    insured: effectiveInsured(barber.attestation_insured, shop?.attestation_insured ?? false),
    min_price: minPriceByBarber[barber.id] ?? null,
    distance_km: barberDistanceKm(userCoords, barber),
  };
}

export function barberMatchesExploreFilters(barber, filters, deps) {
  const {
    searchTerm = '',
    activeFilter = 'All',
    highlightFilter = '',
    promotions = {},
    shopIdsByService = {},
    languageFilter = '',
    kidsWelcomeOnly = false,
    mobileOnly = false,
    shopOnly = false,
    groupOnly = false,
    cityFilter = '',
    shopById = {},
  } = filters;

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

  const matchesTag = barberMatchesTag(barber, activeFilter, shopIdsByService, promotions);
  const shopFriendly = barber.shop_id ? shopById[barber.shop_id]?.children_friendly : false;

  const matchesLanguage =
    !languageFilter ||
    matchesLanguageFilter(
      barber.spoken_languages,
      barber.shop_id ? shopById[barber.shop_id]?.spoken_languages : [],
      [languageFilter]
    );

  const matchesKids = matchesChildrenFriendlyFilter(barber.children_friendly, shopFriendly, kidsWelcomeOnly);
  const matchesMobile = matchesMobileServiceFilter(barber.offers_mobile_service, mobileOnly);
  const matchesShop = matchesShopServiceFilter(barber.offers_shop_service, shopOnly);
  const matchesGroup = !groupOnly || barber.offers_group_booking === true;

  const cityLower = cityFilter.toLowerCase();
  const matchesCity =
    !cityFilter ||
    (barber.city || '').toLowerCase().includes(cityLower) ||
    (barber.location || '').toLowerCase().includes(cityLower);

  const matchesHighlight = barberMatchesHighlight(barber, highlightFilter);

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
}

export function filterExploreBarbers(barbers, filters, deps) {
  return barbers
    .filter((barber) => barberMatchesExploreFilters(barber, filters, deps))
    .map((barber) => enrichExploreBarber(barber, deps));
}

export function buildExploreFallbackMessage(relaxedLabels) {
  if (!relaxedLabels?.length) {
    return "We couldn't find exact matches, but here are some great professionals nearby.";
  }
  const unique = [...new Set(relaxedLabels)];
  if (unique.length === 1) {
    return `No exact matches with your ${unique[0]} filter — here are nearby professionals you may like.`;
  }
  return `We couldn't find exact matches with all your filters — showing nearby professionals with a broader search.`;
}

export function computeExploreFallbackBarbers(barbers, strictFilters, deps, { limit = 12 } = {}) {
  const strictResults = filterExploreBarbers(barbers, strictFilters, deps);
  if (strictResults.length > 0) return null;

  const hasActiveFilters = RELAXATION_STEPS.some((step) =>
    isExploreFilterActive(step.key, strictFilters[step.key])
  );
  if (!hasActiveFilters) return null;

  const relaxed = { ...strictFilters };
  const dropped = [];

  for (const step of RELAXATION_STEPS) {
    if (!isExploreFilterActive(step.key, strictFilters[step.key])) continue;

    relaxed[step.key] = step.value;
    dropped.push(step.label);

    const results = filterExploreBarbers(barbers, relaxed, deps);
    if (results.length > 0) {
      const sorted = [...results].sort((a, b) => {
        const da = a.distance_km;
        const db = b.distance_km;
        if (da == null && db == null) return (b.rating ?? 0) - (a.rating ?? 0);
        if (da == null) return 1;
        if (db == null) return -1;
        return da - db;
      });

      return {
        barbers: sorted.slice(0, limit),
        relaxedLabels: dropped,
        message: buildExploreFallbackMessage(dropped),
      };
    }
  }

  return null;
}
