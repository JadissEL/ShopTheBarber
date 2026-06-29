import { useHomepage } from '@/hooks/useHomepage';
import { ArrowRight, Star, MapPin, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ServiceLocationBadges from '@/components/serviceLocation/ServiceLocationBadges';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { motion } from 'framer-motion';

export default function HomeBestBarbers() {
  const { data, isLoading, isError, refetch } = useHomepage();
  const barbers = data?.top_barbers ?? [];

  if (isLoading) {
    return (
      <div className="py-24 bg-background">
        <div className="container mx-auto px-4 md:px-6 animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-[3/4] bg-muted rounded-[2rem]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-24 bg-background">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <p className="text-muted-foreground mb-4">Could not load top barbers.</p>
          <Button variant="outline" onClick={() => refetch()} className="rounded-xl">
            Try again
          </Button>
        </div>
      </div>
    );
  }

  if (barbers.length === 0) return null;

  return (
    <div className="py-20 md:py-24 bg-background relative">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12">
          <div>
            <div className="text-primary font-semibold uppercase tracking-widest text-xs mb-2 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Top rated
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2 tracking-tight">Barbers clients love</h2>
            <p className="text-muted-foreground text-lg max-w-xl">
              Hand-picked from real ratings and reviews, book with confidence.
            </p>
          </div>
          <Link to={createPageUrl('Explore')}>
            <Button variant="ghost" className="text-foreground hover:bg-muted gap-2 group">
              Explore all barbers <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {barbers.slice(0, 6).map((barber, i) => (
            <motion.div
              key={barber.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="group"
            >
              <Link to={createPageUrl(`BarberProfile?id=${barber.id}`)}>
                <div className="relative aspect-[3/4] overflow-hidden rounded-[2rem] bg-muted mb-4 shadow-md group-hover:shadow-2xl group-hover:shadow-primary/15 transition-all duration-500 ring-1 ring-border/60">
                  <OptimizedImage
                    src={barber.image_url || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&auto=format&fit=crop'}
                    alt={barber.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-transparent to-transparent opacity-70 group-hover:opacity-90 transition-opacity" />
                  <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                    <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-foreground flex items-center gap-1 shadow-lg">
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      {barber.rating > 0 ? barber.rating.toFixed(1) : 'New'}
                    </div>
                    {barber.offers_mobile_service || barber.offers_shop_service !== false ? (
                      <ServiceLocationBadges barber={barber} size="xs" />
                    ) : null}
                  </div>
                  <div className="absolute bottom-6 left-6 right-6 text-white">
                    <div className="flex items-center gap-1 text-xs font-medium text-white/80 mb-1">
                      <MapPin className="w-3 h-3" />
                      {barber.location}
                    </div>
                    <h3 className="text-2xl font-bold mb-0.5">{barber.name}</h3>
                    <p className="text-white/80 text-sm font-light">{barber.title}</p>
                    {barber.review_count > 0 && (
                      <p className="text-white/60 text-xs mt-1">{barber.review_count} reviews</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between px-2">
                  <span className="text-sm font-semibold text-primary group-hover:underline">View profile</span>
                  <span className="text-sm text-muted-foreground">Book now</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
