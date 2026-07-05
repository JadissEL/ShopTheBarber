import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PublicLayout from '@/components/layout/PublicLayout';
import { CartProvider } from '@/components/context/CartContext';

const useIsDesktop = vi.fn(() => false);
const useAuth = vi.fn(() => ({ isAuthenticated: false, isLoading: false }));

vi.mock('@/hooks/useMediaQuery', () => ({
  useIsDesktop: () => useIsDesktop(),
}));

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => useAuth(),
}));

vi.mock('@/hooks/useEffectiveRole', () => ({
  useEffectiveRole: () => ({
    effectiveRole: 'client',
    isLoading: false,
    isProviderRole: false,
  }),
}));

vi.mock('@/api/apiClient', () => ({
  sovereign: {
    cart: { get: vi.fn(() => Promise.resolve([])) },
  },
}));

vi.mock('@/components/layout/Footer', () => ({
  default: () => <footer data-testid="site-footer">Footer</footer>,
}));

vi.mock('@/components/layout/Navbar', () => ({
  default: () => <header data-testid="site-navbar">Navbar</header>,
}));

function renderPublicLayout(authState, route = '/Explore') {
  useAuth.mockReturnValue({ isAuthenticated: authState, isLoading: false });
  return render(
    <MemoryRouter initialEntries={[route]}>
      <CartProvider>
        <PublicLayout>
          <div>Page content</div>
        </PublicLayout>
      </CartProvider>
    </MemoryRouter>,
  );
}

describe('PublicLayout (mobile)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useIsDesktop.mockReturnValue(false);
    localStorage.clear();
  });

  it('shows footer for guests on mobile', () => {
    renderPublicLayout(false);
    const footer = screen.getByTestId('site-footer');
    expect(footer).toBeInTheDocument();
    expect(footer.parentElement).not.toHaveClass('hidden');
    expect(screen.queryByRole('navigation', { name: 'Main navigation' })).not.toBeInTheDocument();
  });

  it('hides footer on mobile when authenticated bottom nav is shown', () => {
    renderPublicLayout(true);
    const footer = screen.getByTestId('site-footer');
    expect(footer.parentElement).toHaveClass('hidden');
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
  });

  it('does not render client desktop sidebar on public pages when authenticated on desktop', () => {
    useIsDesktop.mockReturnValue(true);
    renderPublicLayout(true, '/Home');
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(screen.getByTestId('site-navbar')).toBeInTheDocument();
  });
});
