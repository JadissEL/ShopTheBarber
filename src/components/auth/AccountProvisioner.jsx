import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { createPageUrl } from '@/utils';
import {
  getPendingAccountType,
  getSignupIntentToken,
  clearSignupSession,
} from '@/lib/signupIntent';
import { dashboardPageForAccountType } from '@/lib/accountType';
import { PageLoading } from '@/components/ui/page-loading';

const AUTH_FLOW_PATHS = new Set(['/chooseaccounttype', '/register', '/login', '/setupguide']);

/**
 * After Clerk auth: provisions DB user with chosen account type, then routes to dashboard.
 */
export default function AccountProvisioner() {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname.toLowerCase();
  const { isSignedIn, syncStatus, provisionAccount, user } = useAuth();

  useEffect(() => {
    if (!isSignedIn || syncStatus === 'syncing') return;

    if (user?.id && user?.account_type) {
      clearSignupSession();
      return;
    }

    if (syncStatus !== 'needs_provision') return;

    const accountType = getPendingAccountType();
    const token = getSignupIntentToken();
    if (!accountType) {
      if (!AUTH_FLOW_PATHS.has(path)) {
        navigate(createPageUrl('ChooseAccountType'), { replace: true });
      }
      return;
    }

    void provisionAccount(accountType, token).then((result) => {
      if (result?.ok) {
        clearSignupSession();
        const page = dashboardPageForAccountType(result.accountType || accountType);
        navigate(createPageUrl(page), { replace: true });
      } else if (result?.code === 'ACCOUNT_TYPE_CONFLICT') {
        clearSignupSession();
        navigate(`${createPageUrl('SignIn')}?error=account_type_conflict`, { replace: true });
      }
    });
  }, [isSignedIn, syncStatus, user, provisionAccount, navigate, path]);

  if (
    syncStatus === 'needs_provision' &&
    getPendingAccountType() &&
    !AUTH_FLOW_PATHS.has(path)
  ) {
    return <PageLoading message="Setting up your account…" />;
  }

  return null;
}
