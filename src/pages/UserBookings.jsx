import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { sovereign } from '@/api/apiClient';
import { MetaTags } from '@/components/seo/MetaTags';
import { Button } from '@/components/ui/button';
import BookingCard from '@/components/ui/booking-card';
import { GroupBookingGuestPanel } from '@/components/booking/GroupBookingGuestPanel';
import { BookingPaymentActionButton, BookingCardOnFileHint } from '@/components/payments/BookingPaymentActions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, AlertCircle, Star, CheckCircle2, MessageSquare, Heart } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { isPast, isFuture } from 'date-fns';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import RebookButton from '@/components/booking/RebookButton';
import PageHeader from '@/components/layout/PageHeader';
import PageContent from '@/components/layout/PageContent';
import CancelBookingDialog from '@/components/payments/CancelBookingDialog';
import BookingCheckInQr from '@/components/booking/BookingCheckInQr';
import WaitlistOfferBanner, { MyWaitlistPanel } from '@/components/booking/WaitlistOfferBanner';
export default function UserBookings() {
    const queryClient = useQueryClient();
    const [searchParams] = useSearchParams();
    const initialTab = ['past', 'waitlist'].includes(searchParams.get('tab'))
        ? searchParams.get('tab')
        : 'upcoming';
    const [activeTab, setActiveTab] = useState(initialTab);
    const [cancelTargetId, setCancelTargetId] = useState(null);

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && ['upcoming', 'past', 'waitlist'].includes(tab) && tab !== activeTab) {
            setActiveTab(tab);
        }
    }, [searchParams, activeTab]);

    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => sovereign.auth.me()
    });

    const { data: bookings = [], isFetching: _isFetching } = useQuery({
        queryKey: ['my-bookings', user?.id],
        queryFn: async () => {
            if (!user) return [];
            // Support both client_id and legacy created_by filters
            const results = await sovereign.entities.Booking.filter({ client_id: user.id });
            if (results.length === 0) {
                // Fallback for older bookings
                return await sovereign.entities.Booking.filter({ created_by: user.email });
            }
            return results;
        },
        enabled: !!user,
        initialData: []
    });

    const upcomingBookings = bookings.filter(b =>
        (b.status === 'confirmed' || b.status === 'pending') &&
        isFuture(new Date(b.start_time || b.date_text))
    ).sort((a, b) => new Date(a.start_time || a.date_text) - new Date(b.start_time || b.date_text));

    const pastBookings = bookings.filter(b =>
        b.status === 'completed' ||
        (b.status === 'confirmed' && isPast(new Date(b.start_time || b.date_text))) ||
        b.status === 'cancelled' ||
        b.status === 'no_show'
    ).sort((a, b) => new Date(b.start_time || b.date_text) - new Date(a.start_time || a.date_text));

    const completedBookingIds = pastBookings
        .filter((b) => b.status === 'completed')
        .map((b) => b.id);

    const { data: reviewStatusMap = {} } = useQuery({
        queryKey: ['booking-review-statuses', completedBookingIds.join(',')],
        queryFn: async () => {
            const map = {};
            await Promise.all(
                completedBookingIds.map(async (id) => {
                    try {
                        map[id] = await sovereign.reviews.getBookingStatus(id);
                    } catch {
                        map[id] = null;
                    }
                })
            );
            return map;
        },
        enabled: completedBookingIds.length > 0 && !!user,
    });

    const { data: tipStatusMap = {} } = useQuery({
        queryKey: ['booking-tip-statuses', completedBookingIds.join(',')],
        queryFn: async () => {
            const map = {};
            await Promise.all(
                completedBookingIds.map(async (id) => {
                    try {
                        map[id] = await sovereign.tips.getBookingStatus(id);
                    } catch {
                        map[id] = null;
                    }
                })
            );
            return map;
        },
        enabled: completedBookingIds.length > 0 && !!user,
    });

    const { data: waitlistEntriesData } = useQuery({
        queryKey: ['waitlist-my-entries'],
        queryFn: () => sovereign.bookingWaitlist.getMyEntries(),
        enabled: !!user,
    });
    const waitlistCount = waitlistEntriesData?.entries?.length ?? 0;

    const { data: waitlistOffersData } = useQuery({
        queryKey: ['waitlist-my-offers'],
        queryFn: () => sovereign.bookingWaitlist.getMyOffers(),
        enabled: !!user,
        refetchInterval: 30_000,
    });
    const urgentOfferCount = (waitlistOffersData?.offers ?? []).filter((o) => o.status === 'pending').length;

    const handleCancel = (bookingId) => {
        setCancelTargetId(bookingId);
    };

    const handleCancelledFromDialog = (result) => {
        queryClient.invalidateQueries(['my-bookings']);
        let msg = 'Appointment cancelled';
        if (result?.refund_amount > 0) {
            msg += `, €${result.refund_amount.toFixed(2)} refund processing`;
        }
        if (result?.fee_amount > 0) {
            msg += result.refund_amount > 0
                ? ` (€${result.fee_amount.toFixed(2)} fee retained)`
                : `, €${result.fee_amount.toFixed(2)} cancellation fee applied`;
        }
        toast.success(msg);
        setCancelTargetId(null);
    };

    return (
        <div className="stb-page lg:pb-8">
            <MetaTags
                title="My Bookings"
                description="Manage your grooming appointments and history."
            />

            <PageHeader
                label="Appointments"
                title="My Bookings"
                subtitle="View and manage your upcoming and past appointments."
                compact
            />

            <PageContent narrow>
                {activeTab !== 'waitlist' && <WaitlistOfferBanner />}
                <Tabs value={activeTab} className="w-full" onValueChange={setActiveTab}>
                    <TabsList className="bg-muted border border-border p-1 mb-8">
                        <TabsTrigger value="upcoming" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            Upcoming ({upcomingBookings.length})
                        </TabsTrigger>
                        <TabsTrigger value="waitlist" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground relative">
                            Waitlist ({waitlistCount})
                            {urgentOfferCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-background" />
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="past" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            History ({pastBookings.length})
                        </TabsTrigger>
                    </TabsList>

                    <AnimatePresence mode="wait">
                        <TabsContent value="upcoming" key="upcoming">
                            {upcomingBookings.length > 0 ? (
                                <div className="space-y-4">
                                    {upcomingBookings.map((booking) => {
                                      const isGroup = booking.is_group || booking.booking_type === 'group';
                                      return (
                                        <div key={booking.id} className="relative group rounded-2xl border border-border overflow-hidden bg-card hover:border-primary/30 transition-colors">
                                            <BookingCard
                                                booking={booking}
                                                variant="default"
                                                className="border-0 shadow-none rounded-none"
                                                actions={
                                                    <div className="flex gap-2 flex-wrap justify-end">
                                                        <BookingPaymentActionButton
                                                            booking={booking}
                                                            onSuccess={() => queryClient.invalidateQueries(['my-bookings'])}
                                                        />
                                                        <Link to={createPageUrl(`Chat?booking=${booking.id}`)}>
                                                            <Button size="sm" variant="outline" className="h-9 rounded-xl">
                                                                <MessageSquare className="w-4 h-4 mr-1" />
                                                                Message
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="border-border text-muted-foreground hover:text-foreground hover:bg-muted h-9"
                                                            onClick={() => handleCancel(booking.id)}
                                                        >
                                                            Cancel
                                                        </Button>
                                                        <Link to={createPageUrl(`BarberProfile?id=${booking.barber_id}`)}>
                                                            <Button size="sm" className="bg-primary text-primary-foreground hover:opacity-95 h-9">
                                                                View Detail
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                }
                                            />
                                            <BookingCheckInQr bookingId={booking.id} embedded />
                                            {isGroup && (
                                              <div className="px-4 pb-3 border-t border-border/60">
                                                <GroupBookingGuestPanel
                                                  bookingId={booking.id}
                                                  partySize={booking.party_size}
                                                  eventLabel={booking.group_event_label}
                                                />
                                              </div>
                                            )}
                                            <BookingCardOnFileHint booking={booking} />
                                            {booking.status === 'pending' && (
                                                <div className="absolute -top-2 -left-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg">
                                                    <AlertCircle className="w-3 h-3" /> PENDING CONFIRMATION
                                                </div>
                                            )}
                                        </div>
                                      );
                                    })}
                                </div>
                            ) : (
                                <EmptyState
                                    icon={Calendar}
                                    title="No upcoming appointments"
                                    description="Looks like you haven't booked anything yet."
                                    actionLabel="Find a Barber"
                                    actionHref={createPageUrl('Explore')}
                                />
                            )}
                        </TabsContent>

                        <TabsContent value="waitlist" key="waitlist">
                            <MyWaitlistPanel />
                        </TabsContent>

                        <TabsContent value="past" key="past">
                            {pastBookings.length > 0 ? (
                                <div className="space-y-4">
                                    {pastBookings.map((booking) => (
                                        <BookingCard
                                            key={booking.id}
                                            booking={booking}
                                            variant="default"
                                            className="bg-card border border-border hover:border-primary/20 opacity-80"
                                            actions={
                                                <div className="flex gap-2">
                                                    {booking.status === 'completed' && tipStatusMap[booking.id]?.can_tip && (
                                                        <Link to={createPageUrl(`Review?bookingId=${booking.id}`)}>
                                                            <Button variant="outline" size="sm" className="border-amber-300/50 text-amber-700 hover:bg-amber-50 h-9">
                                                                <Heart className="w-4 h-4 mr-1" /> Leave tip
                                                            </Button>
                                                        </Link>
                                                    )}
                                                    {booking.status === 'completed' && tipStatusMap[booking.id]?.already_tipped && (
                                                        <Button variant="outline" size="sm" disabled className="h-9 opacity-70">
                                                            <Heart className="w-4 h-4 mr-1 text-green-600" /> Tipped
                                                        </Button>
                                                    )}
                                                    {booking.status === 'completed' && (
                                                        reviewStatusMap[booking.id]?.all_done ? (
                                                            <Button variant="outline" size="sm" disabled className="h-9 opacity-70">
                                                                <CheckCircle2 className="w-4 h-4 mr-1 text-green-600" /> Reviewed
                                                            </Button>
                                                        ) : (
                                                            <Link to={createPageUrl(`Review?bookingId=${booking.id}`)}>
                                                                <Button variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/10 h-9">
                                                                    <Star className="w-4 h-4 mr-1" /> Review
                                                                </Button>
                                                            </Link>
                                                        )
                                                    )}
                                                    <RebookButton
                                                        booking={booking}
                                                        variant="default"
                                                        className="h-9 rounded-xl"
                                                    />
                                                </div>
                                            }
                                        />
                                    ))}
                                </div>
                            ) : (
                                <EmptyState
                                    icon={Clock}
                                    title="No past appointments"
                                    description="Your appointment history will appear here once you complete a visit."
                                />
                            )}
                        </TabsContent>
                    </AnimatePresence>
                </Tabs>
            </PageContent>

            <CancelBookingDialog
                bookingId={cancelTargetId}
                open={!!cancelTargetId}
                onOpenChange={(open) => !open && setCancelTargetId(null)}
                onCancelled={handleCancelledFromDialog}
            />
        </div>
    );
}
