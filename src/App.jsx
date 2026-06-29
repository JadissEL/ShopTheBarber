import './App.css'

import { Suspense, lazy } from 'react'

import { QueryClientProvider } from '@tanstack/react-query'

import { queryClientInstance } from '@/lib/query-client'

import VisualEditAgent from '@/lib/VisualEditAgent'

import NavigationTracker from '@/lib/NavigationTracker'

import { pagesConfig } from './pages.config'

import { BrowserRouter as Router, Route, Routes, useParams, Navigate } from 'react-router-dom';

import PageNotFound from './lib/PageNotFound';

import RoutePageFallback from '@/components/routing/RoutePageFallback';

import { AuthProvider, useAuth } from '@/lib/AuthContext';

import UserNotRegisteredError from '@/components/UserNotRegisteredError';

import ErrorBoundary from '@/components/ui/error-boundary';

import { ClerkProvider } from '@clerk/react';

import { clerkAuthAppearance } from '@/lib/clerkAppearance';

import FeatureFlagBootstrap from '@/components/FeatureFlagBootstrap';

import SsoCallback from '@/pages/SsoCallback';



const CityLanding = lazy(() => import('@/pages/CityLanding'));

const CitiesDirectory = lazy(() => import('@/pages/CitiesDirectory'));

const InviteLanding = lazy(() => import('@/pages/InviteLanding'));

const PlatformPricing = lazy(() => import('@/pages/PlatformPricing'));
const ForSoloBarbers = lazy(() => import('@/pages/ForSoloBarbers'));
const ForShopOwners = lazy(() => import('@/pages/ForShopOwners'));
const ForNetworkAdmins = lazy(() => import('@/pages/ForNetworkAdmins'));
const PilotProgram = lazy(() => import('@/pages/PilotProgram'));
const Partners = lazy(() => import('@/pages/Partners'));
const MarketplaceSellerTerms = lazy(() => import('@/pages/MarketplaceSellerTerms'));
const MarketplaceBuyerTerms = lazy(() => import('@/pages/MarketplaceBuyerTerms'));

function GtmPageRoute({ pageName, children }) {
  return (
    <LayoutWrapper currentPageName={pageName}>
      <Suspense fallback={<RoutePageFallback />}>{children}</Suspense>
    </LayoutWrapper>
  );
}



const { Pages, Layout, mainPage } = pagesConfig;

const mainPageKey = mainPage ?? Object.keys(Pages)[0];

const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;



const LayoutWrapper = ({ children, currentPageName }) => Layout ?

  <Layout currentPageName={currentPageName}>{children}</Layout>

  : <>{children}</>;



const ERROR_BOUNDARY_ROUTES = new Set(['BookingFlow', 'Explore']);



function RoutedPage({ pageName, Page }) {

  const content = (

    <Suspense fallback={<RoutePageFallback />}>

      <Page />

    </Suspense>

  );



  if (ERROR_BOUNDARY_ROUTES.has(pageName)) {

    return <ErrorBoundary>{content}</ErrorBoundary>;

  }

  return content;

}



function CityLandingRoute() {

  const { citySlug } = useParams();

  return (

    <LayoutWrapper currentPageName="Explore">

      <Suspense fallback={<RoutePageFallback />}>

        <CityLanding citySlug={citySlug} />

      </Suspense>

    </LayoutWrapper>

  );

}



const AuthenticatedApp = () => {
  const { isLoading, authError } = useAuth();

  if (authError && authError.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
        </div>
      )}

      <Routes>

      <Route path="/signin" element={<Navigate to="/login" replace />} />
      <Route path="/SignIn" element={<Navigate to="/login" replace />} />
      <Route path="/signup" element={<Navigate to="/register" replace />} />
      <Route path="/SignUp" element={<Navigate to="/register" replace />} />
      <Route path="/sso-callback" element={<LayoutWrapper currentPageName="SignIn"><SsoCallback /></LayoutWrapper>} />
      <Route path="/login/sso-callback" element={<LayoutWrapper currentPageName="SignIn"><SsoCallback /></LayoutWrapper>} />
      <Route path="/register/sso-callback" element={<LayoutWrapper currentPageName="SignUp"><SsoCallback /></LayoutWrapper>} />
      <Route path="/SignIn/sso-callback" element={<Navigate to="/login/sso-callback" replace />} />
      <Route path="/SignUp/sso-callback" element={<Navigate to="/register/sso-callback" replace />} />
      <Route path="/oauthcallback" element={<LayoutWrapper currentPageName="SignIn"><SsoCallback /></LayoutWrapper>} />

      <Route
        path="/login/*"
        element={
          <LayoutWrapper currentPageName="SignIn">
            <RoutedPage pageName="SignIn" Page={Pages.SignIn} />
          </LayoutWrapper>
        }
      />
      <Route
        path="/register/*"
        element={
          <LayoutWrapper currentPageName="SignUp">
            <RoutedPage pageName="SignUp" Page={Pages.SignUp} />
          </LayoutWrapper>
        }
      />

      <Route path="/" element={

        <LayoutWrapper currentPageName={mainPageKey}>

          <Suspense fallback={<RoutePageFallback />}>

            <MainPage />

          </Suspense>

        </LayoutWrapper>

      } />

      <Route path="/barbers-in/:citySlug" element={<CityLandingRoute />} />

      <Route path="/cities" element={

        <LayoutWrapper currentPageName="Explore">

          <Suspense fallback={<RoutePageFallback />}>

            <CitiesDirectory />

          </Suspense>

        </LayoutWrapper>

      } />

      <Route path="/invite/:code" element={

        <LayoutWrapper currentPageName="SignUp">

          <Suspense fallback={<RoutePageFallback />}>

            <InviteLanding />

          </Suspense>

        </LayoutWrapper>

      } />

      <Route path="/pricing" element={<GtmPageRoute pageName="PlatformPricing"><PlatformPricing /></GtmPageRoute>} />
      <Route path="/for-barbers" element={<GtmPageRoute pageName="ForSoloBarbers"><ForSoloBarbers /></GtmPageRoute>} />
      <Route path="/for-shops" element={<GtmPageRoute pageName="ForShopOwners"><ForShopOwners /></GtmPageRoute>} />
      <Route path="/for-networks" element={<GtmPageRoute pageName="ForNetworkAdmins"><ForNetworkAdmins /></GtmPageRoute>} />
      <Route path="/pilot" element={<GtmPageRoute pageName="PilotProgram"><PilotProgram /></GtmPageRoute>} />
      <Route path="/partners" element={<GtmPageRoute pageName="Partners"><Partners /></GtmPageRoute>} />
      <Route path="/marketplace/seller-terms" element={<GtmPageRoute pageName="MarketplaceSellerTerms"><MarketplaceSellerTerms /></GtmPageRoute>} />
      <Route path="/marketplace/buyer-terms" element={<GtmPageRoute pageName="MarketplaceBuyerTerms"><MarketplaceBuyerTerms /></GtmPageRoute>} />

      {Object.entries(Pages).filter(([path]) => path !== 'SignIn' && path !== 'SignUp').map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <RoutedPage pageName={path} Page={Page} />
            </LayoutWrapper>
          }
        />
      ))}

      <Route path="*" element={<PageNotFound />} />

      </Routes>
    </>
  );
};





function ClerkAppShell({ clerkPubKey }) {
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      signInUrl="/login"
      signUpUrl="/register"
      signInFallbackRedirectUrl="/SetupGuide"
      signUpFallbackRedirectUrl="/SetupGuide"
      appearance={clerkAuthAppearance}
    >
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <FeatureFlagBootstrap>
            <NavigationTracker />
            <AuthenticatedApp />
            <VisualEditAgent />
          </FeatureFlagBootstrap>
        </QueryClientProvider>
      </AuthProvider>
    </ClerkProvider>
  );
}

function App() {

  const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;



  if (!clerkPubKey) {

    return (

      <div className="fixed inset-0 flex items-center justify-center bg-background">

        <div className="text-center p-8 max-w-md space-y-3">

          <h1 className="text-2xl font-bold text-destructive">Clerk not configured</h1>

          <p className="text-muted-foreground">

            Add <code className="bg-muted px-2 py-1 rounded text-foreground">VITE_CLERK_PUBLISHABLE_KEY</code> to{' '}

            <code className="bg-muted px-2 py-1 rounded text-foreground">.env.local</code> at the repo root (see{' '}

            <code className="bg-muted px-2 py-1 rounded text-foreground">.env.example</code>).

          </p>

          <p className="text-sm text-muted-foreground">

            Get your publishable key from{' '}

            <a href="https://dashboard.clerk.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">

              dashboard.clerk.com

            </a>

            . Use the same Clerk application as{' '}

            <code className="bg-muted px-1 rounded text-xs">CLERK_SECRET_KEY</code> on the server (<code className="bg-muted px-1 rounded text-xs">server/.env.example</code>).

          </p>

          <p className="text-xs text-muted-foreground border-t border-border pt-3">

            The API uses <strong className="text-foreground font-medium">CLERK_SECRET_KEY</strong> on Render for authenticated requests (see <code className="bg-muted px-1 rounded text-xs">server/.env.example</code>).

          </p>

        </div>

      </div>

    );

  }



  return (
    <ErrorBoundary>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ClerkAppShell clerkPubKey={clerkPubKey} />
      </Router>
    </ErrorBoundary>
  );

}



export default App

