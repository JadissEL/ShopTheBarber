export const EXPLORE_SORT_OPTIONS = [
  { id: 'rating', label: 'Top rated' },
  { id: 'reviews', label: 'Most reviewed' },
  { id: 'distance', label: 'Closest to me' },
  { id: 'price', label: 'Price (low → high)' },
  { id: 'price_desc', label: 'Price (high → low)' },
];

/**
 * Client-side barber sorting for Explore (no backend changes).
 */
export function sortExploreBarbers(barbers, sortBy, _userCoords) {
  const list = [...barbers];

  switch (sortBy) {
    case 'reviews':
      return list.sort((a, b) => {
        const diff = (b.review_count ?? 0) - (a.review_count ?? 0);
        if (diff !== 0) return diff;
        return (b.rating ?? 0) - (a.rating ?? 0);
      });

    case 'distance':
      return list.sort((a, b) => {
        const da = a.distance_km;
        const db = b.distance_km;
        if (da == null && db == null) return (b.rating ?? 0) - (a.rating ?? 0);
        if (da == null) return 1;
        if (db == null) return -1;
        return da - db;
      });

    case 'price':
      return list.sort((a, b) => {
        const pa = a.min_price;
        const pb = b.min_price;
        if (pa == null && pb == null) return (b.rating ?? 0) - (a.rating ?? 0);
        if (pa == null) return 1;
        if (pb == null) return -1;
        return pa - pb;
      });

    case 'price_desc':
      return list.sort((a, b) => {
        const pa = a.min_price;
        const pb = b.min_price;
        if (pa == null && pb == null) return (b.rating ?? 0) - (a.rating ?? 0);
        if (pa == null) return 1;
        if (pb == null) return -1;
        return pb - pa;
      });

    case 'rating':
    default:
      return list.sort((a, b) => {
        const ratingDiff = (b.rating ?? 0) - (a.rating ?? 0);
        if (ratingDiff !== 0) return ratingDiff;
        return (b.review_count ?? 0) - (a.review_count ?? 0);
      });
  }
}

/**
 * Minimum service price per barber (from shop-linked services).
 */
export function buildBarberMinPriceMap(servicesList, barbers) {
  const shopToBarbers = {};
  for (const b of barbers) {
    if (b.shop_id) {
      if (!shopToBarbers[b.shop_id]) shopToBarbers[b.shop_id] = [];
      shopToBarbers[b.shop_id].push(b.id);
    }
  }

  const minByBarber = {};
  for (const svc of servicesList) {
    const price = svc.price ?? svc.data?.price;
    if (typeof price !== 'number' || !Number.isFinite(price)) continue;

    const barberId = svc.barber_id ?? svc.data?.barber_id;
    const shopId = svc.shop_id ?? svc.data?.shop_id;

    const targets = [];
    if (barberId) targets.push(barberId);
    if (shopId && shopToBarbers[shopId]) targets.push(...shopToBarbers[shopId]);

    for (const id of targets) {
      if (minByBarber[id] == null || price < minByBarber[id]) {
        minByBarber[id] = price;
      }
    }
  }

  return minByBarber;
}
