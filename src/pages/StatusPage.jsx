import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { sovereign } from '@/api/apiClient';
import { MetaTags } from '@/components/seo/MetaTags';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageLoading } from '@/components/ui/page-loading';
import { PageError } from '@/components/ui/page-error';
import { createPageUrl } from '@/utils';
import { Activity, CheckCircle2, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import PageContent from '@/components/layout/PageContent';
import { stb } from '@/lib/stbUi';

const STATUS_STYLE = {
    operational: { icon: CheckCircle2, badge: 'stb-chip stb-chip-active', label: 'Operational' },
    degraded: { icon: AlertTriangle, badge: 'bg-warning/15 text-foreground', label: 'Degraded' },
    outage: { icon: XCircle, badge: 'bg-destructive/10 text-destructive', label: 'Outage' },
    unknown: { icon: Activity, badge: 'bg-muted text-foreground/90', label: 'Unknown' },
};

const INCIDENT_STYLE = {
    investigating: 'bg-destructive/10 text-destructive',
    identified: 'bg-warning/15 text-foreground',
    monitoring: 'bg-primary/10 text-primary',
    resolved: 'stb-chip stb-chip-active',
};

export default function StatusPage() {
    const { data, isLoading, isError, refetch, isFetching, dataUpdatedAt } = useQuery({
        queryKey: ['public-status'],
        queryFn: () => sovereign.status.getPublic(),
        refetchInterval: 60_000,
        retry: 1,
    });

    if (isLoading) return <PageLoading message="Loading system status…" />;
    if (isError || !data) return <PageError title="Status unavailable" onRetry={refetch} />;

    const overall = STATUS_STYLE[data.overall_status] ?? STATUS_STYLE.unknown;
    const OverallIcon = overall.icon;

    return (
        <div className={stb.page}>
            <MetaTags title="System Status" description="ShopTheBarber platform status and uptime" />
            <PageHeader
                label="Platform"
                title="System status"
                subtitle={`Live health from our API, updated ${dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : '-'}`}
                compact
                tier="display"
                variant="dark"
            >
                <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching} className="border-white/20 text-white hover:bg-white/10">
                    <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                </Button>
            </PageHeader>
            <PageContent narrow>
                <Card className="mb-6">
                    <CardContent className="pt-6 flex items-center gap-4">
                        <OverallIcon className="w-10 h-10 text-primary shrink-0" />
                        <div>
                            <p className="text-sm text-muted-foreground">Overall</p>
                            <p className="text-2xl font-bold capitalize">{overall.label}</p>
                        </div>
                        <Badge className={`ml-auto ${overall.badge}`}>{data.overall_status}</Badge>
                    </CardContent>
                </Card>

                {(data.active_incidents ?? []).length > 0 && (
                    <div className="space-y-3 mb-6">
                        <h2 className={stb.uiSubheading}>Active incidents</h2>
                        {data.active_incidents.map((inc, i) => (
                            <Card key={i} className="border-primary/30">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <CardTitle className="text-base">{inc.title}</CardTitle>
                                        <Badge className={INCIDENT_STYLE[inc.status] ?? INCIDENT_STYLE.investigating}>
                                            {inc.status}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    <p>{inc.message}</p>
                                    {inc.updated_at && (
                                        <p className="text-xs mt-2 opacity-70">Updated {inc.updated_at}</p>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Components</CardTitle>
                    </CardHeader>
                    <CardContent className="divide-y divide-border">
                        {(data.components ?? []).map((c) => {
                            const style = STATUS_STYLE[c.status] ?? STATUS_STYLE.unknown;
                            const Icon = style.icon;
                            return (
                                <div key={c.id} className="flex items-start gap-3 py-4 first:pt-0 last:pb-0">
                                    <Icon className="w-5 h-5 mt-0.5 shrink-0 text-muted-foreground" />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium">{c.name}</p>
                                        {c.description && (
                                            <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>
                                        )}
                                    </div>
                                    <Badge variant="secondary" className={style.badge}>
                                        {style.label}
                                    </Badge>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>

                <p className="text-xs text-muted-foreground text-center mt-8">
                    Need help?{' '}
                    <Link to={createPageUrl('HelpCenter')} className="text-primary hover:underline">
                        Help Center
                    </Link>
                    {', '}
                    <Link to={`${createPageUrl('SupportChat')}?new=1`} className="text-primary hover:underline">
                        Contact support
                    </Link>
                </p>
            </PageContent>
        </div>
    );
}
