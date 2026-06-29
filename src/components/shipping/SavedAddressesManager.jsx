import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Plus, Trash2, Star, Loader, Check } from 'lucide-react';
import { toast } from 'sonner';

const EMPTY = {
    label: 'Home',
    full_name: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    phone: '',
};

export default function SavedAddressesManager({ compact = false, onSelect, selectedId }) {
    const queryClient = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(EMPTY);

    const { data: addresses = [], isLoading } = useQuery({
        queryKey: ['saved-addresses'],
        queryFn: () => sovereign.shipping.listAddresses(),
    });

    const createMutation = useMutation({
        mutationFn: (payload) => sovereign.shipping.createAddress(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['saved-addresses'] });
            setShowForm(false);
            setForm(EMPTY);
            toast.success('Address saved');
        },
        onError: (e) => toast.error(e.message),
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => sovereign.shipping.deleteAddress(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['saved-addresses'] });
            toast.success('Address removed');
        },
        onError: (e) => toast.error(e.message),
    });

    const defaultMutation = useMutation({
        mutationFn: (id) => sovereign.shipping.setDefaultAddress(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['saved-addresses'] });
            toast.success('Default address updated');
        },
        onError: (e) => toast.error(e.message),
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.full_name?.trim() || !form.street?.trim() || !form.city?.trim() || !form.zip?.trim()) {
            toast.error('Name, street, city, and zip are required');
            return;
        }
        createMutation.mutate({ ...form, is_default: addresses.length === 0 });
    };

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
                <Loader className="w-4 h-4 animate-spin" /> Loading addresses…
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {addresses.length === 0 && !showForm && (
                <p className="text-sm text-muted-foreground">No saved addresses yet. Add one for faster checkout.</p>
            )}

            <div className={compact ? 'space-y-2' : 'grid gap-3 sm:grid-cols-2'}>
                {addresses.map((addr) => (
                    <Card
                        key={addr.id}
                        className={`cursor-pointer transition-all ${selectedId === addr.id ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-primary/40'}`}
                        onClick={() => onSelect?.(addr)}
                    >
                        <CardContent className={`${compact ? 'p-3' : 'p-4'} flex justify-between gap-3`}>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <MapPin className="w-4 h-4 text-primary shrink-0" />
                                    <span className="font-semibold text-sm">{addr.label || 'Address'}</span>
                                    {addr.is_default && (
                                        <span className="text-[10px] uppercase font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">Default</span>
                                    )}
                                    {selectedId === addr.id && <Check className="w-4 h-4 text-primary ml-auto" />}
                                </div>
                                <p className="text-sm font-medium">{addr.full_name}</p>
                                <p className="text-xs text-muted-foreground">{addr.street}</p>
                                <p className="text-xs text-muted-foreground">
                                    {addr.city}{addr.state ? `, ${addr.state}` : ''} {addr.zip}
                                </p>
                            </div>
                            {!compact && (
                                <div className="flex flex-col gap-1 shrink-0">
                                    {!addr.is_default && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 px-2"
                                            onClick={(e) => { e.stopPropagation(); defaultMutation.mutate(addr.id); }}
                                        >
                                            <Star className="w-3.5 h-3.5" />
                                        </Button>
                                    )}
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 px-2 text-destructive hover:text-destructive"
                                        onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(addr.id); }}
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {showForm ? (
                <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-border p-4 bg-muted/30">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label className="text-xs">Label</Label>
                            <Input value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} placeholder="Home" className="mt-1 rounded-xl" />
                        </div>
                        <div>
                            <Label className="text-xs">Full name</Label>
                            <Input value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} className="mt-1 rounded-xl" required />
                        </div>
                    </div>
                    <div>
                        <Label className="text-xs">Street</Label>
                        <Input value={form.street} onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))} className="mt-1 rounded-xl" required />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <Label className="text-xs">City</Label>
                            <Input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} className="mt-1 rounded-xl" required />
                        </div>
                        <div>
                            <Label className="text-xs">State</Label>
                            <Input value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} className="mt-1 rounded-xl" />
                        </div>
                        <div>
                            <Label className="text-xs">Zip</Label>
                            <Input value={form.zip} onChange={(e) => setForm((f) => ({ ...f, zip: e.target.value }))} className="mt-1 rounded-xl" required />
                        </div>
                    </div>
                    <div>
                        <Label className="text-xs">Phone</Label>
                        <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="mt-1 rounded-xl" />
                    </div>
                    <div className="flex gap-2">
                        <Button type="submit" disabled={createMutation.isPending} className="rounded-xl">
                            {createMutation.isPending ? <Loader className="w-4 h-4 animate-spin" /> : 'Save address'}
                        </Button>
                        <Button type="button" variant="outline" className="rounded-xl" onClick={() => setShowForm(false)}>Cancel</Button>
                    </div>
                </form>
            ) : (
                <Button type="button" variant="outline" className="rounded-xl gap-2" onClick={() => setShowForm(true)}>
                    <Plus className="w-4 h-4" /> Add address
                </Button>
            )}
        </div>
    );
}

/** Map saved address row checkout shipping fields */
export function addressToShipping(addr) {
    if (!addr) return null;
    return {
        fullName: addr.full_name,
        street: addr.street,
        city: addr.city,
        state: addr.state || '',
        zip: addr.zip,
        phone: addr.phone || '',
        savedAddressId: addr.id,
    };
}
