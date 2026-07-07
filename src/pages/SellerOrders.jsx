import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { MetaTags } from '@/components/seo/MetaTags';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Truck, MapPin, Loader } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useCapabilityContext } from '@/hooks/useCapabilityContext';
import { hasCapability } from '@/lib/capabilities';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { PageLoading } from '@/components/ui/page-loading';
import PageHeader from '@/components/layout/PageHeader';
import PageContent from '@/components/layout/PageContent';
import { stb } from '@/lib/stbUi';

const STATUS_OPTIONS = [
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'preparing', label: 'Preparing' },
    { value: 'in_transit', label: 'In transit' },
    { value: 'delivered', label: 'Delivered' },
];

export default function SellerOrders() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { isAuthenticated } = useAuth();
    const capabilityContext = useCapabilityContext();
    const canManageOrders = hasCapability(capabilityContext, 'order.manage');
    const [expandedId, setExpandedId] = useState(null);
    const [trackingForms, setTrackingForms] = useState({});

    const { data: orders = [], isLoading } = useQuery({
        queryKey: ['seller-orders'],
        queryFn: () => sovereign.shipping.listSellerOrders(),
        enabled: isAuthenticated && canManageOrders,
    });

    const updateMutation = useMutation({
        mutationFn: ({ fulfillmentId, data }) => sovereign.shipping.updateFulfillment(fulfillmentId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
            toast.success('Shipment updated');
        },
        onError: (e) => toast.error(e.message),
    });

    if (!isAuthenticated || !canManageOrders) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <MetaTags title="Seller orders" />
                <p className="text-muted-foreground mb-4">Sign in as a seller to manage marketplace shipments.</p>
                <Button onClick={() => navigate(createPageUrl('SignIn'))}>Sign in</Button>
            </div>
        );
    }

    if (isLoading) return <PageLoading message="Loading orders to fulfill…" />;

    return (
        <div className={`${stb.page  } lg:pb-8`}>
            <MetaTags title="Marketplace orders" description="Manage shipments for your marketplace sales." />

            <PageHeader
                label="Marketplace"
                title="Orders to ship"
                subtitle="Update status and add tracking for your marketplace sales."
                compact
                variant="light"
                tier="app"
            />

            <PageContent narrow className="space-y-4">
                {orders.length === 0 ? (
                    <Card className="border-border">
                        <CardContent className="p-10 text-center text-muted-foreground">
                            <Package className="w-10 h-10 mx-auto mb-3 opacity-40" />
                            <p>No paid orders with your products yet.</p>
                        </CardContent>
                    </Card>
                ) : (
                    orders.map(({ fulfillment, order, items }) => {
                        const isOpen = expandedId === fulfillment.id;
                        const form = trackingForms[fulfillment.id] || {
                            tracking_number: fulfillment.tracking_number || '',
                            carrier: fulfillment.carrier || '',
                            fulfillment_status: fulfillment.fulfillment_status || 'confirmed',
                        };
                        return (
                            <Card key={fulfillment.id} className="border-border overflow-hidden">
                                <CardContent className="p-0">
                                    <button
                                        type="button"
                                        className="w-full text-left p-4 flex items-start justify-between gap-4 hover:bg-muted/30"
                                        onClick={() => setExpandedId(isOpen ? null : fulfillment.id)}
                                    >
                                        <div>
                                            <p className="font-semibold">Order {order.order_number}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {order.created_at ? new Date(order.created_at).toLocaleDateString() : ''}, {items.length} item(s)
                                            </p>
                                            <span className="inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded bg-primary/10 text-primary capitalize">
                                                {fulfillment.fulfillment_status?.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <Truck className="w-5 h-5 text-muted-foreground shrink-0 mt-1" />
                                    </button>

                                    {isOpen && (
                                        <div className="border-t border-border p-4 space-y-4 bg-muted/20">
                                            <div className="flex items-start gap-2 text-sm">
                                                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="font-medium">Ship to</p>
                                                    <p>{order.shipping_full_name}</p>
                                                    <p className="text-muted-foreground">{order.shipping_street}</p>
                                                    <p className="text-muted-foreground">
                                                        {order.shipping_city}{order.shipping_state ? `, ${order.shipping_state}` : ''} {order.shipping_zip}
                                                    </p>
                                                    {order.shipping_phone && <p className="text-muted-foreground">{order.shipping_phone}</p>}
                                                </div>
                                            </div>

                                            <ul className="text-sm space-y-1">
                                                {items.map((item) => (
                                                    <li key={item.id} className="flex justify-between">
                                                        <span>{item.product_name} × {item.quantity}</span>
                                                        <span className="font-medium">${(Number(item.price) * item.quantity).toFixed(2)}</span>
                                                    </li>
                                                ))}
                                            </ul>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <Label className="text-xs">Status</Label>
                                                    <Select
                                                        value={form.fulfillment_status}
                                                        onValueChange={(v) =>
                                                            setTrackingForms((prev) => ({
                                                                ...prev,
                                                                [fulfillment.id]: { ...form, fulfillment_status: v },
                                                            }))
                                                        }
                                                    >
                                                        <SelectTrigger className="mt-1 rounded-lg">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {STATUS_OPTIONS.map((o) => (
                                                                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <Label className="text-xs">Carrier</Label>
                                                    <Input
                                                        value={form.carrier}
                                                        onChange={(e) =>
                                                            setTrackingForms((prev) => ({
                                                                ...prev,
                                                                [fulfillment.id]: { ...form, carrier: e.target.value },
                                                            }))
                                                        }
                                                        placeholder="UPS, FedEx, USPS…"
                                                        className="mt-1 rounded-lg"
                                                    />
                                                </div>
                                                <div className="sm:col-span-2">
                                                    <Label className="text-xs">Tracking number</Label>
                                                    <Input
                                                        value={form.tracking_number}
                                                        onChange={(e) =>
                                                            setTrackingForms((prev) => ({
                                                                ...prev,
                                                                [fulfillment.id]: { ...form, tracking_number: e.target.value },
                                                            }))
                                                        }
                                                        placeholder="1Z999…"
                                                        className="mt-1 rounded-lg"
                                                    />
                                                </div>
                                            </div>

                                            <Button
                                                className=" w-full sm:w-auto"
                                                disabled={updateMutation.isPending}
                                                onClick={() =>
                                                    updateMutation.mutate({
                                                        fulfillmentId: fulfillment.id,
                                                        data: form,
                                                    })
                                                }
                                            >
                                                {updateMutation.isPending ? <Loader className="w-4 h-4 animate-spin mr-2" /> : null}
                                                Save shipment update
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </PageContent>
        </div>
    );
}
