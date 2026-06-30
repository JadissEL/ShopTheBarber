import { Link } from 'react-router-dom';
import { MetaTags } from '@/components/seo/MetaTags';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { createPageUrl } from '@/utils';
import {
  formatVatPercent,
  SHIPPING_LIABILITY_SUMMARY,
} from '@/lib/marketplaceLegal';
import PageHeader from '@/components/layout/PageHeader';
import PageContent from '@/components/layout/PageContent';
import { stb } from '@/lib/stbUi';

export default function MarketplaceBuyerTerms() {
  const vatPct = formatVatPercent();

  return (
    <div className={stb.page}>
      <MetaTags
        title="Marketplace Purchase Terms"
        description="Terms for customers buying grooming products on ShopTheBarber marketplace."
        canonicalUrl="/marketplace/buyer-terms"
      />

      <PageHeader
        label="Legal"
        title="Marketplace Purchase Terms"
        subtitle="Customer edition • Effective June 26, 2026"
        compact
        variant="light"
        tier="app"
      />

      <PageContent narrow>
        <Link
          to={createPageUrl('Marketplace')}
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to marketplace
        </Link>

        <Card className="prose prose-sm max-w-none">
          <CardContent className="pt-6 space-y-6 prose-headings:font-bold">
            <section>
              <h2>1. Who sells to you</h2>
              <p>
                Physical products are sold by the <strong>named seller</strong> (barber, shop, or brand)
                shown on the product page. ShopTheBarber operates the marketplace and payment checkout
                but is not the seller of record for third-party SKUs.
              </p>
            </section>

            <section>
              <h2>2. Prices, VAT & checkout</h2>
              <p>
                Displayed product prices are set by sellers. At checkout you will see subtotal, shipping,
                and an <strong>estimated VAT ({vatPct})</strong> line where applicable. Final tax
                treatment follows seller invoices and your jurisdiction.
              </p>
            </section>

            <section>
              <h2>3. Shipping</h2>
              <p>{SHIPPING_LIABILITY_SUMMARY.buyer}</p>
              <p>
                Delivery times combine seller processing days and carrier transit. You must provide an
                accurate shipping address. {SHIPPING_LIABILITY_SUMMARY.seller}
              </p>
            </section>

            <section>
              <h2>4. Returns & disputes</h2>
              <p>
                Each seller publishes a return policy on their shipping profile. For defective or
                undelivered orders, contact the seller via order support first. ShopTheBarber may help
                mediate payment disputes in line with our general{' '}
                <Link to={createPageUrl('TermsOfService')} className="text-primary hover:underline">
                  Terms of Service
                </Link>
                .
              </p>
            </section>

            <section>
              <h2>5. Module availability</h2>
              <p>
                Marketplace features may be disabled in some deployments. These terms continue to apply
                to orders placed while the module was active.
              </p>
            </section>
          </CardContent>
        </Card>
      </PageContent>
    </div>
  );
}
