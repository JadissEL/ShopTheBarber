import { cn } from '@/lib/utils';

/**
 * Site-wide page hero — dark cinematic header used across client, provider, and public pages.
 */
export default function PageHeader({
  label,
  title,
  subtitle,
  children,
  className,
  compact = false,
  variant = 'dark',
}) {
  const isDark = variant === 'dark';

  return (
    <header
      className={cn(
        'relative overflow-hidden border-b',
        isDark ? 'stb-explore-hero border-white/10 text-white' : 'bg-card border-border text-foreground',
        compact ? 'py-6 md:py-8' : 'py-8 md:py-12',
        className,
      )}
    >
      {isDark && (
        <>
          <div className="absolute inset-0 stb-mesh-bg opacity-70 pointer-events-none" aria-hidden />
          <div
            className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_30%_0%,hsl(var(--primary)/0.22),transparent_55%)] pointer-events-none"
            aria-hidden
          />
        </>
      )}

      <div className="relative container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="max-w-2xl">
            {label && (
              <p className={cn('stb-section-label mb-2', isDark && 'text-primary')}>{label}</p>
            )}
            <h1
              className={cn(
                'font-extrabold tracking-tight leading-[1.05]',
                compact ? 'text-2xl md:text-3xl' : 'text-3xl md:text-4xl lg:text-[2.75rem]',
              )}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                className={cn(
                  'mt-2 md:mt-3 text-base md:text-lg leading-relaxed max-w-xl',
                  isDark ? 'text-white/70' : 'text-muted-foreground',
                )}
              >
                {subtitle}
              </p>
            )}
          </div>
          {children && <div className="shrink-0 flex flex-wrap items-center gap-2">{children}</div>}
        </div>
      </div>
    </header>
  );
}
