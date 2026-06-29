import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { Heart, ArrowRight } from 'lucide-react';
import { buildBarberCardTags } from '@/lib/barberCardTags';
import BarberCardMeta from '@/components/explore/BarberCardMeta';
import VipBarberBadge from '@/components/groupBooking/GroupBookingBadges';
import { cn } from '@/lib/utils';

const MAX_VISIBLE_TAGS = 2;

export default function BarberCard({
  barber,
  hasPromo = false,
  bookingLocation = null,
  exploreMode = 'topRated',
  index = 0,
  isFavorited = false,
  onToggleFavorite,
  compact = false,
}) {
  const prefersReducedMotion = useReducedMotion();

  if (!barber?.id) return null;

  const name = barber.name || 'Unknown Barber';
  const title = barber.title || 'Barber';
  const imageUrl =
    barber.image_url ||
    'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&auto=format&fit=crop';

  const profileUrl = createPageUrl(`BarberProfile?id=${barber.id}`);
  const bookParams = new URLSearchParams({ barberId: barber.id });
  if (bookingLocation) bookParams.set('location', bookingLocation);
  const bookUrl = createPageUrl(`BookingFlow?${bookParams.toString()}`);

  const allTags = buildBarberCardTags(barber, { hasPromo, exploreMode });
  const attestationKeys = new Set(['deal', 'top', 'new']);
  const displayTags = allTags
    .filter((t) => !attestationKeys.has(t.key) || t.key === 'deal')
    .slice(0, MAX_VISIBLE_TAGS);

  const previewImages = barber.discovery_preview?.images?.slice(0, 3) ?? [];

  const motionProps = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.22, delay: Math.min(index * 0.025, 0.12) },
      };

  const Wrapper = prefersReducedMotion ? 'article' : motion.article;

  return (
    <Wrapper
      {...motionProps}
      className={cn('group h-full', compact && 'max-h-[min(22rem,calc(100dvh-15.5rem))] sm:max-h-[min(24rem,calc(100dvh-14rem))]')}
    >
      <div
        className={cn(
          'h-full flex flex-col border border-border/80 bg-card shadow-sm ring-1 ring-border/50 hover:shadow-md hover:border-primary/25 transition-all duration-300 overflow-hidden',
          compact ? 'rounded-xl' : 'rounded-2xl'
        )}
      >
        <Link
          to={profileUrl}
          className={cn(
            'block relative bg-muted overflow-hidden shrink-0',
            compact ? 'aspect-[3/2] max-h-[46%]' : 'aspect-[5/4]'
          )}
        >
          <OptimizedImage
            src={imageUrl}
            alt={`${name}, ${title}`}
            fill
            priority={index < 8}
            width={480}
            height={compact ? 320 : 384}
            aspectRatio={compact ? '3/2' : '5/4'}
            imgClassName="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            fallbackSrc="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80"
          />

          {hasPromo ? (
            <span
              className={cn(
                'absolute left-2.5 rounded-md bg-foreground text-background font-bold uppercase tracking-wide',
                compact ? 'top-2.5 px-1.5 py-0.5 text-[10px]' : 'top-3 left-3 px-2 py-0.5 text-xs'
              )}
            >
              Deal
            </span>
          ) : null}

          <button
            type="button"
            onClick={(e) => onToggleFavorite?.(barber.id, 'barber', e)}
            aria-label={isFavorited ? 'Remove from favorites' : 'Save barber'}
            className={cn(
              'absolute top-2.5 right-2.5 rounded-full flex items-center justify-center transition-colors duration-200',
              compact ? 'w-8 h-8' : 'top-3 right-3 w-9 h-9',
              isFavorited
                ? 'bg-rose-500 text-white shadow-md'
                : 'bg-card/95 text-foreground hover:text-rose-500 shadow-sm border border-border/60'
            )}
          >
            <Heart className={cn(compact ? 'w-3.5 h-3.5' : 'w-4 h-4', isFavorited && 'fill-current')} />
          </button>

          {!compact && previewImages.length > 0 ? (
            <div className="absolute bottom-3 left-3 flex gap-1.5">
              {previewImages.map((img, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-md overflow-hidden border border-white/80 shadow-sm bg-muted"
                >
                  <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          ) : null}
        </Link>

        <div className={cn('flex flex-col flex-1 min-h-0', compact ? 'p-3 gap-2' : 'p-4 md:p-5 gap-3')}>
          <Link to={profileUrl} className={cn('block group/name', compact ? 'space-y-1.5' : 'space-y-3')}>
            {barber.is_vip ? <VipBarberBadge className="w-fit" /> : null}
            <BarberCardMeta barber={barber} tags={displayTags} compact={compact} />
          </Link>

          <div className="mt-auto flex items-center gap-2">
            <Button
              asChild
              className={cn(
                'flex-1 rounded-lg font-semibold shadow-sm',
                compact ? 'h-9 text-xs sm:text-sm' : 'rounded-xl h-10 text-sm'
              )}
            >
              <Link to={bookUrl}>Book now</Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="icon"
              className={cn(
                'shrink-0 rounded-lg text-muted-foreground hover:text-foreground',
                compact ? 'h-9 w-9' : 'rounded-xl h-10 w-10'
              )}
            >
              <Link to={profileUrl} aria-label={`View ${name} profile`}>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Wrapper>
  );
}
