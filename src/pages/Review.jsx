import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { MetaTags } from '@/components/seo/MetaTags';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Loader, CheckCircle2, ArrowLeft, Store, Scissors } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { useNavigate, Link } from 'react-router-dom';
import TipBarber from '@/components/tips/TipBarber';

function StarRating({ rating, onChange, disabled }) {
    return (
        <div className="flex gap-3">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange(star)}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                        rating >= star
                            ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                    <Star className={`w-6 h-6 ${rating >= star ? 'fill-current' : ''}`} />
                </button>
            ))}
        </div>
    );
}

function ratingLabel(rating) {
    if (rating === 5) return 'Excellent';
    if (rating === 4) return 'Great';
    if (rating === 3) return 'Good';
    if (rating === 2) return 'Fair';
    return 'Poor';
}

export default function Review() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const urlParams = new URLSearchParams(window.location.search);
    const bookingId = urlParams.get('bookingId');
    const reviewToken = urlParams.get('token');
    const isTokenMode = !!(reviewToken && reviewToken.length >= 20);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('tip') === 'success' && bookingId) {
            toast.success('Thank you! Your tip was sent.');
            queryClient.invalidateQueries({ queryKey: ['tip-status', bookingId] });
            params.delete('tip');
            const qs = params.toString();
            window.history.replaceState({}, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`);
        }
    }, [bookingId, queryClient]);

    const [barberRating, setBarberRating] = useState(5);
    const [barberContent, setBarberContent] = useState('');
    const [shopRating, setShopRating] = useState(5);
    const [shopContent, setShopContent] = useState('');

    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => sovereign.auth.me(),
        retry: false,
    });

    const { data: booking, isLoading: isBookingLoading } = useQuery({
        queryKey: ['review-booking', bookingId],
        queryFn: () => (bookingId ? sovereign.entities.Booking.get(bookingId) : Promise.resolve(null)),
        enabled: !!bookingId && !isTokenMode,
    });

    const { data: tokenRequest, isLoading: isTokenLoading } = useQuery({
        queryKey: ['review-request', reviewToken],
        queryFn: () => sovereign.reviews.getRequestByToken(reviewToken),
        enabled: isTokenMode,
    });

    const { data: reviewStatus, isLoading: isStatusLoading } = useQuery({
        queryKey: ['review-status', bookingId],
        queryFn: () => sovereign.reviews.getBookingStatus(bookingId),
        enabled: !!bookingId && !!user && !isTokenMode,
    });

    const effectiveStatus = isTokenMode ? tokenRequest : reviewStatus;
    const effectiveBooking = isTokenMode
        ? tokenRequest
            ? {
                  id: tokenRequest.booking_id,
                  barber_name: tokenRequest.barber_name,
                  service_name: tokenRequest.service_name,
                  shop_id: tokenRequest.shop_id,
                  status: 'completed',
              }
            : null
        : booking;
    const resolvedBookingId = isTokenMode ? tokenRequest?.booking_id : bookingId;

    const submitBarberMutation = useMutation({
        mutationFn: () =>
            isTokenMode
                ? sovereign.reviews.submitGuest({
                      token: reviewToken,
                      target_type: 'barber',
                      rating: barberRating,
                      content: barberContent.trim() || undefined,
                  })
                : sovereign.reviews.submit({
                      booking_id: bookingId,
                      target_type: 'barber',
                      rating: barberRating,
                      content: barberContent.trim() || undefined,
                  }),
        onSuccess: () => {
            if (isTokenMode) {
                queryClient.invalidateQueries({ queryKey: ['review-request', reviewToken] });
            } else {
                queryClient.invalidateQueries({ queryKey: ['review-status', bookingId] });
            }
            queryClient.invalidateQueries({ queryKey: ['pending-reviews'] });
            toast.success('Barber review submitted!');
        },
        onError: (err) => toast.error(err.message || 'Failed to submit barber review'),
    });

    const submitShopMutation = useMutation({
        mutationFn: () =>
            isTokenMode
                ? sovereign.reviews.submitGuest({
                      token: reviewToken,
                      target_type: 'shop',
                      rating: shopRating,
                      content: shopContent.trim() || undefined,
                  })
                : sovereign.reviews.submit({
                      booking_id: bookingId,
                      target_type: 'shop',
                      rating: shopRating,
                      content: shopContent.trim() || undefined,
                  }),
        onSuccess: () => {
            if (isTokenMode) {
                queryClient.invalidateQueries({ queryKey: ['review-request', reviewToken] });
            } else {
                queryClient.invalidateQueries({ queryKey: ['review-status', bookingId] });
            }
            queryClient.invalidateQueries({ queryKey: ['pending-reviews'] });
            toast.success('Shop review submitted!');
        },
        onError: (err) => toast.error(err.message || 'Failed to submit shop review'),
    });

    const handleFinish = () => {
        queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
        queryClient.invalidateQueries({ queryKey: ['pending-reviews'] });
        if (isTokenMode) {
            navigate(createPageUrl('Explore'));
            return;
        }
        navigate(createPageUrl('UserBookings'));
    };

    const loading = isTokenMode
        ? isTokenLoading
        : isBookingLoading || isStatusLoading;

    if (loading) {
        return (
            <div className="stb-page flex items-center justify-center">
                <Loader className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!effectiveBooking || (!bookingId && !isTokenMode)) {
        return (
            <div className="stb-page p-8 text-center text-foreground">
                <p>Booking not found.</p>
                <Button onClick={() => navigate(-1)} className="mt-4">Go Back</Button>
            </div>
        );
    }

    if (!isTokenMode && !user) {
        return (
            <div className="stb-page p-8 text-center">
                <p className="text-muted-foreground mb-4">Sign in to leave a review.</p>
                <Button onClick={() => navigate(createPageUrl(`SignIn?return=${encodeURIComponent(window.location.pathname + window.location.search)}`))}>
                    Sign In
                </Button>
            </div>
        );
    }

    if (isTokenMode && tokenRequest?.requires_sign_in) {
        return (
            <div className="stb-page p-8 text-center max-w-lg mx-auto">
                <p className="text-lg font-medium mb-2">Sign in to review</p>
                <p className="text-muted-foreground mb-6">This booking is linked to an account. Sign in to leave your review.</p>
                <Link to={createPageUrl(`SignIn?return=${encodeURIComponent(`Review?bookingId=${tokenRequest.booking_id}`)}`)}>
                    <Button>Sign In</Button>
                </Link>
            </div>
        );
    }

    if (effectiveStatus && !effectiveStatus.can_review) {
        return (
            <div className="stb-page p-8 text-center text-foreground max-w-lg mx-auto">
                <p className="text-lg font-medium mb-2">Review not available yet</p>
                <p className="text-muted-foreground mb-6">You can review after your appointment is marked completed.</p>
                <Button onClick={handleFinish}>Go Back</Button>
            </div>
        );
    }

    const barberDone = effectiveStatus?.barber?.submitted;
    const shopDone = effectiveStatus?.shop?.submitted;
    const shopAvailable = effectiveStatus?.shop?.available ?? !!effectiveBooking.shop_id;
    const allDone = effectiveStatus?.all_done;

    return (
        <div className="stb-page lg:pb-8 pt-10 px-4">
            <MetaTags title="Write a Review" description="Share your experience with your barber and shop." />

            <div className="w-full max-w-2xl lg:max-w-3xl mx-auto">
                <Button
                    variant="ghost"
                    onClick={() => navigate(-1)}
                    className="text-muted-foreground hover:text-foreground mb-8 gap-2"
                >
                    <ArrowLeft className="w-4 h-4" /> Back
                </Button>

                <h1 className="text-4xl font-bold mb-2">How was your visit?</h1>
                <p className="text-muted-foreground mb-6 text-lg">
                    {shopAvailable
                        ? 'Tap a star rating, a short note is optional but helps a lot.'
                        : `Your feedback helps ${effectiveBooking.barber_name || 'your barber'} and the community.`}
                </p>

                {!isTokenMode && resolvedBookingId && (
                    <div className="mb-8">
                        <TipBarber bookingId={resolvedBookingId} returnPath={`Review?bookingId=${resolvedBookingId}`} />
                    </div>
                )}

                {allDone ? (
                    <Card className="border-green-200 bg-green-50/50">
                        <CardContent className="p-8 text-center">
                            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
                            <h2 className="text-xl font-bold mb-2">Thank you!</h2>
                            <p className="text-muted-foreground mb-6">All reviews for this visit have been submitted.</p>
                            <Button onClick={handleFinish}>Done</Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-8">
                        <Card className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
                            <CardHeader className="bg-primary/5 border-b border-border p-6">
                                <CardTitle className="flex items-center gap-3 text-xl">
                                    <Scissors className="w-6 h-6 text-primary" />
                                    Rate your barber
                                    {barberDone && (
                                        <span className="text-sm font-normal text-green-600 ml-auto flex items-center gap-1">
                                            <CheckCircle2 className="w-4 h-4" /> Submitted
                                        </span>
                                    )}
                                </CardTitle>
                                <p className="text-muted-foreground text-sm mt-1">
                                    {effectiveBooking.barber_name}, {effectiveBooking.service_name}
                                </p>
                            </CardHeader>
                            {!barberDone && (
                                <CardContent className="p-6 space-y-6">
                                    <div>
                                        <Label className="text-base font-bold mb-3 block">Your rating</Label>
                                        <StarRating rating={barberRating} onChange={setBarberRating} />
                                        <p className="text-sm font-bold text-amber-600 uppercase tracking-widest mt-2">
                                            {ratingLabel(barberRating)}
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-base font-bold mb-3 block">
                                            Your experience <span className="text-muted-foreground font-normal">(optional)</span>
                                        </Label>
                                        <Textarea
                                            value={barberContent}
                                            onChange={(e) => setBarberContent(e.target.value)}
                                            placeholder="How was the cut, service, and professionalism?"
                                            className="min-h-[100px]"
                                        />
                                    </div>
                                    <Button
                                        className="w-full h-12"
                                        disabled={submitBarberMutation.isPending}
                                        onClick={() => submitBarberMutation.mutate()}
                                    >
                                        {submitBarberMutation.isPending ? (
                                            <Loader className="w-5 h-5 animate-spin" />
                                        ) : (
                                            'Submit barber review'
                                        )}
                                    </Button>
                                </CardContent>
                            )}
                        </Card>

                        {shopAvailable && (
                            <Card className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
                                <CardHeader className="bg-amber-500/5 border-b border-border p-6">
                                    <CardTitle className="flex items-center gap-3 text-xl">
                                        <Store className="w-6 h-6 text-amber-600" />
                                        Rate the shop
                                        {shopDone && (
                                            <span className="text-sm font-normal text-green-600 ml-auto flex items-center gap-1">
                                                <CheckCircle2 className="w-4 h-4" /> Submitted
                                            </span>
                                        )}
                                    </CardTitle>
                                    <p className="text-muted-foreground text-sm mt-1">
                                        Ambience, cleanliness, wait time, and overall experience
                                    </p>
                                </CardHeader>
                                {!shopDone && (
                                    <CardContent className="p-6 space-y-6">
                                        <div>
                                            <Label className="text-base font-bold mb-3 block">Your rating</Label>
                                            <StarRating rating={shopRating} onChange={setShopRating} />
                                            <p className="text-sm font-bold text-amber-600 uppercase tracking-widest mt-2">
                                                {ratingLabel(shopRating)}
                                            </p>
                                        </div>
                                        <div>
                                            <Label className="text-base font-bold mb-3 block">
                                                Your experience <span className="text-muted-foreground font-normal">(optional)</span>
                                            </Label>
                                            <Textarea
                                                value={shopContent}
                                                onChange={(e) => setShopContent(e.target.value)}
                                                placeholder="How was the shop environment and team?"
                                                className="min-h-[100px]"
                                            />
                                        </div>
                                        <Button
                                            className="w-full h-12"
                                            variant="outline"
                                            disabled={submitShopMutation.isPending}
                                            onClick={() => submitShopMutation.mutate()}
                                        >
                                            {submitShopMutation.isPending ? (
                                                <Loader className="w-5 h-5 animate-spin" />
                                            ) : (
                                                'Submit shop review'
                                            )}
                                        </Button>
                                    </CardContent>
                                )}
                            </Card>
                        )}

                        {(barberDone && (!shopAvailable || shopDone)) && (
                            <Button className="w-full h-14 text-lg" onClick={handleFinish}>
                                Done
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
