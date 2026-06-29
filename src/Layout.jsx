import { useLocation } from 'react-router-dom';
import { APP_ZONES, getZoneFromPath, NAV_MENUS, ZONE_BRANDING } from '@/components/navigationConfig';
import PublicLayout from '@/components/layout/PublicLayout';
import AppLayout from '@/components/layout/AppLayout';
import ClientLayout from '@/components/layout/ClientLayout';
import ProviderDesktopSidebar from '@/components/layout/ProviderDesktopSidebar';
import ProviderBottomNav from '@/components/layout/ProviderBottomNav';
import AdminDesktopSidebar from '@/components/layout/AdminDesktopSidebar';
import AdminBottomNav from '@/components/layout/AdminBottomNav';
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
  const zone = getZoneFromPath(path);
  const branding = ZONE_BRANDING[zone] || ZONE_BRANDING[APP_ZONES.PUBLIC];
  const menuItems = NAV_MENUS[zone] || [];
  const isSetupGuide = path.toLowerCase() === '/setupguide';

  return (
    <HelmetProvider>
        <CartProvider>
        <WishlistProvider>
        <BookingProvider>
          <RouteGuard />
          <FeatureGuard />
          <OnboardingRedirect />
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
              {isSetupGuide ? (
                <div className="min-h-screen flex flex-col bg-background text-foreground">
                  <main id="main-content" className="flex-1 w-full">
                    {children}
                  </main>
                </div>
              ) : zone === APP_ZONES.AUTH ? (
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
                    <div className="flex flex-1 min-h-0">
                      <ProviderDesktopSidebar />
                      <main id="main-content" className="flex-1 overflow-auto pb-nav lg:pb-0 stb-site-bg">
                        {children}
                      </main>
                      <ProviderBottomNav />
                    </div>
                  ) : zone === APP_ZONES.ADMIN ? (
                    <div className="flex flex-1 min-h-0">
                      <AdminDesktopSidebar />
                      <main id="main-content" className="flex-1 overflow-auto px-4 py-4 lg:px-8 lg:py-6 pb-nav lg:pb-0 stb-site-bg">
                        {children}
                      </main>
                      <AdminBottomNav />
                    </div>
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