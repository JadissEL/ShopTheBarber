import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { DISCOVERY_ROUTES } from '@/lib/discoveryRoutes';
import {
  ArrowRight,
  Search,
  MapPin,
  Star,
  Trophy,
  Gift,
  ShieldCheck,
  Sparkles,
  Clock,
  Zap,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useHomepage } from '@/hooks/useHomepage';

const TRUST_PILLS = [
  { icon: Trophy, label: 'Season rankings', scroll: '#trust-ecosystem' },
  { icon: Gift, label: 'Gift cards', href: 'GiftCards' },
  { icon: ShieldCheck, label: 'Protected booking', scroll: '#trust-ecosystem' },
];

const HERO_IMAGES = [
  {
    src: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&auto=format&fit=crop',
    alt: 'Precision fade in progress',
    className: 'col-span-1 row-span-2',
  },
  {
    src: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&auto=format&fit=crop',
    alt: 'Client in chair',
    className: 'col-span-1',
  },
  {
    src: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=600&auto=format&fit=crop',
    alt: 'Modern barbershop',
    className: 'col-span-1',
  },
];

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
    <section className="relative overflow-hidden border-b border-white/10">
      {/* Cinematic navy base */}
      <div className="absolute inset-0 bg-[hsl(var(--navy))]" aria-hidden />
      <div className="absolute inset-0 stb-mesh-bg" aria-hidden />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_20%_50%,hsl(var(--primary)/0.35),transparent_55%)]" aria-hidden />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_90%_20%,hsl(var(--chart-2)/0.25),transparent_50%)]" aria-hidden />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" aria-hidden />

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 md:pt-16 md:pb-24 max-w-7xl">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-14 items-center min-h-[min(78vh,820px)]">
          {/* Copy column */}
          <div className="text-center lg:text-left order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 backdrop-blur-md px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white/90 mb-6 stb-animate-fade-up">
              <Sparkles className="w-3.5 h-3.5 text-primary" aria-hidden />
              Premium grooming marketplace
            </div>

            {barberCount && (
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-white/70 mb-5 stb-animate-fade-up stb-delay-1">
                <Star className="w-4 h-4 text-primary fill-primary/30" aria-hidden />
                {barberCount} barbers · {reviewHint}
              </p>
            )}

            <h1 className="text-4xl sm:text-5xl md:text-6xl xl:text-[4.25rem] font-extrabold tracking-tight leading-[1.02] mb-6 text-white stb-animate-fade-up stb-delay-2">
              Book elite barbers.
              <span className="block mt-1 stb-text-gradient-light">On your terms.</span>
            </h1>

            <p className="text-lg md:text-xl text-white/75 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed stb-animate-fade-up stb-delay-3">
              Verified pros. Upfront pricing. In the chair or at your door — one sharp platform, zero guesswork.
            </p>

            <div className="flex flex-wrap gap-3 justify-center lg:justify-start mb-10 stb-animate-fade-up stb-delay-4">
              <Button asChild size="lg" className="h-12 px-8 rounded-xl font-bold stb-btn-glow">
                <Link to={createPageUrl('Explore')}>
                  Book a barber
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 px-8 rounded-xl font-semibold border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white backdrop-blur-sm"
              >
                <Link to={createPageUrl(DISCOVERY_ROUTES.mobile)}>Mobile barbers</Link>
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto lg:mx-0 mb-8 stb-animate-fade-up stb-delay-5">
              {[
                { icon: Zap, label: 'Instant confirm', value: '< 60s' },
                { icon: ShieldCheck, label: 'Protected pay', value: '100%' },
                { icon: Clock, label: 'Avg. wait', value: '2 min' },
              ].map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm px-3 py-3 text-center"
                >
                  <Icon className="w-4 h-4 text-primary mx-auto mb-1.5" aria-hidden />
                  <p className="text-sm font-bold text-white">{value}</p>
                  <p className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">{label}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 justify-center lg:justify-start pt-6 border-t border-white/10">
              {TRUST_PILLS.map(({ icon: Icon, label, href, scroll }) => {
                const className =
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/8 text-white/80 hover:bg-primary/20 hover:text-white border border-white/10 transition-colors no-underline';
                if (scroll) {
                  return (
                    <a key={label} href={scroll} className={className}>
                      <Icon className="w-3.5 h-3.5" aria-hidden />
                      {label}
                    </a>
                  );
                }
                return (
                  <Link key={label} to={createPageUrl(href)} className={className}>
                    <Icon className="w-3.5 h-3.5" aria-hidden />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Floating booking card + visual collage */}
          <div className="relative order-1 lg:order-2 stb-animate-float">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-primary/30 via-chart-2/20 to-energy/20 blur-3xl opacity-60 pointer-events-none" aria-hidden />

            <div className="relative stb-booking-float rounded-3xl border border-white/20 bg-white/95 dark:bg-card/95 backdrop-blur-xl shadow-2xl shadow-black/30 p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-1">Quick book</p>
                  <h2 className="text-xl font-bold text-foreground">Find your next cut</h2>
                </div>
                <div className="flex rounded-xl bg-muted p-1 gap-0.5">
                  <button
                    type="button"
                    onClick={() => setMode('shop')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      mode === 'shop' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                    }`}
                  >
                    In-shop
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('mobile')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      mode === 'mobile' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                    }`}
                  >
                    Mobile
                  </button>
                </div>
              </div>

              <form onSubmit={handleSearch} className="space-y-3">
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                  <Input
                    type="search"
                    placeholder={mode === 'mobile' ? 'Your address or city' : 'City, barber, or service'}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-12 h-14 rounded-2xl border-border bg-muted/40 text-base font-medium focus-visible:ring-primary/30"
                    aria-label="Search barbers"
                  />
                </div>
                <Button type="submit" size="lg" className="w-full h-14 rounded-2xl text-base font-bold stb-btn-glow gap-2">
                  <Search className="w-5 h-5" aria-hidden />
                  Search {mode === 'mobile' ? 'mobile barbers' : 'barbers'}
                </Button>
              </form>

              <p className="text-xs text-muted-foreground text-center mt-4">
                Free cancellation on most bookings · Secure card on file
              </p>
            </div>

            {/* Photo mosaic — desktop only, behind card */}
            <div className="hidden xl:grid grid-cols-2 grid-rows-2 gap-2 absolute -right-8 -bottom-12 w-[55%] -z-10 opacity-40 pointer-events-none">
              {HERO_IMAGES.map((img) => (
                <div
                  key={img.src}
                  className={`relative overflow-hidden rounded-2xl ${img.className ?? ''} ${img.className?.includes('row-span') ? 'min-h-[180px]' : 'min-h-[88px]'}`}
                >
                  <img src={img.src} alt={img.alt} className="w-full h-full object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
