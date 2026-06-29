/**
 * Marketplace legal configuration, VAT, terms version, liability copy.
 * @see docs/MARKETPLACE_LEGAL.md
 */

export const MARKETPLACE_SELLER_TERMS_VERSION = '2026-06-26';

export function getMarketplaceVatRate(): number {
    const raw = process.env.MARKETPLACE_VAT_RATE;
    if (raw === undefined || raw === '') return 0.24;
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0 || n > 1) return 0.24;
    return n;
}

export function computeMarketplaceVatAmount(subtotal: number, shippingAmount: number): number {
    const base = Math.max(0, subtotal) + Math.max(0, shippingAmount);
    const rate = getMarketplaceVatRate();
    return Math.round(base * rate * 100) / 100;
}

export function requireSellerTermsAccepted(body: { seller_terms_accepted?: boolean; seller_terms_version?: string }): void {
    if (body.seller_terms_accepted !== true) {
        throw new Error('You must accept the Marketplace Seller Terms before submitting a listing');
    }
    if (body.seller_terms_version && body.seller_terms_version !== MARKETPLACE_SELLER_TERMS_VERSION) {
        throw new Error('Marketplace Seller Terms have been updated, please review and accept again');
    }
}

export function marketplaceLegalConfig() {
    return {
        seller_terms_version: MARKETPLACE_SELLER_TERMS_VERSION,
        vat_rate: getMarketplaceVatRate(),
        vat_label: 'VAT (estimated at checkout)',
        vat_note:
            'List prices should be VAT-inclusive for B2C sales in Greece. Checkout displays an estimated VAT line; sellers remain responsible for correct tax reporting.',
        shipping_liability: {
            seller: 'Seller is merchant of record: fulfillment, carrier handoff, returns per published policy.',
            platform: 'Platform facilitates payment and order routing; not seller of record for third-party SKUs.',
            buyer: 'Buyer provides accurate delivery details; carrier and seller policies apply after dispatch.',
        },
        module_note: 'Applies when marketplace feature module is enabled.',
    };
}
