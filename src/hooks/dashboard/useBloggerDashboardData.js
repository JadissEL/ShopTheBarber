import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';

/**
 * @param {{ enabled?: boolean, userId?: string | null, userEmail?: string | null }} [options]
 */
export function useBloggerDashboardData(options = {}) {
  const enabled = options.enabled !== false;

  const articlesQuery = useQuery({
    queryKey: ['blogger-dashboard-articles'],
    queryFn: () => sovereign.articles.mine(),
    enabled,
  });

  const productsQuery = useQuery({
    queryKey: ['blogger-dashboard-products'],
    queryFn: () => sovereign.products.mine(),
    enabled,
  });

  const bookingsQuery = useQuery({
    queryKey: ['blogger-dashboard-bookings', options.userId],
    queryFn: async () => {
      if (!options.userId) return [];
      const byClient = await sovereign.entities.Booking.filter({ client_id: options.userId }, '-start_time', 10);
      if (byClient.length > 0) return byClient;
      if (options.userEmail) {
        return sovereign.entities.Booking.filter({ created_by: options.userEmail }, '-start_time', 10);
      }
      return [];
    },
    enabled: enabled && !!options.userId,
  });

  const summary = useMemo(() => {
    const articles = articlesQuery.data ?? [];
    const products = productsQuery.data ?? [];
    const bookings = bookingsQuery.data ?? [];

    const drafts = articles.filter((a) => a.status === 'draft' || a.status === 'rejected');
    const published = articles.filter((a) => a.status === 'published');
    const pendingReview = articles.filter((a) => a.status === 'pending_review');

    const totalViews = published.reduce((sum, a) => sum + (Number(a.view_count) || 0), 0);
    const publishedProducts = products.filter((p) => p.status === 'published');

    const nextBooking = bookings.find(
      (b) => b.status === 'confirmed' && new Date(b.start_time) >= new Date(),
    );

    return {
      articleCount: articles.length,
      draftCount: drafts.length,
      publishedCount: published.length,
      pendingReviewCount: pendingReview.length,
      totalViews,
      drafts: drafts.slice(0, 5),
      recentPublished: published.slice(0, 3),
      productCount: publishedProducts.length,
      nextBooking,
      hasArticles: articles.length > 0,
    };
  }, [articlesQuery.data, productsQuery.data, bookingsQuery.data]);

  return {
    isLoading: articlesQuery.isLoading || productsQuery.isLoading || bookingsQuery.isLoading,
    ...summary,
  };
}
