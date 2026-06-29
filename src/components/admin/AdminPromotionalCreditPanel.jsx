import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { sovereign } from '@/api/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Gift, Search } from 'lucide-react';
import { toast } from 'sonner';
import { formatMoney } from '@/lib/formatMoney';

export default function AdminPromotionalCreditPanel() {
    const queryClient = useQueryClient();
    const [walletSearch, setWalletSearch] = useState('');
    const [walletId, setWalletId] = useState('');
    const [selectedWalletLabel, setSelectedWalletLabel] = useState('');
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');

    const { data: searchResults, isFetching: searching } = useQuery({
        queryKey: ['admin-wallet-search', walletSearch],
        queryFn: () => sovereign.providerWallet.searchWallets(walletSearch),
        enabled: walletSearch.trim().length >= 2,
    });

    const { data: recentGrants } = useQuery({
        queryKey: ['admin-ledger-promo'],
        queryFn: () => sovereign.admin.listLedger({ event_type: 'promotional_credit', limit: 8 }),
    });

    const grantMutation = useMutation({
        mutationFn: () =>
            sovereign.providerWallet.grantPromotionalCredit(
                walletId.trim(),
                parseFloat(amount),
                reason.trim() || undefined
            ),
        onSuccess: (res) => {
            toast.success(
                `Granted ${formatMoney(parseFloat(amount))} promotional credit (balance ${formatMoney(res.new_balance ?? 0)})`
            );
            setAmount('');
            setReason('');
            queryClient.invalidateQueries({ queryKey: ['admin-ledger-promo'] });
        },
        onError: (e) => toast.error(e.message),
    });

    const wallets = searchResults?.wallets ?? [];
    const grants = recentGrants?.entries ?? [];

    return (
        <div className="space-y-6 max-w-xl">
            <Card className="rounded-2xl border-border">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Gift className="w-5 h-5 text-primary" />
                        Grant Promotional Wallet Credit
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Search by provider email or name. Promotional credits are used before purchased top-ups and
                        expire after 12 months.
                    </p>

                    <div className="space-y-2">
                        <Label htmlFor="promo-wallet-search">Find provider wallet</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                            <Input
                                id="promo-wallet-search"
                                value={walletSearch}
                                onChange={(e) => setWalletSearch(e.target.value)}
                                placeholder="barber@email.com or name…"
                                className="pl-9"
                            />
                        </div>
                        {searching && <p className="text-xs text-muted-foreground">Searching…</p>}
                        {wallets.length > 0 && (
                            <div className="border rounded-xl divide-y max-h-48 overflow-y-auto">
                                {wallets.map((w) => (
                                    <button
                                        key={w.id}
                                        type="button"
                                        className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/60 touch-manipulation ${
                                            walletId === w.id ? 'bg-primary/10' : ''
                                        }`}
                                        onClick={() => {
                                            setWalletId(w.id);
                                            setSelectedWalletLabel(
                                                `${w.user_name || w.user_email} · ${w.scope}${w.shop_name ? ` (${w.shop_name})` : ''} · ${formatMoney(w.balance ?? 0)}`
                                            );
                                        }}
                                    >
                                        <span className="font-medium">{w.user_name || w.user_email}</span>
                                        <span className="text-muted-foreground block text-xs tabular-nums">
                                            {w.scope}
                                            {w.shop_name ? ` · ${w.shop_name}` : ''} · {formatMoney(w.balance ?? 0)}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {selectedWalletLabel && (
                        <p className="text-xs text-muted-foreground">
                            Selected: <span className="text-foreground font-medium">{selectedWalletLabel}</span>
                        </p>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="promo-wallet-id">Wallet ID (advanced)</Label>
                        <Input
                            id="promo-wallet-id"
                            value={walletId}
                            onChange={(e) => setWalletId(e.target.value)}
                            placeholder="uuid"
                            className="font-mono text-sm"
                            spellCheck={false}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="promo-amount">Amount (EUR)</Label>
                        <Input
                            id="promo-amount"
                            type="number"
                            min="0.01"
                            step="0.01"
                            inputMode="decimal"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="promo-reason">Reason (optional)</Label>
                        <Input
                            id="promo-reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Launch promo, goodwill credit…"
                        />
                    </div>
                    <Button
                        disabled={
                            grantMutation.isPending ||
                            !walletId.trim() ||
                            !amount ||
                            parseFloat(amount) <= 0
                        }
                        onClick={() => grantMutation.mutate()}
                    >
                        {grantMutation.isPending ? 'Granting…' : 'Grant Promotional Credit'}
                    </Button>
                </CardContent>
            </Card>

            {grants.length > 0 && (
                <Card className="rounded-2xl border-border">
                    <CardHeader>
                        <CardTitle className="text-base">Recent promotional grants</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {grants.map((row) => (
                            <div key={row.id} className="flex justify-between gap-3 text-sm py-2 border-b border-border last:border-0 min-w-0">
                                <div className="min-w-0">
                                    <p className="font-medium tabular-nums">
                                        {formatMoney(row.payload?.amount ?? 0)}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {row.payload?.reason || 'Promotional credit'} · wallet {row.entity_id?.slice(0, 8)}…
                                    </p>
                                </div>
                                <span className="text-xs text-muted-foreground shrink-0">
                                    {row.created_at
                                        ? format(new Date(row.created_at), 'MMM d, HH:mm')
                                        : '—'}
                                </span>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
