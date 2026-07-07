import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useEffectiveRole } from '@/hooks/useEffectiveRole';
import { dashboardPageForAccountType } from '@/lib/accountType';
import { useSellerDashboardData } from '@/hooks/dashboard/useSellerDashboardData';
import { MetaTags } from '@/components/seo/MetaTags';
import PageHeader from '@/components/layout/PageHeader';
import PageContent from '@/components/layout/PageContent';
import MetricCard from '@/components/dashboard/MetricCard';
import DashboardSection from '@/components/dashboard/shared/DashboardSection';
import { EmptyState } from '@/components/ui/empty-state';
import { PageLoading } from '@/components/ui/page-loading';
import OnboardingSetupBanner from '@/components/onboarding/OnboardingSetupBanner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { stb } from '@/lib/stbUi';
import {
  DollarSign,
  Package,
  ShoppingBag,
  AlertTriangle,
  Plus,
  Truck,
} from 'lucide-react';

export default function SellerDashboard() {
  const navigate = useNavigate();
  const { isAdmin, isLoading: roleLoading, accountType } = useEffectiveRole();

  useEffect(() => {
    if (roleLoading) return;
    if (isAdmin) {
      navigate(createPageUrl('GlobalFinancials'), { replace: true });
      return;
    }
    if (accountType && accountType !== 'seller') {
      navigate(createPageUrl(dashboardPageForAccountType(accountType)), { replace: true });
    }
  }, [roleLoading, isAdmin, accountType, navigate]);

  const data = useSellerDashboardData({ enabled: accountType === 'seller' });

  if (roleLoading || data.isLoading) {
    return <PageLoading message="Loading sales overview…" />;
  }

  return (
    <div className={stb.page}>
      <MetaTags
        title="Sales overview | Shop The Barber"
        description="Seller dashboard — products, orders, and inventory."
      />
      <PageHeader
        label="Seller"
        title="Sales overview"
        subtitle="Track product performance, pending orders, and inventory alerts."
        compact
        variant="light"
        tier="app"
      >
        <Button asChild className="h-11">
          <Link to={createPageUrl('MarketplaceProductEditor')}>
            <Plus className="w-4 h-4 mr-2 inline" /> Add product
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-11">
          <Link to={createPageUrl('SellerOrders')}>
            <Truck className="w-4 h-4 mr-2 inline" /> Orders
          </Link>
        </Button>
      </PageHeader>

      <PageContent>
        <OnboardingSetupBanner autoOpenModal />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            title="Live products"
            value={String(data.publishedCount)}
            subValue={`${data.productCount} total listings`}
            icon={Package}
          />
          <MetricCard
            title="Pending orders"
            value={String(data.pendingOrderCount)}
            subValue="Awaiting fulfillment"
            icon={ShoppingBag}
          />
          <MetricCard
            title="Low stock"
            value={String(data.lowStockCount)}
            subValue="At or below 5 units"
            icon={AlertTriangle}
          />
          <MetricCard
            title="Catalog value"
            value={`$${Math.round(data.revenueEstimate).toLocaleString()}`}
            subValue="Published inventory at list price"
            icon={DollarSign}
          />
        </div>

        {!data.hasProducts ? (
          <EmptyState
            icon={Package}
            title="No products yet"
            description="List your first grooming product to open your marketplace store."
            actionLabel="List your first product"
            actionHref={createPageUrl('MarketplaceProductEditor')}
          />
        ) : (
          <>
            <DashboardSection
              title="Pending orders"
              subtitle="Orders that still need fulfillment or tracking."
              actionLabel="View all"
              actionPage="SellerOrders"
            >
              {data.pendingOrders.length === 0 ? (
                <Card className={stb.surface}>
                  <p className="p-6 text-sm text-muted-foreground">No pending orders — you're all caught up.</p>
                </Card>
              ) : (
                <ul className="space-y-3">
                  {data.pendingOrders.map((order) => (
                    <li key={order.id || order.fulfillment_id} className={cnRow}>
                      <div>
                        <p className="font-semibold text-foreground text-sm">
                          {order.product_name || order.order_id || 'Marketplace order'}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">{order.status || 'pending'}</p>
                      </div>
                      <Button asChild size="sm" variant="outline">
                        <Link to={createPageUrl('SellerOrders')}>Fulfill</Link>
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </DashboardSection>

            <DashboardSection
              title="Inventory alerts"
              subtitle="Products running low on stock."
              actionLabel="Manage products"
              actionPage="ProviderMarketplaceProducts"
            >
              {data.lowStockProducts.length === 0 ? (
                <Card className={stb.surface}>
                  <p className="p-6 text-sm text-muted-foreground">Stock levels look healthy.</p>
                </Card>
              ) : (
                <ul className="space-y-3">
                  {data.lowStockProducts.map((product) => (
                    <li key={product.id} className={cnRow}>
                      <div>
                        <p className="font-semibold text-foreground text-sm">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.stock ?? 0} units left</p>
                      </div>
                      <Button asChild size="sm" variant="outline">
                        <Link to={`${createPageUrl('MarketplaceProductEditor')}?id=${product.id}`}>Restock</Link>
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </DashboardSection>

            <DashboardSection title="Top products" subtitle="Your live catalog highlights.">
              <ul className="space-y-3">
                {data.topProducts.map((product) => (
                  <li key={product.id} className={cnRow}>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{product.name}</p>
                      <p className="text-xs text-muted-foreground">${Number(product.price).toFixed(2)}</p>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">{product.stock ?? 0} in stock</span>
                  </li>
                ))}
              </ul>
            </DashboardSection>
          </>
        )}
      </PageContent>
    </div>
  );
}

const cnRow = `${stb.panel} p-4 flex items-center justify-between gap-3`;
