import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { stb } from '@/lib/stbUi';

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
}) {
  return (
    <div className={cn(stb.surface, "flex flex-col items-center justify-center py-16 px-4 text-center", className)}>
      {Icon && (
        <div className={cn(stb.iconBox, "mb-6")}>
          <Icon className="w-7 h-7" />
        </div>
      )}
      <h3 className={cn(stb.uiHeading, "text-lg mb-2")}>{title}</h3>
      {description && (
        <p className={cn(stb.body, "max-w-sm mb-6")}>{description}</p>
      )}
      {actionLabel && actionHref && (
        <Link to={actionHref}>
          <Button>{actionLabel}</Button>
        </Link>
      )}
      {actionLabel && onAction && !actionHref && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}

/** Consistent empty panel inside tabbed dashboards — always visible when a tab has no data. */
export function TabPanelEmptyState(props) {
  return (
    <EmptyState
      {...props}
      className={cn(
        'min-h-[220px] border border-dashed border-border rounded-lg bg-muted/20 py-12',
        props.className,
      )}
    />
  );
}
