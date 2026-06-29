import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { Switch } from '@/components/ui/switch';
import { Crown } from 'lucide-react';
import { toast } from 'sonner';
import VipBarberBadge, { GroupBookingBadge } from '@/components/groupBooking/GroupBookingBadges';
import { getServiceLocationLabel } from '@/lib/serviceLocation';

export default function AdminVipBarbersPanel() {
    const queryClient = useQueryClient();

    const { data: barbers = [], isLoading } = useQuery({
        queryKey: ['admin-vip-barbers'],
        queryFn: () => sovereign.groupBooking.adminListBarbers(),
    });

    const mutation = useMutation({
        mutationFn: ({ barberId, is_vip }) => sovereign.groupBooking.adminSetVip(barberId, is_vip),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-vip-barbers'] });
            toast.success('VIP status updated');
        },
        onError: (e) => toast.error(e.message),
    });

    if (isLoading) return <p className="text-sm text-muted-foreground">Loading barbers…</p>;

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <Crown className="w-5 h-5 text-amber-500" />
                    VIP highlight (optional)
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                    VIP is a recognition badge, independent of where they work. A VIP barber can be at-home only, in-shop only, or both; those modes are set in Provider Settings.
                </p>
            </div>
            <div className="border border-border rounded-2xl overflow-hidden divide-y divide-border max-h-[480px] overflow-y-auto">
                {barbers.slice(0, 50).map((b) => (
                    <div
                        key={b.id}
                        className="flex items-center justify-between gap-4 p-4 bg-card hover:bg-muted/30"
                    >
                        <div className="min-w-0">
                            <div className="font-semibold truncate flex items-center gap-2 flex-wrap">
                                {b.name}
                                {b.is_vip && <VipBarberBadge className="text-[10px] py-0" />}
                                {b.offers_group_booking && (
                                    <GroupBookingBadge discountPercent={b.group_discount_percent} />
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {b.rating?.toFixed(1)}★, {b.review_count} reviews
                                {b.vip_source === 'earned' ? ', earned VIP' : ''}
                                {', '}
                                {getServiceLocationLabel(b)}
                            </p>
                        </div>
                        <Switch
                            checked={b.is_vip}
                            disabled={mutation.isPending}
                            onCheckedChange={(v) => mutation.mutate({ barberId: b.id, is_vip: v })}
                            aria-label={`VIP for ${b.name}`}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
