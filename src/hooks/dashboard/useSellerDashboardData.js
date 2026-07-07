import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';

const LOW_STOCK_THRESHOLD = 5;

/**
 * @param {{ enabled?: boolean }} [options]
 */
export function useSellerDashboardData(options = {}) {
  const enabled = options.enabled !== false;

  const productsQuery = useQuery({
    queryKey: ['seller-dashboard-products'],
    queryFn: () => sovereign.products.mine(),
    enabled,
  });

  const ordersQuery = useQuery({
    queryKey: ['seller-dashboard-orders'],
    queryFn: () => sovereign.shipping.listSellerOrders(),
    enabled,
  });

  const summary = useMemo(() => {
    const products = productsQuery.data ?? [];
    const orders = ordersQuery.data ?? [];

    const published = products.filter((p) => p.status === 'published');
    const pendingOrders = orders.filter(
      (o) => o.status && !['delivered', 'cancelled'].includes(String(o.status).toLowerCase()),
    );
    const lowStock = products.filter(
      (p) => typeof p.stock === 'number' && p.stock >= 0 && p.stock <= LOW_STOCK_THRESHOLD,
    );
    const revenueEstimate = published.reduce((sum, p) => sum + (Number(p.price) || 0) * (Number(p.stock) || 0), 0);

    const topProducts = [...published]
      .sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0))
      .slice(0, 5);

    return {
      productCount: products.length,
      publishedCount: published.length,
      pendingOrderCount: pendingOrders.length,
      lowStockCount: lowStock.length,
      revenueEstimate,
      pendingOrders: pendingOrders.slice(0, 5),
      lowStockProducts: lowStock.slice(0, 5),
      topProducts,
      hasProducts: products.length > 0,
    };
  }, [productsQuery.data, ordersQuery.data]);

  return {
    isLoading: productsQuery.isLoading || ordersQuery.isLoading,
    isFetching: productsQuery.isFetching || ordersQuery.isFetching,
    ...summary,
  };
}
