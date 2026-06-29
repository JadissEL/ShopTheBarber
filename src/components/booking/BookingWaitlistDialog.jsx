import { useState } from 'react';

import { useMutation } from '@tanstack/react-query';

import { format, parse } from 'date-fns';

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

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { toast } from 'sonner';

import { Calendar, Clock, ListOrdered, Scissors, CheckCircle2, Loader2 } from 'lucide-react';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

import { Link } from 'react-router-dom';

import { createPageUrl } from '@/utils';

import { formatMoney } from '@/lib/formatMoney';



function buildSlotStartIso(selectedDate, selectedTime) {

    if (!selectedDate) return null;

    try {

        const merged = new Date(selectedDate);

        if (selectedTime) {

            const timePart = parse(selectedTime, 'h:mm a', new Date());

            merged.setHours(timePart.getHours(), timePart.getMinutes(), 0, 0);

        } else {

            merged.setHours(9, 0, 0, 0);

        }

        return merged.toISOString();

    } catch {

        return selectedDate.toISOString?.() ?? null;

    }

}



function slotSummary(selectedDate, selectedTime) {

    if (!selectedDate) return 'this time';

    const datePart = format(selectedDate, 'EEE d MMM');

    if (!selectedTime) return `${datePart} (flexible time)`;

    return `${datePart} at ${selectedTime}`;

}



export default function BookingWaitlistDialog({

    open,

    onOpenChange,

    selectedDate,

    selectedTime,

    barberId,

    shopId,

    serviceId,

    serviceIds,

    barberName,

    barberImageUrl,

    serviceName,

    servicePrice,

    serviceDuration,

    onJoined,

}) {

    const [joinedEntry, setJoinedEntry] = useState(null);

    const reduceMotion = useReducedMotion();



    const joinMutation = useMutation({

        mutationFn: () => {

            const slotStart = buildSlotStartIso(selectedDate, selectedTime);

            if (!slotStart || !barberId) {

                throw new Error('Pick a date before joining the waitlist');

            }

            return sovereign.bookingWaitlist.join({

                barber_id: barberId,

                shop_id: shopId || undefined,

                service_id: serviceId || serviceIds?.[0] || undefined,

                service_ids: Array.isArray(serviceIds) && serviceIds.length > 0 ? serviceIds : undefined,

                slot_start: slotStart,

                preferred_time: selectedTime || undefined,

            });

        },

        onSuccess: (entry) => {

            setJoinedEntry(entry);

            onJoined?.(entry);

        },

        onError: (e) => toast.error(e.message),

    });



    const handleClose = (nextOpen) => {

        if (!nextOpen) setJoinedEntry(null);

        onOpenChange(nextOpen);

    };



    const slotLabel = slotSummary(selectedDate, selectedTime);

    const displayBarber = joinedEntry?.barber_name ?? barberName ?? 'Barber';

    const displayService = joinedEntry?.service_label ?? joinedEntry?.service_name ?? serviceName;

    const displayPrice = joinedEntry?.service_price ?? servicePrice;

    const displayPosition = joinedEntry?.position;

    const canJoin = Boolean(selectedDate && barberId);



    const motionProps = reduceMotion

        ? {}

        : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0 } };



    return (

        <Dialog open={open} onOpenChange={handleClose}>

            <DialogContent className="rounded-2xl max-w-md overflow-hidden overscroll-contain">

                <AnimatePresence mode="wait">

                    {joinedEntry ? (

                        <motion.div key="success" {...motionProps}>

                            <div className="text-center py-4" role="status" aria-live="polite">

                                <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">

                                    <CheckCircle2 className="w-8 h-8 text-green-600" aria-hidden />

                                </div>

                                <DialogHeader className="text-center sm:text-center">

                                    <DialogTitle className="text-balance">You&apos;re on the list</DialogTitle>

                                    <DialogDescription className="text-center">

                                        Position <strong>#{displayPosition ?? '—'}</strong> for {slotLabel}.

                                        We&apos;ll notify you instantly if the slot opens — you&apos;ll have 15 minutes to accept.

                                    </DialogDescription>

                                </DialogHeader>

                            </div>

                            <DialogFooter className="flex-col sm:flex-col gap-2 mt-2">

                                <Button asChild className="w-full rounded-xl">

                                    <Link to={`${createPageUrl('UserBookings')}?tab=waitlist`} onClick={() => handleClose(false)}>

                                        View My Waitlists

                                    </Link>

                                </Button>

                                <Button variant="outline" className="w-full rounded-xl" onClick={() => handleClose(false)}>

                                    Choose Another Time

                                </Button>

                            </DialogFooter>

                        </motion.div>

                    ) : (

                        <motion.div key="form" {...(reduceMotion ? {} : { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } })}>

                            <DialogHeader>

                                <DialogTitle className="text-balance">

                                    {selectedTime ? 'This Slot Is Full' : 'Join the Waitlist'}

                                </DialogTitle>

                                <DialogDescription>

                                    Get first dibs if someone cancels. You&apos;ll have 15 minutes to book when your turn comes.

                                </DialogDescription>

                            </DialogHeader>



                            {!canJoin && (

                                <p className="text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 rounded-xl px-3 py-2 my-3">

                                    Select a date first, then join the waitlist.

                                </p>

                            )}



                            <div className="rounded-xl border border-border bg-muted/40 p-4 my-4 space-y-3">

                                <div className="flex items-center gap-3 min-w-0">

                                    <Avatar className="h-11 w-11 border border-border shrink-0">

                                        <AvatarImage src={barberImageUrl} alt="" />

                                        <AvatarFallback>{displayBarber.slice(0, 2).toUpperCase()}</AvatarFallback>

                                    </Avatar>

                                    <div className="min-w-0">

                                        <p className="font-semibold text-sm truncate">{displayBarber}</p>

                                        {displayService && (

                                            <p className="text-sm text-muted-foreground flex items-center gap-1 min-w-0">

                                                <Scissors className="w-3.5 h-3.5 shrink-0" aria-hidden />

                                                <span className="truncate">{displayService}</span>

                                                {displayPrice != null && (

                                                    <span className="font-medium text-foreground ml-1 shrink-0 tabular-nums">

                                                        · {formatMoney(displayPrice)}

                                                    </span>

                                                )}

                                            </p>

                                        )}

                                    </div>

                                </div>

                                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground pt-1 border-t border-border/60">

                                    <span className="inline-flex items-center gap-1">

                                        <Calendar className="w-3.5 h-3.5 shrink-0" aria-hidden />

                                        {slotLabel}

                                    </span>

                                    {serviceDuration != null && (

                                        <span className="inline-flex items-center gap-1 tabular-nums">

                                            <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden />

                                            {serviceDuration} min

                                        </span>

                                    )}

                                </div>

                            </div>



                            <ul className="text-xs text-muted-foreground space-y-1.5 mb-4 px-1">

                                <li className="flex items-start gap-2">

                                    <ListOrdered className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden />

                                    First in queue gets a 15-minute window to book when a slot opens

                                </li>

                                <li className="flex items-start gap-2">

                                    <Clock className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden />

                                    Leave the waitlist anytime before an offer arrives

                                </li>

                            </ul>



                            <DialogFooter className="gap-2 sm:gap-0">

                                <Button variant="outline" onClick={() => handleClose(false)} className="rounded-xl">

                                    Pick Another Time

                                </Button>

                                <Button

                                    onClick={() => joinMutation.mutate()}

                                    disabled={joinMutation.isPending || !canJoin}

                                    className="rounded-xl min-w-[132px]"

                                >

                                    {joinMutation.isPending ? (

                                        <>

                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden />

                                            Joining…

                                        </>

                                    ) : (

                                        'Join Waitlist'

                                    )}

                                </Button>

                            </DialogFooter>

                        </motion.div>

                    )}

                </AnimatePresence>

            </DialogContent>

        </Dialog>

    );

}


