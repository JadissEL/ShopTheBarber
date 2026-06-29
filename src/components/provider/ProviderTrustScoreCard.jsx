import { useQuery } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ProviderTrustScoreCard({ barberId }) {
    const { data, isLoading } = useQuery({
        queryKey: ['barber-trust', barberId],
        queryFn: () => sovereign.trust.getBarberTrust(barberId),
        enabled: !!barberId,
        retry: false,
    });

    if (isLoading || !data || data.error) return null;

    return (
        <Card className="rounded-2xl border-primary/20 bg-primary/5">
            <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide font-bold">Trust score</p>
                        <p className="text-2xl font-black tabular-nums">{data.trust_score ?? '—'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="gap-1">
                        <Zap className="w-3 h-3" />
                        {data.availability_label ?? 'Availability'}
                    </Badge>
                    <Link
                        to={createPageUrl('ChampionshipLeaderboard')}
                        className="text-xs font-bold text-primary hover:underline"
                    >
                        Rankings →
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}
