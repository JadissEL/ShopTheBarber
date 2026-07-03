import { Link } from 'react-router-dom';

import { createPageUrl } from '@/utils';

import { DISCOVERY_ROUTES } from '@/lib/discoveryRoutes';

import { Button } from '@/components/ui/button';

import { ArrowRight, Scissors } from 'lucide-react';

import { cn } from '@/lib/utils';

import { stb } from '@/lib/stbUi';



export default function HomeFinalCta() {

  return (

    <section className="py-24 md:py-32 relative overflow-hidden stb-section-dark border-t border-white/10">

      <div className="container mx-auto px-6 max-w-4xl text-center relative text-white">

        <div className={cn(stb.iconBox, 'inline-flex items-center justify-center w-16 h-16 mb-6 mx-auto bg-primary text-primary-foreground border-white/20')}>

          <Scissors className="w-8 h-8 -rotate-45" />

        </div>

        <h2 className={cn(stb.heading, 'text-white mb-4')}>

          Your next great cut is{' '}

          <span className="text-primary">one tap away.</span>

        </h2>

        <p className="text-lg text-white/70 mb-10 max-w-xl mx-auto leading-relaxed font-sans normal-case">

          Pick a barber, lock your time, and walk in confident — or have a pro come to you.

        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">

          <Button asChild size="lg" className="h-12 px-8">

            <Link to={createPageUrl(DISCOVERY_ROUTES.explore)}>

              Book a barber

              <ArrowRight className="w-4 h-4 ml-1" />

            </Link>

          </Button>

          <Button asChild variant="outline" size="lg" className="h-12 px-8 border-white/30 !bg-transparent text-white hover:bg-white/10 hover:text-white">

            <Link to={createPageUrl(DISCOVERY_ROUTES.mobile)}>Mobile barbers</Link>

          </Button>

          <Button asChild variant="ghost" size="lg" className="h-12 px-8 text-white/70 hover:text-white hover:bg-white/10 normal-case tracking-normal font-medium">

            <Link to={createPageUrl('SelectProviderType')}>List your chair</Link>

          </Button>

        </div>

      </div>

    </section>

  );

}

