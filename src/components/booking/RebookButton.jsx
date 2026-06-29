import { CalendarPlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useRebook } from '@/hooks/useRebook';
import { canRebookBooking } from '@/lib/rebook';

/**
 * One-click rebook for any completed/past booking (shop, independent, mobile, group).
 */
export default function RebookButton({
  booking,
  size = 'sm',
  variant = 'default',
  className,
  label = 'Book again',
  showIcon = true,
}) {
  const { rebook, isRebooking } = useRebook();

  if (!canRebookBooking(booking)) return null;

  const isPrimary = variant === 'default';

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      disabled={isRebooking}
      className={cn(
        isPrimary && 'bg-primary text-primary-foreground hover:opacity-95 font-semibold',
        className
      )}
      onClick={() => rebook(booking)}
    >
      {isRebooking ? (
        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
      ) : showIcon ? (
        <CalendarPlus className="w-4 h-4 mr-1" />
      ) : null}
      {label}
    </Button>
  );
}
