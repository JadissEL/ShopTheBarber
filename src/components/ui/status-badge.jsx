import { cva } from 'class-variance-authority';
import { cn } from '@/components/utils';

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        success: "border-transparent bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300",
        warning: "border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300",
        danger: "border-transparent bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300",
        info: "border-transparent bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300",
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