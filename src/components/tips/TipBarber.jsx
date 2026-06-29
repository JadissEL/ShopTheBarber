import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Loader, CheckCircle2, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

function formatMoney(amount) {
    return `$${Number(amount).toFixed(2)}`;
}

export default function TipBarber({ bookingId, returnPath, compact = false }) {
    const queryClient = useQueryClient();
    const [customAmount, setCustomAmount] = useState('');
    const [selectedPreset, setSelectedPreset] = useState(null);
    const [message, setMessage] = useState('');

    const { data: tipStatus, isLoading } = useQuery({
        queryKey: ['tip-status', bookingId],
        queryFn: () => sovereign.tips.getBookingStatus(bookingId),
        enabled: !!bookingId,
    });

    const checkoutMutation = useMutation({
        mutationFn: (payload) => sovereign.tips.createCheckout({ booking_id: bookingId, ...payload, return_path: returnPath }),
        onSuccess: (data) => {
            if (data?.url) {
                window.location.href = data.url;
            } else {
                toast.error('Could not start tip checkout');
            }
        },
        onError: (err) => toast.error(err.message || 'Failed to start tip payment'),
    });

    if (isLoading) {
        return (
            <Card className={compact ? 'border-border' : 'border-amber-200/60 bg-amber-50/30'}>
                <CardContent className="p-6 flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader className="w-4 h-4 animate-spin" /> Loading tip options…
                </CardContent>
            </Card>
        );
    }

    if (!tipStatus?.can_tip && !tipStatus?.already_tipped) {
        if (compact) return null;
        return (
            <Card className="border-border bg-muted/30">
                <CardContent className="p-4 text-sm text-muted-foreground">
                    {tipStatus?.reason || 'Tips will be available after your appointment is completed.'}
                </CardContent>
            </Card>
        );
    }

    if (tipStatus?.already_tipped) {
        return (
            <Card className="border-green-200 bg-green-50/50">
                <CardContent className={`${compact ? 'p-4' : 'p-6'} flex items-center gap-3`}>
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                    <div>
                        <p className="font-semibold text-green-800">Tip sent, thank you!</p>
                        <p className="text-sm text-green-700">
                            {formatMoney(tipStatus.tip?.amount)} to {tipStatus.recipient_name || 'your barber'}
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const handleTip = (opts) => {
        checkoutMutation.mutate({ ...opts, message: message.trim() || undefined });
    };

    const handleCustomTip = () => {
        const amount = parseFloat(customAmount);
        if (Number.isNaN(amount) || amount < (tipStatus.min_amount ?? 1)) {
            toast.error(`Enter at least ${formatMoney(tipStatus.min_amount ?? 1)}`);
            return;
        }
        handleTip({ amount });
    };

    return (
        <Card className={compact ? 'border-border' : 'border-amber-200/60 bg-gradient-to-br from-amber-50/80 to-card shadow-md'}>
            <CardHeader className={compact ? 'p-4 pb-2' : 'p-6 pb-3'}>
                <CardTitle className={`flex items-center gap-2 ${compact ? 'text-base' : 'text-xl'}`}>
                    <Heart className="w-5 h-5 text-amber-600 fill-amber-500/30" />
                    Say thanks with a tip
                </CardTitle>
                {!compact && (
                    <p className="text-sm text-muted-foreground mt-1">
                        100% goes to {tipStatus.recipient_name || tipStatus.barber_name || 'your barber'}
                        {tipStatus.service_price > 0 && `, Service was ${formatMoney(tipStatus.service_price)}`}
                    </p>
                )}
            </CardHeader>
            <CardContent className={`space-y-4 ${compact ? 'p-4 pt-0' : 'p-6 pt-0'}`}>
                <div className="flex flex-wrap gap-2">
                    {(tipStatus.presets || []).map((preset) => (
                        <Button
                            key={preset.percent}
                            type="button"
                            variant={selectedPreset === preset.percent ? 'default' : 'outline'}
                            className="rounded-xl font-bold min-w-[4.5rem]"
                            disabled={checkoutMutation.isPending}
                            onClick={() => {
                                setSelectedPreset(preset.percent);
                                setCustomAmount('');
                                handleTip({ percent: preset.percent });
                            }}
                        >
                            {preset.percent}%
                            <span className="ml-1 text-xs opacity-80">{formatMoney(preset.amount)}</span>
                        </Button>
                    ))}
                </div>

                <div className="flex gap-2 items-end">
                    <div className="flex-1">
                        <Label htmlFor={`custom-tip-${bookingId}`} className="text-xs text-muted-foreground">
                            Custom amount
                        </Label>
                        <div className="relative mt-1">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                id={`custom-tip-${bookingId}`}
                                type="number"
                                min={tipStatus.min_amount}
                                max={tipStatus.max_amount}
                                step="0.01"
                                placeholder="0.00"
                                value={customAmount}
                                onChange={(e) => {
                                    setCustomAmount(e.target.value);
                                    setSelectedPreset(null);
                                }}
                                className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-background text-sm"
                            />
                        </div>
                    </div>
                    <Button
                        type="button"
                        variant="secondary"
                        className="rounded-xl shrink-0"
                        disabled={checkoutMutation.isPending || !customAmount}
                        onClick={handleCustomTip}
                    >
                        {checkoutMutation.isPending ? <Loader className="w-4 h-4 animate-spin" /> : 'Tip'}
                    </Button>
                </div>

                {!compact && (
                    <div>
                        <Label htmlFor={`tip-msg-${bookingId}`} className="text-xs text-muted-foreground">
                            Optional message
                        </Label>
                        <Textarea
                            id={`tip-msg-${bookingId}`}
                            placeholder="Great fade, thanks!"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            maxLength={280}
                            className="mt-1 rounded-xl resize-none"
                            rows={2}
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
