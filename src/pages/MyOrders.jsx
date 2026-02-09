import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Package, ChevronRight } from 'lucide-react';
import { MetaTags } from '@/components/seo/MetaTags';
import { Button } from '@/components/ui/button';
import { sovereign } from '@/api/apiClient';
import { useAuth } from '@/lib/AuthContext';
import { createPageUrl } from '@/utils';
import ClientBottomNav from '@/components/dashboard/ClientBottomNav';

const STATUS_LABELS = {
  confirmed: 'Preparing',
  preparing: 'Preparing',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  paid: 'Confirmed',
  pending: 'Pending',
};

export default function MyOrders() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => sovereign.orders.list(),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });

  if (!isAuthenticated) {
    navigate(createPageUrl('SignIn') + '?return=' + encodeURIComponent('/MyOrders'));
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-8">
      <MetaTags
        title="My Orders – Shop The Barber"
        description="View and track your premium grooming orders."
      />

      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="w-full max-w-2xl mx-auto px-4 lg:px-8 py-4">
          <h1 className="text-xl font-bold text-foreground">My Orders</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Track your marketplace orders</p>
        </div>
      </header>

      <main className="w-full max-w-2xl mx-auto px-4 lg:px-8 py-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-muted-foreground font-medium mb-2">No orders yet</p>
            <p className="text-muted-foreground text-sm mb-6">Orders from the Marketplace will appear here.</p>
            <Link to={createPageUrl('Marketplace')}>
              <Button className="rounded-xl bg-primary text-primary-foreground hover:opacity-95">Browse Marketplace</Button>
            </Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {orders.map((order) => {
              const orderNum = order.order_number || `#${order.id?.slice(-8) || ''}`;
              const dateStr = order.created_at ? new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
              const status = order.fulfillment_status || order.status || 'paid';
              const statusLabel = STATUS_LABELS[status] || status;
              return (
                <li key={order.id}>
                  <Link
                    to={createPageUrl('OrderTracking') + '?id=' + encodeURIComponent(order.id)}
                    className="block rounded-2xl border border-border bg-card p-4 hover:border-primary/30 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">Order {orderNum}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">{dateStr}</p>
                        <p className="text-sm font-medium text-foreground mt-1">${Number(order.total).toFixed(2)}</p>
                        <span className="inline-block mt-2 text-xs font-medium text-sky-600 bg-sky-50 px-2 py-1 rounded">
                          {statusLabel}
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      <ClientBottomNav />
    </div>
  );
}
