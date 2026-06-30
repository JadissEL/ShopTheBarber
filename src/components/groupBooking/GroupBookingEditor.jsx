import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Home } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { toast } from 'sonner';
import { GROUP_BOOKING_LABEL } from '@/lib/groupBooking';
import VipBarberBadge from '@/components/groupBooking/GroupBookingBadges';

export function ProviderGroupBookingPanel() {
    const queryClient = useQueryClient();

    const { data: settings, isLoading } = useQuery({
        queryKey: ['provider-group-booking'],
        queryFn: () => sovereign.groupBooking.getMySettings(),
    });

    const { data: locationSettings } = useQuery({
        queryKey: ['provider-service-locations'],
        queryFn: () => sovereign.serviceLocation.getMySettings(),
    });

    const mutation = useMutation({
        mutationFn: (payload) => sovereign.groupBooking.updateBarber(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['provider-group-booking'] });
            queryClient.invalidateQueries({ queryKey: ['my-barber-profile'] });
            queryClient.invalidateQueries({ queryKey: ['explore-barbers'] });
            queryClient.invalidateQueries({ queryKey: ['homepage'] });
            toast.success('Group booking settings updated');
        },
        onError: (e) => toast.error(e.message),
    });

    if (isLoading) {
        return <p className="text-sm text-muted-foreground">Loading group booking settings…</p>;
    }

    const isVip = settings?.is_vip ?? false;
    const offersGroup = settings?.offers_group_booking ?? false;
    const offersMobile = locationSettings?.barber?.offers_mobile_service ?? locationSettings?.offers_mobile_service ?? false;
    const offersShop = (locationSettings?.barber?.offers_shop_service ?? locationSettings?.offers_shop_service) !== false;

    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                        {GROUP_BOOKING_LABEL}
                        {isVip && <VipBarberBadge />}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        Accept weddings, groomsmen parties, and group grooming sessions, in your shop or at the
                        client&apos;s location. VIP recognition is separate from where you serve; many VIP pros are at-home only.
                        {isVip && settings?.vip_source === 'earned' ? ' You earned VIP recognition for top ratings.' : ''}
                    </p>
                </div>
            </div>

            <div className="flex items-start justify-between gap-4 stb-panel p-4 bg-muted/20">
                <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 font-bold text-foreground">
                        <Users className="w-5 h-5 text-primary" />
                        Accept group bookings
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Clients book friends and family in one session, at your shop or at their location. Guests only need a name, not an account.
                    </p>
                </div>
                <Switch
                    checked={offersGroup}
                    disabled={mutation.isPending}
                    onCheckedChange={(v) =>
                        mutation.mutate({ offers_group_booking: v })
                    }
                    aria-label="Offer group bookings"
                />
            </div>

            {offersGroup && offersShop && !offersMobile && (
                <div className=" border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                    <p className="text-foreground font-medium mb-1">In-shop group booking is active</p>
                    <p>
                        Clients can book groomsmen, friends, and family for chair cuts at your location, no guest accounts required.
                    </p>
                    <p className="mt-2">
                        Want group sessions at the client&apos;s address too? Enable{' '}
                        <strong className="text-foreground">At-home visits</strong> in the section above.
                    </p>
                </div>
            )}

            {offersGroup && offersMobile && !offersShop && (
                <div className=" border border-primary/30 bg-primary/10 p-4 text-sm text-foreground">
                    <div className="flex items-center gap-2 font-bold mb-1">
                        <Home className="w-4 h-4" />
                        At-home group booking only
                    </div>
                    Clients can book group parties at their address, friends and family only need names, not accounts.
                </div>
            )}

            {offersGroup && offersMobile && offersShop && (
                <div className=" border border-primary/30 bg-primary/10 p-4 text-sm text-foreground">
                    <div className="flex items-center gap-2 font-bold mb-1">
                        <Home className="w-4 h-4" />
                        Shop &amp; at-home groups
                    </div>
                    Clients can book group parties at your chair or at their address, friends and family only need names, not accounts.
                </div>
            )}

            {offersGroup && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label>Min party size</Label>
                        <Input
                            type="number"
                            min={2}
                            max={12}
                            defaultValue={settings?.min_party ?? 2}
                            onBlur={(e) => {
                                const n = parseInt(e.target.value, 10);
                                if (!Number.isNaN(n)) {
                                    mutation.mutate({ group_booking_min_party: n });
                                }
                            }}
                            className=""
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Max party size</Label>
                        <Input
                            type="number"
                            min={2}
                            max={12}
                            defaultValue={settings?.max_party ?? 8}
                            onBlur={(e) => {
                                const n = parseInt(e.target.value, 10);
                                if (!Number.isNaN(n)) {
                                    mutation.mutate({ group_booking_max_party: n });
                                }
                            }}
                            className=""
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Group discount (%)</Label>
                        <Input
                            type="number"
                            min={0}
                            max={25}
                            step={1}
                            defaultValue={settings?.group_discount_percent ?? 0}
                            onBlur={(e) => {
                                const n = parseFloat(e.target.value);
                                if (!Number.isNaN(n)) {
                                    mutation.mutate({ group_booking_discount_percent: n });
                                }
                            }}
                            className=""
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
