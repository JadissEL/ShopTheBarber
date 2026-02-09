import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { MetaTags } from '@/components/seo/MetaTags';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Loader, CheckCircle2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';
import ClientBottomNav from '@/components/dashboard/ClientBottomNav';

export default function Review() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const urlParams = new URLSearchParams(window.location.search);
    const bookingId = urlParams.get('bookingId');

    const [rating, setRating] = useState(5);
    const [content, setContent] = useState('');

    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => sovereign.auth.me()
    });

    const { data: booking, isLoading: isBookingLoading } = useQuery({
        queryKey: ['review-booking', bookingId],
        queryFn: () => bookingId ? sovereign.entities.Booking.get(bookingId) : Promise.resolve(null),
        enabled: !!bookingId
    });

    const createReviewMutation = useMutation({
        mutationFn: async (data) => {
            // Now handled entirely by the backend custom endpoint
            return await sovereign.entities.Review.create(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['my-bookings']);
            toast.success("Review submitted! Thank you for your feedback.");
            navigate(createPageUrl('UserBookings'));
        },
        onError: (err) => {
            toast.error("Failed to submit review: " + err.message);
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!user || !booking) return;

        createReviewMutation.mutate({
            booking_id: bookingId,
            reviewer_id: user.id,
            target_id: booking.barber_id,
            rating,
            content
        });
    };

    if (isBookingLoading) return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <Loader className="w-8 h-8 animate-spin text-primary" />
        </div>
    );

    if (!booking) return (
        <div className="min-h-screen bg-background p-8 text-center text-foreground">
            <p>Booking not found or already reviewed.</p>
            <Button onClick={() => navigate(-1)} className="mt-4">Go Back</Button>
        </div>
    );

    return (
        <div className="min-h-screen bg-background text-foreground pb-24 lg:pb-8 pt-10 px-4">
            <MetaTags title="Write a Review" description="Share your experience with your barber." />

            <div className="w-full max-w-2xl lg:max-w-4xl mx-auto">
                <Button
                    variant="ghost"
                    onClick={() => navigate(-1)}
                    className="text-muted-foreground hover:text-foreground mb-8 gap-2"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Bookings
                </Button>

                <h1 className="text-4xl font-bold mb-2">How was it?</h1>
                <p className="text-muted-foreground mb-10 text-lg">Your feedback helps {booking.barber_name} and the community.</p>

                <Card className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
                    <CardHeader className="bg-primary/5 border-b border-border p-8">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl">
                                ✂️
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-bold text-foreground">{booking.barber_name}</CardTitle>
                                <p className="text-primary font-semibold text-sm uppercase tracking-widest">{booking.service_name}</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="space-y-4">
                                <Label className="text-lg font-bold">Your Rating</Label>
                                <div className="flex gap-4">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setRating(star)}
                                            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${rating >= star
                                                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                                }`}
                                        >
                                            <Star className={`w-6 h-6 ${rating >= star ? 'fill-current' : ''}`} />
                                        </button>
                                    ))}
                                </div>
                                <p className="text-sm font-bold text-amber-600 uppercase tracking-widest">
                                    {rating === 5 ? 'Excellent' : rating === 4 ? 'Great' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'Poor'}
                                </p>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-lg font-bold">Your Experience</Label>
                                <Textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="What made this experience special? Any details you'd like to share?"
                                    className="min-h-[150px] bg-muted/50 border border-border rounded-2xl focus:ring-primary focus:border-primary text-lg"
                                    required
                                />
                            </div>

                            <div className="pt-4">
                                <Button
                                    type="submit"
                                    disabled={createReviewMutation.isPending}
                                    className="w-full h-14 rounded-2xl bg-primary text-primary-foreground hover:opacity-95 font-bold text-lg shadow-lg"
                                >
                                    {createReviewMutation.isPending ? (
                                        <Loader className="w-6 h-6 animate-spin" />
                                    ) : (
                                        <>Submit Review <CheckCircle2 className="w-5 h-5 ml-2" /></>
                                    )}
                                </Button>
                                <p className="text-center text-xs text-muted-foreground mt-4 font-medium">
                                    Your review will be public on {booking.barber_name}'s profile.
                                </p>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
            <ClientBottomNav />
        </div>
    );
}
