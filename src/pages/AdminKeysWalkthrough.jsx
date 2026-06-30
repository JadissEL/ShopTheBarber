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
import { KeyRound, ExternalLink, RefreshCw, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import PageContent from '@/components/layout/PageContent';
import { stb } from '@/lib/stbUi';

const GROUP_LABELS = {
    core: 'Core platform',
    payments: 'Payments',
    observability: 'Observability',
    comms: 'Email & SMS',
    ci: 'CI / cron',
};

export default function AdminKeysWalkthrough() {
    const { data, isLoading, isError, refetch, isFetching } = useQuery({
        queryKey: ['admin-config-readiness'],
        queryFn: () => sovereign.admin.getConfigReadiness(),
        staleTime: 30_000,
    });

    if (isLoading) return <PageLoading message="Checking server configuration…" />;
    if (isError || !data) return <PageError title="Could not load config readiness" onRetry={refetch} />;

    const byGroup = data.checks.reduce((acc, c) => {
        const g = c.group ?? 'core';
        if (!acc[g]) acc[g] = [];
        acc[g].push(c);
        return acc;
    }, {});

    return (
        <div className={stb.page + ' lg:pb-8'}>
            <MetaTags title="API keys walkthrough" description="Production secrets readiness checklist" />

            <PageHeader
                label="Admin"
                title="Keys finalization"
                subtitle={`Server-side readiness on ${data.environment} — values are never shown.`}
                compact
                variant="light"
                tier="app"
            >
                <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </PageHeader>

            <PageContent narrow>

            <Card className="mb-8">
                <CardContent className="pt-6">
                    <div className="flex flex-wrap items-center gap-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Production ready</p>
                            <p className="text-2xl font-bold">
                                {data.ready_for_production ? 'Yes' : 'Not yet'}
                            </p>
                        </div>
                        <Badge
                            className={
                                data.ready_for_production
                                    ? 'stb-chip stb-chip-active'
                                    : 'bg-warning/15 text-foreground'
                            }
                        >
                            {data.summary.configured}/{data.summary.total} configured, {' '}
                            {data.summary.required_missing} required missing
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            {Object.entries(byGroup).map(([group, checks]) => (
                <Card key={group} className="mb-4">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">{GROUP_LABELS[group] ?? group}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {checks.map((c) => (
                            <div
                                key={c.id}
                                className="flex items-start gap-3 py-2 border-b border-border last:border-0"
                            >
                                {c.configured ? (
                                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                ) : c.required_production ? (
                                    <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                ) : (
                                    <Circle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm">{c.label}</p>
                                    {c.hint && (
                                        <p className="text-xs text-muted-foreground mt-0.5">{c.hint}</p>
                                    )}
                                </div>
                                {c.dashboard_url && (
                                    <a
                                        href={c.dashboard_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-primary inline-flex items-center gap-1 shrink-0"
                                    >
                                        Open <ExternalLink className="w-3 h-3" />
                                    </a>
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            ))}

            <Card className="mt-8 bg-muted/40">
                <CardContent className="pt-6 text-sm text-muted-foreground space-y-2">
                    <p>
                        <strong>Local check:</strong> run{' '}
                        <code className="text-xs bg-background px-1 py-0.5 rounded">npm run verify:secrets</code>{' '}
                        from the repo root (reads <code className="text-xs">server/.env</code> and{' '}
                        <code className="text-xs">.env.local</code> without printing values).
                    </p>
                    <p>
                        Full walkthrough:{' '}
                        <code className="text-xs">docs/KEYS_FINALIZATION_WALKTHROUGH.md</code> and{' '}
                        <code className="text-xs">.cursor_memory/api_keys_checklist.md</code>.
                    </p>
                    <Link to={createPageUrl('StatusPage')}>
                        <Button variant="link" className="px-0 h-auto">
                            View public status page
                        </Button>
                    </Link>
                </CardContent>
            </Card>
            </PageContent>
        </div>
    );
}
