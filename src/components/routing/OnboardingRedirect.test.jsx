import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import OnboardingRedirect from '@/components/routing/OnboardingRedirect';
import { ONBOARDING_REDIRECT_ONCE_KEY } from '@/lib/onboardingWizard';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const useAuth = vi.fn();
const useOnboardingProgress = vi.fn();
const useEffectiveRole = vi.fn();

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => useAuth(),
}));

vi.mock('@/hooks/useOnboardingProgress', () => ({
  useOnboardingProgress: () => useOnboardingProgress(),
}));

vi.mock('@/hooks/useEffectiveRole', () => ({
  useEffectiveRole: () => useEffectiveRole(),
}));

function renderRedirect(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="*" element={<OnboardingRedirect />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('OnboardingRedirect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    localStorage.clear();
  });

  it('redirects seller from seller dashboard to setup guide when onboarding incomplete', async () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      isLoadingAuth: false,
      user: { id: 'seller-1' },
    });
    useEffectiveRole.mockReturnValue({
      effectiveRole: 'seller',
      isProvider: false,
      isLoading: false,
    });
    useOnboardingProgress.mockReturnValue({
      progress: {
        requiredTotal: 1,
        allRequiredDone: false,
      },
    });

    renderRedirect('/SellerDashboard');

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringMatching(/SetupGuide/i),
        { replace: true },
      );
    });
    expect(sessionStorage.getItem(ONBOARDING_REDIRECT_ONCE_KEY)).toBe('1');
  });

  it('does not redirect providers from provider dashboard', async () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      isLoadingAuth: false,
      user: { id: 'barber-1' },
    });
    useEffectiveRole.mockReturnValue({
      effectiveRole: 'barber',
      isProvider: true,
      isLoading: false,
    });
    useOnboardingProgress.mockReturnValue({
      progress: {
        requiredTotal: 4,
        allRequiredDone: false,
      },
    });

    renderRedirect('/ProviderDashboard');

    await waitFor(() => {
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
