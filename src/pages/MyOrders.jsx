import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Package, ChevronRight } from 'lucide-react';
import { PageLoading } from '@/components/ui/page-loading';
import { EmptyState } from '@/components/ui/empty-state';
import { MetaTags } from '@/components/seo/MetaTags';
import { sovereign } from '@/api/apiClient';
import { useAuth } from '@/lib/AuthContext';
import { createPageUrl } from '@/utils';
import PageHeader from '@/components/layout/PageHeader';
import PageContent from '@/components/layout/PageContent';
import { cn } from '@/lib/utils';
import { stb } from '@/lib/stbUi';
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
  const { isAuthenticated, isLoadingAuth, isSignedIn, syncStatus } = useAuth();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => sovereign.orders.list(),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });

  // Redirect if not authenticated (useEffect to avoid render-phase side effects)
  useEffect(() => {
    if (isLoadingAuth) return;
    if (isSignedIn && !isAuthenticated) {
      if (syncStatus === 'error') {
        navigate(createPageUrl('SetupGuide'), { replace: true });
      }
      return;
    }
    if (!isAuthenticated) {
      navigate(`${createPageUrl('SignIn')  }?return=${  encodeURIComponent('/MyOrders')}`, { replace: true });
    }
  }, [isAuthenticated, isLoadingAuth, isSignedIn, syncStatus, navigate]);

  // Show loading while checking auth
  if (isLoadingAuth || (isSignedIn && !isAuthenticated && syncStatus !== 'error')) {
    return <PageLoading message="Checking authentication..." />;
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="stb-page lg:pb-8">
      <MetaTags
        title="My Orders - Shop The Barber"
        description="View and track your premium grooming orders."
      />

      <PageHeader
        label="Marketplace"
        title="My orders"
        subtitle="Track your marketplace orders"
        compact
        variant="light"
        tier="app"
      />

      <PageContent narrow className="max-w-2xl">
        {isLoading ? (
          <PageLoading message="Loading orders..." />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No orders yet"
            description="Orders from the Marketplace will appear here."
            actionLabel="Browse Marketplace"
            actionHref={createPageUrl('Marketplace')}
          />
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
                    to={`${createPageUrl('OrderTracking')  }?id=${  encodeURIComponent(order.id)}`}
                    className={cn(stb.panel, stb.surfaceHover, 'block p-4 transition-all hover:border-primary/30')}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">Order {orderNum}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">{dateStr}</p>
                        <p className="text-sm font-medium text-foreground mt-1">${Number(order.total).toFixed(2)}</p>
                        <span className="inline-block mt-2 text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                          {statusLabel}
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </PageContent>
    </div>
  );
}
