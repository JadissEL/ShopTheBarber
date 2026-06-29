import { Link } from 'react-router-dom';
import { MetaTags } from '@/components/seo/MetaTags';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { createPageUrl } from '@/utils';
import {
  MARKETPLACE_SELLER_TERMS_VERSION,
  formatVatPercent,
  getMarketplaceVatRate,
  SHIPPING_LIABILITY_SUMMARY,
} from '@/lib/marketplaceLegal';

export default function MarketplaceSellerTerms() {
  const vatPct = formatVatPercent();

  return (
    <div className="stb-page">
      <MetaTags
        title="Marketplace Seller Terms"
        description="Terms for barbers, shops, and brands selling physical products on ShopTheBarber."
        canonicalUrl="/marketplace/seller-terms"
      />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link
          to={createPageUrl('ProviderMarketplaceProducts')}
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to marketplace listings
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Marketplace Seller Terms</h1>
          <p className="text-muted-foreground">
            Version {MARKETPLACE_SELLER_TERMS_VERSION}, Effective June 26, 2026
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Applies when the marketplace module is enabled. Service bookings remain under{' '}
            <Link to={createPageUrl('ProviderTermsOfService')} className="text-primary hover:underline">
              Provider Terms of Service
            </Link>
            .
          </p>
        </div>

        <Card className="prose prose-sm max-w-none">
          <CardContent className="pt-6 space-y-6 prose-headings:font-bold prose-headings:mt-6">
            <section>
              <h2>1. Merchant of record</h2>
              <p>
                You are the <strong>seller of record</strong> for products you list (except where
                ShopTheBarber explicitly labels a SKU as platform-owned). You, not ShopTheBarber , 
                are responsible for the product, fulfillment, consumer communications, and regulatory
                compliance.
              </p>
            </section>

            <section>
              <h2>2. Listings</h2>
              <ul>
                <li>Accurate title, description, price, stock, images, and category</li>
                <li>No counterfeit, recalled, illegal, or non-grooming unrelated goods</li>
                <li>Admin approval required before public listing</li>
                <li>You may not divert buyers to off-platform payment for marketplace orders</li>
              </ul>
            </section>

            <section>
              <h2>3. VAT & tax ({vatPct} standard, Greece physical goods)</h2>
              <p>
                If you are VAT-registered in Greece (or required to register, typically €30,000+
                annual turnover), you must:
              </p>
              <ul>
                <li>Display <strong>VAT-inclusive</strong> consumer prices unless law allows otherwise</li>
                <li>Issue compliant receipts/invoices and remit VAT to AADE</li>
                <li>Keep records matching order history in ShopTheBarber</li>
              </ul>
              <p>
                Checkout shows an <strong>estimated</strong> VAT line at {vatPct} (
                {getMarketplaceVatRate()} rate) for buyer transparency. You remain solely responsible
                for correct tax treatment. See repository doc{' '}
                <code className="text-xs">docs/TAX_COMPLIANCE_GREECE.md</code> for platform guidance.
              </p>
            </section>

            <section>
              <h2>4. Shipping & fulfillment</h2>
              <p>{SHIPPING_LIABILITY_SUMMARY.seller}</p>
              <ul>
                <li>Maintain a complete <strong>seller shipping profile</strong> (ship-from, processing days, rates, return policy)</li>
                <li>Ship within stated processing time; use tracked shipping when practical</li>
                <li>You contract with carriers; platform shipping defaults are informational unless agreed otherwise</li>
              </ul>
            </section>

            <section>
              <h2>5. Returns & refunds</h2>
              <p>
                Publish a clear return policy in your shipping profile. Honor applicable consumer
                withdrawal and defective-goods rules. Refund decisions for your SKUs are yours;
                ShopTheBarber may facilitate payment reversals through Stripe when disputes are upheld.
              </p>
            </section>

            <section>
              <h2>6. Platform role & fees</h2>
              <p>{SHIPPING_LIABILITY_SUMMARY.platform}</p>
              <p>
                Any marketplace commission, payment processing, or brand rev-share is disclosed
                separately. Fixed subscription fees for booking services are independent of marketplace
                sales unless stated in writing.
              </p>
            </section>

            <section>
              <h2>7. Acceptance</h2>
              <p>
                By submitting a product for approval, you accept these terms version{' '}
                {MARKETPLACE_SELLER_TERMS_VERSION}. If terms change, you must re-accept before new
                submissions.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
