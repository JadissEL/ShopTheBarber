import { MetaTags } from '@/components/seo/MetaTags';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Scissors } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function ServicesPricing() {
  return (
    <div className="min-h-screen bg-background">
      <MetaTags title="Services & Pricing" description="View our services and pricing at ShopTheBarber" />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link to={createPageUrl('Home')} className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <div className="flex items-center gap-3 mb-8">
          <Scissors className="w-10 h-10 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Services & Pricing</h1>
            <p className="text-muted-foreground">Rates vary by barber and location. Book to see exact prices.</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground mb-6">
              Each barber and shop sets their own prices. To see exact service costs and availability, go to Explore, pick a barber or shop, and start a booking.
            </p>
            <Link to={createPageUrl('Explore')}>
              <span className="text-primary font-semibold hover:underline">Browse barbers and book →</span>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
