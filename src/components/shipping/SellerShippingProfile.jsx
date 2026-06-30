import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Loader } from 'lucide-react';
import { toast } from 'sonner';

export default function SellerShippingProfile({ barberId, shopId, ownerType }) {
    const queryClient = useQueryClient();
    const [form, setForm] = useState({
        ship_from_name: '',
        ship_from_street: '',
        ship_from_city: '',
        ship_from_state: '',
        ship_from_zip: '',
        ship_from_phone: '',
        processing_days: '2',
        free_shipping_min: '',
        flat_shipping_rate: '0',
        return_policy: '',
    });

    const queryKey = ['seller-shipping-profile', barberId, shopId];
    const { data: profile, isLoading } = useQuery({
        queryKey,
        queryFn: () =>
            sovereign.shipping.getSellerProfile({
                barber_id: barberId || undefined,
                shop_id: shopId || undefined,
            }),
        enabled: !!(barberId || shopId),
    });

    useEffect(() => {
        if (profile) {
            setForm({
                ship_from_name: profile.ship_from_name || '',
                ship_from_street: profile.ship_from_street || '',
                ship_from_city: profile.ship_from_city || '',
                ship_from_state: profile.ship_from_state || '',
                ship_from_zip: profile.ship_from_zip || '',
                ship_from_phone: profile.ship_from_phone || '',
                processing_days: String(profile.processing_days ?? 2),
                free_shipping_min: profile.free_shipping_min != null ? String(profile.free_shipping_min) : '',
                flat_shipping_rate: String(profile.flat_shipping_rate ?? 0),
                return_policy: profile.return_policy || '',
            });
        }
    }, [profile]);

    const saveMutation = useMutation({
        mutationFn: () =>
            sovereign.shipping.upsertSellerProfile({
                owner_type: ownerType,
                barber_id: barberId || undefined,
                shop_id: shopId || undefined,
                ship_from_name: form.ship_from_name,
                ship_from_street: form.ship_from_street,
                ship_from_city: form.ship_from_city,
                ship_from_state: form.ship_from_state || undefined,
                ship_from_zip: form.ship_from_zip,
                ship_from_phone: form.ship_from_phone || undefined,
                processing_days: parseInt(form.processing_days, 10) || 2,
                free_shipping_min: form.free_shipping_min ? parseFloat(form.free_shipping_min) : null,
                flat_shipping_rate: form.flat_shipping_rate ? parseFloat(form.flat_shipping_rate) : 0,
                return_policy: form.return_policy || undefined,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
            toast.success('Shipping profile saved');
        },
        onError: (e) => toast.error(e.message),
    });

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 text-muted-foreground py-8">
                <Loader className="w-4 h-4 animate-spin" /> Loading shipping settings…
            </div>
        );
    }

    return (
        <Card className="border-border rounded-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Truck className="w-5 h-5 text-primary" />
                    Ship-from & delivery settings
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                    Where you ship from, processing time, and return policy shown to buyers. You are
                    liable for fulfillment until carrier handoff, see{' '}
                    <a href="/marketplace/seller-terms" className="text-primary hover:underline">
                        seller shipping terms
                    </a>
                    .
                </p>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label>Ship-from name / business</Label>
                        <Input value={form.ship_from_name} onChange={(e) => setForm((f) => ({ ...f, ship_from_name: e.target.value }))} className="mt-1 rounded-lg" />
                    </div>
                    <div>
                        <Label>Phone</Label>
                        <Input value={form.ship_from_phone} onChange={(e) => setForm((f) => ({ ...f, ship_from_phone: e.target.value }))} className="mt-1 rounded-lg" />
                    </div>
                    <div className="md:col-span-2">
                        <Label>Street address</Label>
                        <Input value={form.ship_from_street} onChange={(e) => setForm((f) => ({ ...f, ship_from_street: e.target.value }))} className="mt-1 rounded-lg" />
                    </div>
                    <div>
                        <Label>City</Label>
                        <Input value={form.ship_from_city} onChange={(e) => setForm((f) => ({ ...f, ship_from_city: e.target.value }))} className="mt-1 rounded-lg" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <Label>State</Label>
                            <Input value={form.ship_from_state} onChange={(e) => setForm((f) => ({ ...f, ship_from_state: e.target.value }))} className="mt-1 rounded-lg" />
                        </div>
                        <div>
                            <Label>Zip</Label>
                            <Input value={form.ship_from_zip} onChange={(e) => setForm((f) => ({ ...f, ship_from_zip: e.target.value }))} className="mt-1 rounded-lg" />
                        </div>
                    </div>
                    <div>
                        <Label>Processing days</Label>
                        <Input type="number" min={1} max={14} value={form.processing_days} onChange={(e) => setForm((f) => ({ ...f, processing_days: e.target.value }))} className="mt-1 rounded-lg" />
                    </div>
                    <div>
                        <Label>Free shipping min ($)</Label>
                        <Input type="number" min={0} step="0.01" placeholder="Platform default: $50" value={form.free_shipping_min} onChange={(e) => setForm((f) => ({ ...f, free_shipping_min: e.target.value }))} className="mt-1 rounded-lg" />
                    </div>
                </div>
                <div>
                    <Label>Return policy</Label>
                    <Textarea value={form.return_policy} onChange={(e) => setForm((f) => ({ ...f, return_policy: e.target.value }))} placeholder="30-day returns on unopened products…" className="mt-1 rounded-lg min-h-[80px]" />
                </div>
                <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="">
                    {saveMutation.isPending ? <Loader className="w-4 h-4 animate-spin mr-2" /> : null}
                    Save shipping profile
                </Button>
            </CardContent>
        </Card>
    );
}
