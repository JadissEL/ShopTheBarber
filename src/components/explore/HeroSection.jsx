import { Search, X, MapPin, ShieldCheck, Star } from 'lucide-react';

import { Input } from '@/components/ui/input';

import { cn } from '@/lib/utils';

import { HERO_THEMES } from '@/lib/explorePageConfig';



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

      <label className="sr-only" htmlFor="explore-search">

        Search barbers

      </label>

      <div

        className={cn(

          'relative rounded-2xl border border-border bg-card p-2 shadow-sm focus-within:ring-2 transition-shadow',

          theme.ring.replace('focus-visible:', 'focus-within:')

        )}

      >

        <div className="relative">

          <Search

            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none"

            aria-hidden

          />

          <Input

            id="explore-search"

            value={searchTerm}

            onChange={(e) => onSearchChange(e.target.value)}

            placeholder={pageConfig.searchPlaceholder}

            aria-label="Search barbers"

            className={cn(

              'pl-12 pr-10 h-12 bg-transparent border-0 shadow-none text-base',

              'focus-visible:ring-0'

            )}

          />

          {searchTerm ? (

            <button

              type="button"

              onClick={onClearSearch}

              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-muted transition-colors"

              aria-label="Clear search"

            >

              <X className="w-4 h-4 text-muted-foreground" />

            </button>

          ) : null}

        </div>

      </div>

    </div>

  );



  return (

    <header className="relative border-b border-white/10 stb-explore-hero overflow-hidden text-white">
      <div
        className="absolute inset-0 stb-mesh-bg opacity-70 pointer-events-none"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,hsl(var(--primary)/0.2),transparent)] pointer-events-none"
        aria-hidden
      />



      <div className="relative max-w-6xl lg:max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10">

        <div className="grid lg:grid-cols-[1fr,min(420px,38%)] gap-6 lg:gap-14 items-end">

          <div className="max-w-2xl order-2 lg:order-none">

            <span

              className={cn(

                'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest mb-4',

                theme.badge

              )}

            >

              {pageConfig.heroBadge}

            </span>



            <h1 className="text-2xl md:text-3xl lg:text-[2.75rem] font-extrabold tracking-tight text-white mb-3 leading-[1.06]">

              {pageConfig.heroTitle(cityFilter)}

            </h1>

            <p className="text-base md:text-lg text-white/70 leading-relaxed mb-6 max-w-xl">

              {pageConfig.heroSubtitle(cityFilter)}

            </p>



            <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/65">

              {barberCount ? (

                <li className="inline-flex items-center gap-2">

                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-card border border-border shadow-sm">

                    <Star className="w-3.5 h-3.5 text-primary fill-primary/20" aria-hidden />

                  </span>

                  <span>

                    <span className="font-semibold text-white">{barberCount} barbers</span>

                    <span className="hidden sm:inline"> · {reviewHint}</span>

                  </span>

                </li>

              ) : (

                <li className="inline-flex items-center gap-2">

                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-card border border-border shadow-sm">

                    <ShieldCheck className="w-3.5 h-3.5 text-primary" aria-hidden />

                  </span>

                  <span>{reviewHint}</span>

                </li>

              )}

              {locationLabel ? (

                <li className="inline-flex items-center gap-2 min-w-0">

                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-card border border-border shadow-sm shrink-0">

                    <MapPin className="w-3.5 h-3.5 text-primary" aria-hidden />

                  </span>

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


