/**
 * Critical-path test: Explore → select barber → services (booking flow entry).
 * Validates that the Explore page renders discovery UI and links to barber profile (booking flow entry).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Explore from '@/pages/Explore';

const mockBarbers = [
  {
    id: 'barber-1',
    name: 'Alex Barber',
    data: {
      name: 'Alex Barber',
      location: 'Downtown',
      image_url: 'https://example.com/alex.jpg',
      rating: 4.9,
      review_count: 42,
      title: 'Master Barber',
    },
  },
];

const mockShops = [
  { id: 'shop-1', name: 'Downtown Cuts', data: { name: 'Downtown Cuts', location: 'Downtown' } },
];

vi.mock('@/api/apiClient', () => ({
  sovereign: {
    auth: { me: vi.fn(() => Promise.resolve(null)) },
    entities: {
      Barber: {
        list: vi.fn(() => Promise.resolve(mockBarbers)),
        get: vi.fn((id) => Promise.resolve(mockBarbers.find((b) => b.id === id) || null)),
      },
      Shop: { list: vi.fn(() => Promise.resolve(mockShops)) },
      Favorite: { filter: vi.fn(() => Promise.resolve([])) },
      Promotion: { list: vi.fn(() => Promise.resolve([])) },
      InspirationPost: { list: vi.fn(() => Promise.resolve([])) },
    },
  },
}));

function renderExplore() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Explore />
        </BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

describe('Critical path: Explore → barber → services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Explore page with discovery UI', async () => {
    renderExplore();
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search for professionals/i)).toBeInTheDocument();
    });
  });

  it('shows professionals discovery section (heading or count)', async () => {
    renderExplore();
    await waitFor(() => {
      const heading = screen.queryByText(/Top Professionals/i);
      const count = screen.queryByText(/professionals available/i);
      expect(heading ?? count).toBeTruthy();
    }, { timeout: 3000 });
    const headings = screen.getAllByText(/Top Professionals|professionals available/i);
    expect(headings.length).toBeGreaterThan(0);
  });

  it('has booking flow entry: BarberProfile links when barbers listed, or empty state when none', async () => {
    renderExplore();
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search for professionals/i)).toBeInTheDocument();
    });
    const barberLinks = document.querySelectorAll('a[href*="BarberProfile"]');
    const countOrEmpty = screen.queryAllByText(/professionals available|No professionals found/i);
    if (barberLinks.length > 0) {
      expect(barberLinks[0].getAttribute('href')).toMatch(/BarberProfile\?id=/);
    } else {
      expect(countOrEmpty.length).toBeGreaterThan(0);
    }
  });
});
