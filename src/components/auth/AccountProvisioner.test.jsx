import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AccountProvisioner from '@/components/auth/AccountProvisioner';

const mockNavigate = vi.fn();
const provisionAccount = vi.fn();
const getPendingAccountType = vi.fn();
const getSignupIntentToken = vi.fn();
const clearSignupSession = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({
    isSignedIn: true,
    syncStatus: 'needs_provision',
    user: null,
    provisionAccount,
  }),
}));

vi.mock('@/lib/signupIntent', () => ({
  getPendingAccountType: () => getPendingAccountType(),
  getSignupIntentToken: () => getSignupIntentToken(),
  clearSignupSession: () => clearSignupSession(),
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}));

function renderProvisioner(path = '/Dashboard') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="*" element={<AccountProvisioner />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('AccountProvisioner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getPendingAccountType.mockReturnValue('seller');
    getSignupIntentToken.mockReturnValue('intent-token');
    provisionAccount.mockResolvedValue({ ok: true, accountType: 'seller' });
  });

  it('navigates to setup guide after successful provision', async () => {
    renderProvisioner();

    await waitFor(() => {
      expect(provisionAccount).toHaveBeenCalledWith('seller', 'intent-token');
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringMatching(/SetupGuide/i),
        { replace: true },
      );
    });

    expect(clearSignupSession).toHaveBeenCalled();
  });
});
