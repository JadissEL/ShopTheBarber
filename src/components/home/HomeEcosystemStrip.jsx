import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Briefcase, PenLine, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { stb } from '@/lib/stbUi';
import { isFeatureEnabled } from '@/lib/featureRegistry';

const ECOSYSTEM_CARDS = [
  {
    id: 'jobs',
    feature: 'careers',
    icon: Briefcase,
    title: 'Find a job in the beauty & styling ecosystem',
    description:
      'Discover roles at barbershops, salons, brands, and creative studios — from artistry and grooming to operations and branding.',
    href: 'CareerHub',
    cta: 'Browse jobs',
  },
  {
    id: 'blog',
    feature: 'content',
    icon: PenLine,
    title: 'Beauty & styling bloggers & journalists',
    description:
      'Publish your articles here. Create your account to share trends, tutorials, and industry insight with our community.',
    href: 'SignUp?redirect=/BlogArticleEditor',
    cta: 'Create your account',
    secondaryHref: 'Blog',
    secondaryCta: 'Read the blog',
  },
];

function EcosystemCard({ item }) {
  return (
    <article className={cn(stb.surfaceHover, 'flex flex-col sm:flex-row sm:items-start gap-4 p-6 md:p-8 h-full')}>
      <div className={cn(stb.iconBox, 'w-12 h-12 shrink-0')}>
        <item.icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0 flex flex-col h-full">
        <h3 className={cn(stb.uiHeading, 'text-lg md:text-xl mb-2')}>{item.title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed flex-1">{item.description}</p>
        <div className="flex flex-wrap items-center gap-2 mt-5">
          <Button asChild size="sm" className="h-10 px-5">
            <Link to={createPageUrl(item.href)}>
              {item.cta}
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </Button>
          {item.secondaryHref && (
            <Button asChild variant="outline" size="sm" className="h-10 px-5 bg-card/80">
              <Link to={createPageUrl(item.secondaryHref)}>{item.secondaryCta}</Link>
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

export default function HomeEcosystemStrip() {
  const cards = ECOSYSTEM_CARDS.filter((card) => isFeatureEnabled(card.feature));

  if (cards.length === 0) return null;

  return (
    <section className="py-16 md:py-20 bg-muted/30 border-y border-foreground/10">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        <div className="text-center mb-10 max-w-2xl mx-auto">
          <p className={stb.label}>Beyond the chair</p>
          <h2 className={cn(stb.heading, 'text-2xl md:text-3xl mb-2')}>
            Grow in the{' '}
            <span className="text-primary">beauty & styling ecosystem</span>
          </h2>
          <p className="text-muted-foreground">
            Find your next role or publish the stories that move the industry forward.
          </p>
        </div>

        <div
          className={cn(
            'grid gap-5',
            cards.length === 2 ? 'md:grid-cols-2' : 'max-w-xl mx-auto',
          )}
        >
          {cards.map((item) => (
            <EcosystemCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
