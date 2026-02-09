import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useBooking } from '@/components/context/BookingContext';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { getZoneFromPath, APP_ZONES } from '@/components/navigationConfig';

/** Build SignIn URL with return path so user is sent back after login */
function signInUrlWithReturn(currentPath) {
  const base = createPageUrl('SignIn');
  const returnPath = encodeURIComponent(currentPath || '/');
  return `${base}?return=${returnPath}`;
}

/** Employer-only pages: require barber/shop_owner/admin (job poster role) */
const EMPLOYER_PATHS = ['/createjob', '/myjobs', '/applicantreview', '/scheduleinterview'];

export default function RouteGuard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, isLoading } = useAuth();
  const { bookingState } = useBooking();
  const path = location.pathname.toLowerCase();
  const zone = getZoneFromPath(path);

  // Check if user is a shop owner/manager (for guarded Ops pages)
  const { data: isManager } = useQuery({
    queryKey: ['isManager', user?.id],
    queryFn: async () => {
        if (!user) return false;
        const members = await sovereign.entities.ShopMember.filter({ barber_id: user.id });
        return members.some(m => ['owner', 'manager'].includes(m.role));
    },
    enabled: !!user
  });

  useEffect(() => {
    if (isLoading) return;

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
        navigate(signInUrlWithReturn(location.pathname + location.search), { replace: true });
        return;
      }
    }

    // 3. PROVIDER ZONE: Require auth + provider role
    const isProviderRole = ['provider', 'barber', 'shop_owner', 'admin'].includes(role);
    if (zone === APP_ZONES.PROVIDER) {
      if (!user) {
        navigate(signInUrlWithReturn(location.pathname), { replace: true });
        return;
      }
      if (!isProviderRole) {
        navigate(createPageUrl('Dashboard'), { replace: true });
        return;
      }
      const managerPages = ['/staffroster', '/staffschedule', '/finances', '/inventorymanagement'];
      if (managerPages.some(p => path.includes(p)) && isManager === false) {
          navigate(createPageUrl('ProviderDashboard'), { replace: true });
      }
    }

    // 4. ADMIN ZONE: Require auth + admin role
    if (zone === APP_ZONES.ADMIN) {
      if (!user) {
        navigate(signInUrlWithReturn(location.pathname), { replace: true });
        return;
      }
      if (role !== 'admin') {
        navigate(createPageUrl('Home'), { replace: true });
      }
    }

    // 5. Employer-only routes (job posting/applicant management): require auth + barber/shop_owner/admin
    const isEmployerRoute = EMPLOYER_PATHS.some(p => path === p || path.startsWith(p + '/'));
    if (isEmployerRoute && user && !isProviderRole) {
      navigate(createPageUrl('CareerHub'), { replace: true });
    }

    // 6. Smart dashboard redirection: provider role lands on ProviderDashboard from /dashboard
    if (path === '/dashboard' && isProviderRole && role !== 'admin') {
        navigate(createPageUrl('ProviderDashboard'), { replace: true });
    }
  }, [location, user, role, isLoading, bookingState, navigate, path, zone]);

  return null;
}
