import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        success: "border-transparent bg-success/10 text-success hover:bg-success/15",
        warning: "border-transparent bg-warning/15 text-foreground hover:bg-warning/25",
        danger: "border-transparent bg-destructive/10 text-destructive hover:bg-destructive/15",
        info: "border-transparent bg-primary/10 text-primary hover:bg-primary/15",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export function StatusBadge({ className, variant, status, children, ...props }) {
  let computedVariant = variant || "default";

  if (!variant && status) {
    const lowerStatus = status.toLowerCase();
    if (['active', 'completed', 'confirmed', 'sent', 'seated', 'success', 'done', 'paid', 'enabled', 'running'].includes(lowerStatus)) computedVariant = 'success';
    else if (['pending', 'waiting', 'scheduled', 'processing', 'in_progress'].includes(lowerStatus)) computedVariant = 'warning';
    else if (['cancelled', 'failed', 'inactive', 'rejected', 'blocked', 'disabled', 'removed'].includes(lowerStatus)) computedVariant = 'danger';
    else if (['in progress', 'ongoing', 'work', 'personal', 'shopping', 'health', 'learning'].includes(lowerStatus)) computedVariant = 'info';
  }

  return (
    <span className={cn(badgeVariants({ variant: computedVariant }), className)} {...props}>
      {children || status}
    </span>
  );
}