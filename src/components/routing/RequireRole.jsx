import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useEffectiveRole } from '@/hooks/useEffectiveRole';
import { dashboardPageForRole } from '@/lib/userRole';
import { PageLoading } from '@/components/ui/page-loading';

/**
 * Redirects when the signed-in user's effective role is not allowed.
 *
 * @param {{
 *   allow?: string[],
 *   deny?: string[],
 *   redirectTo?: string,
 *   children: import('react').ReactNode,
 * }} props
 */
export default function RequireRole({ allow = [], deny = [], redirectTo, children }) {
  const { effectiveRole, isLoading } = useEffectiveRole();
  const navigate = useNavigate();

  const fallback = redirectTo || dashboardPageForRole(effectiveRole);
  const denied = deny.includes(effectiveRole);
  const notAllowed = allow.length > 0 && !allow.includes(effectiveRole);
  const blocked = denied || notAllowed;

  useEffect(() => {
    if (isLoading || !blocked) return;
    navigate(createPageUrl(fallback), { replace: true });
  }, [isLoading, blocked, fallback, navigate]);

  if (isLoading) return <PageLoading message="Loading..." />;
  if (blocked) return null;

  return children;
}
