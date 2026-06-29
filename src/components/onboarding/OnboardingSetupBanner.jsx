import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { useOnboardingProgress } from '@/hooks/useOnboardingProgress';
import { dismissOnboarding, getSetupGuidePath, normalizeOnboardingRole, clearOnboardingRedirectSession } from '@/lib/onboardingWizard';
import OnboardingWizard from '@/components/onboarding/OnboardingWizard';

/**
 * @param {{ autoOpenModal?: boolean, audience?: 'client' | 'provider' | 'admin' }} props
 */
export default function OnboardingSetupBanner({ autoOpenModal = false, audience }) {
  const { showPrompt, progress, payoutReady, user, role } = useOnboardingProgress();
  const [modalOpen, setModalOpen] = useState(false);
  const [dismissedBanner, setDismissedBanner] = useState(false);
  const [autoShown, setAutoShown] = useState(false);

  const normalizedRole = normalizeOnboardingRole(role);
  const roleMatchesAudience =
    !audience ||
    (audience === 'client' && normalizedRole === 'client') ||
    (audience === 'provider' && (normalizedRole === 'provider' || role === 'shop_owner')) ||
    (audience === 'admin' && normalizedRole === 'admin');

  useEffect(() => {
    if (autoOpenModal && showPrompt && roleMatchesAudience && !autoShown && !dismissedBanner) {
      setModalOpen(true);
      setAutoShown(true);
    }
  }, [autoOpenModal, showPrompt, roleMatchesAudience, autoShown, dismissedBanner]);

  const openModal = () => setModalOpen(true);

  if (!showPrompt || dismissedBanner || !roleMatchesAudience) return null;

  const handleDismiss = () => {
    if (user?.id) dismissOnboarding(user.id, role);
    clearOnboardingRedirectSession();
    setDismissedBanner(true);
  };

  const label =
    normalizedRole === 'admin'
      ? 'admin tour'
      : normalizedRole === 'provider' || role === 'shop_owner'
        ? 'provider setup'
        : 'client guide';

  const isProviderAudience =
    audience === 'provider' && (normalizedRole === 'provider' || role === 'shop_owner');
  const displayPercent = isProviderAudience ? payoutReady.percent : progress.percent;
  const displayDone = isProviderAudience ? payoutReady.done : progress.requiredDone || progress.done;
  const displayTotal = isProviderAudience ? payoutReady.total : progress.requiredTotal || progress.total;

  return (
    <>
      <Card className="mb-6 border-salmon/30 stb-onboarding-soft overflow-hidden">
        <CardContent className="p-4 md:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <p className="font-semibold text-foreground">
              {isProviderAudience ? 'Finish setup, open for bookings' : `Complete your ${label}`}
            </p>
            <p className="text-sm text-muted-foreground">
              {isProviderAudience
                ? `${displayDone} of ${displayTotal} steps to payout-ready (${displayPercent}%)`
                : `${displayDone} of ${displayTotal} steps done, learn the dashboard and finish required setup.`}
            </p>
            <Progress value={displayPercent} className="h-1.5 max-w-xs" />
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button asChild size="sm" className="rounded-xl">
              <Link to={getSetupGuidePath()}>
                Continue guide <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
            <Button size="sm" variant="outline" className="rounded-xl" onClick={openModal}>
              Quick tour
            </Button>
            <Button size="sm" variant="ghost" className="rounded-xl text-muted-foreground" onClick={handleDismiss}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-4xl p-0 gap-0 border-0 bg-transparent shadow-none">
          <OnboardingWizard mode="dialog" onClose={() => { clearOnboardingRedirectSession(); setModalOpen(false); }} />
        </DialogContent>
      </Dialog>
    </>
  );
}
