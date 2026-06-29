import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { createPageUrl } from '@/utils';
import { DISCOVERY_ROUTES } from '@/lib/discoveryRoutes';
import { MapPin, Smartphone, Star, Tag, ArrowRight } from 'lucide-react';

const QUICK_LINKS = [
  {
    label: 'By city',
    description: 'Browse local guides',
    icon: MapPin,
    path: DISCOVERY_ROUTES.cities,
  },
  {
    label: 'Mobile',
    description: 'Barbers at your door',
    icon: Smartphone,
    path: DISCOVERY_ROUTES.mobile,
  },
  {
    label: 'Top rated',
    description: 'Highest-reviewed pros',
    icon: Star,
    path: DISCOVERY_ROUTES.explore,
  },
  {
    label: 'Deals',
    description: 'Live offers & combos',
    icon: Tag,
    path: DISCOVERY_ROUTES.deals,
  },
];

export default function HomeQuickFind() {
  const { data } = useQuery({
    queryKey: ['home-cities'],
    queryFn: () => sovereign.seo.listCities(),
    staleTime: 1000 * 60 * 30,
  });

  const cities = (data?.cities ?? []).slice(0, 8);

  return (
    <section className="py-14 md:py-16 bg-muted/40 border-b border-border/60">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">Find your barber</p>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Search by city or style</h2>
            <p className="text-muted-foreground mt-2 max-w-lg">
              Jump straight to what matters, location, mobile service, ratings, or today&apos;s deals.
            </p>
          </div>
          <Link
            to={createPageUrl('Explore')}
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline shrink-0"
          >
            View all barbers <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {QUICK_LINKS.map(({ label, description, icon: Icon, path }) => (
            <Link
              key={label}
              to={path.startsWith('/') ? path : createPageUrl(path)}
              className="group flex flex-col gap-2 p-4 rounded-2xl bg-card border border-border/80 stb-card-lift no-underline"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
              <span className="font-semibold text-foreground group-hover:text-primary transition-colors">{label}</span>
              <span className="text-xs text-muted-foreground">{description}</span>
            </Link>
          ))}
        </div>

        {cities.length > 0 && (
          <>
            <p className="text-sm font-semibold text-muted-foreground mb-3">Popular cities</p>
            <div className="flex flex-wrap gap-2">
              {cities.map((city) => (
                <Link
                  key={city.slug}
                  to={`/barbers-in/${city.slug}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-card border border-border hover:border-primary/40 hover:text-primary transition-colors no-underline"
                >
                  <MapPin className="w-3.5 h-3.5 opacity-60" />
                  {city.name}
                </Link>
              ))}
              <Link
                to="/cities"
                className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold text-primary hover:bg-primary/5 transition-colors no-underline"
              >
                All cities
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
