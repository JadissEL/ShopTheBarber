import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Layout from '@/Layout';
import { CartProvider } from '@/components/context/CartContext';

const useAuth = vi.fn();
const useEffectiveRole = vi.fn();

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => useAuth(),
}));

vi.mock('@/hooks/useEffectiveRole', () => ({
  useEffectiveRole: () => useEffectiveRole(),
}));

vi.mock('@/hooks/useMediaQuery', () => ({
  useIsDesktop: () => true,
}));

vi.mock('@/components/routing/RouteGuard', () => ({ default: () => null }));
vi.mock('@/components/routing/FeatureGuard', () => ({ default: () => null }));
vi.mock('@/components/routing/OnboardingRedirect', () => ({ default: () => null }));
vi.mock('@/components/onboarding/ProviderSignupBootstrap', () => ({ default: () => null }));
vi.mock('@/components/notifications/RealTimeNotifications', () => ({ default: () => null }));
vi.mock('@/components/booking/WaitlistOfferNotifier', () => ({ default: () => null }));
vi.mock('@/components/pwa/InstallPrompt', () => ({ default: () => null }));
vi.mock('@/components/pwa/OfflineIndicator', () => ({ default: () => null }));
vi.mock('@/components/support/InAppSupportWidget', () => ({ default: () => null }));
vi.mock('@/components/QueryOptimizer', () => ({ QueryOptimizer: () => null }));
vi.mock('@/components/ui/GlobalNavigation', () => ({ default: () => null }));
vi.mock('@/components/layout/ClientDesktopSidebar', () => ({
  default: () => <aside data-testid="client-sidebar">Sidebar</aside>,
}));
vi.mock('@/components/layout/ProviderDesktopSidebar', () => ({
  default: () => <aside data-testid="provider-sidebar">Provider</aside>,
}));
vi.mock('@/components/layout/AdminDesktopSidebar', () => ({
  default: () => <aside data-testid="admin-sidebar">Admin</aside>,
}));
vi.mock('@/components/dashboard/ClientBottomNav', () => ({ default: () => null }));
vi.mock('@/components/layout/ProviderBottomNav', () => ({ default: () => null }));
vi.mock('@/components/layout/AdminBottomNav', () => ({ default: () => null }));
vi.mock('@/components/context/BookingContext', () => ({
  BookingProvider: ({ children }) => children,
  useBooking: () => ({ bookingState: {}, updateBooking: vi.fn() }),
}));
vi.mock('@/components/wishlist/WishlistContext', () => ({
  WishlistProvider: ({ children }) => children,
}));
vi.mock('@/api/apiClient', () => ({
  sovereign: {
    cart: { get: vi.fn(() => Promise.resolve([])) },
  },
}));

function renderAuthenticatedRoute(path, roleConfig) {
  useAuth.mockReturnValue({
    user: { id: 'user-1', role: roleConfig.authRole },
    isAuthenticated: true,
    isLoadingAuth: false,
    isSignedIn: true,
    syncStatus: 'ready',
  });
  useEffectiveRole.mockReturnValue({
    effectiveRole: roleConfig.effectiveRole,
    isLoading: false,
    isProvider: roleConfig.isProvider ?? false,
    isAdmin: roleConfig.isAdmin ?? false,
  });

  return render(
    <MemoryRouter initialEntries={[path]}>
      <CartProvider>
        <Routes>
          <Route
            path="*"
            element={
              <Layout currentPageName="Marketplace">
                <div>Module content</div>
              </Layout>
            }
          />
        </Routes>
      </CartProvider>
    </MemoryRouter>,
  );
}

describe('dashboard navigation integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('keeps authenticated clients inside ClientLayout on marketplace', () => {
    renderAuthenticatedRoute('/Marketplace', {
      authRole: 'client',
      effectiveRole: 'client',
    });
    expect(screen.getByTestId('client-sidebar')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
    expect(screen.getByText('Module content')).toBeInTheDocument();
  });

  it('hides breadcrumbs on primary client nav routes', () => {
    renderAuthenticatedRoute('/Explore', {
      authRole: 'client',
      effectiveRole: 'client',
    });
    expect(screen.getByTestId('client-sidebar')).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Breadcrumb' })).not.toBeInTheDocument();
  });

  it('keeps authenticated providers inside ProviderLayout on discovery modules', () => {
    renderAuthenticatedRoute('/Marketplace', {
      authRole: 'barber',
      effectiveRole: 'barber',
      isProvider: true,
    });
    expect(screen.getByTestId('provider-sidebar')).toBeInTheDocument();
    expect(screen.queryByTestId('client-sidebar')).not.toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
  });

  it('hides provider breadcrumbs on primary provider nav routes', () => {
    renderAuthenticatedRoute('/Explore', {
      authRole: 'barber',
      effectiveRole: 'barber',
      isProvider: true,
    });
    expect(screen.getByTestId('provider-sidebar')).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Breadcrumb' })).not.toBeInTheDocument();
  });

  it('keeps authenticated admins inside AdminLayout on discovery modules', () => {
    renderAuthenticatedRoute('/HelpCenter', {
      authRole: 'admin',
      effectiveRole: 'admin',
      isAdmin: true,
    });
    expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
    expect(screen.queryByTestId('client-sidebar')).not.toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
  });

  it('keeps authenticated providers inside ProviderLayout on setup guide', () => {
    renderAuthenticatedRoute('/SetupGuide', {
      authRole: 'barber',
      effectiveRole: 'barber',
      isProvider: true,
    });
    expect(screen.getByTestId('provider-sidebar')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
  });

  it('keeps authenticated clients inside ClientLayout on setup guide', () => {
    renderAuthenticatedRoute('/SetupGuide', {
      authRole: 'client',
      effectiveRole: 'client',
    });
    expect(screen.getByTestId('client-sidebar')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
  });
});
