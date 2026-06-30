import { useQuery } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Scale, RefreshCw, AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

function formatWhen(iso) {
    if (!iso) return '—';
    try {
        return format(parseISO(iso), 'MMM d, HH:mm');
    } catch {
        return iso;
    }
}

export default function AdminWalletReconciliationPanel() {
    const { data, isLoading, isError, refetch, isFetching } = useQuery({
        queryKey: ['admin-wallet-reconciliation'],
        queryFn: () => sovereign.admin.listWalletReconciliation({ limit: 30 }),
        refetchInterval: 120_000,
    });

    const runs = data?.runs ?? [];
    const mismatches = runs.filter((r) => r.status === 'mismatch');

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Scale className="w-5 h-5" />
                    Provider wallet reconciliation
                    {mismatches.length > 0 && (
                        <Badge variant="destructive">{mismatches.length} mismatch{mismatches.length !== 1 ? 'es' : ''}</Badge>
                    )}
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                    Nightly cron compares provider fee wallet balances against transaction sums. Investigate mismatches before payouts.
                </p>
                {isLoading && <p className="text-sm text-muted-foreground">Loading runs…</p>}
                {isError && <p className="text-sm text-destructive">Could not load reconciliation runs.</p>}
                {!isLoading && runs.length === 0 && (
                    <p className="text-sm text-muted-foreground">No reconciliation runs yet — ensure Phase 2 migrations and cron are active.</p>
                )}
                {runs.length > 0 && (
                    <div className="border rounded-lg overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/40 border-b">
                                <tr className="text-left text-muted-foreground text-xs uppercase">
                                    <th className="p-3 font-medium">When</th>
                                    <th className="p-3 font-medium">Wallet</th>
                                    <th className="p-3 font-medium text-right">Expected</th>
                                    <th className="p-3 font-medium text-right">Actual</th>
                                    <th className="p-3 font-medium text-right">Delta</th>
                                    <th className="p-3 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {runs.map((run) => (
                                    <tr key={run.id} className={run.status === 'mismatch' ? 'bg-primary/10 dark:bg-primary/10' : ''}>
                                        <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">{formatWhen(run.created_at)}</td>
                                        <td className="p-3 font-mono text-xs">{run.wallet_id?.slice(0, 8)}…</td>
                                        <td className="p-3 text-right tabular-nums">€{(run.expected_balance ?? 0).toFixed(2)}</td>
                                        <td className="p-3 text-right tabular-nums">€{(run.actual_balance ?? 0).toFixed(2)}</td>
                                        <td className={`p-3 text-right tabular-nums font-medium ${Math.abs(run.delta ?? 0) >= 0.01 ? 'text-muted-foreground' : ''}`}>
                                            €{(run.delta ?? 0).toFixed(2)}
                                        </td>
                                        <td className="p-3">
                                            {run.status === 'mismatch' ? (
                                                <Badge variant="destructive" className="gap-1">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    Mismatch
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary">OK</Badge>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
