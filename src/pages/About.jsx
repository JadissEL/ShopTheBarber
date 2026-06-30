import { MetaTags } from '@/components/seo/MetaTags';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import PageContent from '@/components/layout/PageContent';
import { stb } from '@/lib/stbUi';
import { cn } from '@/lib/utils';

export default function About() {
  return (
    <div className={stb.page}>
      <MetaTags
        title="About Us"
        description="ShopTheBarber connects world-class grooming professionals with clients who value quality, convenience, and style. Learn about our mission and how we're redefining barbershop booking."
      />

      <PageHeader
        tier="app"
        variant="light"
        title="About ShopTheBarber"
        subtitle="Connecting world-class grooming professionals with clients who value quality, convenience, and style."
      />

      <PageContent narrow>
        <Link to={createPageUrl('Home')} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 font-medium">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <section className="space-y-8 mb-12 stb-marketing-prose">
          <div>
            <h2 className={cn(stb.uiHeading, 'text-2xl mb-3')}>Our Mission</h2>
            <p className={stb.body}>
              ShopTheBarber makes it easy to discover and book the best barbers and grooming professionals in your area. We believe every client deserves a premium experience, real-time availability, instant confirmation, verified reviews, and secure payments, so you can focus on looking your best.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className={cn(stb.panel, 'text-center p-6')}>
              <div className={cn(stb.iconBox, 'mx-auto mb-4')}>
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <h3 className={cn(stb.uiHeading, 'text-lg mb-2')}>Seamless Booking</h3>
              <p className={stb.body}>Book in seconds with real-time availability and instant confirmation.</p>
            </div>

            <div className={cn(stb.panel, 'text-center p-6')}>
              <div className={cn(stb.iconBox, 'mx-auto mb-4')}>
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <h3 className={cn(stb.uiHeading, 'text-lg mb-2')}>Verified Professionals</h3>
              <p className={stb.body}>Every barber is vetted with reviews, credentials, and portfolio work.</p>
            </div>

            <div className={cn(stb.panel, 'text-center p-6')}>
              <div className={cn(stb.iconBox, 'mx-auto mb-4')}>
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className={cn(stb.uiHeading, 'text-lg mb-2')}>Secure Payments</h3>
              <p className={stb.body}>Pay safely with encrypted transactions and transparent pricing.</p>
            </div>
          </div>
        </section>
      </PageContent>
    </div>
  );
}
