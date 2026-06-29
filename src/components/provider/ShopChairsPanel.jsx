import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, Armchair, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function ShopChairsPanel({ shopId, barberId }) {
    const queryClient = useQueryClient();
    const [newChairName, setNewChairName] = useState('');
    const [bufferMinutes, setBufferMinutes] = useState('0');

    const { data: chairs = [], isLoading } = useQuery({
        queryKey: ['shop-chairs', shopId],
        queryFn: () => sovereign.capacity.listChairs(shopId),
        enabled: !!shopId,
    });

    const { data: shopBarbers = [] } = useQuery({
        queryKey: ['shop-barbers-chairs', shopId],
        queryFn: async () => {
            const members = await sovereign.entities.ShopMember.filter({ shop_id: shopId });
            const barberIds = members.map((m) => m.barber_id).filter(Boolean);
            if (barberIds.length === 0) {
                return sovereign.entities.Barber.filter({ shop_id: shopId });
            }
            const all = await Promise.all(
                barberIds.map((id) => sovereign.entities.Barber.get(id).catch(() => null))
            );
            return all.filter(Boolean);
        },
        enabled: !!shopId,
    });

    const saveChairMutation = useMutation({
        mutationFn: (payload) => sovereign.capacity.saveChair(shopId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shop-chairs', shopId] });
            setNewChairName('');
            toast.success('Chair saved');
        },
        onError: (e) => toast.error(e.message),
    });

    const assignMutation = useMutation({
        mutationFn: ({ chairId, barberId: bid }) =>
            sovereign.capacity.assignBarber(chairId, { barber_id: bid }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shop-chairs', shopId] });
            toast.success('Barber assigned');
        },
        onError: (e) => toast.error(e.message),
    });

    const bufferMutation = useMutation({
        mutationFn: (minutes) => sovereign.capacity.setBufferMinutes(barberId, minutes),
        onSuccess: () => toast.success('Buffer time updated'),
        onError: (e) => toast.error(e.message),
    });

    if (!shopId) {
        return (
            <Card className="rounded-3xl border-dashed">
                <CardContent className="py-10 text-center text-muted-foreground text-sm">
                    Link a shop to manage chairs and capacity.
                </CardContent>
            </Card>
        );
    }

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card className="rounded-3xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Armchair className="w-5 h-5 text-primary" />
                        Chairs & capacity
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <p className="text-sm text-muted-foreground">
                        One booking per slot per chair. Solo shops with no chairs configured keep the current
                        barber-only overlap rules.
                    </p>

                    <div className="flex gap-2 items-end">
                        <div className="flex-1">
                            <Label htmlFor="new-chair">Add chair</Label>
                            <Input
                                id="new-chair"
                                placeholder="Chair 1, Station A…"
                                value={newChairName}
                                onChange={(e) => setNewChairName(e.target.value)}
                                className="mt-1 rounded-xl"
                            />
                        </div>
                        <Button
                            disabled={!newChairName.trim() || saveChairMutation.isPending}
                            onClick={() =>
                                saveChairMutation.mutate({ name: newChairName.trim(), is_active: true })
                            }
                        >
                            <Plus className="w-4 h-4 mr-1" />
                            Add
                        </Button>
                    </div>

                    {chairs.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No chairs configured yet.</p>
                    ) : (
                        <ul className="space-y-3">
                            {chairs.map((chair) => (
                                <li
                                    key={chair.id}
                                    className="flex flex-wrap items-center gap-3 p-4 rounded-2xl border border-border bg-muted/30"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium">{chair.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {(chair.assignments ?? [])
                                                .map((a) => a.barber?.name)
                                                .filter(Boolean)
                                                .join(', ') || 'Unassigned'}
                                        </p>
                                    </div>
                                    <Badge variant={chair.is_active ? 'default' : 'secondary'}>
                                        {chair.is_active ? 'Active' : 'Disabled'}
                                    </Badge>
                                    <Switch
                                        checked={chair.is_active !== false}
                                        onCheckedChange={(checked) =>
                                            saveChairMutation.mutate({
                                                id: chair.id,
                                                name: chair.name,
                                                is_active: checked,
                                            })
                                        }
                                    />
                                    {shopBarbers.length > 0 && (
                                        <select
                                            className="h-9 rounded-xl border border-border bg-background px-2 text-sm"
                                            defaultValue=""
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    assignMutation.mutate({
                                                        chairId: chair.id,
                                                        barberId: e.target.value,
                                                    });
                                                    e.target.value = '';
                                                }
                                            }}
                                        >
                                            <option value="">Assign barber…</option>
                                            {shopBarbers.map((b) => (
                                                <option key={b.id} value={b.id}>
                                                    {b.name}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>

            {barberId && (
                <Card className="rounded-3xl">
                    <CardHeader>
                        <CardTitle className="text-lg">Cleaning buffer</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-3 items-end">
                        <div>
                            <Label htmlFor="buffer-min">Minutes between appointments</Label>
                            <Input
                                id="buffer-min"
                                type="number"
                                min={0}
                                max={120}
                                className="mt-1 w-32 rounded-xl"
                                value={bufferMinutes}
                                onChange={(e) => setBufferMinutes(e.target.value)}
                            />
                        </div>
                        <Button
                            variant="outline"
                            disabled={bufferMutation.isPending}
                            onClick={() =>
                                bufferMutation.mutate(parseInt(bufferMinutes, 10) || 0)
                            }
                        >
                            Save buffer
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
