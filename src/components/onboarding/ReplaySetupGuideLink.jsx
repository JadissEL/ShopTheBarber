import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { getSetupGuidePath, resetOnboarding } from '@/lib/onboardingWizard';
import { useAuth } from '@/lib/AuthContext';
import { useOnboardingProgress } from '@/hooks/useOnboardingProgress';
import { cn } from '@/lib/utils';

/** Link to replay the role-aware setup guide */
export function ReplaySetupGuideLink({ className = '' }) {
  const { user } = useAuth();
  const { role } = useOnboardingProgress();

  const handleReplay = () => {
    if (user?.id) resetOnboarding(user.id, role);
  };

  return (
    <Link
      to={getSetupGuidePath()}
      onClick={handleReplay}
      className={cn(
        'inline-flex items-center justify-center rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-muted transition-colors',
        className,
      )}
    >
      <Sparkles className="w-4 h-4 mr-2" />
      Replay setup guide
    </Link>
  );
}
