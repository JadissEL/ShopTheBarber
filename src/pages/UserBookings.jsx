import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { MetaTags } from '@/components/seo/MetaTags';
import { Button } from '@/components/ui/button';
import BookingCard from '@/components/ui/booking-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, AlertCircle, Star } from 'lucide-react';
import { isPast, isFuture } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import ClientBottomNav from '@/components/dashboard/ClientBottomNav';

export default function UserBookings() {
    const queryClient = useQueryClient();
    const [_activeTab, setActiveTab] = useState('upcoming');

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

    const cancelBookingMutation = useMutation({
        mutationFn: (id) => sovereign.entities.Booking.update(id, { status: 'cancelled' }),
        onSuccess: () => {
            queryClient.invalidateQueries(['my-bookings']);
            toast.success('Appointment cancelled successfully');
        },
        onError: (error) => {
            toast.error('Failed to cancel appointment: ' + error.message);
        }
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

    const handleCancel = (bookingId) => {
        if (window.confirm("Are you sure you want to cancel this appointment?")) {
            cancelBookingMutation.mutate(bookingId);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground font-sans pb-24 lg:pb-8">
            <MetaTags
                title="My Bookings"
                description="Manage your grooming appointments and history."
            />

            {/* Header */}
            <div className="border-b border-border bg-card sticky top-0 z-30">
                <div className="w-full max-w-5xl lg:max-w-7xl mx-auto px-4 lg:px-8 py-8">
                    <h1 className="text-3xl font-bold tracking-tight">My Bookings</h1>
                    <p className="text-muted-foreground mt-2">View and manage your upcoming and past appointments</p>
                </div>
            </div>

            <div className="w-full max-w-5xl lg:max-w-7xl mx-auto px-4 lg:px-8 py-8">
                <Tabs defaultValue="upcoming" className="w-full" onValueChange={setActiveTab}>
                    <TabsList className="bg-muted border border-border p-1 mb-8">
                        <TabsTrigger value="upcoming" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            Upcoming ({upcomingBookings.length})
                        </TabsTrigger>
                        <TabsTrigger value="past" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            History ({pastBookings.length})
                        </TabsTrigger>
                    </TabsList>

                    <AnimatePresence mode="wait">
                        <TabsContent value="upcoming" key="upcoming">
                            {upcomingBookings.length > 0 ? (
                                <div className="space-y-4">
                                    {upcomingBookings.map((booking) => (
                                        <div key={booking.id} className="relative group">
                                            <BookingCard
                                                booking={booking}
                                                variant="default"
                                                className="bg-card border border-border hover:border-primary/30"
                                                actions={
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="border-border text-muted-foreground hover:text-foreground hover:bg-muted h-9"
                                                            onClick={() => handleCancel(booking.id)}
                                                            disabled={cancelBookingMutation.isPending}
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
                                            {booking.status === 'pending' && (
                                                <div className="absolute -top-2 -left-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg">
                                                    <AlertCircle className="w-3 h-3" /> PENDING CONFIRMATION
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-center py-20 bg-muted/50 rounded-3xl border border-border border-dashed"
                                >
                                    <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-xl font-bold mb-2">No upcoming appointments</h3>
                                    <p className="text-muted-foreground mb-6">Looks like you haven't booked anything yet.</p>
                                    <Link to={createPageUrl('Explore')}>
                                        <Button className="bg-primary text-primary-foreground hover:opacity-95">Find a Barber</Button>
                                    </Link>
                                </motion.div>
                            )}
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
                                                    {booking.status === 'completed' && (
                                                        <Link to={createPageUrl(`Review?bookingId=${booking.id}`)}>
                                                            <Button variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/10 h-9">
                                                                <Star className="w-4 h-4 mr-1" /> Review
                                                            </Button>
                                                        </Link>
                                                    )}
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="border-border text-muted-foreground hover:text-foreground hover:bg-muted h-9"
                                                        onClick={() => toast.info("Rebooking functionality coming soon!")}
                                                    >
                                                        Book Again
                                                    </Button>
                                                </div>
                                            }
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-muted/50 rounded-3xl border border-border border-dashed">
                                    <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-xl font-bold mb-2">No past appointments</h3>
                                    <p className="text-muted-foreground">Your appointment history will appear here once you complete a visit.</p>
                                </div>
                            )}
                        </TabsContent>
                    </AnimatePresence>
                </Tabs>
            </div>
            <ClientBottomNav />
        </div>
    );
}
