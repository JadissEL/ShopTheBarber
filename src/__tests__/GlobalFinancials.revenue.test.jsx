import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import GlobalFinancials from '@/pages/GlobalFinancials';

vi.mock('@/api/apiClient', () => ({
  sovereign: {
    functions: {
      invoke: vi.fn(() =>
        Promise.resolve({
          overview: {
            totalGross: 1200,
            platformRevenue: 180,
            totalPayouts: 900,
            pendingPayouts: 50,
            netMargin: 15,
          },
          chartData: [
            { day: 'Mon', date: 'Jun 01', gross: 200, commission: 30 },
            { day: 'Tue', date: 'Jun 02', gross: 400, commission: 60 },
          ],
          bookings: [],
          north_star: {
            period_days: 30,
            booked_gmv_eur: 5000,
            booked_count: 120,
            no_show_rate_percent: 4.2,
            no_show_count: 5,
            resolved_bookings_count: 118,
            provider_activation_rate_percent: 52,
            providers_total: 40,
            providers_fully_activated: 21,
            d7_retention_percent: 28,
            d7_retention_cohort_size: 150,
            trends: { booked_gmv_change_pct: 8 },
          },
        })
      ),
    },
    entities: {
      Payout: { list: vi.fn(() => Promise.resolve([])) },
      Dispute: { filter: vi.fn(() => Promise.resolve([])) },
      User: { list: vi.fn(() => Promise.resolve([])) },
      PricingRule: { list: vi.fn(() => Promise.resolve([])) },
    },
    fixedFee: { adminListPlans: vi.fn(() => Promise.resolve([])) },
  },
}));

vi.mock('@/components/onboarding/OnboardingSetupBanner', () => ({
  default: () => null,
}));

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <GlobalFinancials />
        </MemoryRouter>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

describe('GlobalFinancials', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders financial overview with chart data (no coming-soon stubs)', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/Financial Command/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Revenue Velocity/i)).toBeInTheDocument();
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.queryByText(/Revenue analytics coming soon/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Reconciliation tools coming soon/i)).not.toBeInTheDocument();
  });

  it('exposes dedicated Revenue and Reconciliation admin tabs', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /^Revenue$/i })).toBeInTheDocument();
    });
    expect(screen.getByRole('tab', { name: /^Reconciliation$/i })).toBeInTheDocument();
  });

  it('renders north-star metrics section', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/North-star metrics/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Booked GMV/i)).toBeInTheDocument();
    expect(screen.getByText(/D7 retention/i)).toBeInTheDocument();
    expect(screen.getByText(/Provider activation/i)).toBeInTheDocument();
  });
});
