import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ArrowRight, MapPin, Sparkles, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { DISCOVERY_ROUTES } from '@/lib/discoveryRoutes';
import { stb } from '@/lib/stbUi';
import { cn } from '@/lib/utils';

const IMAGES = {
  hero: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f0?w=1600&auto=format&fit=crop&q=80',
  shop: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=900&auto=format&fit=crop&q=80',
  barber: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=900&auto=format&fit=crop&q=80',
  discover: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=900&auto=format&fit=crop&q=80',
};

function offerBookPath(offer) {
  if (offer.barber_id) return `BarberProfile?id=${offer.barber_id}`;
  if (offer.shop_id) return `Explore?shop=${offer.shop_id}`;
  if (offer.code) return 'BookingFlow';
  return DISCOVERY_ROUTES.explore;
}

function headlineFromOffer(offer) {
  const discount = (offer.discount_text || '').trim();
  if (offer.scope === 'platform' && discount) {
    const value = discount.replace(/ off/i, '').trim();
    return `${value} off your first booking`;
  }
  if (discount && !offer.title?.toLowerCase().includes(discount.toLowerCase())) {
    return `${discount} at ${offer.title}`;
  }
  return offer.title || 'Exclusive offer';
}

function sublineFromOffer(offer) {
  if (offer.code) {
    return `Use code ${offer.code} at checkout, limited time.`;
  }
  if (offer.description?.trim()) {
    return offer.description;
  }
  if (offer.kind === 'highlight') {
    return `${offer.usual_service_name || 'Grooming'} with a top-rated independent barber near you.`;
  }
  return 'Applied automatically when you book.';
}

function ctaFromOffer(offer, variant = 'default') {
  if (offer.scope === 'platform' && offer.code) {
    return variant === 'hero' ? 'Claim discount' : 'Book with code';
  }
  if (offer.scope === 'shop') {
    return 'Book with discount';
  }
  if (offer.kind === 'highlight' || offer.scope === 'barber') {
    return 'View barber';
  }
  return 'Claim deal';
}

function flattenOffers(raw) {
  const list = [
    ...(raw.platform ?? []).map((o) => ({ ...o, scope: o.scope || 'platform' })),
    ...(raw.shops ?? []).map((o) => ({ ...o, scope: o.scope || 'shop' })),
    ...(raw.barbers ?? []).map((o) => ({ ...o, scope: o.scope || 'barber' })),
  ];
  return list;
}

function scoreOffer(offer) {
  let score = 0;
  if (offer.scope === 'platform') score += 100;
  if (offer.code) score += 50;
  if (offer.discount_text?.includes('%')) score += 30;
  if (offer.discount_text?.includes('€') || offer.discount_text?.includes('$')) score += 25;
  if (offer.kind === 'bundle') score += 15;
  if (offer.kind === 'highlight') score += 10;
  return score;
}

function pickFeatured(raw) {
  const all = flattenOffers(raw).sort((a, b) => scoreOffer(b) - scoreOffer(a));
  const hero = all[0] ?? null;
  const rest = all.filter((o) => o.id !== hero?.id);
  const secondaryA = rest.find((o) => o.scope === 'shop') ?? rest[0] ?? null;
  const secondaryB =
    rest.find((o) => o.id !== secondaryA?.id && (o.scope === 'barber' || o.kind === 'highlight')) ??
    rest.find((o) => o.id !== secondaryA?.id) ??
    null;

  return { hero, secondaryA, secondaryB };
}

function HeroDealCard({ offer }) {
  const path = offerBookPath(offer);
  const image = offer.shop_image_url || offer.barber_image_url || IMAGES.hero;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={cn('relative overflow-hidden min-h-[320px] md:min-h-[380px] group', stb.cardInteractive)}
    >
      <OptimizedImage src={image} alt="" fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
      <div className="absolute inset-0 bg-foreground/60" />

      <div className="relative z-10 flex flex-col justify-between h-full min-h-[320px] md:min-h-[380px] p-8 md:p-10 lg:p-12">
        <div className="flex items-center gap-2">
          <span className="stb-chip stb-chip-active text-xs">
            <Sparkles className="w-3.5 h-3.5" />
            Featured deal
          </span>
          {offer.discount_text && (
            <span className="hidden sm:inline-flex px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold backdrop-blur-sm border border-white/15">
              {offer.discount_text}
            </span>
          )}
        </div>

        <div className="mt-auto max-w-xl">
          <h3 className={cn(stb.heading, 'text-white text-3xl sm:text-4xl md:text-5xl mb-3')}>
            {headlineFromOffer(offer)}
          </h3>
          <p className="text-base md:text-lg text-white/80 leading-relaxed mb-6 max-w-md">
            {sublineFromOffer(offer)}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="h-12 px-8">
              <Link to={createPageUrl(path)}>{ctaFromOffer(offer, 'hero')}</Link>
            </Button>
            {offer.code && (
              <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-black/40 border border-white/20 text-white font-mono text-sm backdrop-blur-md">
                <Tag className="w-4 h-4 text-primary" />
                {offer.code}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function SecondaryDealCard({ offer, fallback, imageKey = 'shop' }) {
  if (!offer && fallback) {
    return (
      <motion.article
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.08 }}
        className={cn('relative overflow-hidden min-h-[280px] group', stb.cardInteractive)}
      >
        <OptimizedImage src={IMAGES.discover} alt="" fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-[hsl(var(--navy))]/80" />
        <div className="relative z-10 flex flex-col justify-end h-full min-h-[280px] p-7 md:p-8">
          <p className="text-white/75 text-xs font-semibold uppercase tracking-widest mb-2">Independent barbers</p>
          <h3 className={cn(stb.title, 'text-2xl text-white mb-2')}>Discover rising talent near you</h3>
          <p className="text-sm text-white/75 mb-5 max-w-xs">
            Browse profiles, compare services, and book your next cut in minutes.
          </p>
          <Button asChild className="w-fit">
            <Link to={createPageUrl(DISCOVERY_ROUTES.explore)}>Explore barbers</Link>
          </Button>
        </div>
      </motion.article>
    );
  }

  if (!offer) return null;

  const path = offerBookPath(offer);
  const image =
    offer.barber_image_url ||
    offer.shop_image_url ||
    IMAGES[imageKey] ||
    IMAGES.barber;

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.05 }}
      className={cn('relative overflow-hidden min-h-[280px] group', stb.cardInteractive)}
    >
      <OptimizedImage src={image} alt="" fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
      <div className="absolute inset-0 bg-foreground/65" />

      <div className="relative z-10 flex flex-col justify-between h-full min-h-[280px] p-7 md:p-8">
        <div>
          {offer.discount_text && (
            <span className="inline-block px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wide mb-3">
              {offer.discount_text}
            </span>
          )}
          {offer.code && (
            <span className="ml-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/15 text-white text-xs font-mono border border-white/20">
              <Tag className="w-3 h-3" />
              {offer.code}
            </span>
          )}
        </div>

        <div>
          <div className="flex items-center gap-1.5 text-white/70 text-xs mb-2">
            {offer.scope === 'shop' && <MapPin className="w-3.5 h-3.5" />}
            <span className="font-medium uppercase tracking-wider">
              {offer.scope === 'shop' ? 'Shop special' : offer.kind === 'highlight' ? 'Top barber' : 'Barber bundle'}
            </span>
          </div>
          <h3 className={cn(stb.title, 'text-xl md:text-2xl text-white mb-2 line-clamp-2')}>
            {headlineFromOffer(offer)}
          </h3>
          <p className="text-sm text-white/75 mb-5 line-clamp-2">{sublineFromOffer(offer)}</p>
          <Button
            asChild
            variant="secondary"
            className=" bg-white/95 text-foreground hover:bg-card font-semibold"
          >
            <Link to={createPageUrl(path)}>{ctaFromOffer(offer)}</Link>
          </Button>
        </div>
      </div>
    </motion.article>
  );
}

function DealsSkeleton() {
  return (
    <section className="py-24 md:py-28 bg-[hsl(var(--navy))]">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl animate-pulse space-y-10">
        <div className="space-y-3 max-w-lg">
          <div className="h-4 w-20 bg-muted rounded" />
          <div className="h-10 w-80 bg-muted rounded" />
          <div className="h-5 w-96 bg-muted rounded" />
        </div>
        <div className="h-[380px] bg-muted rounded-lg" />
        <div className="grid md:grid-cols-2 gap-6">
          <div className="h-[280px] bg-muted rounded-lg" />
          <div className="h-[280px] bg-muted rounded-lg" />
        </div>
      </div>
    </section>
  );
}

export default function HomeOffers() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['homepage'],
    queryFn: () => sovereign.public.getHomepage(),
    staleTime: 1000 * 60 * 5,
  });

  const offers = data?.offers ?? { platform: [], shops: [], barbers: [] };
  const featured = useMemo(() => pickFeatured(offers), [offers]);
  const hasAnyDeal = flattenOffers(offers).length > 0;

  if (isLoading) return <DealsSkeleton />;

  if (isError) {
    return (
      <section className="py-24 bg-[hsl(var(--navy))] border-y border-white/15">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <p className="text-white/70 mb-4">Could not load deals right now.</p>
          <Button variant="outline" onClick={() => refetch()} className=" border-foreground/25 text-white hover:bg-muted">
            Try again
          </Button>
        </div>
      </section>
    );
  }

  const heroOffer =
    featured.hero ??
    ({
      id: 'fallback-hero',
      scope: 'platform',
      title: 'Welcome offer',
      description: 'Save on your first booking with ShopTheBarber.',
      discount_text: '€5 off',
      code: 'WELCOME5',
      kind: 'promo',
    });

  return (
    <section className="py-24 md:py-28 bg-[hsl(var(--navy))] text-white relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl relative z-10">
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 md:mb-14 max-w-2xl"
        >
          <p className={cn(stb.label, 'mb-3')}>Deals</p>
          <h2 className={cn(stb.heading, 'text-white text-3xl md:text-5xl mb-4')}>
            Save on your next cut
          </h2>
          <p className="text-lg text-white/70 leading-relaxed">
            Discover exclusive offers from top barbers and shops, applied at checkout when you book.
          </p>
        </motion.header>

        <div className="space-y-6 md:space-y-8">
          <HeroDealCard offer={heroOffer} />

          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            <SecondaryDealCard
              offer={featured.secondaryA}
              fallback={!featured.secondaryA}
              imageKey="shop"
            />
            <SecondaryDealCard
              offer={featured.secondaryB}
              fallback={!featured.secondaryB}
              imageKey="barber"
            />
          </div>
        </div>

        <motion.footer
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-14 md:mt-16 pt-10 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-6"
        >
          <p className="text-sm text-white/60 text-center sm:text-left">
            {hasAnyDeal
              ? 'New promos and bundles added weekly by shops and barbers on the platform.'
              : 'More deals coming soon as shops and barbers join your city.'}
          </p>
          <Button
            asChild
            size="lg"
            variant="outline"
            className=" border-foreground/25 bg-transparent text-white hover:bg-muted hover:text-white gap-2 shrink-0 h-12 px-8 font-semibold"
          >
            <Link to={createPageUrl(DISCOVERY_ROUTES.deals)}>
              Browse all deals
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </motion.footer>
      </div>
    </section>
  );
}
