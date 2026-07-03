import { Link } from 'react-router-dom';

import { MetaTags } from '@/components/seo/MetaTags';

import { Button } from '@/components/ui/button';

import { Card, CardContent } from '@/components/ui/card';

import { createPageUrl } from '@/utils';

import { ArrowLeft, GraduationCap, Package, Handshake } from 'lucide-react';

import PageHeader from '@/components/layout/PageHeader';

import PageContent from '@/components/layout/PageContent';

import { cn } from '@/lib/utils';

import { stb } from '@/lib/stbUi';



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

    <div className="stb-page pb-16">

      <MetaTags

        title="Partner With Us"

        description="Partner channel for barber schools, product brands, and local networks, tied to ShopTheBarber marketplace and city pilots."

        canonicalUrl="/partners"

      />



      <div className="border-b border-foreground/10 bg-muted/30">

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



      <PageHeader

        label="P2, Partner channel"

        title="Grow the ecosystem, not just the app."

        subtitle="Schools feed talent. Brands feed retail. Networks feed shops. ShopTheBarber connects all three to live booking and marketplace rails, starting in pilot cities before national expansion."

      />



      <PageContent narrow className="py-8">

        <Button asChild size="lg">

          <a href={partnerHref}>Become a partner</a>

        </Button>

      </PageContent>



      <PageContent narrow className="pb-16 space-y-6">

        {PARTNER_TYPES.map(({ icon: Icon, title, body, examples }) => (

          <Card key={title} className={cn(stb.surfaceHover, 'border-foreground/10')}>

            <CardContent className="p-6 md:flex gap-6 items-start">

              <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mb-4 md:mb-0">

                <Icon className="w-6 h-6" />

              </div>

              <div>

                <h2 className={cn(stb.uiHeading, 'text-xl mb-2')}>{title}</h2>

                <p className="text-muted-foreground text-sm leading-relaxed mb-2">{body}</p>

                <p className="text-xs text-muted-foreground">

                  <span className="font-medium text-foreground">Examples:</span> {examples}

                </p>

              </div>

            </CardContent>

          </Card>

        ))}

      </PageContent>



      <PageContent narrow className="pb-20">

        <Card className={cn(stb.surface, 'bg-muted/50 border-foreground/10')}>

          <CardContent className="p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            <div>

              <p className={cn(stb.uiHeading, 'text-base')}>Marketplace tie-in</p>

              <p className="text-sm text-muted-foreground mt-1">

                Brands list SKUs; providers attach products to their shelf; clients buy at booking

                or checkout.

              </p>

            </div>

            <Button asChild variant="outline" className="shrink-0">

              <Link to={createPageUrl('Marketplace')}>Browse marketplace</Link>

            </Button>

          </CardContent>

        </Card>

      </PageContent>

    </div>

  );

}

