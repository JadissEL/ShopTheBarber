import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/hooks/useEffectiveRole', () => ({
  useEffectiveRole: vi.fn(() => ({
    isAdmin: false,
    isLoading: false,
    accountType: 'seller',
    role: 'seller',
  })),
}));

vi.mock('@/hooks/dashboard/useSellerDashboardData', () => ({
  useSellerDashboardData: vi.fn(() => ({
    isLoading: false,
    productCount: 2,
    publishedCount: 1,
    pendingOrderCount: 1,
    lowStockCount: 0,
    revenueEstimate: 120,
    pendingOrders: [{ id: 'o1', product_name: 'Pomade', status: 'confirmed' }],
    lowStockProducts: [],
    topProducts: [{ id: 'p1', name: 'Pomade', price: 24, stock: 10 }],
    hasProducts: true,
  })),
}));

vi.mock('@/components/onboarding/OnboardingSetupBanner', () => ({
  default: () => null,
}));

vi.mock('@/components/seo/MetaTags', () => ({
  MetaTags: () => null,
}));

import SellerDashboard from '@/pages/SellerDashboard';

function renderDashboard() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <SellerDashboard />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('SellerDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders sales overview with KPIs and sections', async () => {
    renderDashboard();
    expect(screen.getByRole('heading', { name: 'Sales overview' })).toBeInTheDocument();
    expect(screen.getAllByText('Pending orders').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Pomade').length).toBeGreaterThan(0);
  });
});
