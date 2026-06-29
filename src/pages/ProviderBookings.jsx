import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, Calendar as CalendarIcon, CheckCircle2, XCircle, AlertCircle, AlertTriangle, Check, X, MessageSquare } from 'lucide-react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useDebounce } from '@/components/hooks/use-debounce';
import { MetaTags } from '@/components/seo/MetaTags';
import { motion, AnimatePresence } from 'framer-motion';
import BookingCard from '@/components/ui/booking-card';
import { GroupBookingGuestPanel } from '@/components/booking/GroupBookingGuestPanel';
import { toast } from 'sonner';
import { sendNotification } from '@/components/notifications/notificationUtils';
import ProviderWaitlistPanel from '@/components/booking/ProviderWaitlistPanel';
import ProviderCheckInDialog from '@/components/booking/ProviderCheckInDialog';
import { sendBookingConfirmationEmail, sendCancellationEmail } from '@/functions/sendBookingConfirmationEmail';

export default function ProviderBookings() {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [checkInBooking, setCheckInBooking] = useState(null);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const pageSize = 10;
  const queryClient = useQueryClient();

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => sovereign.auth.me() });

  const { data: myBarber } = useQuery({
    queryKey: ['provider-bookings-barber', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const barbers = await sovereign.entities.Barber.filter({ user_id: user.id });
      return barbers[0] ?? null;
    },
    enabled: !!user?.id,
  });

  const { data: waitlistQueueData, isLoading: waitlistLoading } = useQuery({
    queryKey: ['barber-waitlist-queue', myBarber?.id],
    queryFn: () => sovereign.bookingWaitlist.getBarberQueue(myBarber.id),
    enabled: activeTab === 'waitlist' && !!myBarber?.id,
  });
  const waitlistQueue = Array.isArray(waitlistQueueData)
    ? waitlistQueueData
    : waitlistQueueData?.entries ?? [];

  const getQuery = () => {
      const query = {};
      if (activeTab === 'upcoming') query.status = { $nin: ['completed', 'cancelled', 'no_show'] };
      if (activeTab === 'completed') query.status = 'completed';
      if (activeTab === 'cancelled') query.status = 'cancelled';
      if (activeTab === 'no_show') query.status = 'no_show';
      if (activeTab === 'waitlist') return null; // Special handling for waitlist
      
      if (debouncedSearch) {
          query.service_name = { $regex: debouncedSearch, $options: 'i' };
      }
      return query;
  };
  
  const { data: bookings = [], isFetching } = useQuery({
    queryKey: ['provider-bookings', activeTab, page, debouncedSearch],
    queryFn: () => {
      if (activeTab === 'waitlist') return Promise.resolve([]);
      return sovereign.entities.Booking.filter(getQuery(), '-start_time', pageSize, (page - 1) * pageSize);
    },
    enabled: activeTab !== 'waitlist',
    keepPreviousData: true,
    placeholderData: (prev) => prev,
  });
  
  useEffect(() => {
    if (bookings.length === pageSize) {
      queryClient.prefetchQuery({
        queryKey: ['provider-bookings', activeTab, page + 1, debouncedSearch],
        queryFn: () => sovereign.entities.Booking.filter(getQuery(), '-start_time', pageSize, page * pageSize),
      });
    }
  }, [bookings, page, debouncedSearch, activeTab, queryClient]);

  const updateStatusMutation = useMutation({
      mutationFn: async ({ id, status, booking }) => {
          if (status === 'confirmed') {
              return sovereign.providerWallet.confirmBooking(id);
          }
          if (status === 'completed') {
              if (booking?.authorization_status === 'authorized') {
                  await sovereign.paymentProtection.captureAuthorization(id);
              }
              return sovereign.entities.Booking.update(id, { status: 'completed' });
          }
          if (status === 'cancelled') {
              if (booking?.authorization_status === 'authorized') {
                  await sovereign.paymentProtection.releaseAuthorization(id).catch(() => null);
              }
              try {
                  return await sovereign.paymentProtection.cancelBooking(id);
              } catch {
                  return sovereign.providerWallet.cancelBooking(id);
              }
          }
          const updated = await sovereign.entities.Booking.update(id, { status });

          if (status === 'confirmed' && booking) {
              await sendBookingConfirmationEmail(booking);
          }

          if (status === 'cancelled' && booking) {
              await sendCancellationEmail(booking, 'barber');
          }

          return updated;
      },
      onSuccess: async (data, variables) => {
          queryClient.invalidateQueries(['provider-bookings']);
          queryClient.invalidateQueries({ queryKey: ['provider-fee-wallet'] });
          toast.success(`Booking ${variables.status.toLowerCase()}`);
          // variables.client_id should be passed or fetched. 
          // For now, assuming we have client_id in the booking object we acted upon, 
          // but react-query mutation variables usually only have input.
          // We can fetch the booking first or pass user info.
          
          // Simplified: We'll assume we can notify if we have a client_id.
          if (variables.booking && variables.booking.client_id) {
             const title = variables.status === 'confirmed' ? 'Booking Confirmed' : 'Booking Cancelled';
             const msg = variables.status === 'confirmed' 
                ? `Your appointment for ${variables.booking.service_name} has been confirmed.`
                : `Your appointment for ${variables.booking.service_name} was cancelled/declined.`;
             
             await sendNotification({
                 userId: variables.booking.client_id,
                 title,
                 message: msg,
                 type: variables.status === 'confirmed' ? 'booking_confirmed' : 'booking_cancelled',
                 link: `/bookingdetails?id=${variables.booking.id}`,
                 relatedEntityId: variables.booking.id
                 });
          }

          if (variables.status === 'completed' && variables.booking?.client_id) {
             await sendNotification({
                 userId: variables.booking.client_id,
                 title: 'How was your visit?',
                 message: `Thanks for visiting! Leave a quick review for ${variables.booking.barber_name || 'your barber'}.`,
                 type: 'review_request',
                 link: `/Review?bookingId=${variables.booking.id}`,
                 relatedEntityId: variables.booking.id
             });
          }
                 },
      onError: () => toast.error("Failed to update status")
  });

  const noShowMutation = useMutation({
      mutationFn: (bookingId) => sovereign.paymentProtection.markNoShow(bookingId),
      onSuccess: (data) => {
          queryClient.invalidateQueries(['provider-bookings']);
          const feeMsg = data.fee_amount > 0
              ? data.charge?.charged
                  ? ` No-show fee €${data.fee_amount.toFixed(2)} charged.`
                  : ` Fee €${data.fee_amount.toFixed(2)}, ${data.charge?.error || 'charge pending'}.`
              : '';
          toast.success(`Marked as no-show.${feeMsg}`);
      },
      onError: (e) => toast.error(e.message || 'Failed to mark no-show'),
  });

  const retryNoShowMutation = useMutation({
      mutationFn: (bookingId) => sovereign.paymentProtection.retryNoShowFee(bookingId),
      onSuccess: () => {
          queryClient.invalidateQueries(['provider-bookings']);
          toast.success('No-show fee retry submitted');
      },
      onError: (e) => toast.error(e.message),
  });

  const handleTabChange = (tab) => {
      setActiveTab(tab);
      setPage(1);
  };

  const _statusColors = {
      Confirmed: "bg-primary/10 text-primary border-primary/20",
      Pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      Completed: "bg-primary/10 text-primary border-primary/20",
      Cancelled: "bg-red-500/10 text-red-400 border-red-500/20"
  };

  const _StatusIcon = ({ status }) => {
      if (status === 'Confirmed') return <CheckCircle2 className="w-4 h-4" />;
      if (status === 'Cancelled') return <XCircle className="w-4 h-4" />;
      if (status === 'Pending') return <AlertCircle className="w-4 h-4" />;
      return <CheckCircle2 className="w-4 h-4" />;
  };

  return (
    <div className="stb-page font-sans pb-12">
      <MetaTags 
        title="Manage Bookings" 
        description="View and manage client appointments." 
      />
      
      {/* Header */}
      <div className="border-b border-border bg-card sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 flex justify-between items-center">
              <div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Bookings</h1>
                  <p className="text-sm text-muted-foreground mt-1">Manage all client appointments</p>
              </div>
              <Button className="bg-primary text-primary-foreground hover:opacity-95 border-none h-10 rounded-xl">
                  + Create Appointment
              </Button>
          </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
        
        {/* Legacy Data Warning */}
        {bookings.some(b => !b.context_type) && (
            <div className="mb-6 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <span className="text-amber-800 text-sm">Some bookings are missing context data.</span>
                </div>
                <Link to={createPageUrl('ProviderSettings')}>
                    <Button size="sm" variant="outline" className="border-amber-500/30 text-amber-700 hover:bg-amber-500/10">
                        Settings
                    </Button>
                </Link>
            </div>
        )}

        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
            <div className="flex bg-muted p-1 rounded-xl border border-border">
                {['upcoming', 'completed', 'no_show', 'cancelled', 'waitlist'].map((tab) => (
                    <button 
                        key={tab}
                        onClick={() => handleTabChange(tab)}
                        className={`px-6 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                            activeTab === tab 
                            ? 'bg-primary text-primary-foreground' 
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="flex gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search client, service, or date..." 
                        className="pl-10 bg-card border border-border placeholder:text-muted-foreground focus:ring-primary/50 h-10 rounded-xl"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button variant="outline" className="border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted">
                    <Filter className="w-4 h-4 mr-2" /> Filters
                </Button>
            </div>
        </div>

        {/* Bookings List */}
        <div className="space-y-4">
            <AnimatePresence mode="popLayout">
                {activeTab === 'waitlist' ? (
                    <ProviderWaitlistPanel entries={waitlistQueue} isLoading={waitlistLoading} />
                ) : bookings.length === 0 && !isFetching ? (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="text-center py-20 bg-muted/50 rounded-3xl border border-border border-dashed"
                    >
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                            <CalendarIcon className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-1">No bookings found</h3>
                        <p className="text-muted-foreground">Try adjusting your filters or create a new appointment.</p>
                    </motion.div>
                ) : (
                    bookings.map((booking) => {
                      const isGroup = booking.is_group || booking.booking_type === 'group';
                      return (
                        <div key={booking.id} className="rounded-2xl border border-border bg-card overflow-hidden">
                            <BookingCard
                            booking={booking}
                            className="border-0 rounded-none shadow-none"
                            actions={
                                <div className="flex gap-2 flex-wrap justify-end">
                                    <Link to={createPageUrl(`ProviderMessages?booking=${booking.id}`)}>
                                        <Button size="sm" variant="outline" className="h-8 rounded-xl">
                                            <MessageSquare className="w-4 h-4 mr-1" />
                                            Chat
                                        </Button>
                                    </Link>
                                    {booking.status === 'pending' && (
                                        <>
                                            <Button 
                                                size="sm" 
                                                className="bg-primary text-primary-foreground hover:opacity-95 h-8"
                                                onClick={() => updateStatusMutation.mutate({ id: booking.id, status: 'confirmed', booking })}
                                            >
                                                <Check className="w-4 h-4 mr-1" /> Accept
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                variant="destructive"
                                                className="h-8"
                                                onClick={() => updateStatusMutation.mutate({ id: booking.id, status: 'cancelled', booking })}
                                            >
                                                <X className="w-4 h-4 mr-1" /> Decline
                                            </Button>
                                        </>
                                    )}
                                    {booking.status === 'confirmed' && (
                                        <>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8"
                                            disabled={false}
                                            onClick={() => setCheckInBooking(booking)}
                                        >
                                            Check in
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="bg-emerald-600 text-white hover:bg-emerald-700 h-8"
                                            onClick={() => updateStatusMutation.mutate({ id: booking.id, status: 'completed', booking })}
                                        >
                                            <Check className="w-4 h-4 mr-1" /> Complete
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8 border-amber-500/30 text-amber-700 hover:bg-amber-50"
                                            onClick={() => {
                                                if (confirm('Mark this client as a no-show? A fee may be charged per your policy.')) {
                                                    noShowMutation.mutate(booking.id);
                                                }
                                            }}
                                        >
                                            No-show
                                        </Button>
                                        <Button 
                                            size="sm" 
                                            variant="outline"
                                            className="h-8 border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                            onClick={() => {
                                                if(confirm("Cancel this booking?")) {
                                                    updateStatusMutation.mutate({ id: booking.id, status: 'cancelled', booking });
                                                }
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                        </>
                                    )}
                                    {booking.status === 'no_show' && booking.no_show_fee_status === 'failed' && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8"
                                            onClick={() => retryNoShowMutation.mutate(booking.id)}
                                        >
                                            Retry no-show fee
                                        </Button>
                                    )}
                                </div>
                            }
                        />
                            {isGroup && (
                              <div className="px-5 pb-4">
                                <GroupBookingGuestPanel
                                  bookingId={booking.id}
                                  partySize={booking.party_size}
                                  eventLabel={booking.group_event_label}
                                />
                              </div>
                            )}
                        </div>
                      );
                    })
                )}
            </AnimatePresence>
        </div>

        <div className="mt-6">
            {activeTab !== 'waitlist' && (
            <PaginationControls 
                currentPage={page}
                onPrevious={() => setPage(p => Math.max(1, p - 1))}
                onNext={() => setPage(p => p + 1)}
                hasNext={bookings.length === pageSize}
                className="justify-center"
            />
            )}
        </div>
      </div>

      <ProviderCheckInDialog
        booking={checkInBooking}
        open={!!checkInBooking}
        onOpenChange={(open) => !open && setCheckInBooking(null)}
      />
    </div>
  );
}
