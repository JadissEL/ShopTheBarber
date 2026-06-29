const eurFormatter = new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

const usdFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

/** Locale-aware money display for Phase 1 EUR-first flows */
export function formatMoney(amount, currency = 'EUR') {
    if (amount == null || Number.isNaN(Number(amount))) return null;
    const value = Number(amount);
    if (currency === 'USD') return usdFormatter.format(value);
    return eurFormatter.format(value);
}
