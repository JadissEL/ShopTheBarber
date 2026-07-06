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

vi.mock('@/lib/bootstrapProvider', () => ({
  getProviderIntent: () => null,
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

function mockAuthenticatedProvider() {
  useAuth.mockReturnValue({
    user: { id: 'user-1', role: 'barber' },
    isLoadingAuth: false,
    isSignedIn: true,
    syncStatus: 'ready',
  });
  useEffectiveRole.mockReturnValue({
    effectiveRole: 'barber',
    isProvider: true,
    isAdmin: false,
    isLoading: false,
    workspace: { barber: { id: 'b-1' }, ownerMembership: false },
  });
}

function mockAuthenticatedClient() {
  useAuth.mockReturnValue({
    user: { id: 'user-2', role: 'client' },
    isLoadingAuth: false,
    isSignedIn: true,
    syncStatus: 'ready',
  });
  useEffectiveRole.mockReturnValue({
    effectiveRole: 'client',
    isProvider: false,
    isAdmin: false,
    isLoading: false,
    workspace: null,
  });
}

function mockAuthenticatedAdmin() {
  useAuth.mockReturnValue({
    user: { id: 'admin-1', role: 'admin' },
    isLoadingAuth: false,
    isSignedIn: true,
    syncStatus: 'ready',
  });
  useEffectiveRole.mockReturnValue({
    effectiveRole: 'admin',
    isProvider: false,
    isAdmin: true,
    isLoading: false,
    workspace: null,
  });
}

describe('RouteGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects providers from /Chat to ProviderMessages preserving query', async () => {
    mockAuthenticatedProvider();
    renderGuard('/Chat?booking=abc');

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringMatching(/ProviderMessages\?booking=abc/i),
        { replace: true },
      );
    });
  });

  it('redirects admins from /Dashboard to GlobalFinancials', async () => {
    mockAuthenticatedAdmin();
    renderGuard('/Dashboard');

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringMatching(/GlobalFinancials/i),
        { replace: true },
      );
    });
  });

  it('redirects providers from /Dashboard to ProviderDashboard', async () => {
    mockAuthenticatedProvider();
    renderGuard('/Dashboard');

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringMatching(/ProviderDashboard/i),
        { replace: true },
      );
    });
  });

  it('redirects clients away from /ProviderDashboard when not a provider', async () => {
    mockAuthenticatedClient();
    renderGuard('/ProviderDashboard');

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringMatching(/Dashboard/i),
        { replace: true },
      );
    });
  });
});
