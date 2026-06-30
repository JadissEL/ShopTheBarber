import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, useReducedMotion } from 'framer-motion';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { Heart } from 'lucide-react';
import { buildBarberCardTags } from '@/lib/barberCardTags';
import BarberCardMeta from '@/components/explore/BarberCardMeta';
import { cn } from '@/lib/utils';
import { stb } from '@/lib/stbUi';

const MAX_VISIBLE_TAGS = 1;

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
      <div className={cn('h-full flex flex-col overflow-hidden', stb.cardInteractive)}>
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
                'absolute left-2.5 rounded-md bg-foreground text-background font-semibold uppercase tracking-wide text-[10px] px-2 py-0.5',
                compact ? 'top-2.5' : 'top-3 left-3 text-xs'
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
              'absolute top-2.5 right-2.5 rounded-lg flex items-center justify-center border border-foreground/10 bg-card/95 shadow-sm transition-colors duration-200',
              compact ? 'w-8 h-8' : 'top-3 right-3 w-9 h-9',
              isFavorited ? 'text-primary border-primary/30' : 'text-muted-foreground hover:text-primary'
            )}
          >
            <Heart className={cn(compact ? 'w-3.5 h-3.5' : 'w-4 h-4', isFavorited && 'fill-current')} />
          </button>
        </Link>

        <div className={cn('flex flex-col flex-1 min-h-0', compact ? 'p-3 gap-2' : 'p-4 gap-3')}>
          <Link to={profileUrl} className={cn('block group/name', compact ? 'space-y-1.5' : 'space-y-2')}>
            <BarberCardMeta barber={barber} tags={displayTags} compact={compact} />
          </Link>

          <Link to={bookUrl} className={cn(stb.cardCta, 'mt-auto -mx-3 -mb-3 rounded-none rounded-b-lg', compact && '-mx-3 -mb-3', !compact && '-mx-4 -mb-4')}>
            Book now
          </Link>
        </div>
      </div>
    </Wrapper>
  );
}
