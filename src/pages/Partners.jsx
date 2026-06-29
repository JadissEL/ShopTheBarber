import { Link } from 'react-router-dom';
import { MetaTags } from '@/components/seo/MetaTags';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createPageUrl } from '@/utils';
import { ArrowLeft, GraduationCap, Package, Handshake } from 'lucide-react';

const PARTNER_TYPES = [
  {
    icon: GraduationCap,
    title: 'Barber schools & academies',
    body: 'Graduate placement, student booking labs, and shop owner pipelines. Co-branded onboarding for your cohort.',
    examples: 'Academy chains, vocational programs, masterclass tours',
  },
  {
    icon: Package,
    title: 'Product brands',
    body: 'Sell through provider marketplace shelves, pomades, clippers, aftercare, with rev-share on fulfilled orders.',
    examples: 'Men\'s grooming lines, clipper manufacturers, retail distributors',
  },
  {
    icon: Handshake,
    title: 'Local business networks',
    body: 'Chambers, franchise consultants, and equipment financiers who introduce shops into the pilot city.',
    examples: 'City business associations, booth rental hubs',
  },
];

export default function Partners() {
  const mailSubject = encodeURIComponent('ShopTheBarber partner inquiry');
  const mailBody = encodeURIComponent(
    'Organization:\nPartner type (school / brand / network):\nCity/market:\nProposal:\n',
  );
  const partnerHref = `mailto:hello@shopthebarber.com?subject=${mailSubject}&body=${mailBody}`;

  return (
    <div className="stb-page">
      <MetaTags
        title="Partner With Us"
        description="Partner channel for barber schools, product brands, and local networks, tied to ShopTheBarber marketplace and city pilots."
        canonicalUrl="/partners"
      />

      <div className="border-b border-border bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link
            to={createPageUrl('Home')}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Home
          </Link>
        </div>
      </div>

      <section className="max-w-4xl mx-auto px-4 py-16 md:py-20">
        <Badge variant="secondary" className="mb-4">
          P2, Partner channel
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Grow the ecosystem, not just the app.
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
          Schools feed talent. Brands feed retail. Networks feed shops. ShopTheBarber connects all
          three to live booking and marketplace rails, starting in pilot cities before national
          expansion.
        </p>
        <Button asChild size="lg" className="rounded-xl mt-8">
          <a href={partnerHref}>Become a partner</a>
        </Button>
      </section>

      <section className="max-w-4xl mx-auto px-4 pb-16 space-y-6">
        {PARTNER_TYPES.map(({ icon: Icon, title, body, examples }) => (
          <Card key={title}>
            <CardContent className="p-6 md:flex gap-6 items-start">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mb-4 md:mb-0">
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2">{title}</h2>
                <p className="text-muted-foreground text-sm leading-relaxed mb-2">{body}</p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Examples:</span> {examples}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="max-w-4xl mx-auto px-4 pb-20">
        <Card className="bg-muted/50">
          <CardContent className="p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="font-semibold">Marketplace tie-in</p>
              <p className="text-sm text-muted-foreground mt-1">
                Brands list SKUs; providers attach products to their shelf; clients buy at booking
                or checkout.
              </p>
            </div>
            <Button asChild variant="outline" className="rounded-xl shrink-0">
              <Link to={createPageUrl('Marketplace')}>Browse marketplace</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
