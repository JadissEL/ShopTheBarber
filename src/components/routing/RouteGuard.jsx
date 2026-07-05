import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useBooking } from '@/components/context/BookingContext';
import { createPageUrl, signInUrlWithReturn } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { getZoneFromPath, APP_ZONES } from '@/components/navigationConfig';
import { useEffectiveRole } from '@/hooks/useEffectiveRole';
import { getProviderIntent } from '@/lib/bootstrapProvider';

/** Build SignIn URL with return path so user is sent back after login */
function buildSignInRedirect(currentPath) {
  return signInUrlWithReturn(currentPath || '/');
}

/** Clerk session exists but backend user is not ready, never send to SignIn (Clerk would bounce back). */
function handleMissingBackendUser({ isSignedIn, syncStatus, path, navigate }) {
  if (!isSignedIn) return false;

  if (syncStatus === 'error' && path !== '/setupguide') {
    navigate(createPageUrl('SetupGuide'), { replace: true });
  }
  return true;
}

/** Employer-only pages: require barber/shop_owner/admin (job poster role) */
const EMPLOYER_PATHS = ['/createjob', '/myjobs', '/applicantreview', '/scheduleinterview'];

export default function RouteGuard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoadingAuth, isSignedIn, syncStatus } = useAuth();
  const { effectiveRole, isProvider, isLoading: roleLoading, workspace } = useEffectiveRole();
  const { bookingState } = useBooking();
  const path = location.pathname.toLowerCase();
  const zone = getZoneFromPath(path);

  // Check if user is a shop owner/manager (for guarded Ops pages)
  const { data: isManager, isLoading: isManagerLoading } = useQuery({
    queryKey: ['isManager', user?.id],
    queryFn: async () => {
        if (!user) return false;
        const members = await sovereign.entities.ShopMember.filter({ user_id: user.id });
        return members.some(m => ['owner', 'manager'].includes(m.role));
    },
    enabled: !!user
  });

  useEffect(() => {
    if (isLoadingAuth || isManagerLoading || roleLoading) return; // Wait for Clerk + backend sync and manager check

    const isProviderRole = isProvider;
    const providerIntent = getProviderIntent();
    const hasProviderWorkspace = Boolean(workspace?.barber || workspace?.ownerMembership);

    // 1. Booking Flow Protection
    if (path.includes('/payment') || path.includes('/bookingconfirm')) {
        const urlParams = new URLSearchParams(window.location.search);
        const hasUrlState = urlParams.has('bookingId') || (urlParams.has('amount') && urlParams.has('serviceName'));
        if (!hasUrlState && !bookingState.selectedService) {
           // Optional: redirect to Explore if no booking context
        }
    }

    // 2. CLIENT ZONE: Require authentication (dashboard, account, bookings, cart, etc.)
    if (zone === APP_ZONES.CLIENT) {
      if (!user) {
        if (handleMissingBackendUser({ isSignedIn, syncStatus, path, navigate })) return;
        navigate(buildSignInRedirect(location.pathname + location.search), { replace: true });
        return;
      }
    }

    // 3. PROVIDER ZONE: Require auth + provider role (or active provider workspace)
    if (zone === APP_ZONES.PROVIDER) {
      if (!user) {
        if (handleMissingBackendUser({ isSignedIn, syncStatus, path, navigate })) return;
        navigate(buildSignInRedirect(location.pathname), { replace: true });
        return;
      }
      if (!isProviderRole) {
        if (providerIntent && !hasProviderWorkspace) {
          navigate(createPageUrl('SetupGuide'), { replace: true });
          return;
        }
        navigate(createPageUrl('Dashboard'), { replace: true });
        return;
      }
      const managerPages = [
        '/staffroster',
        '/staffschedule',
        '/shopemployeemanagement',
        '/networkownerdashboard',
        '/shopinventorymanagement',
        '/shopexpensetracking',
        '/shopbrandingmanagement',
        '/shopanalytics',
      ];
      if (managerPages.some((p) => path.includes(p)) && isManager === false) {
          navigate(createPageUrl('ProviderDashboard'), { replace: true });
      }
    }

    // 4. ADMIN ZONE: Require auth + admin role
    if (zone === APP_ZONES.ADMIN) {
      if (!user) {
        if (handleMissingBackendUser({ isSignedIn, syncStatus, path, navigate })) return;
        navigate(buildSignInRedirect(location.pathname), { replace: true });
        return;
      }
      if (effectiveRole !== 'admin') {
        navigate(createPageUrl('Home'), { replace: true });
      }
    }

    // 5. Employer-only routes (job posting/applicant management): require auth + barber/shop_owner/admin
    const isEmployerRoute = EMPLOYER_PATHS.some(p => path === p || path.startsWith(`${p  }/`));
    if (isEmployerRoute && user && !isProviderRole) {
      navigate(createPageUrl('CareerHub'), { replace: true });
    }

    // 6. Providers must not land on the client dashboard
    if (path === '/dashboard' && isProviderRole && effectiveRole !== 'admin') {
        navigate(createPageUrl('ProviderDashboard'), { replace: true });
    }

    // 7. Clients without provider workspace should not stay on provider dashboard
    if (path === '/providerdashboard' && user && !isProviderRole && !providerIntent && !hasProviderWorkspace) {
        navigate(createPageUrl('Dashboard'), { replace: true });
    }
  }, [location, user, effectiveRole, isProvider, roleLoading, workspace, isLoadingAuth, isSignedIn, syncStatus, isManagerLoading, isManager, bookingState, navigate, path, zone]);

  return null;
}
