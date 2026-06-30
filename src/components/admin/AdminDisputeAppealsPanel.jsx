import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Scale, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

function formatWhen(iso) {
    if (!iso) return '—';
    try {
        return format(parseISO(iso), 'MMM d, yyyy HH:mm');
    } catch {
        return iso;
    }
}

export default function AdminDisputeAppealsPanel() {
    const queryClient = useQueryClient();
    const { data, isLoading, isError } = useQuery({
        queryKey: ['admin-dispute-appeals'],
        queryFn: () => sovereign.admin.listDisputeAppeals(),
        refetchInterval: 120_000,
    });

    const resolveMutation = useMutation({
        mutationFn: ({ id, status }) => sovereign.admin.resolveDisputeAppeal(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-dispute-appeals'] });
            toast.success('Appeal updated');
        },
        onError: (e) => toast.error(e.message),
    });

    const appeals = data?.appeals ?? [];

    if (isLoading) return null;
    if (isError) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Scale className="w-5 h-5" />
                    Pending dispute appeals
                    {appeals.length > 0 && (
                        <Badge variant="secondary">{appeals.length}</Badge>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {appeals.length === 0 ? (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        No pending appeals.
                    </p>
                ) : (
                    <ul className="space-y-3">
                        {appeals.map((appeal) => (
                            <li key={appeal.id} className="p-4 rounded-lg border space-y-2">
                                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                    <span>{formatWhen(appeal.created_at)}</span>
                                    <span>·</span>
                                    <span>
                                        {appeal.appellant?.full_name ?? appeal.appellant?.email ?? appeal.appellant_id}
                                    </span>
                                </div>
                                <p className="text-sm">{appeal.reason}</p>
                                <p className="text-xs text-muted-foreground">Dispute: {appeal.dispute_id?.slice(0, 8)}…</p>
                                <div className="flex gap-2 pt-1">
                                    <Button
                                        size="sm"
                                        disabled={resolveMutation.isPending}
                                        onClick={() => resolveMutation.mutate({ id: appeal.id, status: 'accepted' })}
                                    >
                                        <CheckCircle2 className="w-4 h-4 mr-1" />
                                        Accept
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={resolveMutation.isPending}
                                        onClick={() => resolveMutation.mutate({ id: appeal.id, status: 'rejected' })}
                                    >
                                        <XCircle className="w-4 h-4 mr-1" />
                                        Reject
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}
