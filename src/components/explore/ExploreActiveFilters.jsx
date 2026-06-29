import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

function ActivePill({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 pl-3 pr-1.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="p-0.5 rounded-full hover:bg-primary/15 transition-colors"
        aria-label={`Remove ${label} filter`}
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

export default function ExploreActiveFilters({ items, onClearAll, className }) {
  if (!items.length) return null;

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 py-2 md:py-3 mb-2 border-b border-border/40',
        className
      )}
      aria-label="Active filters"
    >
      <span className="text-xs font-medium text-muted-foreground mr-1">Active</span>
      {items.map((item) => (
        <ActivePill key={item.id} label={item.label} onRemove={item.onRemove} />
      ))}
      {items.length > 1 ? (
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs font-semibold text-muted-foreground hover:text-foreground underline-offset-2 hover:underline ml-1"
        >
          Clear all
        </button>
      ) : null}
    </div>
  );
}
