import { cn } from '@/lib/utils';

import { stb, HEADER_TIER, headerTitleClasses } from '@/lib/stbUi';



/**

 * Site-wide page hero — Premium Momentum.

 * `display` tier (default on dark): Bebas marketing headlines.

 * `app` tier: DM Sans UI headings on cream background.

 * `immersive` tier: profile heroes — minimal chrome, transparent/dark overlay.

 */

export default function PageHeader({

  label,

  title,

  subtitle,

  children,

  className,

  compact = false,

  variant = 'dark',

  tier = 'display',

}) {

  const isImmersive = tier === HEADER_TIER.IMMERSIVE;

  const isDark = isImmersive || variant === 'dark';

  const isApp = tier === HEADER_TIER.APP || variant === 'light';



  return (

    <header

      className={cn(

        'relative overflow-hidden',

        isImmersive

          ? 'border-0 bg-transparent text-white'

          : cn(

              'border-b',

              isDark

                ? 'stb-explore-hero border-white/10 text-white'

                : 'bg-background border-foreground/10 text-foreground',

            ),

        compact ? 'py-6 md:py-8' : isImmersive ? 'py-8 md:py-12' : 'py-8 md:py-12',

        className,

      )}

    >

      {isImmersive && (

        <div

          className="absolute inset-0 bg-foreground/55 pointer-events-none"

          aria-hidden

        />

      )}



      {isDark && tier === HEADER_TIER.DISPLAY && !isImmersive && (

        <div

          className="absolute inset-0 bg-primary/5 pointer-events-none"

          aria-hidden

        />

      )}



      <div className={cn(stb.container, 'relative')}>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">

          <div className="max-w-2xl">

            {label && (

              <p className={cn(stb.overline, 'mb-2 font-sans', isDark && 'text-primary')}>{label}</p>

            )}

            <h1 className={cn(headerTitleClasses(tier, compact), isImmersive && 'drop-shadow-sm')}>

              {title}

            </h1>

            {subtitle && (

              <p

                className={cn(

                  stb.body,

                  'mt-2 md:mt-3 text-base md:text-lg max-w-xl font-sans',

                  isDark ? stb.textOnDarkMuted : 'text-muted-foreground',

                  isImmersive && 'text-white/80 drop-shadow-sm',

                )}

              >

                {subtitle}

              </p>

            )}

          </div>

          {children && <div className="relative shrink-0 flex flex-wrap items-center gap-2">{children}</div>}

        </div>

      </div>

    </header>

  );

}

