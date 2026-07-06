import { useLocation } from 'react-router-dom';
import { APP_ZONES, getZoneFromPath, NAV_MENUS, ZONE_BRANDING } from '@/components/navigationConfig';
import { useAuth } from '@/lib/AuthContext';
import { useEffectiveRole } from '@/hooks/useEffectiveRole';
import PublicLayout from '@/components/layout/PublicLayout';
import AppLayout from '@/components/layout/AppLayout';
import ClientLayout from '@/components/layout/ClientLayout';
import ProviderLayout from '@/components/layout/ProviderLayout';
import AdminLayout from '@/components/layout/AdminLayout';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from "@/components/theme-provider"
import { QueryOptimizer } from '@/components/QueryOptimizer';
import { HelmetProvider } from 'react-helmet-async';
import GlobalNavigation from '@/components/ui/GlobalNavigation';
import { BookingProvider } from '@/components/context/BookingContext';
import { CartProvider } from '@/components/context/CartContext';
import { WishlistProvider } from '@/components/wishlist/WishlistContext';
import RouteGuard from '@/components/routing/RouteGuard';
import FeatureGuard from '@/components/routing/FeatureGuard';
import OnboardingRedirect from '@/components/routing/OnboardingRedirect';
import ProviderSignupBootstrap from '@/components/onboarding/ProviderSignupBootstrap';
import { SkipLink } from '@/components/ui/SkipLink';
import ErrorBoundary from '@/components/ui/error-boundary';
import RealTimeNotifications from '@/components/notifications/RealTimeNotifications';
import WaitlistOfferNotifier from '@/components/booking/WaitlistOfferNotifier';
import InstallPrompt from '@/components/pwa/InstallPrompt';
import OfflineIndicator from '@/components/pwa/OfflineIndicator';
import InAppSupportWidget from '@/components/support/InAppSupportWidget';

export default function Layout({ children, currentPageName: _currentPageName }) {
  const location = useLocation();
  const path = location.pathname;
  const { user, isAuthenticated } = useAuth();
  const { effectiveRole } = useEffectiveRole();
  const zone = getZoneFromPath(path, {
    isAuthenticated: isAuthenticated && !!user,
    role: effectiveRole,
  });
  const branding = ZONE_BRANDING[zone] || ZONE_BRANDING[APP_ZONES.PUBLIC];
  const menuItems = NAV_MENUS[zone] || [];

  return (
    <HelmetProvider>
        <CartProvider>
        <WishlistProvider>
        <BookingProvider>
          <RouteGuard />
          <FeatureGuard />
          <OnboardingRedirect />
          <ProviderSignupBootstrap />
          <ThemeProvider
            attribute="class"
            forcedTheme="light"
            enableSystem={false}
          >
            <SkipLink />
            <Toaster />
            <RealTimeNotifications />
            <WaitlistOfferNotifier />
            <OfflineIndicator />
            <InstallPrompt />
            <InAppSupportWidget />
            <ErrorBoundary>
              <QueryOptimizer />
              {zone === APP_ZONES.AUTH ? (
                <div className="min-h-screen flex flex-col bg-background text-foreground">
                  <GlobalNavigation />
                  <main id="main-content" className="flex-1">
                    {children}
                  </main>
                </div>
              ) : zone === APP_ZONES.PUBLIC ? (
                <PublicLayout>
                  {children}
                </PublicLayout>
              ) : (
                <AppLayout zone={zone} branding={branding} menuItems={menuItems}>
                  <GlobalNavigation />
                  {zone === APP_ZONES.CLIENT ? (
                    <ClientLayout>{children}</ClientLayout>
                  ) : zone === APP_ZONES.PROVIDER ? (
                    <ProviderLayout>{children}</ProviderLayout>
                  ) : zone === APP_ZONES.ADMIN ? (
                    <AdminLayout>{children}</AdminLayout>
                  ) : (
                    <main id="main-content" className="flex-1">
                      {children}
                    </main>
                  )}
                </AppLayout>
              )}
            </ErrorBoundary>
          </ThemeProvider>
        </BookingProvider>
        </WishlistProvider>
        </CartProvider>
    </HelmetProvider>
  );
}