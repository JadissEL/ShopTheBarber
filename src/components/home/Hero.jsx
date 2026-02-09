import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowRight, Package as PackageIcon, User as UserIcon, Smile as SmileIcon, Calendar } from 'lucide-react';

export default function Hero() {
  return (
    <div className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.06),_transparent_50%)]" />

      <div className="relative z-10 container mx-auto px-6 text-center max-w-4xl">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-8">
          <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
          Trusted by top grooming professionals
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 tracking-tight leading-[1.1]">
          Book barbers. <br />
          <span className="text-primary">Shop products.</span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl mx-auto">
          Discover and book the finest barbers, buy premium grooming products, and explore career opportunities—all in one place.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            to={createPageUrl('Explore')}
            className="inline-flex items-center justify-center h-14 px-8 text-base font-semibold rounded-xl bg-primary text-primary-foreground hover:opacity-95 transition-opacity shadow-lg shadow-primary/20 no-underline gap-2"
          >
            Book appointment <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to={createPageUrl('Marketplace')}
            className="inline-flex items-center justify-center h-14 px-8 text-base font-semibold rounded-xl border-2 border-border bg-card text-foreground hover:bg-muted transition-colors no-underline"
          >
            Marketplace
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Verified reviews', sub: '5.0 rating', icon: SmileIcon, link: null },
            { label: 'Instant confirm', sub: '24/7 booking', icon: Calendar, link: null },
            { label: 'Premium products', sub: 'Top brands', icon: PackageIcon, link: 'Marketplace' },
            { label: 'Elite stylists', sub: 'Expert barbers', icon: UserIcon, link: 'Explore' }
          ].map((stat, i) => {
            const card = (
              <>
                <stat.icon className="w-6 h-6 text-primary mb-2" />
                <div className="font-semibold text-foreground">{stat.label}</div>
                <div className="text-xs text-muted-foreground">{stat.sub}</div>
              </>
            );
            const className = "bg-card p-4 rounded-xl border border-border hover:border-primary/30 transition-colors group";
            return stat.link ? (
              <Link key={i} to={createPageUrl(stat.link)} className={`${className} block no-underline text-inherit`}>{card}</Link>
            ) : (
              <div key={i} className={className}>{card}</div>
            );
          })}
        </div>
      </div>
    </div>
  );
}