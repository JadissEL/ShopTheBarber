import { Link } from 'react-router-dom';

import { MetaTags } from '@/components/seo/MetaTags';

import { Button } from '@/components/ui/button';

import { Card, CardContent } from '@/components/ui/card';

import { ArrowLeft, Check } from 'lucide-react';

import { createPageUrl } from '@/utils';

import PageHeader from '@/components/layout/PageHeader';

import PageContent from '@/components/layout/PageContent';

import { cn } from '@/lib/utils';

import { stb } from '@/lib/stbUi';



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

    <div className="stb-page min-h-screen bg-background">

      <MetaTags title={title} description={description} canonicalUrl={canonicalPath} />



      <div className="border-b border-foreground/10 bg-muted/30">

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



      <PageHeader
        label={badge}
        title={headline}
        subtitle={subhead}
      >

        <div className="w-20 h-20 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">

          {icon}

        </div>

      </PageHeader>



      <PageContent className="py-8">

        <div className="flex flex-wrap gap-3">

          <Button asChild size="lg">

            <Link to={ctaHref}>{ctaLabel}</Link>

          </Button>

          {secondaryHref && (

            <Button asChild variant="outline" size="lg">

              <Link to={secondaryHref}>{secondaryLabel}</Link>

            </Button>

          )}

        </div>

      </PageContent>



      <section className="bg-muted/40 border-y border-foreground/10 py-16 stb-marketing-prose">

        <PageContent>

          <h2 className={cn(stb.uiHeading, 'text-2xl mb-6')}>Sound familiar?</h2>

          <ul className="grid md:grid-cols-2 gap-3">

            {pains.map((pain) => (

              <li key={pain} className="flex gap-3 text-muted-foreground text-sm leading-relaxed font-sans normal-case">

                <span className="text-primary shrink-0 mt-0.5">•</span>

                {pain}

              </li>

            ))}

          </ul>

        </PageContent>

      </section>



      <PageContent className="py-16">

        <h2 className={cn(stb.uiHeading, 'text-2xl mb-8')}>Built for how you work</h2>

        <div className="grid md:grid-cols-3 gap-6">

          {wins.map((w) => (

            <Card key={w.title} className={cn(stb.surfaceHover, 'border-foreground/10')}>

              <CardContent className="p-6 space-y-2">

                <Check className="w-5 h-5 text-primary" />

                <h3 className={cn(stb.uiHeading, 'text-base')}>{w.title}</h3>

                <p className="text-sm text-muted-foreground leading-relaxed">{w.body}</p>

              </CardContent>

            </Card>

          ))}

        </div>

      </PageContent>

    </div>

  );

}

