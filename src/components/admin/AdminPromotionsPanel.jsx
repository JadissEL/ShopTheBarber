import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Tag, Users, Store, Scissors } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const EMPTY_FORM = {
    code: '',
    discount_type: 'percentage',
    discount_value: '10',
    audience: 'everyone',
    target_ids: [],
    expiry_date: '',
    max_uses: '100',
    max_uses_per_user: '1',
    admin_note: '',
    bypass_policy: false,
    is_active: true,
};

function TargetPicker({ audience, targetIds, onChange, users = [], shops = [], barbers = [] }) {
    const needsTargets = ['specific_users', 'specific_shops', 'specific_barbers'].includes(audience);
    if (!needsTargets) {
        return (
            <p className="text-sm text-muted-foreground rounded-xl border border-dashed p-4">
                No targets needed, this audience applies broadly per the rule you selected.
            </p>
        );
    }

    const options =
        audience === 'specific_users'
            ? users.map((u) => ({ id: u.id, label: u.full_name || u.email || u.id }))
            : audience === 'specific_shops'
              ? shops.map((s) => ({ id: s.id, label: s.name || s.location || s.id }))
              : barbers.map((b) => ({ id: b.id, label: b.name || b.title || b.id }));

    const toggle = (id) => {
        onChange(targetIds.includes(id) ? targetIds.filter((x) => x !== id) : [...targetIds, id]);
    };

    return (
        <div className="max-h-48 overflow-y-auto border rounded-xl p-3 space-y-2">
            {options.length === 0 ? (
                <p className="text-sm text-muted-foreground">No options loaded.</p>
            ) : (
                options.map((opt) => (
                    <label key={opt.id} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                            type="checkbox"
                            checked={targetIds.includes(opt.id)}
                            onChange={() => toggle(opt.id)}
                        />
                        <span>{opt.label}</span>
                    </label>
                ))
            )}
        </div>
    );
}

export default function AdminPromotionsPanel() {
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);

    const { data: config } = useQuery({
        queryKey: ['promo-admin-config'],
        queryFn: () => sovereign.promotions.getAdminConfig(),
    });

    const { data: promos = [], isLoading } = useQuery({
        queryKey: ['admin-promotions'],
        queryFn: () => sovereign.promotions.adminList(),
    });

    const { data: users = [] } = useQuery({
        queryKey: ['platform-users'],
        queryFn: () => sovereign.entities.User.list(),
    });

    const { data: shops = [] } = useQuery({
        queryKey: ['explore-shops'],
        queryFn: () => sovereign.entities.Shop.list(),
    });

    const { data: barbers = [] } = useQuery({
        queryKey: ['explore-barbers'],
        queryFn: () => sovereign.entities.Barber.list(),
    });

    const saveMutation = useMutation({
        mutationFn: (payload) =>
            editing ? sovereign.promotions.adminUpdate(editing.id, payload) : sovereign.promotions.adminCreate(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-promotions'] });
            queryClient.invalidateQueries({ queryKey: ['active-promotions'] });
            queryClient.invalidateQueries({ queryKey: ['homepage'] });
            toast.success(editing ? 'Promotion updated' : 'Promotion created');
            setOpen(false);
            setEditing(null);
            setForm(EMPTY_FORM);
        },
        onError: (e) => toast.error(e.message),
    });

    const deactivateMutation = useMutation({
        mutationFn: (id) => sovereign.promotions.adminDeactivate(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-promotions'] });
            toast.success('Promotion deactivated');
        },
        onError: (e) => toast.error(e.message),
    });

    const audiences = config?.audiences ?? [];

    const openCreate = () => {
        setEditing(null);
        setForm(EMPTY_FORM);
        setOpen(true);
    };

    const openEdit = (promo) => {
        setEditing(promo);
        const type = promo.audience;
        const ids =
            type === 'specific_users'
                ? promo.target_ids?.users ?? []
                : type === 'specific_shops'
                  ? promo.target_ids?.shops ?? []
                  : type === 'specific_barbers'
                    ? promo.target_ids?.barbers ?? []
                    : [];
        setForm({
            code: promo.code,
            discount_type: promo.discount_type,
            discount_value: String(promo.discount_value),
            audience: promo.audience,
            target_ids: ids,
            expiry_date: promo.expiry_date ? promo.expiry_date.slice(0, 10) : '',
            max_uses: promo.max_uses != null ? String(promo.max_uses) : '100',
            max_uses_per_user: String(promo.max_uses_per_user ?? 1),
            admin_note: promo.admin_note ?? '',
            bypass_policy: false,
            is_active: promo.is_active !== false,
        });
        setOpen(true);
    };

    const payload = useMemo(
        () => ({
            code: form.code,
            discount_type: form.discount_type,
            discount_value: parseFloat(form.discount_value),
            audience: form.audience,
            target_ids: form.target_ids,
            expiry_date: form.expiry_date || null,
            max_uses: form.max_uses ? parseInt(form.max_uses, 10) : null,
            max_uses_per_user: form.max_uses_per_user ? parseInt(form.max_uses_per_user, 10) : 1,
            admin_note: form.admin_note || null,
            bypass_policy: form.bypass_policy,
            is_active: form.is_active,
        }),
        [form]
    );

    const audienceIcon = (audience) => {
        if (audience.includes('user')) return Users;
        if (audience.includes('shop')) return Store;
        if (audience.includes('barber')) return Scissors;
        return Tag;
    };

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                    <div>
                        <CardTitle>Platform promotions</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            Target all clients, specific users, all shops, specific shops, or specific barbers.
                        </p>
                    </div>
                    <Button onClick={openCreate} className="gap-2 shrink-0">
                        <Plus className="w-4 h-4" /> New promo
                    </Button>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <p className="text-sm text-muted-foreground">Loading promotions…</p>
                    ) : promos.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No promotions yet. Create a platform or targeted promo.</p>
                    ) : (
                        <div className="space-y-3">
                            {promos.map((promo) => {
                                const Icon = audienceIcon(promo.audience);
                                return (
                                    <div
                                        key={promo.id}
                                        className="flex flex-wrap items-start justify-between gap-3 p-4 border rounded-xl"
                                    >
                                        <div className="space-y-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-mono font-bold">{promo.code}</span>
                                                <Badge variant={promo.is_active ? 'default' : 'secondary'}>
                                                    {promo.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                                <Badge variant="outline">{promo.discount_text}</Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                                <Icon className="w-3.5 h-3.5" />
                                                {promo.audience_label}
                                            </p>
                                            {(promo.targets?.users?.length > 0 ||
                                                promo.targets?.shops?.length > 0 ||
                                                promo.targets?.barbers?.length > 0) && (
                                                <p className="text-xs text-muted-foreground">
                                                    {[
                                                        ...(promo.targets.users ?? []).map((t) => t.label),
                                                        ...(promo.targets.shops ?? []).map((t) => t.label),
                                                        ...(promo.targets.barbers ?? []).map((t) => t.label),
                                                    ].join(', ')}
                                                </p>
                                            )}
                                            <p className="text-xs text-muted-foreground">
                                                Used {promo.usage?.total ?? 0}
                                                {promo.max_uses != null ? ` / ${promo.max_uses}` : ''}
                                                {promo.expiry_date
                                                    ? `, expires ${format(new Date(promo.expiry_date), 'PP')}`
                                                    : ''}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="outline" onClick={() => openEdit(promo)}>
                                                Edit
                                            </Button>
                                            {promo.is_active && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    disabled={deactivateMutation.isPending}
                                                    onClick={() => deactivateMutation.mutate(promo.id)}
                                                >
                                                    Deactivate
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Edit promotion' : 'Create promotion'}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2">
                                <Label>Promo code</Label>
                                <Input
                                    value={form.code}
                                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                    placeholder="SUMMER20"
                                />
                            </div>
                            <div>
                                <Label>Discount type</Label>
                                <Select
                                    value={form.discount_type}
                                    onValueChange={(v) => setForm({ ...form, discount_type: v })}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="percentage">Percentage</SelectItem>
                                        <SelectItem value="fixed">Fixed (€)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Value</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={form.discount_value}
                                    onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <Label>Audience</Label>
                            <Select
                                value={form.audience}
                                onValueChange={(v) => setForm({ ...form, audience: v, target_ids: [] })}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {audiences.map((a) => (
                                        <SelectItem key={a.value} value={a.value}>
                                            {a.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Targets</Label>
                            <TargetPicker
                                audience={form.audience}
                                targetIds={form.target_ids}
                                onChange={(target_ids) => setForm({ ...form, target_ids })}
                                users={users}
                                shops={shops}
                                barbers={barbers}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>Expiry (optional)</Label>
                                <Input
                                    type="date"
                                    value={form.expiry_date}
                                    onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Max total uses</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={form.max_uses}
                                    onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Max uses per user</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={form.max_uses_per_user}
                                    onChange={(e) => setForm({ ...form, max_uses_per_user: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <Label>Admin note (internal)</Label>
                            <Input
                                value={form.admin_note}
                                onChange={(e) => setForm({ ...form, admin_note: e.target.value })}
                                placeholder="Campaign name, reason, etc."
                            />
                        </div>

                        <div className="flex items-center justify-between rounded-xl border p-3">
                            <div>
                                <p className="text-sm font-medium">Bypass platform discount caps</p>
                                <p className="text-xs text-muted-foreground">For special campaigns above pricing rules</p>
                            </div>
                            <Switch
                                checked={form.bypass_policy}
                                onCheckedChange={(bypass_policy) => setForm({ ...form, bypass_policy })}
                            />
                        </div>

                        {editing && (
                            <div className="flex items-center justify-between rounded-xl border p-3">
                                <Label>Active</Label>
                                <Switch
                                    checked={form.is_active}
                                    onCheckedChange={(is_active) => setForm({ ...form, is_active })}
                                />
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            disabled={saveMutation.isPending || !form.code.trim()}
                            onClick={() => saveMutation.mutate(payload)}
                        >
                            {saveMutation.isPending ? 'Saving…' : editing ? 'Save changes' : 'Create promo'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
