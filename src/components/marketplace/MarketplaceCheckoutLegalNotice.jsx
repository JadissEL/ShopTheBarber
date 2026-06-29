import { Link } from 'react-router-dom';
import { BUYER_TERMS_PATH, formatVatPercent, SHIPPING_LIABILITY_SUMMARY } from '@/lib/marketplaceLegal';

/**
 * @param {{ compact?: boolean }} props
 */
export function MarketplaceCheckoutLegalNotice({ compact = false }) {
  const vatPct = formatVatPercent();

  if (compact) {
    return (
      <p className="text-xs text-muted-foreground leading-relaxed">
        Estimated VAT ({vatPct}) shown at checkout. Products ship from individual sellers.{' '}
        <Link to={BUYER_TERMS_PATH} className="text-primary hover:underline">
          Marketplace purchase terms
        </Link>
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-muted/40 p-4 text-xs text-muted-foreground space-y-2 leading-relaxed">
      <p className="font-medium text-foreground text-sm">Marketplace order notice</p>
      <p>
        <strong>VAT:</strong> Checkout displays an estimated {vatPct} VAT line. Sellers are responsible
        for tax-compliant pricing and invoicing.
      </p>
      <p>
        <strong>Shipping:</strong> {SHIPPING_LIABILITY_SUMMARY.buyer}
      </p>
      <p>
        <Link to={BUYER_TERMS_PATH} className="text-primary hover:underline">
          Read marketplace purchase terms
        </Link>
      </p>
    </div>
  );
}
