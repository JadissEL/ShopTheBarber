import { cn } from '@/lib/utils';

export default function ShopCardSkeleton({ className }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border/60 bg-card overflow-hidden animate-pulse ring-1 ring-border/50',
        className
      )}
      aria-hidden
    >
      <div className="aspect-[16/9] bg-muted" />
      <div className="p-4 md:p-5 space-y-3">
        <div className="h-5 bg-muted rounded-lg w-3/4" />
        <div className="h-4 bg-muted rounded-lg w-1/2" />
        <div className="flex gap-2 pt-2">
          <div className="h-6 bg-muted rounded-full w-16" />
          <div className="h-6 bg-muted rounded-full w-14" />
        </div>
      </div>
    </div>
  );
}
