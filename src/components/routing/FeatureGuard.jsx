import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { isPathFeatureEnabled, FEATURE_MODULES, getFeatureForPage } from '@/lib/featureRegistry';
import { useEffectiveRole } from '@/hooks/useEffectiveRole';
import { dashboardPageForRole } from '@/lib/userRole';
import { toast } from 'sonner';

/**
 * Redirects when the current route belongs to a disabled feature module.
 * Deep links remain registered; users see a friendly redirect instead of partial UI.
 */
export default function FeatureGuard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { effectiveRole, isLoading } = useEffectiveRole();
  const path = location.pathname;

  useEffect(() => {
    if (isLoading) return;
    if (isPathFeatureEnabled(path)) return;

    const segment = path.replace(/^\//, '').split('/')[0] || '';
    const pageKey = segment.charAt(0).toUpperCase() + segment.slice(1);
    const featureId = getFeatureForPage(pageKey);
    const mod = FEATURE_MODULES[featureId];
    const label = mod?.label ?? 'This feature';

    toast.message(`${label} is not available`, {
      description: 'This module may be disabled for your environment.',
    });
    navigate(createPageUrl(dashboardPageForRole(effectiveRole)), { replace: true });
  }, [path, navigate, effectiveRole, isLoading]);

  return null;
}
