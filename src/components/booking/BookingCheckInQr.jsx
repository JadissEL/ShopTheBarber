import { useState } from 'react';

import { useQuery } from '@tanstack/react-query';

import { QRCodeSVG } from 'qrcode.react';

import { sovereign } from '@/api/apiClient';

import { Badge } from '@/components/ui/badge';

import { Button } from '@/components/ui/button';

import { CheckCircle2, Copy, QrCode } from 'lucide-react';

import { toast } from 'sonner';

import { cn } from '@/lib/utils';



function CheckInSkeleton({ compact }) {

    if (compact) {

        return <span className="inline-block h-4 w-20 rounded bg-muted animate-pulse" aria-hidden />;

    }

    return (

        <div className="rounded-xl border border-border bg-muted/30 p-4 animate-pulse" aria-busy="true" aria-label="Loading check-in code…">

            <div className="h-4 w-40 bg-muted rounded mb-3" />

            <div className="flex gap-4 items-center">

                <div className="w-[160px] h-[160px] bg-muted rounded-lg" />

                <div className="flex-1 space-y-2">

                    <div className="h-3 w-24 bg-muted rounded" />

                    <div className="h-8 w-full bg-muted rounded" />

                </div>

            </div>

        </div>

    );

}



async function copyText(text) {

    await navigator.clipboard.writeText(text);

    toast.success('Check-in code copied');

}



export default function BookingCheckInQr({ bookingId, compact = false, embedded = false, className }) {

    const [revealed, setRevealed] = useState(!embedded);

    const { data, isLoading, isError, refetch } = useQuery({

        queryKey: ['booking-check-in-qr', bookingId],

        queryFn: () => sovereign.bookings.getCheckInQr(bookingId),

        enabled: !!bookingId,

        staleTime: 60_000,

    });



    if (isLoading) return <CheckInSkeleton compact={compact} />;



    if (isError || !data?.qr_token) {

        if (compact) return null;

        return (

            <div className={cn('rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground', className)}>

                <p>Check-in code unavailable right now.</p>

                <Button type="button" variant="link" size="sm" className="px-0 h-auto" onClick={() => refetch()}>

                    Try again

                </Button>

            </div>

        );

    }



    if (data.checked_in) {

        return (

            <Badge variant="secondary" className="text-xs gap-1" role="status">

                <CheckCircle2 className="w-3 h-3" aria-hidden />

                Checked in

            </Badge>

        );

    }



    if (compact) {

        return (

            <button

                type="button"

                className="inline-flex items-center gap-1 text-xs text-muted-foreground font-mono truncate max-w-[160px] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded touch-manipulation"

                onClick={() => copyText(data.qr_token)}

                title="Copy check-in code"

                aria-label={`Copy check-in code ending in ${data.qr_token.slice(-8)}`}

            >

                <QrCode className="w-3 h-3 shrink-0" aria-hidden />

                {data.qr_token.slice(-8)}

            </button>

        );

    }



    if (embedded && !revealed) {

        return (

            <div className={cn('border-t border-border px-4 py-3 bg-muted/20', className)}>

                <Button

                    type="button"

                    variant="ghost"

                    size="sm"

                    className="w-full justify-start gap-2 h-9 text-muted-foreground hover:text-foreground"

                    onClick={() => setRevealed(true)}

                >

                    <QrCode className="w-4 h-4" aria-hidden />

                    Show Arrival Check-In QR

                </Button>

            </div>

        );

    }



    return (

        <div

            className={cn(

                embedded

                    ? 'border-t border-border px-4 py-4 bg-muted/20 space-y-3'

                    : 'rounded-xl border border-border bg-muted/40 p-4 space-y-3',

                className

            )}

            translate="no"

        >

            <div className="flex items-start justify-between gap-2">

                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">

                    <QrCode className="w-3.5 h-3.5 shrink-0" aria-hidden />

                    Show this QR code when you arrive

                </p>

                {embedded && (

                    <Button type="button" variant="ghost" size="sm" className="h-7 text-xs shrink-0" onClick={() => setRevealed(false)}>

                        Hide

                    </Button>

                )}

            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">

                <div className="rounded-lg border border-border bg-card p-2 shrink-0">

                    <QRCodeSVG

                        value={data.qr_token}

                        size={160}

                        level="M"

                        includeMargin={false}

                        aria-label="Booking check-in QR code"

                    />

                </div>

                <div className="min-w-0 w-full sm:flex-1 text-center sm:text-left space-y-2">

                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Backup code</p>

                    <p className="text-xs font-mono break-all select-all text-foreground bg-background border border-border rounded-lg px-3 py-2">

                        {data.qr_token}

                    </p>

                    <Button

                        type="button"

                        variant="outline"

                        size="sm"

                        className="rounded-lg gap-2 touch-manipulation"

                        onClick={() => copyText(data.qr_token)}

                    >

                        <Copy className="w-3.5 h-3.5" aria-hidden />

                        Copy Code

                    </Button>

                </div>

            </div>

        </div>

    );

}


