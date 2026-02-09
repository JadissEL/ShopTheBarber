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

/**
 * GLOBAL NAVIGATION COMPONENT
 * 
 * POSITIONING STRATEGY: sticky (not fixed)
 * 
 * Why sticky?
 * - Stays in normal document flow (reserves space)
 * - Does NOT overlap content below it
 * - Becomes "stuck" at top only when scrolling
 * - No need for padding/margin compensation hacks
 * 
 * z-index: 50 is used to ensure header stays above
 * content that may have its own z-index (modals, etc)
 */
export default function GlobalNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, isAuthenticated, isLoading } = useAuth();
  const path = location.pathname.toLowerCase();
  const zone = getZoneFromPath(path);
  const isDesktop = useIsDesktop();

  // On desktop, client zone uses ClientLayout sidebar — hide top nav to avoid duplication
  if (zone === APP_ZONES.CLIENT && isDesktop) {
    return null;
  }

  // Get centralized visibility rules
  const visibility = getNavigationVisibility({
    pathname: path,
    isAuthenticated,
    role,
    zone
  });

  // Determine header style based on context
  const isDark = shouldUseDarkHeader(zone, path);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  // Hide GlobalNavigation on Dashboard pages (they have their own headers)
  if (path === '/dashboard' || path === '/providerdashboard') {
    return null;
  }

  // STICKY HEADER STYLES
  // Using position: sticky ensures the header:
  // 1. Takes up space in the document flow
  // 2. Does not overlap content below it
  // 3. Sticks to top when scrolling
  const headerBaseClasses = `
    w-full px-4 py-3
    sticky top-0 z-50
    transition-all duration-300 ease-out
  `;

  const headerDarkStyles = `
    bg-gradient-to-r from-primary to-primary/90 
    border-b border-white/5 
    backdrop-blur-md 
    shadow-lg shadow-black/10
  `;

  const headerLightStyles = `
    bg-primary 
    border-b border-primary/30 
    shadow-md
  `;

  // During auth loading, show minimal branded header
  if (isLoading) {
    return (
      <header className={`${headerBaseClasses} ${isDark ? headerDarkStyles : headerLightStyles}`}>
        <div className="max-w-7xl mx-auto flex items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Scissors className="w-4 h-4 text-primary-foreground transform -rotate-45" />
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">ShopTheBarber</span>
          </Link>
        </div>
      </header>
    );
  }

  // Generate navigation items based on visibility rules
  const navigationItems = [];

  // Home item
  if (visibility[NAV_ITEMS.HOME]) {
    navigationItems.push({
      icon: Home,
      label: 'Home',
      path: isAuthenticated ? getDashboardPath(role) : 'Home'
    });
  }

  // Dashboard (only for authenticated users; skip if same path as Home to avoid duplicate key)
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

  // Marketplace (clients – elite/luxury products)
  if (visibility[NAV_ITEMS.EXPLORE]) {
    navigationItems.push({
      icon: Store,
      label: 'Marketplace',
      path: 'Marketplace'
    });
  }

  // Bookings (provider only)
  if (visibility[NAV_ITEMS.BOOKINGS]) {
    navigationItems.push({
      icon: Calendar,
      label: 'Bookings',
      path: 'ProviderBookings'
    });
  }

  // Loyalty (client only)
  if (visibility[NAV_ITEMS.LOYALTY]) {
    navigationItems.push({
      icon: Gift,
      label: 'Loyalty',
      path: 'Loyalty'
    });
  }

  // Profile
  if (visibility[NAV_ITEMS.PROFILE]) {
    navigationItems.push({
      icon: User,
      label: 'Profile',
      path: 'AccountSettings'
    });
  }

  // Settings (provider/admin only)
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
    <header className={`${headerBaseClasses} ${isDark ? headerDarkStyles : headerLightStyles}`}>
      <div className="max-w-7xl mx-auto flex items-center gap-2">
        {/* Back Arrow - Only for non-root pages */}
        {visibility[NAV_ITEMS.BACK_BUTTON] && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className={`gap-2 ${hoverBg} ${textColor} transition-colors`}
            title="Go Back"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline-block">Back</span>
          </Button>
        )}

        {/* Logo (always centered or left) */}
        {visibility[NAV_ITEMS.LOGO] && (
          <Link to="/" className="flex items-center gap-2 ml-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-md">
              <Scissors className="w-4 h-4 text-primary-foreground transform -rotate-45" />
            </div>
            <span className="text-white font-semibold text-lg tracking-tight hidden sm:block">ShopTheBarber</span>
          </Link>
        )}

        <div className="flex-1" />

        {/* Contextual Navigation Items */}
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={`${item.label}-${item.path}`} to={createPageUrl(item.path)}>
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 ${hoverBg} ${textColor} transition-colors`}
                title={item.label}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline-block">{item.label}</span>
              </Button>
            </Link>
          );
        })}

        {/* Sign In Button (only for unauthenticated users) */}
        {visibility[NAV_ITEMS.SIGN_IN] && (
          <Link to={createPageUrl('SignIn')}>
            <Button
              variant="ghost"
              size="sm"
              className={`gap-2 ${hoverBg} ${textColor} transition-colors`}
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline-block">Sign In</span>
            </Button>
          </Link>
        )}

        {/* Notification Center (only for authenticated users) */}
        {visibility[NAV_ITEMS.NOTIFICATIONS] && (
          <NotificationCenter isDark={true} />
        )}
      </div>
    </header>
  );
}