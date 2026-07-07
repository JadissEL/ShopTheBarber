import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import RouteGuard from '@/components/routing/RouteGuard';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const useAuth = vi.fn();
const useEffectiveRole = vi.fn();

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => useAuth(),
}));

vi.mock('@/hooks/useEffectiveRole', () => ({
  useEffectiveRole: () => useEffectiveRole(),
}));

vi.mock('@/components/context/BookingContext', () => ({
  useBooking: () => ({ bookingState: {} }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: false, isLoading: false }),
}));

function renderGuard(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="*" element={<RouteGuard />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('RouteGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects sellers away from provider dashboard', async () => {
    useAuth.mockReturnValue({
      user: { id: 'u1' },
      isLoadingAuth: false,
      isSignedIn: true,
      syncStatus: 'ready',
    });
    useEffectiveRole.mockReturnValue({
      effectiveRole: 'seller',
      accountType: 'seller',
      isProvider: false,
      isAdmin: false,
      isBookingProvider: false,
      isLoading: false,
    });

    renderGuard('/ProviderDashboard');

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringMatching(/SellerDashboard/i),
        { replace: true },
      );
    });
  });

  it('redirects sellers away from provider settings', async () => {
    useAuth.mockReturnValue({
      user: { id: 'u1' },
      isLoadingAuth: false,
      isSignedIn: true,
      syncStatus: 'ready',
    });
    useEffectiveRole.mockReturnValue({
      effectiveRole: 'seller',
      accountType: 'seller',
      isProvider: false,
      isAdmin: false,
      isBookingProvider: false,
      isLoading: false,
    });

    renderGuard('/ProviderSettings');

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringMatching(/SellerDashboard/i),
        { replace: true },
      );
    });
  });

  it('redirects admins from client dashboard to GlobalFinancials', async () => {
    useAuth.mockReturnValue({
      user: { id: 'admin-1' },
      isLoadingAuth: false,
      isSignedIn: true,
      syncStatus: 'ready',
    });
    useEffectiveRole.mockReturnValue({
      effectiveRole: 'admin',
      accountType: 'client',
      isProvider: false,
      isAdmin: true,
      isBookingProvider: false,
      isLoading: false,
    });

    renderGuard('/Dashboard');

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringMatching(/GlobalFinancials/i),
        { replace: true },
      );
    });
  });
});
