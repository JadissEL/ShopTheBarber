import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardBreadcrumbs from '@/components/layout/DashboardBreadcrumbs';
import { DashboardShellProvider } from '@/components/layout/DashboardShellContext';
import { DashboardBreadcrumbProvider } from '@/components/layout/DashboardBreadcrumbContext';

vi.mock('@/hooks/useEffectiveRole', () => ({
  useEffectiveRole: () => ({ effectiveRole: 'client', isLoading: false }),
}));

function renderCrumbs(route) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <DashboardShellProvider>
        <DashboardBreadcrumbProvider>
          <DashboardBreadcrumbs />
        </DashboardBreadcrumbProvider>
      </DashboardShellProvider>
    </MemoryRouter>,
  );
}

describe('DashboardBreadcrumbs', () => {
  it('renders module trail outside primary nav routes', () => {
    renderCrumbs('/Marketplace');
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByText('Marketplace')).toBeInTheDocument();
  });

  it('renders nothing on primary sidebar routes', () => {
    renderCrumbs('/Explore');
    expect(screen.queryByRole('navigation', { name: 'Breadcrumb' })).not.toBeInTheDocument();
  });
});
