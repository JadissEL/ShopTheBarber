import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminFeatureToggles from '@/pages/AdminFeatureToggles';

vi.mock('@/api/apiClient', () => ({
  sovereign: {
    featureFlags: {
      adminList: vi.fn(() =>
        Promise.resolve({
          modules: [
            { id: 'marketplace', label: 'Marketplace', description: 'Shop', enabled: true },
            { id: 'careers', label: 'Careers', description: 'Jobs', enabled: false },
          ],
        })
      ),
      adminSet: vi.fn(),
    },
  },
}));

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <AdminFeatureToggles />
    </QueryClientProvider>
  );
}

describe('AdminFeatureToggles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads modules and shows runtime toggle copy', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/Toggle optional product modules at runtime/i)).toBeInTheDocument();
    });
    expect(screen.getByText('Marketplace')).toBeInTheDocument();
    expect(screen.getByText('Booking & discovery')).toBeInTheDocument();
  });

  it('enables switch for optional non-env-locked modules', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByLabelText(/Toggle Marketplace/i)).toBeInTheDocument();
    });
    const marketplaceSwitch = screen.getByLabelText(/Toggle Marketplace/i);
    expect(marketplaceSwitch).not.toBeDisabled();
  });
});
