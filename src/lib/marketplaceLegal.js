/**
 * Marketplace legal & tax defaults (when VITE_FEATURE_MARKETPLACE is enabled).
 * Align with docs/MARKETPLACE_LEGAL.md and Greece VAT guidance in docs/TAX_COMPLIANCE_GREECE.md.
 */

export const MARKETPLACE_SELLER_TERMS_VERSION = '2026-06-26';

/** Greece standard VAT on physical grooming retail (seller must include in list price for B2C). */
export const MARKETPLACE_VAT_RATE_DEFAULT = 0.24;

export const MARKETPLACE_VAT_LABEL = 'VAT (est.)';

/** Align with server/src/shipping/logic.ts platform defaults */
export const PLATFORM_FREE_SHIPPING_MIN = 50;
export const PLATFORM_FLAT_SHIPPING = 5.99;

export const SELLER_TERMS_STORAGE_KEY = 'stb_marketplace_seller_terms_v1';

export const BUYER_TERMS_PATH = '/marketplace/buyer-terms';
export const SELLER_TERMS_PATH = '/marketplace/seller-terms';

export function getMarketplaceVatRate() {
  const raw = import.meta.env.VITE_MARKETPLACE_VAT_RATE;
  if (raw === undefined || raw === '') return MARKETPLACE_VAT_RATE_DEFAULT;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 && n <= 1 ? n : MARKETPLACE_VAT_RATE_DEFAULT;
}

export function formatVatPercent(rate = getMarketplaceVatRate()) {
  return `${Math.round(rate * 100)}%`;
}

export function computeMarketplaceTax(subtotal, shippingAmount, rate = getMarketplaceVatRate()) {
  const base = Math.max(0, Number(subtotal) || 0) + Math.max(0, Number(shippingAmount) || 0);
  return Math.round(base * rate * 100) / 100;
}

export function computeMarketplaceShipping(subtotal) {
  const s = Math.max(0, Number(subtotal) || 0);
  return s >= PLATFORM_FREE_SHIPPING_MIN ? 0 : PLATFORM_FLAT_SHIPPING;
}

export function hasAcceptedSellerTerms(userId) {
  if (typeof window === 'undefined' || !userId) return false;
  try {
    const raw = localStorage.getItem(SELLER_TERMS_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return parsed.userId === userId && parsed.version === MARKETPLACE_SELLER_TERMS_VERSION;
  } catch {
    return false;
  }
}

export function recordSellerTermsAcceptance(userId) {
  if (typeof window === 'undefined' || !userId) return;
  localStorage.setItem(
    SELLER_TERMS_STORAGE_KEY,
    JSON.stringify({ userId, version: MARKETPLACE_SELLER_TERMS_VERSION, at: new Date().toISOString() }),
  );
}

export const SHIPPING_LIABILITY_SUMMARY = {
  seller:
    'Sellers pack, ship, and fulfill orders. You are liable for accurate listings, dispatch within stated processing time, and damage/loss until handoff to the carrier unless your policy states otherwise.',
  platform:
    'ShopTheBarber provides checkout, payment routing, and optional platform shipping defaults. We are not the seller of record for barber/shop SKUs.',
  buyer:
    'Buyers must provide a deliverable address. Risk of loss passes per the seller’s stated policy and applicable consumer law after carrier acceptance.',
};
