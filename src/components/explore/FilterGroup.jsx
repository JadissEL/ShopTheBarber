import { cn } from '@/lib/utils';

export default function FilterGroup({ title, icon: Icon, children, className = '', scrollable = false }) {
  return (
    <div className={cn('space-y-2 min-w-0', className)}>
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-0.5">
        {Icon ? <Icon className="w-3.5 h-3.5" aria-hidden /> : null}
        {title}
      </p>
      <div
        aria-label={scrollable ? `${title} filters` : undefined}
        className={cn(
          'flex gap-2',
          scrollable
            ? 'overflow-x-auto scrollbar-none -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap md:overflow-visible pb-0.5 snap-x snap-mandatory [mask-image:linear-gradient(to_right,transparent,black_12px,black_calc(100%-12px),transparent)] md:[mask-image:none]'
            : 'flex-wrap'
        )}
      >
        {children}
      </div>
    </div>
  );
}
