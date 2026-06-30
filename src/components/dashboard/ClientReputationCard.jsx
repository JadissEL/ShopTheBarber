import { useQuery } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, Shield, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { stb } from '@/lib/stbUi';

const LEVEL_COLORS = {
    new: 'secondary',
    bronze: 'outline',
    silver: 'secondary',
    gold: 'default',
    platinum: 'default',
    diamond: 'default',
    legend: 'default',
};

export default function ClientReputationCard({ className = '' }) {
    const { data, isLoading } = useQuery({
        queryKey: ['my-reputation'],
        queryFn: () => sovereign.trust.getMyReputation(),
        retry: false,
    });

    const { data: dash } = useQuery({
        queryKey: ['my-trust-dashboard'],
        queryFn: () => sovereign.trust.getMyDashboard(),
        retry: false,
    });

    if (isLoading || !data) return null;

    const level = data.level ?? 'new';
    const variant = LEVEL_COLORS[level] ?? 'secondary';

    return (
        <Card className={cn(stb.panel, className)}>
            <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                    <Award className="w-4 h-4 text-primary" />
                    Your reputation
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                    <Badge variant={variant} className="capitalize">{level}</Badge>
                    <span className="text-2xl font-bold tabular-nums">{data.score ?? 0}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="w-3.5 h-3.5" />
                    Reliability index: <strong className="text-foreground">{data.reliability_index ?? 100}</strong>/100
                </div>
                {dash && (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t text-sm">
                        <div>
                            <p className="text-muted-foreground text-xs">Lifetime bookings</p>
                            <p className="font-semibold">{dash.lifetime_bookings ?? 0}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" /> Referral earnings
                            </p>
                            <p className="font-semibold">€{(dash.referral_earnings_eur ?? 0).toFixed(2)}</p>
                        </div>
                    </div>
                )}
                {Array.isArray(data.recent_events) && data.recent_events.length > 0 && (
                    <div className="pt-2 border-t space-y-2">
                        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Recent activity</p>
                        <ul className="space-y-1.5 max-h-32 overflow-y-auto">
                            {data.recent_events.slice(0, 5).map((ev, i) => (
                                <li key={i} className="flex items-center justify-between text-xs gap-2">
                                    <span className="text-muted-foreground capitalize truncate">
                                        {(ev.event_type ?? 'event').replace(/_/g, ' ')}
                                    </span>
                                    <span className={`font-semibold tabular-nums shrink-0 ${(ev.points_delta ?? 0) >= 0 ? 'text-primary' : 'text-destructive'}`}>
                                        {(ev.points_delta ?? 0) >= 0 ? '+' : ''}{ev.points_delta ?? 0}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
