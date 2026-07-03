import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Check, Circle, Truck, Package, Headphones } from 'lucide-react';
import { MetaTags } from '@/components/seo/MetaTags';
import { Button } from '@/components/ui/button';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { PageLoading } from '@/components/ui/page-loading';
import { sovereign } from '@/api/apiClient';
import { useAuth } from '@/lib/AuthContext';
import { createPageUrl } from '@/utils';
import ContextualBackLink from '@/components/ui/ContextualBackLink';
import PageHeader from '@/components/layout/PageHeader';
import PageContent from '@/components/layout/PageContent';
import { cn } from '@/lib/utils';
import { stb } from '@/lib/stbUi';

const JOURNEY_STEPS = [
  { key: 'confirmed', label: 'Order Confirmed', sub: null, icon: Check },
  { key: 'preparing', label: 'Preparing Your Selection', sub: 'Our grooming consultants are curating your kit', icon: Circle },
  { key: 'in_transit', label: 'In Transit', sub: 'Elite Courier Logistics', icon: Truck },
  { key: 'delivered', label: 'Delivered', sub: 'Signature required', icon: Package },
];

function formatEstimatedArrival(isoDateStr) {
  if (!isoDateStr) return null;
  const d = new Date(`${isoDateStr  }T12:00:00`);
  const options = { weekday: 'long', month: 'short', day: 'numeric' };
  const formatted = d.toLocaleDateString('en-US', options);
  const day = d.getDate();
  const suffix = day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th';
  return formatted.replace(String(day), day + suffix);
}

export default function OrderTracking() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('id');
  const { isAuthenticated } = useAuth();

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => sovereign.orders.get(orderId),
    enabled: !!orderId && isAuthenticated,
    staleTime: 60 * 1000,
  });

  const customerName = order?.shipping_full_name?.split(' ')[0] || 'there';
  const orderNumber = order?.order_number || (order?.id ? `#${order.id.slice(-8).toUpperCase()}` : '');
  const estimatedDateRaw = order?.estimated_delivery_at || (order?.created_at ? (() => { const d = new Date(order.created_at); d.setDate(d.getDate() + 3); return d.toISOString().slice(0, 10); })() : null);
  const estimatedDate = estimatedDateRaw ? formatEstimatedArrival(estimatedDateRaw) : null;
  const fulfillmentStatus = order?.fulfillment_status || 'confirmed';
  const fulfillments = order?.fulfillments || [];
  const statusOrder = { confirmed: 0, preparing: 1, in_transit: 2, delivered: 3 };
  const currentStepIndex = statusOrder[fulfillmentStatus] ?? 1;

  if (!orderId) {
    return (
      <div className="stb-page lg:pb-8 flex flex-col items-center justify-center px-4">
        <MetaTags title="Order Tracking" description="Track your order." />
        <p className="text-muted-foreground mb-4">No order specified.</p>
        <ContextualBackLink />
      </div>
    );
  }

  if (!isAuthenticated) {
    navigate(`${createPageUrl('SignIn')  }?return=${  encodeURIComponent(`/OrderTracking?id=${orderId}`)}`);
    return null;
  }

  if (isLoading) {
    return (
      <div className="stb-page lg:pb-8">
        <PageLoading message="Loading order details..." />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="stb-page lg:pb-8 flex flex-col items-center justify-center px-4">
        <MetaTags title="Order Not Found" description="Order not found." />
        <p className="text-muted-foreground mb-4">Order not found.</p>
        <ContextualBackLink />
      </div>
    );
  }

  const items = order.items || [];

  return (
    <div className={`${stb.page  } lg:pb-8`}>
      <MetaTags
        title={`Tracking - Order ${orderNumber}`}
        description="Track your premium grooming order."
      />

      <PageHeader
        label="Marketplace"
        title="Order tracking"
        subtitle={`Order ${orderNumber}${estimatedDate ? ` · Est. ${estimatedDate}` : ''}`}
        compact
        variant="light"
        tier="app"
      />

      <PageContent narrow>
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-primary" strokeWidth={2.5} />
          </div>
          <h2 className={`${stb.uiSubheading  } mb-1`}>
            Thank You, {customerName}
          </h2>
          <p className="text-sm text-muted-foreground font-medium">ORDER {orderNumber}</p>
        </div>

        {estimatedDate && (
          <section className={cn(stb.panel, 'p-5 mb-8')}>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">Estimated Arrival</p>
            <p className="text-xl font-bold text-foreground mb-0.5" style={{ fontFamily: 'var(--font-serif, Georgia, serif)' }}>
              {estimatedDate}
            </p>
            <p className="text-sm text-muted-foreground">Via Premium White-Glove Courier</p>
          </section>
        )}

        {(order.tracking_number || fulfillments.some((f) => f.tracking_number)) && (
          <section className={cn(stb.panel, 'p-5 mb-8')}>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">Tracking</p>
            {fulfillments.filter((f) => f.tracking_number).length > 0 ? (
              <ul className="space-y-2">
                {fulfillments.filter((f) => f.tracking_number).map((f) => (
                  <li key={f.id} className="text-sm">
                    <span className="font-medium capitalize">{f.carrier || 'Carrier'}: </span>
                    <span className="font-mono">{f.tracking_number}</span>
                    <span className="text-muted-foreground ml-2 capitalize">({f.fulfillment_status?.replace('_', ' ')})</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm font-mono">{order.tracking_number}{order.carrier ? `, ${order.carrier}` : ''}</p>
            )}
          </section>
        )}

        {(order.shipping_street || order.shipping_full_name) && (
          <section className="stb-card p-5 mb-8 shadow-sm text-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">Deliver to</p>
            <p className="font-medium">{order.shipping_full_name}</p>
            <p className="text-muted-foreground">{order.shipping_street}</p>
            <p className="text-muted-foreground">
              {order.shipping_city}{order.shipping_state ? `, ${order.shipping_state}` : ''} {order.shipping_zip}
            </p>
          </section>
        )}

        <section className="mb-8">
          <h3 className="text-lg font-bold text-foreground mb-5" style={{ fontFamily: 'var(--font-serif, Georgia, serif)' }}>
            Order Journey
          </h3>
          <div className="relative pl-8 border-l-2 border-border ml-1">
            {JOURNEY_STEPS.map((step, i) => {
              const isDone = i < currentStepIndex;
              const isCurrent = i === currentStepIndex;
              const isPending = i > currentStepIndex;
              const Icon = step.icon;
              return (
                <div key={step.key} className="relative pb-6 last:pb-0">
                  <div className="absolute -left-8 top-0 flex items-center justify-center w-6 h-6 rounded-full bg-card border-2 border-border">
                    {isDone ? (
                      <Check className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
                    ) : isCurrent ? (
                      <Circle className="w-3.5 h-3.5 text-primary fill-primary" strokeWidth={2} />
                    ) : (
                      <Icon className={`w-3.5 h-3.5 ${isPending ? 'text-white/70' : 'text-primary'}`} strokeWidth={2} />
                    )}
                  </div>
                  <div className={`${isPending ? 'text-muted-foreground' : 'text-foreground'}`}>
                    <p className="font-semibold text-sm">{step.label}</p>
                    {step.sub && (
                      <p className={`text-xs mt-0.5 ${isCurrent ? 'text-primary italic' : 'text-muted-foreground'}`}>{step.sub}</p>
                    )}
                    {i === 0 && order?.created_at && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mb-8">
          <h3 className="text-lg font-bold text-foreground mb-4" style={{ fontFamily: 'var(--font-serif, Georgia, serif)' }}>
            Your Selection
          </h3>
          <ul className="space-y-4">
            {items.map((item) => (
              <li key={item.id} className={cn(stb.panel, 'p-4 flex gap-4')}>
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted shrink-0">
                  <OptimizedImage
                    src={item.product_image_url || ''}
                    alt={item.product_name}
                    className="w-full h-full object-cover"
                    width={80}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Elite Grooming</p>
                  <p className="font-semibold text-foreground">{item.product_name}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">Qty: {item.quantity}</p>
                  <p className="font-bold text-foreground mt-1">${(Number(item.price) * (item.quantity || 1)).toFixed(2)}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <div className="mb-6">
          <p className="text-sm text-muted-foreground mb-4">
            Your personal grooming consultant is available for any delivery adjustments or styling advice.
          </p>
          <Link to={createPageUrl('SupportChat') + (order?.id ? `?order_id=${order.id}&new=1` : '?new=1')}>
            <Button className="w-full rounded-lg h-12 bg-card border-2 border-primary text-primary hover:bg-primary/10 font-semibold gap-2" variant="outline">
              <Headphones className="w-5 h-5" />
              Contact Concierge
            </Button>
          </Link>
        </div>

        <p className="text-center text-xs text-muted-foreground uppercase tracking-[0.25em]">
          Elite Grooming Marketplace
        </p>
      </PageContent>
    </div>
  );
}
