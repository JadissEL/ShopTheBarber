import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { useAuth } from '@/lib/AuthContext';
import { MetaTags } from '@/components/seo/MetaTags';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Loader2, Play, RefreshCw, Trophy } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { toast } from 'sonner';
import { PageLoading } from '@/components/ui/page-loading';

export default function AdminTombola() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { data: draws = [], isLoading } = useQuery({
        queryKey: ['tombola-admin-draws'],
        queryFn: () => sovereign.tombola.adminListDraws(),
        enabled: user?.role === 'admin',
    });

    const syncMutation = useMutation({
        mutationFn: (drawId) => sovereign.tombola.adminSyncDraw(drawId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tombola-admin-draws'] });
            toast.success('Entries synced');
        },
        onError: (e) => toast.error(e.message),
    });

    const runMutation = useMutation({
        mutationFn: (drawId) => sovereign.tombola.adminRunDraw(drawId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tombola-admin-draws'] });
            queryClient.invalidateQueries({ queryKey: ['tombola-current'] });
            toast.success('Draw completed');
        },
        onError: (e) => toast.error(e.message),
    });

    if (user?.role !== 'admin') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card><CardContent className="py-8 text-center">
                    <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-2" />
                    <p className="font-semibold">Admin access required</p>
                </CardContent></Card>
            </div>
        );
    }

    if (isLoading) return <PageLoading message="Loading draws…" />;

    return (
        <div className="stb-page p-4 lg:p-8">
            <MetaTags title="Tombola Admin" />
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                    <Trophy className="w-6 h-6 text-primary" />
                    <h1 className="text-xl font-bold">Weekly Tombola</h1>
                </div>
                <ul className="space-y-3">
                    {draws.map((d) => (
                        <li key={d.id}>
                            <Card>
                                <CardContent className="p-4 flex flex-wrap items-center gap-3 justify-between">
                                    <div>
                                        <p className="font-medium">{d.title}</p>
                                        <p className="text-sm text-muted-foreground">
                                            Draw: {isValid(parseISO(d.draw_at)) ? format(parseISO(d.draw_at), 'PPp') : d.draw_at}
                                        </p>
                                        <div className="flex gap-2 mt-1">
                                            <Badge variant="secondary">{d.status}</Badge>
                                            <span className="text-xs text-muted-foreground">{d.total_tickets} tickets, {d.participant_count} users</span>
                                        </div>
                                        {d.winner_display_name && (
                                            <p className="text-sm text-emerald-600 mt-1">Winner: {d.winner_display_name}</p>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" onClick={() => syncMutation.mutate(d.id)} disabled={syncMutation.isPending}>
                                            <RefreshCw className="w-4 h-4" />
                                        </Button>
                                        {d.status !== 'completed' && (
                                            <Button size="sm" onClick={() => runMutation.mutate(d.id)} disabled={runMutation.isPending}>
                                                {runMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                                                Run draw
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
