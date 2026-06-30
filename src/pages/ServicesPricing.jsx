import { MetaTags } from '@/components/seo/MetaTags';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import PageHeader from '@/components/layout/PageHeader';
import PageContent from '@/components/layout/PageContent';

export default function ServicesPricing() {
  return (
    <div className="stb-page pb-16 font-sans">
      <MetaTags title="Services & Pricing" description="View our services and pricing at ShopTheBarber" />
      <PageHeader
        label="Provider"
        title="Services & pricing"
        subtitle="Rates vary by barber and location. Book to see exact prices."
        compact
        variant="light"
        tier="app"
      />

      <PageContent narrow>
        <Link to={createPageUrl('Home')} className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground mb-6">
              Each barber and shop sets their own prices. To see exact service costs and availability, go to Explore, pick a barber or shop, and start a booking.
            </p>
            <p className="text-sm text-muted-foreground mb-6 border-t border-border pt-6">
              <strong className="text-foreground">Barbers & shop owners:</strong> platform pricing (flat fee, 0% commission on direct bookings) is on{' '}
              <Link to="/pricing" className="text-primary font-semibold hover:underline">our pricing page</Link>.
            </p>
            <Link to={createPageUrl('Explore')}>
              <span className="text-primary font-semibold hover:underline">Browse barbers and book</span>
            </Link>
          </CardContent>
        </Card>
      </PageContent>
    </div>
  );
}
