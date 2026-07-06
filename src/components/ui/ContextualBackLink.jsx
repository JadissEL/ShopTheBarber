import { Link, useLocation } from 'react-router-dom';

import { ArrowLeft } from 'lucide-react';

import { createPageUrl } from '@/utils';

import { useAuth } from '@/lib/AuthContext';

import { useEffectiveRole } from '@/hooks/useEffectiveRole';

import { useDashboardShell } from '@/components/layout/DashboardShellContext';

import { getDashboardBackLink } from '@/lib/dashboardBreadcrumbs';
import { dashboardPageForRole } from '@/lib/userRole';

import { cn } from '@/lib/utils';

import { stb } from '@/lib/stbUi';



/**

 * Back link that routes to the breadcrumb parent in the dashboard shell,

 * otherwise Dashboard (signed in) or Home (guest).

 */

export default function ContextualBackLink({ className, label }) {

  const { isAuthenticated } = useAuth();

  const { effectiveRole } = useEffectiveRole();

  const location = useLocation();

  const inShell = useDashboardShell();

  const backLink = inShell && isAuthenticated
    ? getDashboardBackLink(location.pathname, { role: effectiveRole })
    : null;

  const to = backLink?.href
    ?? createPageUrl(isAuthenticated ? dashboardPageForRole(effectiveRole) : 'Home');

  const defaultLabel = isAuthenticated
    ? `Back to ${dashboardPageForRole(effectiveRole) === 'GlobalFinancials' ? 'Admin' : 'Dashboard'}`
    : 'Back to Home';

  const text = label ?? (backLink?.label ? `Back to ${backLink.label}` : defaultLabel);



  return (

    <Link

      to={to}

      className={cn(

        'inline-flex items-center gap-2 font-sans text-sm font-medium text-primary hover:text-primary/80 transition-colors',

        stb.focusRing,

        className,

      )}

    >

      <ArrowLeft className="w-4 h-4" /> {text}

    </Link>

  );

}
