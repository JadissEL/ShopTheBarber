import { useQuery, useMutation } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Shield } from 'lucide-react';

function tierLabel(tier) {
    switch (tier) {
        case 'full_refund':
            return 'Full refund';
        case 'partial_refund':
            return 'Partial refund';
        case 'no_refund':
            return 'Non-refundable';
        default:
            return 'Standard cancellation';
    }
}

export default function CancelBookingDialog({ bookingId, open, onOpenChange, onCancelled }) {
    const { data: preview, isLoading, error } = useQuery({
        queryKey: ['cancel-preview', bookingId],
        queryFn: () => sovereign.paymentProtection.getCancelPreview(bookingId),
        enabled: open && !!bookingId,
    });

    const cancelMutation = useMutation({
        mutationFn: () => sovereign.paymentProtection.cancelBooking(bookingId),
        onSuccess: (result) => {
            onCancelled?.(result);
            onOpenChange(false);
        },
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-violet-600" />
                        Cancel appointment
                    </DialogTitle>
                    <DialogDescription>
                        Review refund and cancellation fee before confirming.
                    </DialogDescription>
                </DialogHeader>

                {isLoading && (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                )}

                {error && (
                    <p className="text-sm text-destructive">{error.message}</p>
                )}

                {preview && !isLoading && (
                    <div className="space-y-3 text-sm">
                        <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-2">
                            <p className="font-semibold">{tierLabel(preview.tier)}</p>
                            <p className="text-muted-foreground">{preview.reason}</p>
                            {preview.refund_amount > 0 && (
                                <p className="text-green-700">
                                    Refund: <strong>€{preview.refund_amount.toFixed(2)}</strong>
                                </p>
                            )}
                            {preview.fee_amount > 0 && (
                                <p className="text-amber-800 flex items-start gap-1.5">
                                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                    Cancellation fee: <strong>€{preview.fee_amount.toFixed(2)}</strong>
                                    {preview.deposit_paid && preview.refund_amount === 0 && (
                                        <span className="block text-xs">(deposit retained)</span>
                                    )}
                                </p>
                            )}
                            {preview.hours_until_appointment != null && (
                                <p className="text-xs text-muted-foreground">
                                    ~{Math.floor(preview.hours_until_appointment)}h until appointment
                                </p>
                            )}
                        </div>
                        {preview.policy?.late_cancel_protection_enabled && (
                            <p className="text-xs text-muted-foreground">
                                Policy: full refund {preview.policy.late_cancel_full_refund_hours}h+ before;
                                {' '}{preview.policy.late_cancel_fee_percent}% fee between{' '}
                                {preview.policy.late_cancel_no_refund_hours}-{preview.policy.late_cancel_full_refund_hours}h;
                                non-refundable within {preview.policy.late_cancel_no_refund_hours}h.
                            </p>
                        )}
                    </div>
                )}

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={cancelMutation.isPending}>
                        Keep appointment
                    </Button>
                    <Button
                        variant="destructive"
                        disabled={!preview || cancelMutation.isPending || isLoading}
                        onClick={() => cancelMutation.mutate()}
                    >
                        {cancelMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            'Confirm cancellation'
                        )}
                    </Button>
                </DialogFooter>
                {cancelMutation.error && (
                    <p className="text-sm text-destructive">{cancelMutation.error.message}</p>
                )}
            </DialogContent>
        </Dialog>
    );
}
