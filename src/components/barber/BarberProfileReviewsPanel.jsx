import { Star, MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReviewCard from '@/components/ui/review-card';
import { cn } from '@/lib/utils';
import { stb } from '@/lib/stbUi';

function computeRatingBreakdown(reviews) {
  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  for (const review of reviews) {
    const r = review?.rating ?? review?.data?.rating;
    const bucket = Math.min(5, Math.max(1, Math.round(Number(r) || 5)));
    counts[bucket] += 1;
  }
  const total = reviews.length || 1;
  return [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: counts[stars],
    pct: Math.round((counts[stars] / total) * 100),
  }));
}

function ReviewsEmptyState({ barberName, rating, reviewCount, onBook }) {
  return (
    <div className="text-center py-12 px-6 space-y-4 rounded-lg border border-dashed border-border bg-muted/30">
      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
        <MessageSquare className="w-7 h-7 text-primary" />
      </div>
      <div className="space-y-2 max-w-md mx-auto">
        <h3 className="font-bold text-foreground">No reviews yet</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {barberName} is building their reputation on ShopTheBarber.
          {reviewCount > 0
            ? ` They have a ${rating}-star average from platform data — detailed client reviews will appear here after visits.`
            : ' Be the first to book and share your experience after your appointment.'}
        </p>
      </div>
      {onBook && (
        <Button onClick={onBook} className="rounded-lg">
          Book with {barberName?.split(' ')[0] || 'this barber'}
        </Button>
      )}
    </div>
  );
}

export default function BarberProfileReviewsPanel({
  reviews = [],
  barber,
  isLoading = false,
  onBook,
}) {
  const barberName = barber?.name || 'This barber';
  const aggregateRating = barber?.rating ?? 0;
  const reviewCount = barber?.review_count ?? reviews.length;
  const breakdown = computeRatingBreakdown(reviews);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm">Loading reviews…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="stb-panel p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
          <div className="text-center md:text-left shrink-0">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="text-5xl font-bold text-foreground tabular-nums">
                {aggregateRating ? Number(aggregateRating).toFixed(1) : '—'}
              </span>
              <Star className="w-8 h-8 text-primary fill-primary" />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
            </p>
          </div>

          <div className="flex-1 space-y-2 min-w-0">
            {breakdown.map(({ stars, count, pct }) => (
              <div key={stars} className="flex items-center gap-3 text-sm">
                <span className="w-8 text-muted-foreground font-medium tabular-nums">{stars}★</span>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: reviews.length ? `${pct}%` : '0%' }}
                  />
                </div>
                <span className="w-8 text-right text-muted-foreground tabular-nums text-xs">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {reviews.length === 0 ? (
        <ReviewsEmptyState
          barberName={barberName}
          rating={aggregateRating}
          reviewCount={reviewCount}
          onBook={onBook}
        />
      ) : (
        <div>
          <h3 className={cn(stb.uiHeading, 'text-lg text-foreground mb-4')}>
            Client feedback
          </h3>
          <div className="grid gap-4">
            {reviews.map((review) => (
              <ReviewCard key={review.id || `${review.created_at}-${review.author_name}`} review={review} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
