import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import ClientBottomNav from '@/components/dashboard/ClientBottomNav';
import { renderWithRouter } from '@/__tests__/helpers/renderWithRouter';

const useIsDesktop = vi.fn(() => false);
const useAuth = vi.fn(() => ({ isAuthenticated: true }));
const useCart = vi.fn(() => ({ itemCount: 0 }));

vi.mock('@/hooks/useMediaQuery', () => ({
  useIsDesktop: () => useIsDesktop(),
}));

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => useAuth(),
}));

vi.mock('@/components/context/CartContext', () => ({
  useCart: () => useCart(),
}));

vi.mock('@/hooks/useEffectiveRole', () => ({
  useEffectiveRole: () => ({
    effectiveRole: 'client',
    isLoading: false,
    isProviderRole: false,
  }),
}));

describe('ClientBottomNav', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useIsDesktop.mockReturnValue(false);
    useAuth.mockReturnValue({ isAuthenticated: true });
    useCart.mockReturnValue({ itemCount: 0 });
  });

  it('renders five primary tabs for authenticated mobile users', () => {
    renderWithRouter(<ClientBottomNav />, { route: '/Dashboard' });

    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Bookings/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Book appointment/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Bag/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'More options' })).toBeInTheDocument();
  });

  it('does not render on desktop', () => {
    useIsDesktop.mockReturnValue(true);
    renderWithRouter(<ClientBottomNav />, { route: '/Dashboard' });
    expect(screen.queryByRole('navigation', { name: 'Main navigation' })).not.toBeInTheDocument();
  });

  it('does not render for guests', () => {
    useAuth.mockReturnValue({ isAuthenticated: false });
    renderWithRouter(<ClientBottomNav />, { route: '/Explore' });
    expect(screen.queryByRole('navigation', { name: 'Main navigation' })).not.toBeInTheDocument();
  });

  it('hides during booking flow', () => {
    renderWithRouter(<ClientBottomNav />, { route: '/BookingFlow' });
    expect(screen.queryByRole('navigation', { name: 'Main navigation' })).not.toBeInTheDocument();
  });

  it('shows cart badge when items are in the bag', () => {
    useCart.mockReturnValue({ itemCount: 3 });
    renderWithRouter(<ClientBottomNav />, { route: '/Dashboard' });
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('opens More sheet with secondary destinations', () => {
    renderWithRouter(<ClientBottomNav />, { route: '/Dashboard' });

    fireEvent.click(screen.getByRole('button', { name: 'More options' }));

    expect(screen.getByRole('heading', { name: 'Menu' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Favorites/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Gift Cards/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Support/i })).toBeInTheDocument();
  });
});
