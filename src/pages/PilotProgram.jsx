import { Link } from 'react-router-dom';
import { MetaTags } from '@/components/seo/MetaTags';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { createPageUrl } from '@/utils';
import { ArrowLeft, MapPin, Users, Calendar, CheckCircle2 } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import PageContent from '@/components/layout/PageContent';
import { cn } from '@/lib/utils';
import { stb } from '@/lib/stbUi';

const PILOT_CRITERIA = [
  '5-10 shops or solo barbers in one city',
  'Willing to run direct booking links for 90 days',
  'At least one shop owner + 2 independent barbers',
  'Feedback call every two weeks during pilot',
];

const PILOT_PERKS = [
  'Founding-city badge on Explore',
  'Locked pilot pricing for 12 months',
  'White-glove onboarding & setup guide',
  'Priority support channel',
];

export default function PilotProgram() {
  const mailSubject = encodeURIComponent('ShopTheBarber city pilot application');
  const mailBody = encodeURIComponent(
    'Shop name / barber name:\nCity:\nChairs:\nWhy you want in:\n',
  );
  const applyHref = `mailto:hello@shopthebarber.com?subject=${mailSubject}&body=${mailBody}`;

  return (
    <div className="stb-page">
      <MetaTags
        title="City Pilot Program"
        description="ShopTheBarber pilot: 5-10 real shops in one city before national marketing. Founding pricing, onboarding support, and product influence."
        canonicalUrl="/pilot"
      />

      <div className="border-b border-foreground/10 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Pricing
          </Link>
        </div>
      </div>

      <PageHeader
        label="P1, Pilot program"
        title="One city. Real shops. Prove it before we scale."
        subtitle="National marketing comes after density, not before. We are recruiting 5-10 barbershops and solo barbers in a single city to validate direct booking, no-show recovery, and flat pricing in the wild."
      />

      <PageContent narrow className="py-8">
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <a href={applyHref}>Apply for pilot</a>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to={createPageUrl('SelectProviderType')}>Start self-serve setup</Link>
          </Button>
        </div>
      </PageContent>

      <PageContent narrow className="pb-16 grid md:grid-cols-3 gap-4">
        {[
          { icon: MapPin, label: '1 city', sub: 'Depth over spray' },
          { icon: Users, label: '5-10 providers', sub: 'Mix of shops + solos' },
          { icon: Calendar, label: '90 days', sub: 'Measured rollout' },
        ].map(({ icon: Icon, label, sub }) => (
          <Card key={label} className={cn(stb.surface, 'border-foreground/10')}>
            <CardContent className="p-6 text-center">
              <Icon className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="font-bold text-lg">{label}</p>
              <p className="text-sm text-muted-foreground">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </PageContent>

      <section className="bg-muted/40 border-y border-foreground/10 py-16">
        <PageContent narrow>
          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <h2 className={cn(stb.uiHeading, 'text-xl mb-4')}>Who we accept</h2>
            <ul className="space-y-3">
              {PILOT_CRITERIA.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className={cn(stb.uiHeading, 'text-xl mb-4')}>What you get</h2>
            <ul className="space-y-3">
              {PILOT_PERKS.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          </div>
        </PageContent>
      </section>

      <PageContent narrow className="py-16 text-sm text-muted-foreground">
        <p>
          Internal playbook for founders: <code className="text-xs bg-muted px-1 py-0.5 rounded">docs/PILOT_PROGRAM.md</code>{' '}
          in the repo. Questions?{' '}
          <a href="mailto:hello@shopthebarber.com" className="text-primary hover:underline">
            hello@shopthebarber.com
          </a>
        </p>
      </PageContent>
    </div>
  );
}
