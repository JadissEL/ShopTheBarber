import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useOnboardingProgress } from '@/hooks/useOnboardingProgress';
import { getSetupGuidePath, ONBOARDING_REDIRECT_ONCE_KEY } from '@/lib/onboardingWizard';

const ENTRY_PATHS = new Set([
  '/dashboard',
  '/providerdashboard',
  '/globalfinancials',
]);

/**
 * One-time redirect to setup guide after sign-in when onboarding is incomplete.
 */
export default function OnboardingRedirect() {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const { showPrompt } = useOnboardingProgress();
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname.toLowerCase().replace(/\/$/, '') || '/';

  useEffect(() => {
    if (isLoadingAuth || !isAuthenticated) return;
    if (path === '/setupguide') return;
    if (!ENTRY_PATHS.has(path)) return;
    if (!showPrompt) return;

    try {
      if (sessionStorage.getItem(ONBOARDING_REDIRECT_ONCE_KEY) === '1') return;
      sessionStorage.setItem(ONBOARDING_REDIRECT_ONCE_KEY, '1');
    } catch {
      /* ignore */
    }

    navigate(getSetupGuidePath(), { replace: true });
  }, [isLoadingAuth, isAuthenticated, path, showPrompt, navigate]);

  return null;
}
