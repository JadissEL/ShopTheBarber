import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useOnboardingProgress } from '@/hooks/useOnboardingProgress';
import { useEffectiveRole } from '@/hooks/useEffectiveRole';
import { getSetupGuidePath, ONBOARDING_REDIRECT_ONCE_KEY, shouldShowOnboardingPrompt, isOnboardingRedirectComplete } from '@/lib/onboardingWizard';

const ENTRY_PATHS = new Set([
  '/dashboard',
  '/providerdashboard',
  '/globalfinancials',
  '/sellerdashboard',
  '/companydashboard',
  '/bloggerdashboard',
]);

/**
 * One-time redirect to setup guide after sign-in when onboarding is incomplete.
 */
export default function OnboardingRedirect() {
  const { isAuthenticated, isLoadingAuth, user } = useAuth();
  const { progress } = useOnboardingProgress();
  const { effectiveRole, isProvider, isLoading: roleLoading } = useEffectiveRole();
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname.toLowerCase().replace(/\/$/, '') || '/';

  useEffect(() => {
    if (isLoadingAuth || roleLoading || !isAuthenticated || !user?.id) return;
    if (path === '/setupguide') return;
    if (!ENTRY_PATHS.has(path)) return;
    if (isOnboardingRedirectComplete()) return;
    if (isProvider) return;
    if (!shouldShowOnboardingPrompt(user.id, effectiveRole, progress)) return;

    try {
      if (sessionStorage.getItem(ONBOARDING_REDIRECT_ONCE_KEY) === '1') return;
      sessionStorage.setItem(ONBOARDING_REDIRECT_ONCE_KEY, '1');
    } catch {
      /* ignore */
    }

    navigate(getSetupGuidePath(), { replace: true });
  }, [isLoadingAuth, roleLoading, isAuthenticated, user?.id, effectiveRole, isProvider, progress, path, navigate]);

  return null;
}
