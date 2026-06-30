import { Star } from 'lucide-react';
import ProviderAttestationBadges from '@/components/providerAttestation/ProviderAttestationBadges';
import { formatBarberLocation, formatBarberRatingLine } from '@/lib/barberCardTags';
import { formatDistanceKm } from '@/lib/geo';

export default function BarberCardMeta({ barber, tags = [], compact = false }) {
  const locationText =
    barber.distance_km != null ? formatDistanceKm(barber.distance_km) : formatBarberLocation(barber);

  const ratingLine = formatBarberRatingLine(barber.rating ?? 0, barber.review_count ?? 0);
  const completedServices = barber.completed_services ?? 0;
  const completionRate = barber.completion_rate_percent ?? barber.stats?.completion_rate_percent;
  const visibleTags = compact ? tags.slice(0, 1) : tags;

  return (
    <>
      <div className="flex items-start justify-between gap-2 min-w-0">
        <div className="min-w-0 flex-1">
          <h3
            className={
              compact
                ? 'stb-title text-base leading-snug truncate'
                : 'stb-title text-lg leading-snug truncate'
            }
          >
            {barber.name}
          </h3>
          <p className={compact ? 'text-xs text-muted-foreground truncate' : 'text-sm text-muted-foreground truncate mt-0.5'}>
            {barber.title || 'Barber'}
          </p>
        </div>
        {barber.min_price != null ? (
          <p
            className={
              compact
                ? 'text-xs font-semibold text-primary shrink-0 tabular-nums whitespace-nowrap'
                : 'text-sm font-semibold text-primary shrink-0 tabular-nums whitespace-nowrap'
            }
          >
            <span className="text-[11px] font-medium text-muted-foreground">from </span>
            €{Math.round(barber.min_price)}
          </p>
        ) : null}
      </div>

      <div className={compact ? 'flex flex-col gap-0.5 min-w-0' : 'flex flex-col gap-1 text-sm min-w-0'}>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="inline-flex items-center gap-1 font-semibold text-primary shrink-0 text-xs sm:text-sm">
            <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary fill-primary" aria-hidden />
            {ratingLine.value}
          </span>
          {ratingLine.reviews ? (
            <span className="text-muted-foreground truncate text-[11px] sm:text-xs">({ratingLine.reviews})</span>
          ) : (
            <span className="text-muted-foreground text-[11px] sm:text-xs">New</span>
          )}
          {!compact && completedServices > 0 ? (
            <>
              <span className="text-border" aria-hidden>
                ·
              </span>
              <span className="text-muted-foreground text-xs truncate">
                {completedServices} cut{completedServices === 1 ? '' : 's'} completed
                {completionRate != null && completionRate > 0 ? ` · ${completionRate}% completion` : ''}
              </span>
            </>
          ) : null}
        </div>
        {locationText ? (
          <p className="text-muted-foreground truncate text-[11px] sm:text-xs">{locationText}</p>
        ) : null}
      </div>

      {(barber.licensed || barber.insured || visibleTags.length > 0) && (
        <div className={compact ? 'flex flex-wrap items-center gap-1' : 'flex flex-wrap items-center gap-1.5'}>
          {(barber.licensed || barber.insured) && (
            <ProviderAttestationBadges
              licensed={barber.licensed}
              insured={barber.insured}
              size="xs"
            />
          )}
          {visibleTags.map(({ key, label }) => (
            <span
              key={key}
              className="inline-flex px-2 py-0.5 rounded-md bg-muted text-xs font-medium text-muted-foreground"
            >
              {label}
            </span>
          ))}
        </div>
      )}
    </>
  );
}
