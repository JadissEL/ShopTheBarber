import { useQuery } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Banknote } from 'lucide-react';
import { format, parseISO } from 'date-fns';

function formatWhen(iso) {
    if (!iso) return '—';
    try {
        return format(parseISO(iso), 'MMM d, yyyy');
    } catch {
        return iso;
    }
}

export default function AdminFinancingApplicationsPanel() {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['admin-financing-applications'],
        queryFn: () => sovereign.admin.listFinancingApplications(),
    });

    const apps = data?.applications ?? [];

    return (
        <Card className="rounded-2xl border-border">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Banknote className="w-5 h-5" />
                    Financing applications
                    {apps.filter((a) => a.status === 'pending').length > 0 && (
                        <Badge variant="secondary">
                            {apps.filter((a) => a.status === 'pending').length} pending
                        </Badge>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
                {isError && <p className="text-sm text-destructive">Failed to load applications.</p>}
                {!isLoading && apps.length === 0 && (
                    <p className="text-sm text-muted-foreground">No financing applications yet.</p>
                )}
                {apps.length > 0 && (
                    <ul className="space-y-3">
                        {apps.map((app) => (
                            <li key={app.id} className="flex flex-wrap items-start justify-between gap-3 p-4 rounded-xl border">
                                <div>
                                    <p className="font-medium">
                                        €{(app.amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {app.user?.full_name ?? app.user?.email ?? app.user_id}
                                    </p>
                                    {app.purpose && (
                                        <p className="text-xs text-muted-foreground mt-1">{app.purpose}</p>
                                    )}
                                </div>
                                <div className="text-right space-y-1">
                                    <Badge variant={app.status === 'pending' ? 'outline' : 'secondary'} className="capitalize">
                                        {app.status ?? 'pending'}
                                    </Badge>
                                    <p className="text-xs text-muted-foreground">{formatWhen(app.created_at)}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
                <p className="text-xs text-muted-foreground mt-4">
                    Phase 3 stub — underwriting and disbursement workflow coming later.
                </p>
            </CardContent>
        </Card>
    );
}
