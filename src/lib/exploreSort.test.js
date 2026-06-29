import { describe, it, expect } from 'vitest';
import { sortExploreBarbers, buildBarberMinPriceMap } from './exploreSort';

describe('sortExploreBarbers', () => {
  const barbers = [
    { id: 'a', rating: 4.2, review_count: 10, min_price: 30, distance_km: 5 },
    { id: 'b', rating: 4.9, review_count: 2, min_price: 15, distance_km: 1 },
    { id: 'c', rating: 4.9, review_count: 50, min_price: 25, distance_km: null },
  ];

  it('sorts by rating by default', () => {
    const sorted = sortExploreBarbers(barbers, 'rating');
    expect(sorted[0].id).toBe('c');
  });

  it('sorts by reviews', () => {
    const sorted = sortExploreBarbers(barbers, 'reviews');
    expect(sorted[0].id).toBe('c');
  });

  it('sorts by price ascending', () => {
    const sorted = sortExploreBarbers(barbers, 'price');
    expect(sorted[0].id).toBe('b');
  });

  it('sorts by price descending', () => {
    const sorted = sortExploreBarbers(barbers, 'price_desc');
    expect(sorted[0].id).toBe('a');
  });

  it('sorts by distance when coords available', () => {
    const sorted = sortExploreBarbers(barbers, 'distance', { latitude: 0, longitude: 0 });
    expect(sorted[0].id).toBe('b');
  });
});

describe('buildBarberMinPriceMap', () => {
  it('maps minimum shop service price to barbers', () => {
    const map = buildBarberMinPriceMap(
      [
        { shop_id: 's1', price: 40 },
        { shop_id: 's1', price: 20 },
      ],
      [{ id: 'b1', shop_id: 's1' }]
    );
    expect(map.b1).toBe(20);
  });
});
