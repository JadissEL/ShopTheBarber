import { Link } from 'react-router-dom';
import { MetaTags } from '@/components/seo/MetaTags';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createPageUrl } from '@/utils';
import { ArrowLeft, MapPin, Users, Calendar, CheckCircle2 } from 'lucide-react';

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

      <div className="border-b border-border bg-muted/30">
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

      <section className="max-w-4xl mx-auto px-4 py-16 md:py-20">
        <Badge className="mb-4">P1, Pilot program</Badge>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          One city. Real shops. Prove it before we scale.
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
          National marketing comes after density, not before. We are recruiting{' '}
          <strong className="text-foreground">5-10 barbershops and solo barbers in a single city</strong>{' '}
          to validate direct booking, no-show recovery, and flat pricing in the wild.
        </p>
        <div className="flex flex-wrap gap-3 mt-8">
          <Button asChild size="lg" className="rounded-xl">
            <a href={applyHref}>Apply for pilot</a>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-xl">
            <Link to={createPageUrl('SelectProviderType')}>Start self-serve setup</Link>
          </Button>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 pb-16 grid md:grid-cols-3 gap-4">
        {[
          { icon: MapPin, label: '1 city', sub: 'Depth over spray' },
          { icon: Users, label: '5-10 providers', sub: 'Mix of shops + solos' },
          { icon: Calendar, label: '90 days', sub: 'Measured rollout' },
        ].map(({ icon: Icon, label, sub }) => (
          <Card key={label}>
            <CardContent className="p-6 text-center">
              <Icon className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="font-bold text-lg">{label}</p>
              <p className="text-sm text-muted-foreground">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="bg-muted/40 border-y border-border py-16">
        <div className="max-w-4xl mx-auto px-4 grid md:grid-cols-2 gap-10">
          <div>
            <h2 className="text-xl font-bold mb-4">Who we accept</h2>
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
            <h2 className="text-xl font-bold mb-4">What you get</h2>
            <ul className="space-y-3">
              {PILOT_PERKS.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-16 text-sm text-muted-foreground">
        <p>
          Internal playbook for founders: <code className="text-xs bg-muted px-1 py-0.5 rounded">docs/PILOT_PROGRAM.md</code>{' '}
          in the repo. Questions?{' '}
          <a href="mailto:hello@shopthebarber.com" className="text-primary hover:underline">
            hello@shopthebarber.com
          </a>
        </p>
      </section>
    </div>
  );
}
