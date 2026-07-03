import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { DISCOVERY_ROUTES } from '@/lib/discoveryRoutes';
import { ArrowRight, Search, MapPin, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useHomepage } from '@/hooks/useHomepage';
import { cn } from '@/lib/utils';
import { stb } from '@/lib/stbUi';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1600&auto=format&fit=crop&q=80';

function formatCount(n) {
  const num = Number(n) || 0;
  if (num >= 1000) return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}k+`;
  return num > 0 ? `${num}+` : null;
}

export default function Hero() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState('shop');
  const { data } = useHomepage();
  const stats = data?.stats;

  const handleSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    const base = mode === 'mobile' ? DISCOVERY_ROUTES.mobile : 'Explore';
    const path = createPageUrl(base);
    navigate(q ? `${path}?q=${encodeURIComponent(q)}` : path);
  };

  const barberCount = formatCount(stats?.barber_count);
  const reviewHint = stats?.avg_rating
    ? `${Number(stats.avg_rating).toFixed(1)} avg rating`
    : 'Verified reviews';

  return (
    <>
      <section className="relative min-h-[min(72vh,680px)] flex items-end overflow-hidden">
        <img
          src={HERO_IMAGE}
          alt="Barber giving a precision fade"
          className="absolute inset-0 w-full h-full object-cover"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-black/40" aria-hidden />

        <div className="relative z-10 w-full container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl pb-14 md:pb-20 pt-28 md:pt-32">
          <div className="max-w-2xl">
            {barberCount && (
              <p className="inline-flex items-center gap-2 text-sm font-medium text-white/80 mb-5 stb-animate-fade-up">
                <Star className="w-4 h-4 text-primary fill-primary/40" aria-hidden />
                {barberCount} barbers · {reviewHint}
              </p>
            )}

            <h1 className={cn(stb.heading, 'text-white text-4xl sm:text-5xl md:text-6xl mb-6 stb-animate-fade-up stb-delay-1')}>
              Book elite barbers.
              <span className="block mt-2 text-primary">On your terms.</span>
            </h1>

            <p className="text-lg md:text-xl text-white/80 mb-8 max-w-xl leading-relaxed stb-animate-fade-up stb-delay-2">
              Verified pros. Upfront pricing. In the chair or at your door — one sharp platform, zero guesswork.
            </p>

            <div className="flex flex-wrap gap-3 stb-animate-fade-up stb-delay-3">
              <Button asChild size="lg" className="h-12 px-8">
                <Link to={createPageUrl('Explore')}>
                  Book a barber
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 px-8 border-white/40 !bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <Link to={createPageUrl(DISCOVERY_ROUTES.mobile)}>Mobile barbers</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-background border-b border-foreground/10 py-10 md:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <div className="text-center mb-6">
            <p className={cn(stb.label, 'mb-2')}>Quick book</p>
            <h2 className={cn(stb.uiHeading, 'text-2xl md:text-3xl')}>Find your next cut</h2>
          </div>

          <div className={cn(stb.surface, 'p-5 md:p-6')}>
            <div className="flex rounded-lg bg-muted/60 p-1 gap-0.5 mb-4 w-fit mx-auto">
              <button
                type="button"
                onClick={() => setMode('shop')}
                className={cn(
                  'px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
                  mode === 'shop' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                )}
              >
                In-shop
              </button>
              <button
                type="button"
                onClick={() => setMode('mobile')}
                className={cn(
                  'px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
                  mode === 'mobile' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                )}
              >
                Mobile
              </button>
            </div>

            <form onSubmit={handleSearch} className="space-y-3">
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                <Input
                  type="search"
                  placeholder={mode === 'mobile' ? 'Your address or city' : 'City, barber, or service'}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-12 h-12 text-base"
                  aria-label="Search barbers"
                />
              </div>
              <Button type="submit" size="lg" className="w-full h-12 gap-2">
                <Search className="w-5 h-5" aria-hidden />
                Search {mode === 'mobile' ? 'mobile barbers' : 'barbers'}
              </Button>
            </form>

            <p className="text-xs text-muted-foreground text-center mt-4">
              Free cancellation on most bookings · Secure card on file
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
