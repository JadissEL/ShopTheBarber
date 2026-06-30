import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { stb } from '@/lib/stbUi';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ClientPaymentMethodsPanel() {
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['payment-methods'],
        queryFn: () => sovereign.paymentProtection.listPaymentMethods(),
    });

    const addCardMutation = useMutation({
        mutationFn: () => sovereign.paymentProtection.startSaveCardCheckout(),
        onSuccess: (res) => {
            if (res.url) window.location.href = res.url;
        },
        onError: (e) => toast.error(e.message),
    });

    const removeMutation = useMutation({
        mutationFn: (id) => sovereign.paymentProtection.removePaymentMethod(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
            toast.success('Card removed');
        },
        onError: (e) => toast.error(e.message),
    });

    if (isLoading) {
        return (
            <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
        );
    }

    const methods = data?.methods ?? [];

    return (
        <Card className={cn(stb.panel, 'border-border')}>
            <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-primary" />
                            Saved payment methods
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Cards on file for faster checkout and no-show protection with participating barbers.
                        </p>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={addCardMutation.isPending || !data?.stripe_configured}
                        onClick={() => addCardMutation.mutate()}
                    >
                        {addCardMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                <Plus className="w-4 h-4 mr-1" /> Add card
                            </>
                        )}
                    </Button>
                </div>

                {methods.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-lg">
                        No cards saved yet.
                    </p>
                ) : (
                    <ul className="space-y-2">
                        {methods.map((m) => (
                            <li
                                key={m.id}
                                className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20"
                            >
                                <div className="flex items-center gap-3">
                                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                                    <span className="font-medium capitalize">
                                        {m.brand || 'Card'} •••• {m.last4}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {m.exp_month}/{m.exp_year}
                                    </span>
                                    {m.is_default && (
                                        <Badge variant="secondary" className="text-xs">
                                            Default
                                        </Badge>
                                    )}
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground hover:text-destructive"
                                    onClick={() => removeMutation.mutate(m.id)}
                                    disabled={removeMutation.isPending}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}
