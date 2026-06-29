import { useQuery } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, AlertCircle, Zap } from 'lucide-react';

export default function ProviderPhase2Financials({ shopId }) {
    const { data, isLoading } = useQuery({
        queryKey: ['provider-financial-dashboard', shopId],
        queryFn: () => sovereign.providerFinancials.getDashboard(shopId),
        retry: false,
    });

    if (isLoading) {
        return <div className="h-24 rounded-3xl bg-muted/40 animate-pulse" aria-busy="true" />;
    }

    if (!data) return null;

    return (
        <Card className="rounded-3xl border-border/60">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Financial insights
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid sm:grid-cols-3 gap-4 text-sm">
                    <div className="rounded-xl bg-muted/30 p-4">
                        <p className="text-muted-foreground text-xs mb-1">Referral income</p>
                        <p className="text-2xl font-bold tabular-nums">€{(data.referral_income_eur ?? 0).toFixed(2)}</p>
                    </div>
                    <div className="rounded-xl bg-muted/30 p-4">
                        <p className="text-muted-foreground text-xs mb-1 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" /> Open disputes
                        </p>
                        <p className="text-2xl font-bold tabular-nums">{data.pending_disputes ?? 0}</p>
                    </div>
                    <div className="rounded-xl bg-muted/30 p-4">
                        <p className="text-muted-foreground text-xs mb-1 flex items-center gap-1">
                            <Zap className="w-3.5 h-3.5" /> Auto top-up
                        </p>
                        <Badge variant={data.auto_recharge?.enabled ? 'default' : 'secondary'}>
                            {data.auto_recharge?.enabled ? `Below €${data.auto_recharge.threshold}` : 'Off'}
                        </Badge>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
