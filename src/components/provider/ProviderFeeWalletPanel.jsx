import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Wallet, Banknote, Info } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { formatMoney } from '@/lib/formatMoney';

const PRESETS = [20, 50, 100, 200];

const HEALTH_FILL = {
    excellent: 92,
    good: 72,
    warning: 45,
    critical: 22,
    blocked: 8,
};

function WalletHealthBar({ status, label, cashBlocked }) {
    const fill = HEALTH_FILL[status] ?? 50;
    const barColor = cashBlocked
        ? 'bg-destructive'
        : status === 'warning' || status === 'critical'
          ? 'bg-primary/100'
          : 'bg-primary/100';

    return (
        <div className="mt-3 space-y-1.5" aria-label={`Wallet health: ${label}`}>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className={`h-full rounded-full transition-[width] duration-500 ${barColor}`} style={{ width: `${fill}%` }} />
            </div>
            <div className="flex items-center justify-between gap-2 text-xs">
                <Badge variant={cashBlocked ? 'destructive' : 'secondary'} className="text-xs">
                    {label}
                </Badge>
                {cashBlocked ? (
                    <span className="text-destructive">Cash bookings blocked until top-up</span>
                ) : null}
            </div>
        </div>
    );
}

export default function ProviderFeeWalletPanel({ shopId, isShopOwner }) {
    const queryClient = useQueryClient();
    const [customAmount, setCustomAmount] = useState('');

    const { data, isLoading } = useQuery({
        queryKey: ['provider-fee-wallet', shopId],
        queryFn: () => sovereign.providerWallet.getMe(shopId),
    });

    const scope = isShopOwner && data?.shop_wallet ? 'shop' : 'barber';
    const wallet = scope === 'shop' ? data?.shop_wallet : data?.barber_wallet;
    const symbol = wallet?.currency === 'USD' ? '$' : '€';
    const formatAmount = (n) => formatMoney(n, wallet?.currency === 'USD' ? 'USD' : 'EUR') ?? `${symbol}0.00`;

    const settingsMutation = useMutation({
        mutationFn: (accepts) =>
            sovereign.providerWallet.updateSettings({
                accepts_cash_in_store: accepts,
                scope,
                shop_id: scope === 'shop' ? shopId : undefined,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['provider-fee-wallet'] });
            toast.success('Cash payment settings updated');
        },
        onError: (e) => toast.error(e.message),
    });

    const topUpMutation = useMutation({
        mutationFn: (amount) =>
            sovereign.providerWallet.topUp(amount, scope, scope === 'shop' ? shopId : undefined),
        onSuccess: (res) => {
            if (res.url) window.location.href = res.url;
        },
        onError: (e) => toast.error(e.message),
    });

    if (isLoading) {
        return (
            <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="Loading wallet…">
                <div className="h-48  bg-muted/50" />
                <div className="h-28  bg-muted/40" />
            </div>
        );
    }

    if (!wallet) return null;

    const commissionWaived =
        scope === 'shop'
            ? !!data?.fixed_fee?.shop?.commission_waived
            : !!data?.fixed_fee?.barber?.commission_waived;

    const commissionPct = commissionWaived
        ? 0
        : scope === 'shop'
          ? Math.round((data?.commission_rates?.shop ?? 0.2) * 100)
          : Math.round((data?.commission_rates?.freelancer ?? 0.15) * 100);

    return (
        <div className="space-y-6">
            <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Wallet className="w-5 h-5 text-primary" />
                        Platform fee balance
                        {scope === 'shop' && data?.shop_wallet?.shop_name && (
                            <Badge variant="secondary" className="ml-2">{data.shop_wallet.shop_name}</Badge>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <p className="text-sm text-muted-foreground">Prepaid credit for ShopTheBarber commission on pay-at-shop bookings</p>
                        <p className="text-4xl font-bold mt-1 tabular-nums">{formatAmount(wallet.balance ?? 0)}</p>
                        {(wallet.promotional_balance > 0 || wallet.purchased_balance > 0) && (
                            <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground tabular-nums">
                                {wallet.purchased_balance > 0 && (
                                    <span>Purchased: {formatAmount(wallet.purchased_balance)}</span>
                                )}
                                {wallet.promotional_balance > 0 && (
                                    <span className="text-muted-foreground dark:text-primary">
                                        Promotional: {formatAmount(wallet.promotional_balance)} (used first)
                                    </span>
                                )}
                            </div>
                        )}
                        {wallet.health_label && (
                            <WalletHealthBar
                                status={wallet.health_status}
                                label={wallet.health_label}
                                cashBlocked={wallet.cash_blocked}
                            />
                        )}
                        {data?.burn_rate?.bookings_until_empty != null && (
                            <p className="text-xs text-muted-foreground mt-3 tabular-nums">
                                ~{data.burn_rate.bookings_until_empty} cash booking
                                {data.burn_rate.bookings_until_empty === 1 ? '' : 's'} until empty
                                {data.burn_rate.avg_commission_per_booking != null && (
                                    <span> (avg fee {formatAmount(data.burn_rate.avg_commission_per_booking)})</span>
                                )}
                            </p>
                        )}
                        {wallet.promotional_expires_at && (wallet.promotional_balance ?? 0) > 0 && (
                            <p className="text-xs text-muted-foreground dark:text-primary mt-1">
                                Promotional credit expires{' '}
                                {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
                                    new Date(wallet.promotional_expires_at)
                                )}
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                            {commissionWaived
                                ? 'Fixed-fee plan active, no per-booking commission on pay-at-shop bookings.'
                                : `When a client pays you in the shop (cash or your POS), our ${commissionPct}% commission is deducted from this balance when you confirm the booking.`}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {PRESETS.map((amt) => (
                            <Button
                                key={amt}
                                size="sm"
                                variant="outline"
                                disabled={topUpMutation.isPending}
                                onClick={() => topUpMutation.mutate(amt)}
                            >
                                +{symbol}{amt}
                            </Button>
                        ))}
                    </div>

                    <div className="flex gap-2 items-end">
                        <div className="flex-1">
                            <Label htmlFor="custom-topup" className="text-xs">Custom amount (min {formatAmount(data?.min_top_up ?? 10)})</Label>
                            <Input
                                id="custom-topup"
                                type="number"
                                inputMode="decimal"
                                min={data?.min_top_up ?? 10}
                                step="0.01"
                                className="mt-1 rounded-lg tabular-nums"
                                value={customAmount}
                                onChange={(e) => setCustomAmount(e.target.value)}
                            />
                        </div>
                        <Button
                            disabled={topUpMutation.isPending || !customAmount}
                            onClick={() => topUpMutation.mutate(parseFloat(customAmount))}
                        >
                            Top up
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="">
                <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Banknote className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <Label htmlFor="cash-toggle" className="text-base font-semibold">Accept pay-at-shop bookings</Label>
                                <p className="text-sm text-muted-foreground mt-1 max-w-md">
                                    Clients can pay you in the shop, cash or card on your POS. You need at least {symbol}{wallet.minimum_balance} prepaid credit
                                    to enable this; ShopTheBarber commission is taken from your balance when you confirm each booking.
                                </p>
                                {!wallet.can_enable_cash && !wallet.accepts_cash_in_store && (
                                    <p className="text-xs text-primary mt-2 flex items-center gap-1">
                                        <Info className="w-3.5 h-3.5" /> Top up your commission credit to enable pay-at-shop bookings.
                                    </p>
                                )}
                            </div>
                        </div>
                        <Switch
                            id="cash-toggle"
                            checked={wallet.wallet_accepts_cash ?? false}
                            disabled={settingsMutation.isPending || (!wallet.can_enable_cash && !wallet.wallet_accepts_cash)}
                            onCheckedChange={(v) => settingsMutation.mutate(v)}
                        />
                    </div>
                </CardContent>
            </Card>

            {data?.transactions?.length > 0 && (
                <Card className="">
                    <CardHeader><CardTitle className="text-base">Recent activity</CardTitle></CardHeader>
                    <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                        {data.transactions.map((tx) => (
                            <div key={tx.id} className="flex justify-between gap-3 text-sm py-2 border-b border-border last:border-0 min-w-0">
                                <span className="text-muted-foreground truncate">{tx.description || tx.type}</span>
                                <span className={`shrink-0 tabular-nums font-medium ${tx.amount >= 0 ? 'text-primary' : 'text-destructive'}`}>
                                    {tx.amount >= 0 ? '+' : '−'}
                                    {formatAmount(Math.abs(tx.amount))}
                                </span>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
