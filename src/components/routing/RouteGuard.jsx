import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useBooking } from '@/components/context/BookingContext';
import { createPageUrl, signInUrlWithReturn } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { getZoneFromPath, APP_ZONES } from '@/components/navigationConfig';
import { useEffectiveRole } from '@/hooks/useEffectiveRole';
import {
  isAdminRole,
  canAccessBookingProviderTools,
} from '@/lib/userRole';
import { dashboardPageForAccountType as dashboardPage } from '@/lib/accountType';

function buildSignInRedirect(currentPath) {
  return signInUrlWithReturn(currentPath || '/');
}

function handleMissingBackendUser({ isSignedIn, syncStatus, path, navigate }) {
  if (!isSignedIn) return false;

  if (syncStatus === 'needs_provision' && path !== '/chooseaccounttype' && path !== '/register') {
    return true;
  }

  if (syncStatus === 'error' && path !== '/setupguide') {
    navigate(createPageUrl('SetupGuide'), { replace: true });
  }
  return true;
}

const EMPLOYER_PATHS = ['/createjob', '/myjobs', '/applicantreview', '/scheduleinterview'];

const BOOKING_PROVIDER_PATHS = [
  '/providerdashboard',
  '/providerbookings',
  '/providermessages',
  '/providersettings',
  '/providerpayouts',
  '/clientlist',
  '/staffroster',
  '/staffschedule',
];

const EMPLOYER_ACCOUNT_TYPES = new Set(['solo_barber', 'shop', 'seller', 'company']);

export default function RouteGuard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoadingAuth, isSignedIn, syncStatus } = useAuth();
  const {
    effectiveRole,
    accountType,
    isProvider,
    isAdmin,
    isBookingProvider,
    isLoading: roleLoading,
  } = useEffectiveRole();
  const { bookingState } = useBooking();
  const path = location.pathname.toLowerCase();
  const zone = getZoneFromPath(path, {
    isAuthenticated: !!user,
    role: effectiveRole,
    accountType,
  });

  const homeDashboard = accountType
    ? createPageUrl(dashboardPage(accountType))
    : createPageUrl('Dashboard');

  const { data: isManager, isLoading: isManagerLoading } = useQuery({
    queryKey: ['isManager', user?.id],
    queryFn: async () => {
      if (!user) return false;
      const members = await sovereign.entities.ShopMember.filter({ user_id: user.id });
      return members.some((m) => ['owner', 'manager'].includes(m.role));
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (isLoadingAuth || isManagerLoading || roleLoading) return;

    if (isAdmin) {
      if (path === '/dashboard' || path === '/providerdashboard' || path === '/sellerdashboard' || path === '/companydashboard' || path === '/bloggerdashboard') {
        navigate(createPageUrl('GlobalFinancials'), { replace: true });
        return;
      }
    }

    const protectedZones = [
      APP_ZONES.CLIENT,
      APP_ZONES.PROVIDER,
      APP_ZONES.SELLER,
      APP_ZONES.COMPANY,
      APP_ZONES.BLOGGER,
      APP_ZONES.ADMIN,
    ];

    if (protectedZones.includes(zone) && !user) {
      if (handleMissingBackendUser({ isSignedIn, syncStatus, path, navigate })) return;
      navigate(buildSignInRedirect(location.pathname + location.search), { replace: true });
      return;
    }

    if (zone === APP_ZONES.PROVIDER && user && !isBookingProvider) {
      navigate(homeDashboard, { replace: true });
      return;
    }

    if (zone === APP_ZONES.ADMIN && user && !isAdminRole(effectiveRole)) {
      navigate(createPageUrl('Home'), { replace: true });
      return;
    }

    if (user && accountType && !canAccessBookingProviderTools(accountType)) {
      if (BOOKING_PROVIDER_PATHS.some((p) => path === p || path.startsWith(`${p}/`))) {
        navigate(homeDashboard, { replace: true });
        return;
      }
    }

    if (path === '/chat' && user && isProvider) {
      const search = location.search || '';
      navigate(`${createPageUrl('ProviderMessages')}${search}`, { replace: true });
      return;
    }

    const isEmployerRoute = EMPLOYER_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
    if (isEmployerRoute && user && accountType && !EMPLOYER_ACCOUNT_TYPES.has(accountType)) {
      navigate(createPageUrl('CareerHub'), { replace: true });
      return;
    }

    if (user && accountType) {
      const expected = createPageUrl(dashboardPage(accountType)).toLowerCase();
      const legacyRedirects = [
        ['/dashboard', ['solo_barber', 'shop', 'seller', 'company', 'blogger']],
        ['/providerdashboard', ['seller', 'company', 'blogger', 'client']],
        ['/sellerdashboard', ['solo_barber', 'shop', 'company', 'blogger', 'client']],
        ['/companydashboard', ['solo_barber', 'shop', 'seller', 'blogger', 'client']],
        ['/bloggerdashboard', ['solo_barber', 'shop', 'seller', 'company', 'client']],
      ];
      for (const [legacyPath, wrongTypes] of legacyRedirects) {
        if (path === legacyPath && wrongTypes.includes(accountType)) {
          navigate(homeDashboard, { replace: true });
          return;
        }
      }
      if (path !== expected.replace(/\/$/, '') && legacyRedirects.some(([lp]) => lp === path)) {
        /* handled above */
      }
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
  }, [
    location,
    user,
    accountType,
    effectiveRole,
    isProvider,
    isAdmin,
    isBookingProvider,
    roleLoading,
    isLoadingAuth,
    isSignedIn,
    syncStatus,
    isManagerLoading,
    isManager,
    bookingState,
    navigate,
    path,
    zone,
    homeDashboard,
  ]);

  return null;
}
