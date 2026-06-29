import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { DISCOVERY_ROUTES } from '@/lib/discoveryRoutes';
import { Button } from '@/components/ui/button';
import { ArrowRight, Scissors } from 'lucide-react';

export default function HomeFinalCta() {
  return (
    <section className="py-24 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-[hsl(var(--navy))]" aria-hidden />
      <div className="absolute inset-0 stb-mesh-bg opacity-80 pointer-events-none" aria-hidden />
      <div className="container mx-auto px-6 max-w-4xl text-center relative text-white">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 text-primary mb-6 ring-4 ring-primary/15 stb-animate-float">
          <Scissors className="w-8 h-8 -rotate-45" />
        </div>
        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 leading-[1.05]">
          Your next great cut is{' '}
          <span className="stb-text-gradient-light">one tap away.</span>
        </h2>
        <p className="text-lg text-white/70 mb-10 max-w-xl mx-auto leading-relaxed">
          Pick a barber, lock your time, and walk in confident — or have a pro come to you.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg" className="h-12 px-8 stb-btn-glow">
            <Link to={createPageUrl(DISCOVERY_ROUTES.explore)}>
              Book a barber
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-12 px-8 rounded-xl font-semibold border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white">
            <Link to={createPageUrl(DISCOVERY_ROUTES.mobile)}>Mobile barbers</Link>
          </Button>
          <Button asChild variant="ghost" size="lg" className="h-12 px-8 rounded-xl font-semibold text-white/70 hover:text-white hover:bg-white/10">
            <Link to={createPageUrl('SelectProviderType')}>List your chair</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
