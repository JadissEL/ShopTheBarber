import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Zap, Info } from 'lucide-react';
import { toast } from 'sonner';

const THRESHOLD_PRESETS = [10, 20, 50];
const AMOUNT_PRESETS = [50, 100, 200];

export default function ProviderAutoRechargePanel() {
    const queryClient = useQueryClient();
    const { data: user, isLoading } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => sovereign.auth.me(),
    });

    const [enabled, setEnabled] = useState(false);
    const [threshold, setThreshold] = useState('20');
    const [amount, setAmount] = useState('100');

    useEffect(() => {
        if (!user) return;
        setEnabled(!!user.auto_recharge_enabled);
        setThreshold(String(user.auto_recharge_threshold ?? 20));
        setAmount(String(user.auto_recharge_amount ?? 100));
    }, [user]);

    const saveMutation = useMutation({
        mutationFn: (payload) => sovereign.wallet.updateAutoRecharge(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['currentUser'] });
            queryClient.invalidateQueries({ queryKey: ['provider-financial-dashboard'] });
            toast.success('Low-balance alert settings saved');
        },
        onError: (e) => toast.error(e.message),
    });

    const handleSave = () => {
        const thresholdNum = parseFloat(threshold);
        const amountNum = parseFloat(amount);
        if (Number.isNaN(thresholdNum) || thresholdNum < 0) {
            toast.error('Enter a valid threshold');
            return;
        }
        if (Number.isNaN(amountNum) || amountNum < 10) {
            toast.error('Recharge amount must be at least €10');
            return;
        }
        saveMutation.mutate({
            enabled,
            threshold: thresholdNum,
            amount: amountNum,
        });
    };

    if (isLoading) {
        return <div className="h-32 rounded-lg bg-muted/40 animate-pulse" aria-busy="true" />;
    }

    return (
        <Card className=" border-border/60">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    Low balance alerts
                    {enabled ? (
                        <Badge variant="secondary" className="ml-auto text-xs">Active</Badge>
                    ) : (
                        <Badge variant="outline" className="ml-auto text-xs">Off</Badge>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
                <div className="flex items-start gap-3 rounded-lg bg-muted/40 p-4 text-sm">
                    <Info className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
                    <p className="text-muted-foreground">
                        When your fee wallet drops below the threshold, we send you a reminder to top up.
                        Automatic card charges will be enabled in a future release.
                    </p>
                </div>

                <div className="flex items-center justify-between gap-4">
                    <Label htmlFor="auto-recharge-toggle" className="font-medium">
                        Enable low-balance alerts
                    </Label>
                    <Switch
                        id="auto-recharge-toggle"
                        checked={enabled}
                        onCheckedChange={setEnabled}
                    />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="auto-recharge-threshold">Alert when balance below (€)</Label>
                        <Input
                            id="auto-recharge-threshold"
                            type="number"
                            min="0"
                            step="1"
                            value={threshold}
                            onChange={(e) => setThreshold(e.target.value)}
                        />
                        <div className="flex flex-wrap gap-2">
                            {THRESHOLD_PRESETS.map((v) => (
                                <Button
                                    key={v}
                                    type="button"
                                    size="sm"
                                    variant={String(v) === threshold ? 'default' : 'outline'}
                                    className="h-7 text-xs"
                                    onClick={() => setThreshold(String(v))}
                                >
                                    €{v}
                                </Button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="auto-recharge-amount">Suggested top-up amount (€)</Label>
                        <Input
                            id="auto-recharge-amount"
                            type="number"
                            min="10"
                            step="5"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                        <div className="flex flex-wrap gap-2">
                            {AMOUNT_PRESETS.map((v) => (
                                <Button
                                    key={v}
                                    type="button"
                                    size="sm"
                                    variant={String(v) === amount ? 'default' : 'outline'}
                                    className="h-7 text-xs"
                                    onClick={() => setAmount(String(v))}
                                >
                                    €{v}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                <Button
                    onClick={handleSave}
                    disabled={saveMutation.isPending}
                    className=" font-bold"
                >
                    Save alert settings
                </Button>
            </CardContent>
        </Card>
    );
}
