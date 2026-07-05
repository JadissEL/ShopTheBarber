import { describe, it, expect } from 'vitest';
import {
  buildShopIdsByService,
  serviceTextMatchesExploreFilter,
  barberServicesMatchExploreFilter,
} from './exploreServiceTags';
import {
  filterExploreBarbers,
  computeExploreFallbackBarbers,
  buildExploreFallbackMessage,
} from './exploreBarberFilter';

describe('exploreServiceTags', () => {
  it('matches executive grooming to haircut filter', () => {
    expect(serviceTextMatchesExploreFilter('', 'The Executive Grooming', 'Haircut')).toBe(true);
  });

  it('builds shop ids for synonym service names', () => {
    const map = buildShopIdsByService([
      { shop_id: 'shop-1', name: 'Executive Grooming Package', category: 'Premium' },
    ]);
    expect(map.haircut?.has('shop-1')).toBe(true);
  });

  it('matches barber service strings via synonyms', () => {
    expect(barberServicesMatchExploreFilter(['Executive cut & finish'], 'Haircut')).toBe(true);
  });
});

describe('exploreBarberFilter', () => {
  const barbers = [
    {
      id: 'b1',
      name: 'Alex',
      city: 'Brussels',
      location: 'Brussels centre',
      rating: 4.8,
      review_count: 20,
      offers_mobile_service: true,
      offers_shop_service: true,
      offers_group_booking: false,
      children_friendly: false,
      services: ['Haircut'],
      latitude: 50.85,
      longitude: 4.35,
    },
    {
      id: 'b2',
      name: 'Sam',
      city: 'Antwerp',
      location: 'Antwerp',
      rating: 4.2,
      review_count: 8,
      offers_mobile_service: false,
      offers_shop_service: true,
      offers_group_booking: true,
      children_friendly: true,
      services: ['Beard trim'],
      latitude: 51.22,
      longitude: 4.4,
    },
  ];

  const deps = { shopById: {}, minPriceByBarber: {}, userCoords: null };

  it('filters by city strictly', () => {
    const results = filterExploreBarbers(
      barbers,
      { cityFilter: 'Brussels', shopById: {} },
      deps
    );
    expect(results.map((b) => b.id)).toEqual(['b1']);
  });

  it('returns fallback barbers when city filter yields zero results', () => {
    const strict = {
      cityFilter: 'Brussels',
      kidsWelcomeOnly: true,
      shopById: {},
    };
    const fallback = computeExploreFallbackBarbers(barbers, strict, deps);
    expect(fallback).not.toBeNull();
    expect(fallback.barbers.length).toBeGreaterThan(0);
    expect(fallback.message).toMatch(/couldn't find exact matches|No exact matches/i);
  });

  it('builds readable fallback message', () => {
    expect(buildExploreFallbackMessage(['city'])).toMatch(/city/i);
  });
});
