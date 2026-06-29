import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';

export default function ExploreEmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
  onClearFilters,
  variant,
}) {
  return (
    <div className="col-span-full">
      <EmptyState
        icon={icon}
        title={title}
        description={message}
        className={variant === 'error' ? 'py-16 md:py-20' : 'py-16 md:py-24'}
      />
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 -mt-4 pb-8">
        {actionLabel && onAction ? (
          <Button onClick={onAction} className="rounded-xl">
            {actionLabel}
          </Button>
        ) : null}
        {onClearFilters ? (
          <Button variant="outline" onClick={onClearFilters} className="rounded-xl">
            Clear filters
          </Button>
        ) : null}
      </div>
    </div>
  );
}
