import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Banknote, Info } from 'lucide-react';
import { toast } from 'sonner';

export default function ProviderFinancingApplyPanel() {
    const queryClient = useQueryClient();
    const [amount, setAmount] = useState('');
    const [purpose, setPurpose] = useState('');

    const { data } = useQuery({
        queryKey: ['my-financing-applications'],
        queryFn: () => sovereign.financing.listMine(),
        retry: false,
    });

    const applyMutation = useMutation({
        mutationFn: () =>
            sovereign.financing.apply({
                amount: parseFloat(amount),
                purpose: purpose.trim() || undefined,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-financing-applications'] });
            setAmount('');
            setPurpose('');
            toast.success('Application submitted — we will review it shortly');
        },
        onError: (e) => toast.error(e.message),
    });

    const applications = data?.applications ?? [];
    const pending = applications.find((a) => a.status === 'pending');

    return (
        <Card className="rounded-3xl border-border/60">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Banknote className="w-5 h-5 text-primary" />
                    Business financing
                    {pending && <Badge variant="outline" className="ml-auto capitalize">{pending.status}</Badge>}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-start gap-3 rounded-xl bg-muted/40 p-4 text-sm">
                    <Info className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
                    <p className="text-muted-foreground">
                        Apply for equipment or expansion financing. This is an early-access program — approvals are manual.
                    </p>
                </div>

                {applications.length > 0 && (
                    <ul className="text-sm space-y-2 border rounded-xl p-3">
                        {applications.slice(0, 3).map((app) => (
                            <li key={app.id} className="flex justify-between gap-2">
                                <span>€{(app.amount ?? 0).toLocaleString()}</span>
                                <Badge variant="outline" className="capitalize text-xs">{app.status}</Badge>
                            </li>
                        ))}
                    </ul>
                )}

                {!pending && (
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="fin-amount">Amount requested (EUR)</Label>
                            <Input
                                id="fin-amount"
                                type="number"
                                min="500"
                                step="100"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="5000"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="fin-purpose">Purpose</Label>
                            <Textarea
                                id="fin-purpose"
                                rows={3}
                                value={purpose}
                                onChange={(e) => setPurpose(e.target.value)}
                                placeholder="New chairs, renovation, marketing…"
                            />
                        </div>
                        <Button
                            disabled={applyMutation.isPending || !amount || parseFloat(amount) < 500}
                            onClick={() => applyMutation.mutate()}
                            className="rounded-xl font-bold"
                        >
                            Submit application
                        </Button>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
