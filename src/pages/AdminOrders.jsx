import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { AlertCircle, Package, Truck, CheckCircle2, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { MetaTags } from '@/components/seo/MetaTags';
import { toast } from 'sonner';

const FULFILLMENT_OPTIONS = [
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'in_transit', label: 'In transit' },
  { value: 'delivered', label: 'Delivered' },
];

function formatDate(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { dateStyle: 'short' });
  } catch {
    return iso;
  }
}

export default function AdminOrders() {
  const queryClient = useQueryClient();
  const [filterFulfillment, setFilterFulfillment] = useState('all');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => sovereign.auth.me(),
  });

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => sovereign.orders.listAdmin(),
    initialData: [],
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ orderId, data }) => sovereign.orders.update(orderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Order updated');
    },
    onError: (err) => toast.error(err.message || 'Update failed'),
  });

  const filteredOrders =
    filterFulfillment === 'all'
      ? orders
      : orders.filter((o) => (o.fulfillment_status || 'confirmed') === filterFulfillment);

  const paidCount = orders.filter((o) => o.payment_status === 'paid').length;
  const inTransitCount = orders.filter((o) => o.fulfillment_status === 'in_transit').length;
  const deliveredCount = orders.filter((o) => o.fulfillment_status === 'delivered').length;

  const handleFulfillmentChange = (orderId, value) => {
    updateOrderMutation.mutate({ orderId, data: { fulfillment_status: value } });
  };

  const handleEstimatedDeliveryChange = (orderId, value) => {
    if (!value) return;
    updateOrderMutation.mutate({ orderId, data: { estimated_delivery_at: value } });
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <MetaTags title="Access Denied" />
        <Card>
          <CardContent className="py-8 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
            <p className="text-foreground font-semibold">Admin Access Required</p>
            <p className="text-muted-foreground text-sm mt-2">You must be an admin to manage orders.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      <MetaTags title="Order Management" description="Manage marketplace orders and fulfillment" />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Order Management</h1>
          <p className="text-muted-foreground">View and update fulfillment for marketplace orders</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <h3 className="text-3xl font-bold">{orders.length}</h3>
                </div>
                <Package className="w-8 h-8 text-muted-foreground opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Paid</p>
                  <h3 className="text-3xl font-bold">{paidCount}</h3>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">In transit</p>
                  <h3 className="text-3xl font-bold">{inTransitCount}</h3>
                </div>
                <Truck className="w-8 h-8 text-amber-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Delivered</p>
                  <h3 className="text-3xl font-bold">{deliveredCount}</h3>
                </div>
                <CheckCircle2 className="w-8 h-8 text-emerald-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-4">
          <label className="text-sm text-muted-foreground">Fulfillment:</label>
          <select
            value={filterFulfillment}
            onChange={(e) => setFilterFulfillment(e.target.value)}
            className="px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
          >
            <option value="all">All</option>
            {FULFILLMENT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <Clock className="w-10 h-10 text-muted-foreground mx-auto animate-pulse" />
            <p className="text-muted-foreground mt-2">Loading orders...</p>
          </div>
        ) : filteredOrders.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-sm font-medium text-muted-foreground">Order #</th>
                      <th className="px-4 py-3 text-sm font-medium text-muted-foreground">Date</th>
                      <th className="px-4 py-3 text-sm font-medium text-muted-foreground">Customer</th>
                      <th className="px-4 py-3 text-sm font-medium text-muted-foreground">Total</th>
                      <th className="px-4 py-3 text-sm font-medium text-muted-foreground">Payment</th>
                      <th className="px-4 py-3 text-sm font-medium text-muted-foreground">Fulfillment</th>
                      <th className="px-4 py-3 text-sm font-medium text-muted-foreground">Est. delivery</th>
                      <th className="px-4 py-3 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3 font-mono text-sm">{order.order_number}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(order.created_at)}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className="font-medium">{order.user_name || '—'}</span>
                          {order.user_email && (
                            <span className="block text-muted-foreground text-xs">{order.user_email}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">
                          ${Number(order.total).toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                              order.payment_status === 'paid'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {order.payment_status || 'unpaid'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={order.fulfillment_status || 'confirmed'}
                            onChange={(e) => handleFulfillmentChange(order.id, e.target.value)}
                            className="px-2 py-1 rounded border border-border bg-background text-sm"
                            disabled={updateOrderMutation.isPending}
                          >
                            {FULFILLMENT_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {order.estimated_delivery_at
                            ? formatDate(order.estimated_delivery_at)
                            : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="date"
                            className="px-2 py-1 rounded border border-border bg-background text-sm w-36"
                            onBlur={(e) => {
                              const v = e.target.value;
                              if (v) handleEstimatedDeliveryChange(order.id, v);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const v = e.target.value;
                                if (v) handleEstimatedDeliveryChange(order.id, v);
                              }
                            }}
                            aria-label="Set estimated delivery date"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No orders found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
