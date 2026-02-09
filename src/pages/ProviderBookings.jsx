import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, Calendar as CalendarIcon, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useDebounce } from '@/components/hooks/use-debounce';
import { MetaTags } from '@/components/seo/MetaTags';
import { motion, AnimatePresence } from 'framer-motion';
import BookingCard from '@/components/ui/booking-card';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { sendNotification } from '@/components/notifications/notificationUtils';
import { Check, X } from 'lucide-react';
import { sendBookingConfirmationEmail, sendCancellationEmail } from '@/functions/sendBookingConfirmationEmail';

const POINTS_PER_DOLLAR = 10;
const TIERS = {
    Bronze: 0,
    Silver: 5000,
    Gold: 15000,
    Platinum: 30000
};

export default function ProviderBookings() {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const pageSize = 10;
  const queryClient = useQueryClient();

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const getQuery = () => {
      let query = {};
      if (activeTab === 'upcoming') query.status = { $nin: ['completed', 'cancelled'] };
      if (activeTab === 'completed') query.status = 'completed';
      if (activeTab === 'cancelled') query.status = 'cancelled';
      if (activeTab === 'waitlist') return null; // Special handling for waitlist
      
      if (debouncedSearch) {
          query.service_name = { $regex: debouncedSearch, $options: 'i' };
      }
      return query;
  };
  
  const { data: bookings = [], isFetching } = useQuery({
    queryKey: ['provider-bookings', activeTab, page, debouncedSearch],
    queryFn: () => {
      if (activeTab === 'waitlist') return sovereign.entities.WaitingListEntry.list('-created_date', pageSize, (page - 1) * pageSize);
      return sovereign.entities.Booking.filter(getQuery(), '-date_text', pageSize, (page - 1) * pageSize);
    },
    keepPreviousData: true,
    placeholderData: (prev) => prev,
  });
  
  useEffect(() => {
    if (bookings.length === pageSize) {
      queryClient.prefetchQuery({
        queryKey: ['provider-bookings', activeTab, page + 1, debouncedSearch],
        queryFn: () => sovereign.entities.Booking.filter(getQuery(), '-date_text', pageSize, page * pageSize),
      });
    }
  }, [bookings, page, debouncedSearch, activeTab, queryClient]);

  const updateStatusMutation = useMutation({
      mutationFn: async ({ id, status, booking }) => {
          const updated = await sovereign.entities.Booking.update(id, { status });

          // Send confirmation email when booking is confirmed
          if (status === 'confirmed' && booking) {
              await sendBookingConfirmationEmail(booking);
          }

          // Send cancellation email
          if (status === 'cancelled' && booking) {
              await sendCancellationEmail(booking, 'barber');
          }

          return updated;
      },
      onSuccess: async (data, variables) => {
          queryClient.invalidateQueries(['provider-bookings']);
          toast.success(`Booking ${variables.status.toLowerCase()}`);
          
          // Notify Client
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
                 // email: variables.booking.client_email, // If we had it
                 title: title,
                 message: msg,
                 type: variables.status === 'confirmed' ? 'booking_confirmed' : 'booking_cancelled',
                 link: `/bookingdetails?id=${variables.booking.id}`,
                 relatedEntityId: variables.booking.id
                 });
                 }

                 // LOYALTY INTEGRATION: Award points on completion
                 if (variables.status === 'completed' && variables.booking && variables.booking.client_id) {
                 try {
                  const clientId = variables.booking.client_id;
                  const amount = variables.booking.price_at_booking || 0;
                  if (amount > 0) {
                      const points = Math.floor(amount * POINTS_PER_DOLLAR);

                      // 1. Get/Create Profile
                      const profiles = await sovereign.entities.LoyaltyProfile.filter({ user_id: clientId });
                      let profile = profiles[0];
                      if (!profile) {
                          profile = await sovereign.entities.LoyaltyProfile.create({
                              user_id: clientId,
                              current_points: 0,
                              lifetime_points: 0,
                              tier: 'Bronze',
                              joined_date: new Date().toISOString()
                          });
                      }

                      // 2. Update Profile
                      const newCurrent = (profile.current_points || 0) + points;
                      const newLifetime = (profile.lifetime_points || 0) + points;

                      // Calculate Tier
                      let newTier = profile.tier;
                      if (newLifetime >= TIERS.Platinum) newTier = 'Platinum';
                      else if (newLifetime >= TIERS.Gold) newTier = 'Gold';
                      else if (newLifetime >= TIERS.Silver) newTier = 'Silver';

                      await sovereign.entities.LoyaltyProfile.update(profile.id, {
                          current_points: newCurrent,
                          lifetime_points: newLifetime,
                          tier: newTier
                      });

                      // 3. Log Transaction
                      await sovereign.entities.LoyaltyTransaction.create({
                          user_id: clientId,
                          points: points,
                          type: 'earned_booking',
                          description: `Earned from ${variables.booking.service_name}`,
                          related_entity_id: variables.booking.id,
                          date_text: new Date().toISOString()
                      });

                      // 4. Notify
                      await sendNotification({
                          userId: clientId,
                          title: "Points Earned!",
                          message: `You earned ${points} loyalty points for your booking.`,
                          type: 'system',
                          link: '/LoyaltyProgram',
                          relatedEntityId: variables.booking.id
                      });
                  }
                 } catch (e) {
                  console.error("Loyalty error:", e);
                 }
                 }
                 },
      onError: () => toast.error("Failed to update status")
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
    <div className="min-h-screen bg-background text-foreground font-sans pb-12">
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
                {['upcoming', 'completed', 'cancelled', 'waitlist'].map((tab) => (
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
                {bookings.length === 0 && !isFetching ? (
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
                ) : activeTab === 'waitlist' ? (
                    bookings.map((entry) => (
                        <motion.div 
                            key={entry.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-card border border-border rounded-xl p-4"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-semibold text-foreground">{entry.client_name || 'Customer'}</h4>
                                    <p className="text-sm text-muted-foreground">{entry.service_name || 'Service Request'}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{entry.preferred_date || 'Flexible timing'}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" className="bg-primary text-primary-foreground hover:opacity-95 h-8">
                                        Book Slot
                                    </Button>
                                    <Button size="sm" variant="outline" className="border-border h-8">
                                        Notify
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    bookings.map((booking) => (
                        <BookingCard 
                            key={booking.id} 
                            booking={booking} 
                            actions={
                                <div className="flex gap-2">
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
                                    )}
                                </div>
                            }
                        />
                    ))
                )}
            </AnimatePresence>
        </div>

        <div className="mt-6">
            <PaginationControls 
                currentPage={page}
                onPrevious={() => setPage(p => Math.max(1, p - 1))}
                onNext={() => setPage(p => p + 1)}
                hasNext={bookings.length === pageSize}
                className="justify-center"
            />
        </div>
      </div>
    </div>
  );
}
