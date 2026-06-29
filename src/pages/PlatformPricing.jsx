import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MetaTags } from '@/components/seo/MetaTags';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RoiCalculator } from '@/components/gtm/RoiCalculator';
import {
  DIRECT_BOOKING_COMMISSION,
  DISCOVERY_FEE_STATUS,
  fetchPublicPricingConfig,
  formatMoney,
  GTM_PRICING_DEFAULTS,
  mergePricingConfig,
} from '@/lib/gtmPricing';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Check, Scissors, Store, Sparkles } from 'lucide-react';

function PricingTier({ title, price, period, subtitle, features, ctaHref, ctaLabel, highlighted }) {
  return (
    <Card
      className={`relative flex flex-col h-full ${highlighted ? 'border-primary shadow-lg ring-1 ring-primary/20' : 'border-border'}`}
    >
      {highlighted && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">Most popular</Badge>
      )}
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
        <div className="pt-4">
          <span className="text-4xl font-bold tracking-tight">{price}</span>
          <span className="text-muted-foreground text-sm">{period}</span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 gap-6">
        <ul className="space-y-3 text-sm flex-1">
          {features.map((f) => (
            <li key={f} className="flex gap-2 text-muted-foreground">
              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              {f}
            </li>
          ))}
        </ul>
        <Button asChild className="w-full rounded-xl" variant={highlighted ? 'default' : 'outline'}>
          <Link to={ctaHref}>{ctaLabel}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function PlatformPricing() {
  const { data: apiConfig } = useQuery({
    queryKey: ['fixed-fee-config-public'],
    queryFn: () => fetchPublicPricingConfig('/api'),
    staleTime: 60_000,
  });

  const pricing = mergePricingConfig(apiConfig);
  const currency = pricing.currency;

  const barberSignUp = `${createPageUrl('SignUp')}?type=barber`;
  const shopSignUp = `${createPageUrl('SignUp')}?type=shop`;

  return (
    <div className="stb-page">
      <MetaTags
        title="Pricing for Barbers & Shops"
        description="Flat monthly fee per chair or location. 0% commission on direct bookings. Optional discovery fee coming later, no marketplace tax on your regulars."
        canonicalUrl="/pricing"
      />

      <div className="border-b border-border bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <Link
            to={createPageUrl('Home')}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Home
          </Link>
          <Link to="/pilot" className="text-sm text-primary font-medium hover:underline">
            Join the city pilot
          </Link>
        </div>
      </div>

      <section className="max-w-5xl mx-auto px-4 py-16 md:py-20 text-center">
        <Badge variant="secondary" className="mb-4">
          Provider pricing
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Flat fee. Zero commission on your clients.
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Pay a predictable monthly rate per chair or location, not a cut of every haircut. Direct
          bookings from your link, returning clients, and guest checkout stay at{' '}
          <strong className="text-foreground">{DIRECT_BOOKING_COMMISSION}%</strong> platform
          commission. Discovery from our marketplace may carry an optional fee later; we will never
          surprise you.
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-4 pb-12">
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <PricingTier
            title="Solo barber"
            subtitle="One chair, your brand"
            price={formatMoney(pricing.monthly_fee_barber, currency)}
            period="/month per chair"
            highlighted
            ctaHref={barberSignUp}
            ctaLabel="Start as barber"
            features={[
              '0% commission on direct & guest bookings',
              'Online booking, reminders & card on file',
              'Stripe payouts to you',
              'Showcase profile & reviews',
              `Optional annual plan (${pricing.annual_discount_percent}% off)`,
            ]}
          />
          <PricingTier
            title="Shop location"
            subtitle="Team, chairs & one address"
            price={formatMoney(pricing.monthly_fee_shop, currency)}
            period="/month per location"
            ctaHref={shopSignUp}
            ctaLabel="Register your shop"
            features={[
              'Covers your shop listing + owner tools',
              `+${formatMoney(pricing.extra_chair_fee, currency)}/mo per extra chair (pilot pricing)`,
              'Staff roster, schedules & shop analytics',
              '0% commission on direct shop bookings',
              'Marketplace product shelf for retail add-ons',
            ]}
          />
        </div>
        <p className="text-center text-xs text-muted-foreground mt-6 max-w-xl mx-auto">
          Amounts sync from live config when the API is available. Consumer service prices are set by
          each barber, see{' '}
          <Link to={createPageUrl('ServicesPricing')} className="text-primary hover:underline">
            client service rates
          </Link>
          .
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Direct vs discovery</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-3 pr-4 font-medium">Booking source</th>
                  <th className="py-3 pr-4 font-medium">Platform fee</th>
                  <th className="py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b border-border">
                  <td className="py-3 pr-4 text-foreground">Your link, QR, Instagram bio</td>
                  <td className="py-3 pr-4 font-semibold text-emerald-700">
                    {DIRECT_BOOKING_COMMISSION}% commission
                  </td>
                  <td className="py-3">
                    <Badge variant="outline" className="text-emerald-700 border-emerald-200">
                      Live
                    </Badge>
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 pr-4 text-foreground">Returning client rebooks you</td>
                  <td className="py-3 pr-4 font-semibold text-emerald-700">
                    {DIRECT_BOOKING_COMMISSION}% commission
                  </td>
                  <td className="py-3">
                    <Badge variant="outline" className="text-emerald-700 border-emerald-200">
                      Live
                    </Badge>
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 pr-4 text-foreground">Guest book (no account friction)</td>
                  <td className="py-3 pr-4 font-semibold text-emerald-700">
                    {DIRECT_BOOKING_COMMISSION}% commission
                  </td>
                  <td className="py-3">
                    <Badge variant="outline" className="text-emerald-700 border-emerald-200">
                      Live
                    </Badge>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 text-foreground">New client from Explore / marketplace</td>
                  <td className="py-3 pr-4">Optional discovery fee</td>
                  <td className="py-3">
                    <Badge variant="secondary">
                      {DISCOVERY_FEE_STATUS === 'planned' ? 'Planned, opt-in later' : 'Live'}
                    </Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-8">
        <RoiCalculator monthlyFee={pricing.monthly_fee_barber} currency={currency} />
      </section>

      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold mb-6">Who is this for?</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              icon: Scissors,
              title: 'Solo barbers',
              href: '/for-barbers',
              blurb: 'Own your chair, calendar, and payouts.',
            },
            {
              icon: Store,
              title: 'Shop owners',
              href: '/for-shops',
              blurb: 'Run the floor, team, and location in one place.',
            },
            {
              icon: Sparkles,
              title: 'Network admins',
              href: '/for-networks',
              blurb: 'Multi-location ops, promos, and financial roll-ups.',
            },
          ].map(({ icon: Icon, title, href, blurb }) => (
            <Link
              key={href}
              to={href}
              className="rounded-xl border border-border p-5 hover:border-primary/40 hover:bg-muted/30 transition-colors block"
            >
              <Icon className="w-6 h-6 text-primary mb-3" />
              <p className="font-semibold text-foreground">{title}</p>
              <p className="text-sm text-muted-foreground mt-1">{blurb}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-primary text-primary-foreground py-16">
        <div className="max-w-3xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl font-bold">Ready to own your bookings?</h2>
          <p className="opacity-90">
            Join the pilot in your city or start setup today, flat pricing, no commission on your
            regulars.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" variant="secondary" className="rounded-xl">
              <Link to="/pilot">Apply for pilot</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-xl bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Link to={createPageUrl('SelectProviderType')}>Choose provider type</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
