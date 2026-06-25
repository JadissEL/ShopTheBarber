import './App.css'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ErrorBoundary from '@/components/ui/error-boundary';
import { ClerkProvider } from '@clerk/react';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const HEAVY_ROUTES = new Set(['BookingFlow', 'Explore']);

const AuthenticatedApp = () => {
  const { isLoadingAuth, authError } = useAuth();

  // Show loading spinner while checking auth
  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors (but don't redirect - let RouteGuard handle it)
  if (authError && authError.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            HEAVY_ROUTES.has(path) ? (
              <ErrorBoundary>
                <LayoutWrapper currentPageName={path}>
                  <Page />
                </LayoutWrapper>
              </ErrorBoundary>
            ) : (
              <LayoutWrapper currentPageName={path}>
                <Page />
              </LayoutWrapper>
            )
          }
        />
      ))}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


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
            The API still uses <strong className="text-foreground font-medium">JWT_SECRET</strong> in production for Fastify JWT and legacy email/password auth — independent from Clerk.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ClerkProvider publishableKey={clerkPubKey}>
        <AuthProvider>
          <QueryClientProvider client={queryClientInstance}>
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <NavigationTracker />
              <AuthenticatedApp />
            </Router>
            <VisualEditAgent />
          </QueryClientProvider>
        </AuthProvider>
      </ClerkProvider>
    </ErrorBoundary>
  );
}

export default App
