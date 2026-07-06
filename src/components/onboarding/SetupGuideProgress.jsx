import { useOnboardingProgress } from '@/hooks/useOnboardingProgress';
import { cn } from '@/lib/utils';

/** Inline provider payout progress — shown inside the dashboard shell on Setup Guide. */
export default function SetupGuideProgress({ className }) {
  const { payoutReady } = useOnboardingProgress();

  if (!payoutReady?.total) return null;

  return (
    <p className={cn('text-sm text-muted-foreground', className)}>
      Payout setup:{' '}
      <span className="text-foreground font-medium">{payoutReady.percent}% complete</span>
    </p>
  );
}
