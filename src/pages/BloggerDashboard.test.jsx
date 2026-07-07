import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/hooks/useEffectiveRole', () => ({
  useEffectiveRole: vi.fn(() => ({
    isAdmin: false,
    isLoading: false,
    accountType: 'blogger',
    role: 'blogger',
  })),
}));

vi.mock('@/hooks/dashboard/useBloggerDashboardData', () => ({
  useBloggerDashboardData: vi.fn(() => ({
    isLoading: false,
    publishedCount: 2,
    articleCount: 4,
    draftCount: 1,
    pendingReviewCount: 0,
    totalViews: 1200,
    productCount: 3,
    hasArticles: true,
    nextBooking: null,
    draftArticles: [{ id: 'a1', title: 'Fade Trends 2026', status: 'draft' }],
    drafts: [{ id: 'a1', title: 'Fade Trends 2026', status: 'draft' }],
    recentPublished: [{ id: 'a2', title: 'Beard Care Guide', views: 800 }],
  })),
}));

vi.mock('@/api/apiClient', () => ({
  sovereign: {
    auth: {
      me: vi.fn(async () => ({ id: 'u1', email: 'blogger@test.com' })),
    },
  },
}));

vi.mock('@/components/onboarding/OnboardingSetupBanner', () => ({
  default: () => null,
}));

vi.mock('@/components/seo/MetaTags', () => ({
  MetaTags: () => null,
}));

import BloggerDashboard from '@/pages/BloggerDashboard';

function renderDashboard() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <BloggerDashboard />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('BloggerDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders creator studio with article KPIs and draft queue', async () => {
    renderDashboard();
    expect(screen.getByRole('heading', { name: 'Creator studio' })).toBeInTheDocument();
    expect(screen.getAllByText('Published').length).toBeGreaterThan(0);
    expect(screen.getByText('Draft queue')).toBeInTheDocument();
    expect(screen.getByText('Fade Trends 2026')).toBeInTheDocument();
  });
});
