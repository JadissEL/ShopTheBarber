import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import OnboardingWizard from '@/components/onboarding/OnboardingWizard';
import SetupGuideHeader from '@/components/onboarding/SetupGuideHeader';
import { PageLoading } from '@/components/ui/page-loading';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { createPageUrl } from '@/utils';

const SETUP_LOADING_TIMEOUT_MS = 15_000;

const DEFAULT_SYNC_ERROR =
  'Could not connect your account to the server. Check that the API is running and CLERK_SECRET_KEY is set in server/.env.';

function SetupGuideSyncError({ message, onRetry, onSignOut }) {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <Card className="max-w-lg w-full border-destructive/30 shadow-lg">
        <CardContent className="p-8 space-y-5 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-destructive" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold">Account setup could not finish</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>
          </div>
          <ul className="text-left text-sm text-muted-foreground space-y-2 bg-muted/50 rounded-xl p-4">
            <li>Confirm the API is running on port 3001 (<code className="text-xs">npm run dev</code> in <code className="text-xs">server/</code>).</li>
            <li>Set <code className="text-xs">CLERK_SECRET_KEY</code> in <code className="text-xs">server/.env</code> (same Clerk app as <code className="text-xs">VITE_CLERK_PUBLISHABLE_KEY</code>).</li>
            <li>Restart the API after changing env vars, then retry.</li>
          </ul>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button type="button" onClick={onRetry} className="rounded-xl">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
            <Button type="button" variant="outline" onClick={onSignOut} className="rounded-xl">
              Sign out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/** Full-page setup guide, role-aware; requires sign-in */
export default function SetupGuide() {
  const {
    isAuthenticated,
    isLoadingAuth,
    isLoading,
    isSignedIn,
    syncStatus,
    syncError,
    retrySync,
    logout,
  } = useAuth();
  const navigate = useNavigate();
  const [timedOut, setTimedOut] = useState(false);

  const stillSyncing =
    isSignedIn && syncStatus !== 'ready' && syncStatus !== 'error';
  const syncFailed = syncStatus === 'error' || timedOut;

  useEffect(() => {
    if (!stillSyncing) {
      setTimedOut(false);
      return undefined;
    }

    const timer = window.setTimeout(() => setTimedOut(true), SETUP_LOADING_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [stillSyncing]);

  useEffect(() => {
    if (isLoading || isLoadingAuth) return;
    if (!isSignedIn) {
      navigate(`${createPageUrl('SignIn')}?redirect=${encodeURIComponent('/SetupGuide')}`, {
        replace: true,
      });
    }
  }, [isLoading, isLoadingAuth, isSignedIn, navigate]);

  if ((isLoading || isLoadingAuth) && !isSignedIn) {
    return <PageLoading message="Loading guide..." />;
  }

  if (!isSignedIn) return null;

  if (syncFailed) {
    return (
      <>
        <SetupGuideHeader />
        <SetupGuideSyncError
          message={syncError || DEFAULT_SYNC_ERROR}
          onRetry={() => {
            setTimedOut(false);
            void retrySync();
          }}
          onSignOut={() => void logout(true)}
        />
      </>
    );
  }

  if (stillSyncing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm">Connecting your account…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <SetupGuideHeader />
        <SetupGuideSyncError
          message={syncError || DEFAULT_SYNC_ERROR}
          onRetry={() => void retrySync()}
          onSignOut={() => void logout(true)}
        />
      </>
    );
  }

  return (
    <>
      <SetupGuideHeader />
      <OnboardingWizard mode="page" />
    </>
  );
}
