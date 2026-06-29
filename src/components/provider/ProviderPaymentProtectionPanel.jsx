import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Shield, CreditCard, Loader2, Info, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function ProviderPaymentProtectionPanel({ shopId, isShopOwner }) {
    const queryClient = useQueryClient();
    const [scope, setScope] = useState(isShopOwner && shopId ? 'shop' : 'barber');

    const { data, isLoading } = useQuery({
        queryKey: ['payment-protection-settings', shopId, scope],
        queryFn: () => sovereign.paymentProtection.getSettings(scope === 'shop' ? shopId : undefined),
    });

    const saveMutation = useMutation({
        mutationFn: (payload) =>
            sovereign.paymentProtection.updateSettings({
                ...payload,
                scope,
                shop_id: scope === 'shop' ? shopId : undefined,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payment-protection-settings'] });
            toast.success('Payment protection settings saved');
        },
        onError: (e) => toast.error(e.message),
    });

    const source = scope === 'shop' ? data?.shop : data?.barber;
    const effective = data?.effective_policy;

    const patch = (fields) => saveMutation.mutate(fields);

    if (isLoading) {
        return (
            <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card className="border-violet-200/60 bg-gradient-to-br from-violet-50/50 to-transparent rounded-3xl">
                <CardHeader>
                    <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
                        <Shield className="w-5 h-5 text-violet-600" />
                        No-show protection &amp; deposits
                        <Badge variant={data?.stripe_configured ? 'default' : 'secondary'} className="ml-auto">
                            {data?.stripe_configured ? 'Stripe ready' : 'Stripe not configured'}
                        </Badge>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Booksy/Squire-style card on file, booking deposits, and no-show fees.
                    </p>
                </CardHeader>
                <CardContent className="space-y-6">
                    {isShopOwner && shopId && (
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                size="sm"
                                variant={scope === 'barber' ? 'default' : 'outline'}
                                onClick={() => setScope('barber')}
                            >
                                My barber profile
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant={scope === 'shop' ? 'default' : 'outline'}
                                onClick={() => setScope('shop')}
                            >
                                Shop defaults
                            </Button>
                        </div>
                    )}

                    {effective && (
                        <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm space-y-1">
                            <p className="font-semibold flex items-center gap-2">
                                <Info className="w-4 h-4" /> Effective policy for clients
                            </p>
                            <ul className="text-muted-foreground list-disc pl-5 space-y-0.5">
                                {effective.card_on_file_required && <li>Card on file required</li>}
                                {effective.deposit_enabled && (
                                    <li>
                                        Deposit{' '}
                                        {effective.deposit_flat_amount
                                            ? `€${effective.deposit_flat_amount}`
                                            : `${effective.deposit_percent}%`}{' '}
                                        at booking
                                    </li>
                                )}
                                {effective.auth_hold_enabled && <li>Full amount authorized (charged after visit)</li>}
                                {effective.no_show_protection_enabled && <li>No-show fee enabled</li>}
                                {effective.late_cancel_protection_enabled && (
                                    <li>
                                        Late cancel: {effective.late_cancel_full_refund_hours}h+ full refund;{' '}
                                        {effective.late_cancel_fee_percent}% fee {effective.late_cancel_no_refund_hours}-
                                        {effective.late_cancel_full_refund_hours}h; non-refundable within{' '}
                                        {effective.late_cancel_no_refund_hours}h
                                    </li>
                                )}
                                {!effective.card_on_file_required &&
                                    !effective.deposit_enabled &&
                                    !effective.auth_hold_enabled &&
                                    !effective.no_show_protection_enabled && (
                                        <li>No payment protection active</li>
                                    )}
                            </ul>
                        </div>
                    )}

                    <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-border">
                        <div>
                            <Label className="text-base font-semibold flex items-center gap-2">
                                <CreditCard className="w-4 h-4" /> Require card on file
                            </Label>
                            <p className="text-xs text-muted-foreground mt-1">
                                Clients must save a card before the appointment is secured.
                            </p>
                        </div>
                        <Switch
                            checked={!!source?.card_on_file_required}
                            onCheckedChange={(v) => patch({ card_on_file_required: v })}
                            disabled={saveMutation.isPending}
                        />
                    </div>

                    <div className="space-y-4 p-4 rounded-xl border border-border">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <Label className="text-base font-semibold">Booking deposit</Label>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Collect a partial payment at booking; balance due at visit.
                                </p>
                            </div>
                            <Switch
                                checked={!!source?.booking_deposit_enabled}
                                onCheckedChange={(v) => patch({ booking_deposit_enabled: v })}
                                disabled={saveMutation.isPending}
                            />
                        </div>
                        {source?.booking_deposit_enabled && (
                            <div className="grid sm:grid-cols-2 gap-3">
                                <div>
                                    <Label htmlFor="deposit-pct" className="text-xs">Deposit %</Label>
                                    <Input
                                        id="deposit-pct"
                                        type="number"
                                        min={0}
                                        max={100}
                                        defaultValue={source?.booking_deposit_percent ?? 20}
                                        onBlur={(e) =>
                                            patch({ booking_deposit_percent: parseFloat(e.target.value) || 20 })
                                        }
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="deposit-flat" className="text-xs">Or flat € (optional)</Label>
                                    <Input
                                        id="deposit-flat"
                                        type="number"
                                        min={0}
                                        placeholder="Leave empty for %"
                                        defaultValue={source?.booking_deposit_flat_amount ?? ''}
                                        onBlur={(e) => {
                                            const v = e.target.value.trim();
                                            patch({
                                                booking_deposit_flat_amount: v ? parseFloat(v) : null,
                                            });
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-border">
                        <div>
                            <Label className="text-base font-semibold">Payment authorization</Label>
                            <p className="text-xs text-muted-foreground mt-1">
                                Hold the full service amount on the card; capture when you mark complete.
                            </p>
                        </div>
                        <Switch
                            checked={!!source?.booking_auth_hold_enabled}
                            onCheckedChange={(v) => patch({ booking_auth_hold_enabled: v })}
                            disabled={saveMutation.isPending || !!source?.booking_deposit_enabled}
                        />
                    </div>

                    <div className="space-y-4 p-4 rounded-xl border border-amber-200/60 bg-amber-50/30">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <Label className="text-base font-semibold flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                                    No-show protection
                                </Label>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Charge a fee from the card on file when you mark a no-show.
                                </p>
                            </div>
                            <Switch
                                checked={!!source?.no_show_protection_enabled}
                                onCheckedChange={(v) => patch({ no_show_protection_enabled: v })}
                                disabled={saveMutation.isPending}
                            />
                        </div>
                        {source?.no_show_protection_enabled && (
                            <div className="grid sm:grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs">Fee % of service</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        max={100}
                                        placeholder="100 = full price"
                                        defaultValue={source?.no_show_fee_percent ?? 100}
                                        onBlur={(e) =>
                                            patch({
                                                no_show_fee_percent: e.target.value
                                                    ? parseFloat(e.target.value)
                                                    : null,
                                            })
                                        }
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">Or flat € fee</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        placeholder="Optional"
                                        defaultValue={source?.no_show_fee_flat_amount ?? ''}
                                        onBlur={(e) => {
                                            const v = e.target.value.trim();
                                            patch({ no_show_fee_flat_amount: v ? parseFloat(v) : null });
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4 p-4 rounded-xl border border-violet-200/60 bg-violet-50/20">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <Label className="text-base font-semibold">Late cancellation fees</Label>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Tiered refunds/charges when clients cancel (Stripe refunds or card on file).
                                </p>
                            </div>
                            <Switch
                                checked={!!source?.late_cancel_protection_enabled}
                                onCheckedChange={(v) => patch({ late_cancel_protection_enabled: v })}
                                disabled={saveMutation.isPending}
                            />
                        </div>
                        {source?.late_cancel_protection_enabled && (
                            <div className="grid sm:grid-cols-3 gap-3">
                                <div>
                                    <Label className="text-xs">Full refund if cancelled (hours before)</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={168}
                                        defaultValue={source?.late_cancel_full_refund_hours ?? 24}
                                        onBlur={(e) =>
                                            patch({
                                                late_cancel_full_refund_hours: parseFloat(e.target.value) || 24,
                                            })
                                        }
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">Non-refundable within (hours)</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        max={48}
                                        defaultValue={source?.late_cancel_no_refund_hours ?? 2}
                                        onBlur={(e) =>
                                            patch({
                                                late_cancel_no_refund_hours: parseFloat(e.target.value) || 2,
                                            })
                                        }
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">Middle tier fee (%)</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        max={100}
                                        defaultValue={source?.late_cancel_fee_percent ?? 50}
                                        onBlur={(e) =>
                                            patch({
                                                late_cancel_fee_percent: parseFloat(e.target.value) || 50,
                                            })
                                        }
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
