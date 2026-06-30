import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Loader2, User } from 'lucide-react';
import { toast } from 'sonner';
import QrScannerPanel from '@/components/booking/QrScannerPanel';

function formatBookingWhen(booking) {
    if (!booking?.start_time) return null;
    try {
        return format(parseISO(booking.start_time), 'EEE d MMM · h:mm a');
    } catch {
        return booking.time_text || null;
    }
}

export default function ProviderCheckInDialog({ booking, open, onOpenChange }) {
    const queryClient = useQueryClient();
    const [qrToken, setQrToken] = useState('');
    const [showScanner, setShowScanner] = useState(false);

    useEffect(() => {
        if (!open) {
            setQrToken('');
            setShowScanner(false);
        }
    }, [open]);

    const checkInMutation = useMutation({
        mutationFn: () =>
            sovereign.bookings.checkIn(booking.id, {
                qr_token: qrToken.trim(),
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['provider-bookings'] });
            toast.success('Client checked in');
            setQrToken('');
            setShowScanner(false);
            onOpenChange(false);
        },
        onError: (e) => toast.error(e.message),
    });

    if (!booking) return null;

    const whenLabel = formatBookingWhen(booking);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className=" max-w-md overscroll-contain max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Check In Client</DialogTitle>
                    <DialogDescription>
                        Scan the client&apos;s QR code or paste their check-in code below.
                    </DialogDescription>
                </DialogHeader>

                <div className=" border border-border bg-muted/30 p-3 text-sm space-y-1">
                    <p className="font-medium flex items-center gap-2 min-w-0">
                        <User className="w-4 h-4 shrink-0 text-muted-foreground" aria-hidden />
                        <span className="truncate">{booking.client_name || booking.guest_name || 'Client'}</span>
                    </p>
                    {booking.service_name && (
                        <p className="text-muted-foreground truncate">{booking.service_name}</p>
                    )}
                    {whenLabel && (
                        <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                            <Calendar className="w-3.5 h-3.5 shrink-0" aria-hidden />
                            {whenLabel}
                        </p>
                    )}
                </div>

                {showScanner ? (
                    <QrScannerPanel
                        onScan={(code) => {
                            setQrToken(code);
                            setShowScanner(false);
                            toast.success('QR code captured');
                        }}
                    />
                ) : (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full touch-manipulation"
                        onClick={() => setShowScanner(true)}
                    >
                        Open Camera Scanner
                    </Button>
                )}

                <div className="space-y-2 py-1">
                    <Label htmlFor="qr-token">Check-in code</Label>
                    <Input
                        id="qr-token"
                        name="check_in_code"
                        placeholder="stb-ci-…"
                        value={qrToken}
                        onChange={(e) => setQrToken(e.target.value)}
                        className="font-mono text-sm"
                        autoComplete="off"
                        spellCheck={false}
                        inputMode="text"
                    />
                    <p className="text-xs text-muted-foreground">
                        Client path: My Bookings → Show Arrival Check-In QR
                    </p>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        disabled={!qrToken.trim() || checkInMutation.isPending}
                        onClick={() => checkInMutation.mutate()}
                    >
                        {checkInMutation.isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden />
                                Checking In…
                            </>
                        ) : (
                            'Confirm Check-In'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
