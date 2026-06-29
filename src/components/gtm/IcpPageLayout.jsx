import { Link } from 'react-router-dom';
import { MetaTags } from '@/components/seo/MetaTags';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Check } from 'lucide-react';
import { createPageUrl } from '@/utils';

/**
 * @param {{
 *   title: string;
 *   description: string;
 *   canonicalPath: string;
 *   badge?: string;
 *   headline: string;
 *   subhead: string;
 *   pains: string[];
 *   wins: { title: string; body: string }[];
 *   ctaLabel: string;
 *   ctaHref: string;
 *   secondaryHref?: string;
 *   secondaryLabel?: string;
 *   icon: React.ReactNode;
 * }} props
 */
export function IcpPageLayout({
  title,
  description,
  canonicalPath,
  badge,
  headline,
  subhead,
  pains,
  wins,
  ctaLabel,
  ctaHref,
  secondaryHref,
  secondaryLabel = 'See pricing',
  icon,
}) {
  return (
    <div className="min-h-screen bg-background">
      <MetaTags title={title} description={description} canonicalUrl={canonicalPath} />

      <div className="border-b border-border bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <Link
            to={createPageUrl('Home')}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Home
          </Link>
        </div>
      </div>

      <section className="max-w-5xl mx-auto px-4 py-16 md:py-20">
        <div className="flex flex-col md:flex-row md:items-start gap-10">
          <div className="md:w-2/3 space-y-6">
            {badge && (
              <span className="inline-block text-xs font-semibold uppercase tracking-wide text-primary bg-primary/10 px-3 py-1 rounded-full">
                {badge}
              </span>
            )}
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">{headline}</h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">{subhead}</p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild size="lg" className="rounded-xl">
                <Link to={ctaHref}>{ctaLabel}</Link>
              </Button>
              {secondaryHref && (
                <Button asChild variant="outline" size="lg" className="rounded-xl">
                  <Link to={secondaryHref}>{secondaryLabel}</Link>
                </Button>
              )}
            </div>
          </div>
          <div className="md:w-1/3 flex justify-center md:justify-end">
            <div className="w-24 h-24 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              {icon}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-muted/40 border-y border-border py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">Sound familiar?</h2>
          <ul className="grid md:grid-cols-2 gap-3">
            {pains.map((pain) => (
              <li key={pain} className="flex gap-3 text-muted-foreground text-sm leading-relaxed">
                <span className="text-primary shrink-0 mt-0.5">•</span>
                {pain}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold mb-8">Built for how you work</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {wins.map((w) => (
            <Card key={w.title} className="border shadow-sm">
              <CardContent className="p-6 space-y-2">
                <Check className="w-5 h-5 text-emerald-600" />
                <h3 className="font-semibold text-foreground">{w.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{w.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
