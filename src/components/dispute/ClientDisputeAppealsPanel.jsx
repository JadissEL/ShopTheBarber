import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Scale, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { disputeStatusLabel } from '@/utils/disputeStatus';

export default function ClientDisputeAppealsPanel() {
    const queryClient = useQueryClient();
    const [appealReasons, setAppealReasons] = useState({});

    const { data, isLoading } = useQuery({
        queryKey: ['my-disputes'],
        queryFn: () => sovereign.disputes.listMine(),
        retry: false,
    });

    const appealMutation = useMutation({
        mutationFn: ({ disputeId, reason }) => sovereign.disputes.submitAppeal(disputeId, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-disputes'] });
            toast.success('Appeal submitted — our team will review it');
        },
        onError: (e) => toast.error(e.message),
    });

    const disputes = data?.disputes ?? [];
    const appealable = disputes.filter(
        (d) => d.resolution_outcome || d.status === 'resolved'
    );

    if (isLoading) return null;
    if (appealable.length === 0) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Scale className="w-4 h-4" />
                    Dispute appeals
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {appealable.map((dispute) => (
                    <div key={dispute.id} className="rounded-xl border p-4 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline">{disputeStatusLabel(dispute.status)}</Badge>
                            {dispute.resolution_outcome && (
                                <span className="text-xs text-muted-foreground capitalize">
                                    Outcome: {dispute.resolution_outcome.replace(/_/g, ' ')}
                                </span>
                            )}
                        </div>
                        <p className="text-sm font-medium">{dispute.reason}</p>
                        <Textarea
                            placeholder="Explain why you are appealing this decision…"
                            value={appealReasons[dispute.id] ?? ''}
                            onChange={(e) =>
                                setAppealReasons((prev) => ({ ...prev, [dispute.id]: e.target.value }))
                            }
                            rows={3}
                        />
                        <Button
                            size="sm"
                            disabled={appealMutation.isPending || !(appealReasons[dispute.id]?.trim())}
                            onClick={() =>
                                appealMutation.mutate({
                                    disputeId: dispute.id,
                                    reason: appealReasons[dispute.id].trim(),
                                })
                            }
                        >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Submit appeal
                        </Button>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
