import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Star, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { formatBarberRatingLine } from '@/lib/barberCardTags';
import { cn } from '@/lib/utils';
import { stb } from '@/lib/stbUi';

export default function ExploreFeaturedSpotlight({ barber, bookingLocation = null }) {
  if (!barber?.id) return null;

  const name = barber.name || 'Barber';
  const title = barber.title || 'Professional';
  const imageUrl =
    barber.image_url ||
    'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&auto=format&fit=crop';
  const ratingLine = formatBarberRatingLine(barber.rating ?? 0, barber.review_count ?? 0);

  const profileUrl = createPageUrl(`BarberProfile?id=${barber.id}`);
  const bookParams = new URLSearchParams({ barberId: barber.id });
  if (bookingLocation) bookParams.set('location', bookingLocation);
  const bookUrl = createPageUrl(`BookingFlow?${bookParams.toString()}`);

  return (
    <div className={cn(stb.surface, 'border-foreground/10 overflow-hidden')}>
      <div className="flex flex-col sm:flex-row">
        <Link
          to={profileUrl}
          className="relative sm:w-36 md:w-44 aspect-[4/3] sm:aspect-auto sm:min-h-[120px] shrink-0 bg-muted overflow-hidden"
        >
          <OptimizedImage
            src={imageUrl}
            alt={name}
            fill
            width={176}
            height={132}
            aspectRatio="4/3"
            imgClassName="object-cover"
            priority
          />
        </Link>
        <div className="flex flex-col flex-1 p-4 gap-2 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">
            Featured
          </p>
          <Link to={profileUrl} className="group/name min-w-0">
            <h3 className={cn(stb.uiHeading, 'text-base truncate group-hover/name:text-primary transition-colors')}>
              {name}
            </h3>
          </Link>
          <p className="text-sm text-muted-foreground truncate">{title}</p>
          <div className="flex items-center gap-1.5 text-sm">
            <Star className="w-3.5 h-3.5 text-primary fill-amber-500" aria-hidden />
            <span className="font-semibold">{ratingLine.value}</span>
            {ratingLine.reviews ? (
              <span className="text-muted-foreground text-xs">({ratingLine.reviews})</span>
            ) : null}
          </div>
          <div className="flex items-center gap-2 mt-auto pt-1">
            <Button asChild size="sm" className=" h-9 font-semibold text-sm flex-1 sm:flex-none">
              <Link to={bookUrl}>Book now</Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className=" h-9 text-muted-foreground hover:text-foreground gap-1"
            >
              <Link to={profileUrl}>
                Profile
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
