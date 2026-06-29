import { describe, it, expect } from 'vitest';
import { resolveExploreMode, EXPLORE_PAGE_CONFIG } from './explorePageConfig';

describe('resolveExploreMode', () => {
  it('returns mobile when mobile=1', () => {
    expect(resolveExploreMode({ mobileOnly: true, shopOnly: false, groupOnly: false, activeFilter: 'All' })).toBe('mobile');
  });

  it('returns mobileGroup when mobile and group', () => {
    expect(resolveExploreMode({ mobileOnly: true, shopOnly: false, groupOnly: true, activeFilter: 'All' })).toBe('mobileGroup');
  });

  it('returns topRated by default', () => {
    expect(resolveExploreMode({ mobileOnly: false, shopOnly: false, groupOnly: false, activeFilter: 'All' })).toBe('topRated');
  });
});

describe('EXPLORE_PAGE_CONFIG.topRated', () => {
  it('uses accurate results heading', () => {
    expect(EXPLORE_PAGE_CONFIG.topRated.resultsHeading).toBe('All professionals');
  });
});

describe('EXPLORE_PAGE_CONFIG.mobile', () => {
  it('has mobile-specific hero and locks professionals', () => {
    const cfg = EXPLORE_PAGE_CONFIG.mobile;
    expect(cfg.heroTitle('')).toBe('Mobile Barbers');
    expect(cfg.lockProfessionals).toBe(true);
    expect(cfg.bookingLocation).toBe('mobile');
  });
});
