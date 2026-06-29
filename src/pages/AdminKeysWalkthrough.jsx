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
        <div className="max-w-3xl mx-auto py-6">
            <MetaTags title="API keys walkthrough" description="Production secrets readiness checklist" />

            <div className="flex items-start justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <KeyRound className="w-8 h-8 text-primary" />
                        Keys finalization
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Server-side readiness on <strong>{data.environment}</strong>, values are never shown.
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

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
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
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
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                ) : c.required_production ? (
                                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
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
        </div>
    );
}
