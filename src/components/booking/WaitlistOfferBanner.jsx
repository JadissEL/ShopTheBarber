import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sovereign } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Scissors, Zap, ListOrdered, Clock, X } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { createPageUrl } from '@/utils';
import { useOfferCountdown } from '@/hooks/useOfferCountdown';
import { WAITLIST_OFFER_MS } from '@/lib/waitlistConstants';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { formatMoney } from '@/lib/formatMoney';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

function formatSlot(iso) {
    if (!iso) return 'Flexible timing';
    try {
        return format(parseISO(iso), 'EEE d MMM · h:mm a');
    } catch {
        return iso;
    }
}

function OfferCountdownRing({ progress, label }) {
    const radius = 18;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - progress);

    return (
        <div className="relative w-12 h-12 shrink-0" aria-label={`${label} remaining`}>
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 44 44">
                <circle cx="22" cy="22" r={radius} fill="none" stroke="currentColor" strokeWidth="3" className="text-amber-200 dark:text-amber-900" />
                <circle
                    cx="22" cy="22" r={radius} fill="none" stroke="currentColor" strokeWidth="3"
                    strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
                    className="text-amber-500 transition-[stroke-dashoffset] duration-1000 linear"
                />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold tabular-nums text-amber-700 dark:text-amber-300">
                {label}
            </span>
        </div>
    );
}

async function completeWaitlistAccept(booking) {
    const d = booking?.data || booking;
    if (!d?.id) throw new Error('Booking was not created');

    try {
        const checkout = await sovereign.paymentProtection.bookingCheckout(d.id);
        if (checkout?.url) {
            toast.success('Slot secured — complete payment to confirm');
            window.location.href = checkout.url;
            return true;
        }
    } catch (e) {
        const msg = e?.message || '';
        if (!/no payment|not required|none/i.test(msg)) {
            toast.error(msg || 'Booking created but payment setup failed');
        }
    }

    toast.success('Slot secured — see it in Upcoming');
    return false;
}

export function WaitlistOfferCard({ offer }) {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const reduceMotion = useReducedMotion();
    const { progress, label, expired } = useOfferCountdown(offer.offer_expires_at, WAITLIST_OFFER_MS);

    const acceptMutation = useMutation({
        mutationFn: () => sovereign.bookingWaitlist.acceptOffer(offer.id, {}),
        onSuccess: async (booking) => {
            queryClient.invalidateQueries({ queryKey: ['waitlist-my-offers'] });
            queryClient.invalidateQueries({ queryKey: ['waitlist-my-entries'] });
            queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
            const redirected = await completeWaitlistAccept(booking);
            if (!redirected) navigate(createPageUrl('UserBookings'));
        },
        onError: (e) => toast.error(e.message),
    });

    if (expired) return null;

    const barberName = offer.barber_name ?? 'Barber';
    const serviceName = offer.waitlist_entry?.service_label ?? offer.service_name;
    const price = offer.service_price;
    const imageUrl = offer.barber_image_url;

    const motionProps = reduceMotion
        ? {}
        : { layout: true, initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, scale: 0.98 } };

    return (
        <motion.div
            {...motionProps}
            className="rounded-2xl border-2 border-amber-400/50 bg-gradient-to-br from-amber-50 via-orange-50/80 to-background dark:from-amber-950/40 dark:via-orange-950/20 dark:to-background p-4 sm:p-5 shadow-sm"
            role="alert"
        >
            <div className="flex gap-4 items-start">
                <OfferCountdownRing progress={progress} label={label} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <Zap className="w-4 h-4 text-amber-600 shrink-0" />
                        <p className="font-semibold text-sm text-amber-900 dark:text-amber-100">Slot opened — accept now</p>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                        <Avatar className="h-10 w-10 border border-border">
                            <AvatarImage src={imageUrl} alt={barberName} />
                            <AvatarFallback>{barberName.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate">{barberName}</p>
                            {serviceName && (
                                <p className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                                    <Scissors className="w-3.5 h-3.5 shrink-0" />
                                    {serviceName}
                                    {price != null && <span className="text-foreground font-medium ml-1">· {formatMoney(price)}</span>}
                                </p>
                            )}
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatSlot(offer.slot_start)}
                    </p>
                </div>
                <Button
                    size="sm"
                    className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl h-10 px-4 touch-manipulation focus-visible:ring-2 focus-visible:ring-amber-400"
                    disabled={acceptMutation.isPending}
                    onClick={() => acceptMutation.mutate()}
                >
                    {acceptMutation.isPending ? 'Booking…' : 'Accept & Book'}
                </Button>
            </div>
        </motion.div>
    );
}

function WaitlistEntryCard({ entry, onLeave, leaving }) {
    const isOffered = entry.status === 'offered';
    const serviceLabel = entry.service_label ?? entry.service_name;

    return (
        <div className={`rounded-xl border p-4 ${isOffered ? 'border-amber-300/60 bg-amber-50/50 dark:bg-amber-950/10' : 'border-border bg-card'}`}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3 min-w-0">
                    <Avatar className="h-9 w-9 shrink-0 border border-border">
                        <AvatarImage src={entry.barber_image_url} alt="" />
                        <AvatarFallback>{(entry.barber_name ?? 'B').slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-sm truncate">{entry.barber_name ?? 'Barber'}</p>
                            <StatusBadge status={entry.status} className="capitalize text-[10px]" />
                        </div>
                        {serviceLabel && (
                            <p className="text-sm text-muted-foreground mt-0.5 truncate">
                                {serviceLabel}
                                {entry.service_price != null && ` · ${formatMoney(entry.service_price)}`}
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatSlot(entry.slot_start)}
                        </p>
                        {entry.position != null && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <ListOrdered className="w-3 h-3" />
                                Position #{entry.position} in queue
                                {isOffered && ' · offer sent to you'}
                            </p>
                        )}
                    </div>
                </div>
                {!isOffered && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                        disabled={leaving}
                        onClick={() => onLeave(entry.id)}
                        aria-label="Leave waitlist"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}

/** Urgent offers — show above tabs on My Bookings */
export default function WaitlistOfferBanner({ className = '' }) {
    const { data, isLoading } = useQuery({
        queryKey: ['waitlist-my-offers'],
        queryFn: () => sovereign.bookingWaitlist.getMyOffers(),
        refetchInterval: 15_000,
    });

    const offers = data?.offers ?? [];
    const activeOffers = offers.filter((o) => o.status === 'pending');

    if (isLoading || activeOffers.length === 0) return null;

    return (
        <div className={`space-y-3 mb-6 ${className}`}>
            <AnimatePresence mode="popLayout">
                {activeOffers.map((offer) => (
                    <WaitlistOfferCard key={offer.id} offer={offer} />
                ))}
            </AnimatePresence>
        </div>
    );
}

/** Full waitlist management panel for the Waitlist tab */
export function MyWaitlistPanel() {
    const queryClient = useQueryClient();
    const [leaveTarget, setLeaveTarget] = useState(null);

    const { data: offersData, isLoading: offersLoading } = useQuery({
        queryKey: ['waitlist-my-offers'],
        queryFn: () => sovereign.bookingWaitlist.getMyOffers(),
        refetchInterval: 15_000,
    });

    const { data: entriesData, isLoading: entriesLoading } = useQuery({
        queryKey: ['waitlist-my-entries'],
        queryFn: () => sovereign.bookingWaitlist.getMyEntries(),
        refetchInterval: 30_000,
    });

    const leaveMutation = useMutation({
        mutationFn: (entryId) => sovereign.bookingWaitlist.leave(entryId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['waitlist-my-entries'] });
            queryClient.invalidateQueries({ queryKey: ['waitlist-my-offers'] });
            toast.success('Removed from waitlist');
            setLeaveTarget(null);
        },
        onError: (e) => toast.error(e.message),
    });

    const offers = offersData?.offers ?? [];
    const entries = entriesData?.entries ?? [];
    const isLoading = offersLoading || entriesLoading;

    if (isLoading) {
        return <div className="text-center py-16 text-muted-foreground text-sm">Loading your waitlists…</div>;
    }

    const hasOffers = offers.some((o) => o.status === 'pending');
    const hasEntries = entries.length > 0;

    if (!hasOffers && !hasEntries) {
        return (
            <EmptyState
                icon={ListOrdered}
                title="No active waitlists"
                description="When a slot is full during booking, you can join the queue and we'll notify you if it opens."
            />
        );
    }

    return (
        <div className="space-y-8">
            {hasOffers && (
                <section aria-labelledby="waitlist-action-required">
                    <h2 id="waitlist-action-required" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                        Action Required
                    </h2>
                    <div className="space-y-3">
                        <AnimatePresence mode="popLayout">
                            {offers.filter((o) => o.status === 'pending').map((offer) => (
                                <WaitlistOfferCard key={offer.id} offer={offer} />
                            ))}
                        </AnimatePresence>
                    </div>
                </section>
            )}

            {hasEntries && (
                <section aria-labelledby="waitlist-queues">
                    <h2 id="waitlist-queues" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                        Your Queues ({entries.length})
                    </h2>
                    <div className="space-y-3">
                        {entries.map((entry) => (
                            <WaitlistEntryCard
                                key={entry.id}
                                entry={entry}
                                leaving={leaveMutation.isPending}
                                onLeave={(id) => setLeaveTarget(id)}
                            />
                        ))}
                    </div>
                </section>
            )}

            <Dialog open={Boolean(leaveTarget)} onOpenChange={(open) => !open && setLeaveTarget(null)}>
                <DialogContent className="rounded-2xl max-w-sm overscroll-contain">
                    <DialogHeader>
                        <DialogTitle>Leave Waitlist?</DialogTitle>
                        <DialogDescription>
                            You&apos;ll lose your queue position for this slot. You can rejoin later if it&apos;s still full.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setLeaveTarget(null)}>
                            Stay on List
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={leaveMutation.isPending}
                            onClick={() => leaveTarget && leaveMutation.mutate(leaveTarget)}
                        >
                            {leaveMutation.isPending ? 'Leaving…' : 'Leave Waitlist'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
