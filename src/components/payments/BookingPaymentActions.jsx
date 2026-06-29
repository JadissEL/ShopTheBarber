import { useMutation } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, Shield } from 'lucide-react';
import { toast } from 'sonner';

function paymentBadge(booking) {
    const d = booking.data || booking;
    if (d.deposit_payment_status === 'paid' && (d.balance_due ?? 0) > 0) {
        return { label: `Deposit paid, €${(d.balance_due ?? 0).toFixed(2)} due`, variant: 'secondary' };
    }
    if (d.deposit_payment_status === 'unpaid' && (d.deposit_amount ?? 0) > 0) {
        return { label: 'Deposit due', variant: 'destructive' };
    }
    if (d.authorization_status === 'authorized') {
        return { label: 'Card authorized', variant: 'outline' };
    }
    if (d.payment_status === 'partial') {
        return { label: 'Partially paid', variant: 'secondary' };
    }
    if (d.no_show_fee_status === 'charged') {
        return { label: 'No-show fee charged', variant: 'destructive' };
    }
    if (d.cancellation_fee_status === 'charged' || d.cancellation_fee_status === 'retained' || d.cancellation_fee_status === 'deposit_forfeited') {
        const amt = d.cancellation_fee_amount ?? 0;
        return { label: amt > 0 ? `Cancel fee €${amt.toFixed(2)}` : 'Cancellation fee', variant: 'destructive' };
    }
    return null;
}

export function BookingPaymentBadge({ booking }) {
    const badge = paymentBadge(booking);
    if (!badge) return null;
    return (
        <Badge variant={badge.variant} className="text-[10px] uppercase tracking-wide">
            {badge.label}
        </Badge>
    );
}

export function BookingPaymentActionButton({ booking, onSuccess }) {
    const d = booking.data || booking;
    const payMutation = useMutation({
        mutationFn: () => sovereign.paymentProtection.bookingCheckout(d.id),
        onSuccess: (res) => {
            if (res.url) window.location.href = res.url;
            else toast.success('Payment complete');
            onSuccess?.();
        },
        onError: (e) => toast.error(e.message),
    });

    const needsDeposit = d.deposit_payment_status === 'unpaid' && (d.deposit_amount ?? 0) > 0;
    const needsAuth =
        d.authorization_status === 'none' &&
        (d.authorization_amount ?? 0) > 0 &&
        d.payment_status !== 'authorized';
    const needsPay =
        d.payment_status === 'unpaid' &&
        d.payment_method !== 'cash_at_store' &&
        !needsDeposit &&
        !needsAuth;

    if (!needsDeposit && !needsAuth && !needsPay) return null;

    const label = needsDeposit
        ? `Pay deposit €${(d.deposit_amount ?? 0).toFixed(2)}`
        : needsAuth
          ? 'Authorize card'
          : 'Pay online';

    return (
        <Button
            size="sm"
            className="h-9 bg-violet-600 hover:bg-violet-700 text-white"
            disabled={payMutation.isPending}
            onClick={() => payMutation.mutate()}
        >
            {payMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <>
                    <CreditCard className="w-4 h-4 mr-1" />
                    {label}
                </>
            )}
        </Button>
    );
}

export function BookingCardOnFileHint({ booking }) {
    const d = booking.data || booking;
    if (d.saved_payment_method_id || d.payment_status === 'paid') return null;
    return (
        <p className="text-xs text-violet-700 flex items-center gap-1 mt-2">
            <Shield className="w-3.5 h-3.5" />
            Card on file may be required, complete payment to secure this slot.
        </p>
    );
}
