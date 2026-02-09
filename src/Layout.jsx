import { useLocation } from 'react-router-dom';
import { APP_ZONES, getZoneFromPath, NAV_MENUS, ZONE_BRANDING } from '@/components/navigationConfig';
import PublicLayout from '@/components/layout/PublicLayout';
import AppLayout from '@/components/layout/AppLayout';
import ClientLayout from '@/components/layout/ClientLayout';
import { Toaster } from 'sonner';
import { ThemeProvider } from "@/components/theme-provider"
import { QueryOptimizer } from '@/components/QueryOptimizer';
import { HelmetProvider } from 'react-helmet-async';
import GlobalNavigation from '@/components/ui/GlobalNavigation';
import { BookingProvider } from '@/components/context/BookingContext';
import { CartProvider } from '@/components/context/CartContext';
import RouteGuard from '@/components/routing/RouteGuard';
import { SkipLink } from '@/components/ui/SkipLink';
import ErrorBoundary from '@/components/ui/error-boundary';
import RealTimeNotifications from '@/components/notifications/RealTimeNotifications';

export default function Layout({ children, currentPageName: _currentPageName }) {
  const location = useLocation();
  const path = location.pathname;
  const zone = getZoneFromPath(path);
  const branding = ZONE_BRANDING[zone] || ZONE_BRANDING[APP_ZONES.PUBLIC];
  const menuItems = NAV_MENUS[zone] || [];
  const isLandingPage = path === '/' || path.toLowerCase() === '/home';
  const useLightTheme = isLandingPage || zone === APP_ZONES.CLIENT;

  return (
    <HelmetProvider>
        <CartProvider>
        <BookingProvider>
          <RouteGuard />
          <ThemeProvider
            attribute="class"
            forcedTheme={useLightTheme ? "light" : "dark"}
            enableSystem={false}
          >
            <SkipLink />
            <RealTimeNotifications />
            <ErrorBoundary>
              <QueryOptimizer />
              {zone === APP_ZONES.AUTH ? (
                <div className="min-h-screen flex flex-col bg-background text-foreground">
                  <GlobalNavigation />
                  <main id="main-content" className="flex-1">
                    {children}
                  </main>
                  <Toaster />
                </div>
              ) : zone === APP_ZONES.PUBLIC ? (
                <PublicLayout>
                  {children}
                  <Toaster />
                </PublicLayout>
              ) : (
                <AppLayout zone={zone} branding={branding} menuItems={menuItems}>
                  <GlobalNavigation />
                  {zone === APP_ZONES.CLIENT ? (
                    <ClientLayout>{children}</ClientLayout>
                  ) : (
                    <main id="main-content" className="flex-1">
                      {children}
                    </main>
                  )}
                  <Toaster />
                </AppLayout>
              )}
            </ErrorBoundary>
          </ThemeProvider>
        </BookingProvider>
        </CartProvider>
    </HelmetProvider>
  );
}