import { useQuery } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { DISCOVERY_ROUTES } from '@/lib/discoveryRoutes';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Home, MapPin, Star, ArrowRight, Sofa } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { motion } from 'framer-motion';
import VipBarberBadge from '@/components/groupBooking/GroupBookingBadges';

export default function HomeAtYourDoor() {
  const { data, isLoading } = useQuery({
    queryKey: ['homepage'],
    queryFn: () => sovereign.public.getHomepage(),
    staleTime: 1000 * 60 * 5,
  });

  const mobileBarbers = data?.mobile_barbers ?? [];
  const copy = data?.home_visit ?? {
    headline: 'Your barber, at your door',
    description:
      'Choose certified professionals who come to your home, office, or hotel. Same quality as the chair, zero travel, total convenience.',
  };

  return (
    <section className="stb-section-dark stb-section overflow-hidden relative">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Badge className="stb-chip border-white/25 bg-white/10 text-white mb-4">
              <Home className="w-3 h-3 mr-1" /> Barber at home
            </Badge>
            <h2 className="stb-heading-display text-white text-3xl md:text-5xl mb-5">
              {copy.headline}
            </h2>
            <p className="text-lg text-white/80 mb-8 max-w-lg leading-relaxed">
              {copy.description}
            </p>
            <ul className="space-y-3 mb-10 text-white/75 text-sm">
              <li className="flex items-start gap-3">
                <Sofa className="w-5 h-5 shrink-0 mt-0.5 text-primary" />
                <span>Professional setup in your living room, home office, or hotel suite</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 shrink-0 mt-0.5 text-primary" />
                <span>Enter your address when booking, we match you with mobile-ready barbers nearby</span>
              </li>
              <li className="flex items-start gap-3">
                <Star className="w-5 h-5 shrink-0 mt-0.5 text-primary" />
                <span>Same verified pros as in-shop, cuts, fades, beard work &amp; grooming on your schedule</span>
              </li>
            </ul>
            <div className="flex flex-wrap gap-3">
              <Link to={createPageUrl(DISCOVERY_ROUTES.mobile)}>
                <Button size="lg" className="bg-card text-foreground hover:bg-muted gap-2">
                  Book a barber at home <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to={createPageUrl(copy.group_cta_path || DISCOVERY_ROUTES.mobileGroup)}>
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 gap-2">
                  Group booking at home
                </Button>
              </Link>
              <Link to={createPageUrl(DISCOVERY_ROUTES.mobile)}>
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 gap-2">
                  Browse mobile barbers
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-2">
              Mobile-ready barbers
            </p>
            {isLoading ? (
              <div className="grid grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <div key={i} className="aspect-[4/5] bg-white/10 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : mobileBarbers.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {mobileBarbers.slice(0, 4).map((barber) => (
                  <Link
                    key={barber.id}
                    to={createPageUrl(`BarberProfile?id=${barber.id}`)}
                    className="group relative aspect-[4/5] overflow-hidden border border-white/20 hover:border-primary/50 transition-all stb-card-interactive"
                  >
                    <OptimizedImage
                      src={barber.image_url || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&fit=crop'}
                      alt={barber.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-foreground/55" />
                    <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                      {barber.is_vip && (
                        <VipBarberBadge className="text-[9px] py-0 px-1.5 bg-primary/90 text-white border-0" />
                      )}
                      {barber.mobile_only && (
                        <Badge className="text-[9px] bg-primary text-primary-foreground border-0">At-home only</Badge>
                      )}
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <p className="font-bold text-sm">{barber.name}</p>
                      <p className="text-xs text-white/70 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        {barber.rating?.toFixed(1)}, {barber.location}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="stb-notice border-white/20 bg-white/5 p-8 text-center">
                <Home className="w-10 h-10 mx-auto mb-3 text-primary" />
                <p className="text-white/75 text-sm font-sans normal-case">
                  Mobile barbers are joining every week. Start a booking and filter by &ldquo;At home&rdquo; to see who serves your area.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
