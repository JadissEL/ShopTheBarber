import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Home,
  LayoutDashboard,
  ArrowLeft,
  Gift,
  User,
  Settings,
  Calendar,
  LogIn,
  Scissors,
  Store
} from 'lucide-react';
import { createPageUrl } from '@/utils';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import { getZoneFromPath, APP_ZONES } from '@/components/navigationConfig';
import { useAuth } from '@/lib/AuthContext';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import {
  getNavigationVisibility,
  getDashboardPath,
  NAV_ITEMS,
  shouldUseDarkHeader
} from '@/components/navigation/navigationVisibility';
import { shouldHideGlobalNavOnMobile } from '@/lib/mobileLayout';
import { isNavActive } from '@/lib/navActive';
import { stb } from '@/lib/stbUi';
import { cn } from '@/lib/utils';

/**
 * GLOBAL NAVIGATION COMPONENT
 *
 * POSITIONING STRATEGY: sticky (not fixed)
 */
export default function GlobalNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, isAuthenticated, isLoading } = useAuth();
  const path = location.pathname.toLowerCase();
  const zone = getZoneFromPath(path);
  const isDesktop = useIsDesktop();

  if (zone === APP_ZONES.CLIENT && isDesktop) {
    return null;
  }

  if (
    shouldHideGlobalNavOnMobile({
      pathname: path,
      zone,
      isAuthenticated,
      isDesktop,
      role,
    })
  ) {
    return null;
  }

  const visibility = getNavigationVisibility({
    pathname: path,
    isAuthenticated,
    role,
    zone
  });

  const isDark = shouldUseDarkHeader(zone, path);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  if (path === '/dashboard' || path === '/providerdashboard') {
    return null;
  }

  const headerBaseClasses = cn(
    'w-full px-4 h-14 flex items-center sticky top-0 z-50 transition-all duration-300 ease-out font-sans',
    stb.glass,
  );

  if (isLoading) {
    return (
      <header className={headerBaseClasses}>
        <div className={cn(stb.container, 'flex items-center max-w-7xl')}>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg border border-white/20 flex items-center justify-center">
              <Scissors className="w-4 h-4 text-primary-foreground transform -rotate-45" />
            </div>
            <span className="text-white font-display uppercase text-lg tracking-wider">ShopTheBarber</span>
          </Link>
        </div>
      </header>
    );
  }

  const navigationItems = [];

  if (visibility[NAV_ITEMS.HOME]) {
    navigationItems.push({
      icon: Home,
      label: 'Home',
      path: isAuthenticated ? getDashboardPath(role) : 'Home'
    });
  }

  const dashboardPath = getDashboardPath(role);
  if (visibility[NAV_ITEMS.DASHBOARD]) {
    const homePath = isAuthenticated ? dashboardPath : 'Home';
    if (dashboardPath !== homePath || !visibility[NAV_ITEMS.HOME]) {
      navigationItems.push({
        icon: LayoutDashboard,
        label: 'Dashboard',
        path: dashboardPath
      });
    }
  }

  if (visibility[NAV_ITEMS.EXPLORE]) {
    navigationItems.push({
      icon: Store,
      label: 'Explore',
      path: 'Explore'
    });
  }

  if (visibility[NAV_ITEMS.BOOKINGS]) {
    navigationItems.push({
      icon: Calendar,
      label: 'Bookings',
      path: 'ProviderBookings'
    });
  }

  if (visibility[NAV_ITEMS.LOYALTY]) {
    navigationItems.push({
      icon: Gift,
      label: 'Loyalty',
      path: 'Loyalty'
    });
  }

  if (visibility[NAV_ITEMS.PROFILE]) {
    navigationItems.push({
      icon: User,
      label: 'Profile',
      path: 'AccountSettings'
    });
  }

  if (visibility[NAV_ITEMS.SETTINGS]) {
    navigationItems.push({
      icon: Settings,
      label: 'Settings',
      path: role === 'admin' ? 'AdminUserModeration' : 'ProviderSettings'
    });
  }

  const textColor = 'text-white';
  const hoverBg = 'hover:bg-white/10';

  return (
    <header className={headerBaseClasses}>
      <div className={cn(stb.container, 'flex items-center gap-2 max-w-7xl')}>
        {visibility[NAV_ITEMS.BACK_BUTTON] && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className={cn('gap-2 rounded-lg font-sans', hoverBg, textColor, 'transition-colors')}
            title="Go Back"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline-block">Back</span>
          </Button>
        )}

        {visibility[NAV_ITEMS.LOGO] && (
          <Link to="/" className="flex items-center gap-2 ml-2">
            <div className="w-8 h-8 bg-primary rounded-lg border border-white/20 flex items-center justify-center shadow-md">
              <Scissors className="w-4 h-4 text-primary-foreground transform -rotate-45" />
            </div>
            <span className="text-white font-display uppercase text-lg tracking-wider hidden sm:block">ShopTheBarber</span>
          </Link>
        )}

        <div className="flex-1" />

        {navigationItems.map((item) => {
          const Icon = item.icon;
          const active = isNavActive(location.pathname, item.path);
          return (
            <Link key={`${item.label}-${item.path}`} to={createPageUrl(item.path)}>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'gap-2 rounded-lg font-sans transition-colors',
                  active
                    ? 'text-primary border-b-2 border-primary bg-transparent hover:bg-white/5'
                    : cn(hoverBg, textColor),
                )}
                title={item.label}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline-block">{item.label}</span>
              </Button>
            </Link>
          );
        })}

        {visibility[NAV_ITEMS.SIGN_IN] && (
          <Link to={createPageUrl('SignIn')}>
            <Button
              variant="ghost"
              size="sm"
              className={cn('gap-2 rounded-lg font-sans', hoverBg, textColor, 'transition-colors')}
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline-block">Sign In</span>
            </Button>
          </Link>
        )}

        {visibility[NAV_ITEMS.NOTIFICATIONS] && (
          <NotificationCenter isDark={isDark} />
        )}
      </div>
    </header>
  );
}
