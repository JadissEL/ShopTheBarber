import { useQuery } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Calendar, CreditCard, Wallet, Users } from 'lucide-react';

function Metric({ icon: Icon, label, value, alert }) {
    return (
        <div className={`rounded-xl border p-4 ${alert ? 'border-amber-300 bg-amber-50/50 dark:bg-amber-950/20' : 'border-border'}`}>
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Icon className="w-3.5 h-3.5" />
                {label}
            </div>
            <p className="text-xl font-bold tabular-nums">{value}</p>
        </div>
    );
}

export default function AdminLiveMetricsPanel() {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['admin-financial-trust-live'],
        queryFn: () => sovereign.admin.getFinancialTrustLive(),
        refetchInterval: 60_000,
    });

    if (isLoading) return <p className="text-sm text-muted-foreground">Loading live ops metrics…</p>;
    if (isError || data?.schema_pending) {
        return (
            <Card>
                <CardContent className="p-4 text-sm text-muted-foreground">
                    Live metrics unavailable — run Phase 2/3 migrations on the database.
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Live ops (today)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <Metric icon={Calendar} label="Bookings today" value={data.today_bookings ?? 0} />
                    <Metric icon={CreditCard} label="Commission today" value={`€${(data.revenue_commission_today_eur ?? 0).toFixed(0)}`} />
                    <Metric icon={Wallet} label="Deposits locked" value={`€${(data.deposits_locked_eur ?? 0).toFixed(0)}`} />
                    <Metric
                        icon={AlertTriangle}
                        label="Wallets &lt; €20"
                        value={data.wallets_below_20 ?? 0}
                        alert={(data.wallets_below_20 ?? 0) > 0}
                    />
                    <Metric icon={Users} label="Cancellations" value={data.cancellations_today ?? 0} />
                    <Metric icon={Users} label="No-shows" value={data.no_shows_today ?? 0} />
                    <Metric icon={AlertTriangle} label="Open fraud alerts" value={data.open_fraud_alerts ?? 0} alert={(data.open_fraud_alerts ?? 0) > 0} />
                    <Metric icon={Users} label="Top barber today" value={data.top_barber_today ?? '—'} />
                </div>
            </CardContent>
        </Card>
    );
}
