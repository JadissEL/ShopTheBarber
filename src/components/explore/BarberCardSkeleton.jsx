import { cn } from '@/lib/utils';

export default function BarberCardSkeleton({ className, compact = false }) {
  return (
    <div
      className={cn(
        'border border-border/60 bg-card overflow-hidden animate-pulse ring-1 ring-border/50',
        compact ? 'rounded-xl max-h-[min(22rem,calc(100dvh-15.5rem))]' : 'rounded-2xl',
        className
      )}
      aria-hidden
    >
      <div className={compact ? 'aspect-[3/2] bg-muted max-h-[46%]' : 'aspect-[5/4] bg-muted'} />
      <div className={compact ? 'p-3 space-y-2' : 'p-4 md:p-5 space-y-3'}>
        <div className="space-y-2">
          <div className={compact ? 'h-4 bg-muted rounded-lg w-3/4' : 'h-5 bg-muted rounded-lg w-3/4'} />
          <div className={compact ? 'h-3 bg-muted rounded-lg w-1/2' : 'h-4 bg-muted rounded-lg w-1/2'} />
        </div>
        <div className={compact ? 'h-3 bg-muted rounded-lg w-2/5' : 'h-4 bg-muted rounded-lg w-2/5'} />
        <div className="h-3 bg-muted rounded-lg w-3/5" />
        {!compact ? (
          <div className="flex gap-2">
            <div className="h-6 bg-muted rounded-full w-16" />
            <div className="h-6 bg-muted rounded-full w-14" />
          </div>
        ) : null}
        <div className={compact ? 'h-9 bg-muted rounded-lg w-full' : 'h-10 bg-muted rounded-xl w-full mt-2'} />
      </div>
    </div>
  );
}
