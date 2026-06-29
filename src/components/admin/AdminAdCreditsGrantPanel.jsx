import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { sovereign } from '@/api/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Megaphone, Search } from 'lucide-react';
import { toast } from 'sonner';
import { formatMoney } from '@/lib/formatMoney';

export default function AdminAdCreditsGrantPanel() {
    const queryClient = useQueryClient();
    const [userSearch, setUserSearch] = useState('');
    const [userId, setUserId] = useState('');
    const [selectedUserLabel, setSelectedUserLabel] = useState('');
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');

    const { data: searchResults, isFetching: searching } = useQuery({
        queryKey: ['admin-user-search', userSearch],
        queryFn: () => sovereign.admin.searchUsers(userSearch),
        enabled: userSearch.trim().length >= 2,
    });

    const { data: recentGrants } = useQuery({
        queryKey: ['admin-ledger-ad-credits'],
        queryFn: () => sovereign.admin.listLedger({ event_type: 'promotional_credit', limit: 8 }),
    });

    const grantMutation = useMutation({
        mutationFn: () =>
            sovereign.admin.grantAdCredits({
                user_id: userId.trim(),
                amount: parseFloat(amount),
                reason: reason.trim() || 'Admin grant',
            }),
        onSuccess: (res) => {
            toast.success(`Granted ${formatMoney(parseFloat(amount))} ad credits (balance ${formatMoney(res.balance ?? 0)})`);
            setAmount('');
            setReason('');
            queryClient.invalidateQueries({ queryKey: ['admin-ledger-ad-credits'] });
        },
        onError: (e) => toast.error(e.message),
    });

    const users = searchResults?.users ?? [];
    const grants = (recentGrants?.entries ?? []).filter(
        (row) => row.entity_type === 'ad_credit_wallet'
    );

    return (
        <div className="space-y-6 max-w-xl">
            <Card className="rounded-2xl border-border">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Megaphone className="w-5 h-5 text-primary" />
                        Grant Ad Credits
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Search by email or name. Ad credits are used for profile boosts and featured placements.
                    </p>

                    <div className="space-y-2">
                        <Label htmlFor="ad-user-search">Find user</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                            <Input
                                id="ad-user-search"
                                value={userSearch}
                                onChange={(e) => setUserSearch(e.target.value)}
                                placeholder="user@email.com or name…"
                                className="pl-9"
                            />
                        </div>
                        {searching && <p className="text-xs text-muted-foreground">Searching…</p>}
                        {users.length > 0 && (
                            <div className="border rounded-xl divide-y max-h-48 overflow-y-auto">
                                {users.map((u) => (
                                    <button
                                        key={u.id}
                                        type="button"
                                        className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/60 touch-manipulation ${
                                            userId === u.id ? 'bg-primary/10' : ''
                                        }`}
                                        onClick={() => {
                                            setUserId(u.id);
                                            setSelectedUserLabel(`${u.full_name || u.email} · ${u.role || 'user'}`);
                                        }}
                                    >
                                        <span className="font-medium">{u.full_name || u.email}</span>
                                        <span className="text-muted-foreground block text-xs">{u.email}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {selectedUserLabel && (
                        <p className="text-xs text-muted-foreground">
                            Selected: <span className="text-foreground font-medium">{selectedUserLabel}</span>
                        </p>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="ad-user-id">User ID (advanced)</Label>
                        <Input
                            id="ad-user-id"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            placeholder="uuid"
                            className="font-mono text-sm"
                            spellCheck={false}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="ad-amount">Amount (EUR)</Label>
                        <Input
                            id="ad-amount"
                            type="number"
                            min="1"
                            step="1"
                            inputMode="decimal"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="ad-reason">Reason (optional)</Label>
                        <Input
                            id="ad-reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Launch campaign, partner promo…"
                        />
                    </div>
                    <Button
                        disabled={
                            grantMutation.isPending ||
                            !userId.trim() ||
                            !amount ||
                            parseFloat(amount) <= 0
                        }
                        onClick={() => grantMutation.mutate()}
                    >
                        {grantMutation.isPending ? 'Granting…' : 'Grant Ad Credits'}
                    </Button>
                </CardContent>
            </Card>

            {grants.length > 0 && (
                <Card className="rounded-2xl border-border">
                    <CardHeader>
                        <CardTitle className="text-base">Recent ad credit grants</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {grants.map((row) => (
                            <div key={row.id} className="flex justify-between gap-3 text-sm py-2 border-b border-border last:border-0 min-w-0">
                                <div className="min-w-0">
                                    <p className="font-medium tabular-nums">
                                        {formatMoney(row.payload?.amount ?? 0)}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {row.payload?.reason || 'Ad credit grant'} · wallet {row.entity_id?.slice(0, 8)}…
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
