/**
 * Go-to-market pricing copy and defaults.
 * Live amounts are loaded from GET /api/fixed-fee/config when available.
 */

export const GTM_PRICING_DEFAULTS = {
  currency: 'EUR',
  monthly_fee_barber: 79,
  monthly_fee_shop: 149,
  extra_chair_fee: 29,
  annual_discount_percent: 30,
};

export const DIRECT_BOOKING_COMMISSION = 0;
export const DISCOVERY_FEE_STATUS = 'planned'; // optional discovery fee, not billed yet

/** Typical no-show fee providers recover (Cutly-style ROI framing). */
export const DEFAULT_AVG_SERVICE_PRICE = 35;
export const DEFAULT_NO_SHOWS_PER_MONTH = 2;

export function formatMoney(amount, currency = 'EUR') {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '-';
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

export function mergePricingConfig(apiConfig) {
  if (!apiConfig) return { ...GTM_PRICING_DEFAULTS, fromApi: false };
  return {
    currency: apiConfig.currency ?? GTM_PRICING_DEFAULTS.currency,
    monthly_fee_barber:
      apiConfig.monthly_fee_barber ?? GTM_PRICING_DEFAULTS.monthly_fee_barber,
    monthly_fee_shop:
      apiConfig.monthly_fee_shop ?? GTM_PRICING_DEFAULTS.monthly_fee_shop,
    extra_chair_fee: GTM_PRICING_DEFAULTS.extra_chair_fee,
    annual_discount_percent:
      apiConfig.annual_discount_percent ?? GTM_PRICING_DEFAULTS.annual_discount_percent,
    annual_checkout_barber: apiConfig.annual_checkout_barber,
    annual_checkout_shop: apiConfig.annual_checkout_shop,
    enrollment_window_open: apiConfig.enrollment_window_open,
    fromApi: true,
  };
}

/**
 * Cutly-style ROI: one recovered no-show vs monthly platform fee.
 * @returns {{ monthlyFee: number, recoveredPerNoShow: number, breakEvenNoShows: number, surplusOneNoShow: number }}
 */
export function computeRoi({ avgServicePrice, noShowsPerMonth, monthlyFee, recoveryRate = 1 }) {
  const fee = Math.max(0, Number(monthlyFee) || 0);
  const price = Math.max(0, Number(avgServicePrice) || 0);
  const rate = Math.min(1, Math.max(0, Number(recoveryRate) || 0));
  const recoveredPerNoShow = price * rate;
  const breakEvenNoShows = recoveredPerNoShow > 0 ? fee / recoveredPerNoShow : Infinity;
  const prevented = Math.min(Math.max(0, Number(noShowsPerMonth) || 0), 1);
  const surplusOneNoShow = prevented * recoveredPerNoShow - fee;

  return {
    monthlyFee: fee,
    recoveredPerNoShow,
    breakEvenNoShows,
    surplusOneNoShow,
    paysForMonth: recoveredPerNoShow >= fee,
  };
}

export async function fetchPublicPricingConfig(baseUrl = '/api') {
  try {
    const res = await fetch(`${baseUrl}/fixed-fee/config`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
