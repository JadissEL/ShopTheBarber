import { describe, it, expect } from 'vitest';
import {
  computeRoi,
  formatMoney,
  mergePricingConfig,
  GTM_PRICING_DEFAULTS,
} from '@/lib/gtmPricing';

describe('gtmPricing', () => {
  it('formats money in EUR', () => {
    expect(formatMoney(79, 'EUR')).toMatch(/79/);
  });

  it('merges API config with defaults', () => {
    const merged = mergePricingConfig({ monthly_fee_barber: 99, currency: 'EUR' });
    expect(merged.monthly_fee_barber).toBe(99);
    expect(merged.fromApi).toBe(true);
  });

  it('falls back to defaults when API missing', () => {
    const merged = mergePricingConfig(null);
    expect(merged.monthly_fee_barber).toBe(GTM_PRICING_DEFAULTS.monthly_fee_barber);
    expect(merged.fromApi).toBe(false);
  });

  it('Cutly ROI: one no-show at €35 covers €79 fee when price high enough', () => {
    const low = computeRoi({ avgServicePrice: 35, noShowsPerMonth: 1, monthlyFee: 79 });
    expect(low.paysForMonth).toBe(false);

    const high = computeRoi({ avgServicePrice: 85, noShowsPerMonth: 1, monthlyFee: 79 });
    expect(high.paysForMonth).toBe(true);
    expect(high.surplusOneNoShow).toBeGreaterThan(0);
  });

  it('computes break-even no-shows', () => {
    const roi = computeRoi({ avgServicePrice: 40, noShowsPerMonth: 2, monthlyFee: 80 });
    expect(roi.breakEvenNoShows).toBe(2);
  });
});
