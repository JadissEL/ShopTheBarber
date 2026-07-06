import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/lib/AuthContext';
import { useEffectiveRole } from '@/hooks/useEffectiveRole';
import { dashboardPageForRole } from '@/lib/userRole';
import { cn } from '@/lib/utils';

function dashboardLinkLabel(page) {
  if (page === 'GlobalFinancials') return 'Return to admin';
  if (page === 'ProviderDashboard') return 'Return to dashboard';
  return 'Return to dashboard';
}

/**
 * Role-aware link back to the signed-in user's home dashboard, or marketing home for guests.
 */
export default function RoleDashboardLink({
  className,
  guestPage = 'Home',
  guestLabel = 'Back to home',
}) {
  const { isAuthenticated } = useAuth();
  const { effectiveRole } = useEffectiveRole();

  if (!isAuthenticated) {
    return (
      <Link to={createPageUrl(guestPage)} className={cn('text-primary hover:underline', className)}>
        {guestLabel}
      </Link>
    );
  }

  const page = dashboardPageForRole(effectiveRole);

  return (
    <Link to={createPageUrl(page)} className={cn('text-primary hover:underline', className)}>
      {dashboardLinkLabel(page)}
    </Link>
  );
}
