/**
 * Critical-path test: Explore → select barber → services (booking flow entry).
 * Validates that the Explore page renders discovery UI and links to barber profile (booking flow entry).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ClerkProvider } from '@clerk/react';
import { AuthProvider } from '@/lib/AuthContext';
import { CartProvider } from '@/components/context/CartContext';
import Explore from '@/pages/Explore';

/** Valid-form publishable key shape for ClerkProvider in tests (does not need a real backend for mount). */
const CLERK_PUBLISHABLE_TEST = 'pk_test_dGVzdGFibGVfY2xlcmsuZGV2JA';

const mockBarbers = [
  {
    id: 'barber-1',
    shop_id: 'shop-1',
    name: 'Alex Barber',
    data: {
      name: 'Alex Barber',
      location: 'Downtown',
      image_url: 'https://example.com/alex.jpg',
      rating: 4.9,
      review_count: 42,
      title: 'Master Barber',
      offers_mobile_service: true,
    },
  },
];

const mockShops = [
  { id: 'shop-1', name: 'Downtown Cuts', data: { name: 'Downtown Cuts', location: 'Downtown' } },
];

vi.mock('@/api/apiClient', () => ({
  registerClerkGetToken: vi.fn(),
  sovereign: {
    auth: { me: vi.fn(() => Promise.resolve(null)) },
    public: {
      getActivePromotions: vi.fn(() =>
        Promise.resolve({ shop_ids: [], has_platform_promos: false })
      ),
      getHomepage: vi.fn(() =>
        Promise.resolve({ stats: { barber_count: 100, avg_rating: 4.8 } })
      ),
    },
    languages: { getOptions: vi.fn(() => Promise.resolve([{ code: 'en', label: 'English' }])) },
    providerStats: { getBarberPublicBatch: vi.fn(() => Promise.resolve({})) },
    showcase: { getDiscoveryPreviews: vi.fn(() => Promise.resolve({})) },
    explore: {
      searchBarbers: vi.fn(() =>
        Promise.resolve({
          barbers: mockBarbers.map((b) => ({
            id: b.id,
            shop_id: b.shop_id,
            name: b.data.name,
            location: b.data.location,
            image_url: b.data.image_url,
            rating: b.data.rating,
            review_count: b.data.review_count,
            title: b.data.title,
            offers_mobile_service: b.data.offers_mobile_service,
            offers_shop_service: true,
            services: [],
            shop: { id: b.shop_id, name: 'Downtown Cuts', spoken_languages: null, children_friendly: false, attestation_licensed: false, attestation_insured: false },
          })),
          total: 1,
          fallback: null,
        })
      ),
      searchShops: vi.fn(() =>
        Promise.resolve({
          shops: mockShops.map((s) => ({
            id: s.id,
            name: s.data.name,
            location: s.data.location,
          })),
          total: 1,
        })
      ),
    },
    entities: {
      Barber: {
        get: vi.fn((id) => Promise.resolve(mockBarbers.find((b) => b.id === id) || null)),
      },
      Shop: { list: vi.fn(() => Promise.resolve(mockShops)) },
      Service: { list: vi.fn(() => Promise.resolve([])) },
      Favorite: { filter: vi.fn(() => Promise.resolve([])) },
    },
  },
}));

function renderExplore(initialEntries = ['/Explore']) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries} future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
          <ClerkProvider publishableKey={CLERK_PUBLISHABLE_TEST}>
            <AuthProvider>
              <CartProvider>
                <Explore />
              </CartProvider>
            </AuthProvider>
          </ClerkProvider>
        </MemoryRouter>
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
      expect(screen.getAllByPlaceholderText(/search barbers/i).length).toBeGreaterThan(0);
    });
  });

  it('shows professionals discovery section (heading or count)', async () => {
    renderExplore();
    await waitFor(() => {
      const matches = screen.getAllByText(/Top Rated Barbers|All professionals|professional/i);
      expect(matches.length).toBeGreaterThan(0);
    }, { timeout: 3000 });
  });

  it('has booking flow entry: BarberProfile links when barbers listed, or empty state when none', async () => {
    renderExplore();
    await waitFor(() => {
      const profileLinks = document.querySelectorAll('a[href*="BarberProfile"]');
      const bookLinks = document.querySelectorAll('a[href*="BookingFlow"]');
      expect(profileLinks.length + bookLinks.length).toBeGreaterThan(0);
    }, { timeout: 3000 });
  });

  it('renders mobile discovery mode with dedicated hero', async () => {
    renderExplore(['/Explore?mobile=1']);
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Mobile Barbers/i })).toBeInTheDocument();
    });
    expect(screen.getByRole('status')).toHaveTextContent(/at-home barbers/i);
    expect(screen.getByRole('heading', { level: 2, name: /Mobile professionals/i })).toBeInTheDocument();
  });
});
