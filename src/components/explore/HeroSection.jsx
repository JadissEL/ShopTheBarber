import { MapPin, ShieldCheck, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { stb } from '@/lib/stbUi';
import { HERO_THEMES } from '@/lib/explorePageConfig';
import SearchField from '@/components/ui/search-field';
function formatCount(n) {
  const num = Number(n) || 0;
  if (num >= 1000) return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}k+`;
  return num > 0 ? `${num}+` : null;
}

export default function HeroSection({
  pageConfig,
  cityFilter,
  searchTerm,
  onSearchChange,
  onClearSearch,
  platformStats,
  locationLabel,
  spotlight = null,
}) {
  const theme = HERO_THEMES[pageConfig.heroTheme] ?? HERO_THEMES.emerald;
  const barberCount = formatCount(platformStats?.barber_count);
  const reviewHint = platformStats?.avg_rating
    ? `${Number(platformStats.avg_rating).toFixed(1)} avg rating`
    : 'Verified reviews';

  const searchBlock = (
    <div className="w-full lg:max-w-md lg:ml-auto order-first lg:order-none">
      <div
        className={cn(
          'rounded-lg border border-foreground/10 bg-card text-foreground p-2 shadow-sm focus-within:ring-2 transition-shadow',
          theme.ring.replace('focus-visible:', 'focus-within:'),
        )}
      >
        <SearchField
          id="explore-search"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          onClear={onClearSearch}
          placeholder={pageConfig.searchPlaceholder}
          aria-label="Search barbers"
          size="lg"
          inputClassName="border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>
    </div>
  );
  return (
    <header className="relative border-b border-white/10 stb-explore-hero overflow-hidden text-white">
      <div
        className="absolute inset-0 bg-primary/5 pointer-events-none"
        aria-hidden
      />

      <div className="relative max-w-6xl lg:max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10">
        <div className="grid lg:grid-cols-[1fr,min(420px,38%)] gap-6 lg:gap-14 items-end">
          <div className="max-w-2xl order-2 lg:order-none">
            <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wide mb-4', theme.badge)}>
              {pageConfig.heroBadge}
            </span>

            <h1 className={cn(stb.heading, 'text-white mb-3')}>{pageConfig.heroTitle(cityFilter)}</h1>
            <p className={cn('text-base md:text-lg leading-relaxed mb-6 max-w-xl', stb.textOnDarkMuted)}>
              {pageConfig.heroSubtitle(cityFilter)}
            </p>

            <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/65">
              {barberCount ? (
                <li className="inline-flex items-center gap-2">
                  <Star className="w-4 h-4 text-primary fill-primary/30" aria-hidden />
                  <span>
                    <span className="font-semibold text-white">{barberCount} barbers</span>
                    <span className="hidden sm:inline"> · {reviewHint}</span>
                  </span>
                </li>
              ) : (
                <li className="inline-flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" aria-hidden />
                  <span>{reviewHint}</span>
                </li>
              )}
              {locationLabel ? (
                <li className="inline-flex items-center gap-2 min-w-0">
                  <MapPin className="w-4 h-4 text-primary shrink-0" aria-hidden />
                  <span className="truncate">{locationLabel}</span>
                </li>
              ) : null}
            </ul>
          </div>

          <div className="flex flex-col gap-4 order-1 lg:order-none">
            {searchBlock}
            {spotlight ? <div className="hidden lg:block">{spotlight}</div> : null}
          </div>
        </div>

        {spotlight ? <div className="mt-6 lg:hidden">{spotlight}</div> : null}
      </div>
    </header>
  );
}
