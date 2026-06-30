import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

function parsePayload(payloadJson) {
    if (!payloadJson) return null;
    try {
        return typeof payloadJson === 'string' ? JSON.parse(payloadJson) : payloadJson;
    } catch {
        return payloadJson;
    }
}

function alertSummary(alert) {
    const payload = parsePayload(alert.payload_json);
    if (payload?.message) return payload.message;
    if (payload?.summary) return payload.summary;
    if (typeof payload === 'string') return payload;
    if (payload) return JSON.stringify(payload);
    return `Rule ${alert.rule_id} triggered on ${alert.entity_type}`;
}

function formatWhen(iso) {
    if (!iso) return '—';
    try {
        return format(parseISO(iso), 'MMM d, HH:mm');
    } catch {
        return iso;
    }
}

export default function AdminFraudAlertsPanel() {
    const queryClient = useQueryClient();
    const { data, isLoading, isError, refetch, isFetching } = useQuery({
        queryKey: ['admin-fraud-alerts'],
        queryFn: () => sovereign.admin.listFraudAlerts(),
        refetchInterval: 120_000,
    });

    const resolveMutation = useMutation({
        mutationFn: (id) => sovereign.admin.resolveFraudAlert(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-fraud-alerts'] });
            queryClient.invalidateQueries({ queryKey: ['admin-financial-trust-live'] });
            toast.success('Fraud alert resolved');
        },
        onError: (e) => toast.error(e.message),
    });

    const alerts = data?.alerts ?? [];

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
                <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-primary" />
                    Fraud alerts
                    {alerts.length > 0 && (
                        <Badge variant="destructive" className="ml-1">{alerts.length}</Badge>
                    )}
                </CardTitle>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                    disabled={isFetching}
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </CardHeader>
            <CardContent>
                {isLoading && <p className="text-sm text-muted-foreground">Loading alerts…</p>}
                {isError && (
                    <p className="text-sm text-destructive">Could not load fraud alerts.</p>
                )}
                {!isLoading && !isError && alerts.length === 0 && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        No open fraud alerts.
                    </p>
                )}
                {alerts.length > 0 && (
                    <ul className="space-y-3">
                        {alerts.map((alert) => (
                            <li
                                key={alert.id}
                                className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 p-4 rounded-lg border border-primary/30 bg-primary/10/40 dark:bg-primary/10"
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <Badge variant="outline" className="capitalize text-xs">
                                            {alert.rule_id ?? 'rule'}
                                        </Badge>
                                        {alert.severity && (
                                            <Badge variant={alert.severity === 'high' ? 'destructive' : 'secondary'} className="text-xs capitalize">
                                                {alert.severity}
                                            </Badge>
                                        )}
                                        <span className="text-xs text-muted-foreground">
                                            {formatWhen(alert.created_at)}
                                        </span>
                                    </div>
                                    <p className="font-medium text-sm">{alertSummary(alert)}</p>
                                    {alert.entity_id && (
                                        <p className="text-xs text-muted-foreground mt-1 truncate">
                                            {alert.entity_type} · {alert.entity_id}
                                        </p>
                                    )}
                                </div>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    className="shrink-0"
                                    disabled={resolveMutation.isPending}
                                    onClick={() => resolveMutation.mutate(alert.id)}
                                >
                                    Resolve
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}
