import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/lib/AuthContext';
import { useEffectiveRole } from '@/hooks/useEffectiveRole';
import { dashboardPageForRole } from '@/lib/userRole';
import { Button } from '@/components/ui/button';
import { MetaTags } from '@/components/seo/MetaTags';
import { SchemaMarkup } from '@/components/seo/SchemaMarkup';
import Hero from '../components/home/Hero';
import HomeTrustBar from '../components/home/HomeTrustBar';
import HomeQuickFind from '../components/home/HomeQuickFind';
import HomeBestBarbers from '../components/home/HomeBestBarbers';
import HomeTrustSpotlight from '../components/home/HomeTrustSpotlight';
import Features from '../components/home/Features';
import HomeRewardsStrip from '../components/home/HomeRewardsStrip';
import HomeEcosystemStrip from '../components/home/HomeEcosystemStrip';
import HomeOffers from '../components/home/HomeOffers';
import HomeMarketplacePreview from '../components/home/HomeMarketplacePreview';
import Testimonials from '../components/home/Testimonials';
import HomeFinalCta from '../components/home/HomeFinalCta';
import { siteOrigin } from '@/lib/seoUtils';
import { cn } from '@/lib/utils';
import { stb } from '@/lib/stbUi';

function AuthenticatedHomeQuickStart() {
  const { effectiveRole } = useEffectiveRole();
  const dashboardPage = dashboardPageForRole(effectiveRole);
  const dashboardLabel = dashboardPage === 'GlobalFinancials' ? 'Admin' : 'Dashboard';

  return (
    <section className="py-10 bg-background border-b border-foreground/10">
      <div className="container mx-auto px-6 max-w-6xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className={cn(stb.overline, 'mb-1')}>Welcome back</p>
          <h2 className={cn(stb.uiHeading, 'text-xl')}>Ready for your next appointment?</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild className={stb.btn}>
            <Link to={createPageUrl('Explore')}>Book a barber</Link>
          </Button>
          <Button asChild variant="outline" className="bg-card/80">
            <Link to={createPageUrl(dashboardPage)}>{dashboardLabel}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex flex-col">
      <MetaTags
        title="Book Barbers Near You"
        description="Book verified barbers in minutes. Season rankings, digital gift cards, protected payments, upfront pricing, and real reviews on ShopTheBarber."
        keywords="barber booking, barbershop near me, mobile barber, men's grooming"
        canonicalUrl={`${siteOrigin()}/`}
      />
      <SchemaMarkup
        type="WebSite"
        data={{
          name: 'ShopTheBarber',
          url: window.location.origin,
          potentialAction: {
            '@type': 'SearchAction',
            target: `${window.location.origin}/Explore?q={search_term_string}`,
            'query-input': 'required name=search_term_string',
          },
        }}
      />

      <Hero />
      <HomeTrustBar />

      {isAuthenticated && <AuthenticatedHomeQuickStart />}

      <HomeQuickFind />
      <HomeBestBarbers />
      <HomeTrustSpotlight />
      <Features />
      <HomeRewardsStrip />
      <HomeEcosystemStrip />
      <HomeOffers />
      <HomeMarketplacePreview />
      <Testimonials />
      <HomeFinalCta />
    </div>
  );
}
