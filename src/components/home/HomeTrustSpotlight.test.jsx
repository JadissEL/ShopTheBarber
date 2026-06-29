import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import HomeTrustSpotlight from './HomeTrustSpotlight';

vi.mock('@/api/apiClient', () => ({
  sovereign: {
    trust: {
      getChampionshipLeaderboard: vi.fn().mockResolvedValue({
        season: { name: 'Spring 2026' },
        leaderboard: [
          { id: '1', rank: 1, composite_score: 92, barber: { id: 'b1', name: 'Alex Fade', image_url: null } },
          { id: '2', rank: 2, composite_score: 88, barber: { id: 'b2', name: 'Jordan Cut', image_url: null } },
        ],
      }),
    },
    public: {
      getHomepage: vi.fn().mockResolvedValue({ top_barbers: [] }),
    },
  },
}));

function wrap(ui) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('HomeTrustSpotlight', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders trust ecosystem heading and three feature areas', async () => {
    wrap(<HomeTrustSpotlight />);
    expect(await screen.findByRole('heading', { name: /Rankings, gifts & protection/i })).toBeInTheDocument();
    expect(screen.getByText(/Give the gift of a fresh cut/i)).toBeInTheDocument();
    expect(screen.getByText(/Book with total confidence/i)).toBeInTheDocument();
  });

  it('exposes anchor id for hero scroll links', () => {
    const { container } = wrap(<HomeTrustSpotlight />);
    expect(container.querySelector('#trust-ecosystem')).toBeTruthy();
  });
});
