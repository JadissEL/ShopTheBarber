import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RoleDashboardLink from '@/components/navigation/RoleDashboardLink';

vi.mock('@/lib/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/hooks/useEffectiveRole', () => ({
  useEffectiveRole: vi.fn(),
}));

import { useAuth } from '@/lib/AuthContext';
import { useEffectiveRole } from '@/hooks/useEffectiveRole';

describe('RoleDashboardLink', () => {
  it('links guests to Home', () => {
    useAuth.mockReturnValue({ isAuthenticated: false });
    useEffectiveRole.mockReturnValue({ effectiveRole: 'client' });

    render(
      <MemoryRouter>
        <RoleDashboardLink />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /back to home/i })).toHaveAttribute('href', '/Home');
  });

  it('links providers to ProviderDashboard', () => {
    useAuth.mockReturnValue({ isAuthenticated: true });
    useEffectiveRole.mockReturnValue({ effectiveRole: 'barber' });

    render(
      <MemoryRouter>
        <RoleDashboardLink />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /return to dashboard/i })).toHaveAttribute(
      'href',
      '/ProviderDashboard',
    );
  });

  it('links admins to GlobalFinancials', () => {
    useAuth.mockReturnValue({ isAuthenticated: true });
    useEffectiveRole.mockReturnValue({ effectiveRole: 'admin' });

    render(
      <MemoryRouter>
        <RoleDashboardLink />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /return to admin/i })).toHaveAttribute(
      'href',
      '/GlobalFinancials',
    );
  });
});
