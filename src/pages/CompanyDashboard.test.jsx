import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/hooks/useEffectiveRole', () => ({
  useEffectiveRole: vi.fn(() => ({
    isAdmin: false,
    isLoading: false,
    accountType: 'company',
    role: 'company',
  })),
}));

vi.mock('@/hooks/dashboard/useCompanyDashboardData', () => ({
  useCompanyDashboardData: vi.fn(() => ({
    isLoading: false,
    openRoles: 2,
    totalJobs: 3,
    applicantCount: 5,
    pendingApplicantCount: 1,
    draftRoles: 1,
    pendingReview: 0,
    commerceActive: false,
    productCount: 0,
    hasJobs: true,
    recentJobs: [{ id: 'j1', title: 'Senior Stylist', status: 'open' }],
    recentApplicants: [],
  })),
}));

vi.mock('@/components/onboarding/OnboardingSetupBanner', () => ({
  default: () => null,
}));

vi.mock('@/components/seo/MetaTags', () => ({
  MetaTags: () => null,
}));

import CompanyDashboard from '@/pages/CompanyDashboard';

function renderDashboard() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <CompanyDashboard />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('CompanyDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders company hub with recruitment KPIs and pipeline', () => {
    renderDashboard();
    expect(screen.getByRole('heading', { name: 'Company hub' })).toBeInTheDocument();
    expect(screen.getAllByText('Open roles').length).toBeGreaterThan(0);
    expect(screen.getByText('Senior Stylist')).toBeInTheDocument();
    expect(screen.getByText('Commerce')).toBeInTheDocument();
  });
});
