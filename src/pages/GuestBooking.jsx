import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { sovereign } from '@/api/apiClient';
import { createPageUrl } from '@/utils';
import { MetaTags } from '@/components/seo/MetaTags';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar, MapPin, Scissors, Loader2, UserPlus, XCircle } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { toast } from 'sonner';
import { addGuestClaimToken } from '@/lib/guestBooking';

export default function GuestBooking() {
  const [params] = useSearchParams();
  const token = params.get('token')?.trim() || '';
  const queryClient = useQueryClient();
  const [cancelOpen, setCancelOpen] = useState(false);

  useEffect(() => {
    if (token.length >= 20) addGuestClaimToken(token);
  }, [token]);

  const { data: booking, isLoading, error } = useQuery({
    queryKey: ['guest-booking', token],
    queryFn: () => sovereign.bookings.getGuestByToken(token),
    enabled: token.length >= 20,
    retry: false,
  });

  const canCancel = booking && !['cancelled', 'completed', 'no_show'].includes(booking.status || '');

  const { data: cancelPreview } = useQuery({
    queryKey: ['guest-cancel-preview', token],
    queryFn: () => sovereign.bookings.getGuestCancelPreview(token),
    enabled: token.length >= 20 && !!canCancel,
    retry: false,
  });

  const cancelMutation = useMutation({
    mutationFn: () => sovereign.bookings.cancelGuest(token),
    onSuccess: () => {
      toast.success('Booking cancelled');
      setCancelOpen(false);
      queryClient.invalidateQueries({ queryKey: ['guest-booking', token] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Could not cancel booking');
    },
  });

  const signUpUrl = `${createPageUrl('SignUp')}?return=${encodeURIComponent('/UserBookings')}`;

  return (
    <div className="stb-page">
      <MetaTags title="Your booking" description="View your guest booking confirmation." />

      <div className="max-w-lg mx-auto px-4 py-12">
        {!token || token.length < 20 ? (
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">Invalid link</h1>
            <p className="text-muted-foreground">Use the link from your confirmation screen or SMS.</p>
            <Link to={createPageUrl('Explore')}>
              <Button>Find a barber</Button>
            </Link>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error || !booking ? (
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">Booking not found</h1>
            <p className="text-muted-foreground">
              This link may have expired, was linked to an account, or is incorrect.
            </p>
            <Link to={createPageUrl('Explore')}>
              <Button>Find a barber</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-2">
                {booking.status === 'cancelled' ? 'Booking cancelled' : "You're booked"}
              </h1>
              <p className="text-muted-foreground text-sm">Reference #{booking.id?.slice(0, 8)}</p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              {booking.barber ? (
                <div className="flex items-center gap-4">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-muted shrink-0">
                    {booking.barber.image_url ? (
                      <OptimizedImage src={booking.barber.image_url} alt="" fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Scissors className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">{booking.barber.name}</p>
                    {booking.barber.location ? (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {booking.barber.location}
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div className="flex items-start gap-3 text-sm">
                <Calendar className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">{booking.date_text || 'Date TBC'}</p>
                  <p className="text-muted-foreground">{booking.time_text || ''}</p>
                </div>
              </div>

              {booking.service_name ? (
                <div className="flex items-start gap-3 text-sm">
                  <Scissors className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <p>{booking.service_name}</p>
                </div>
              ) : null}

              {booking.client_name ? (
                <p className="text-sm text-muted-foreground pt-2 border-t border-border">
                  Booked as <strong className="text-foreground">{booking.client_name}</strong>
                </p>
              ) : null}

              <p className="text-xs text-muted-foreground">
                Status: <span className="capitalize">{booking.status || 'pending'}</span>
                {booking.payment_method === 'cash_at_store' ? ', Pay at shop' : ''}
              </p>
            </div>

            <div className="space-y-2">
              {canCancel ? (
                <Button
                  variant="outline"
                  className="w-full h-11 text-destructive border-destructive/30 hover:bg-destructive/5"
                  onClick={() => setCancelOpen(true)}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel appointment
                </Button>
              ) : null}

              <Link to={signUpUrl}>
                <Button className="w-full h-11">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Save to my account (free)
                </Button>
              </Link>
              <Link to={createPageUrl('Explore')}>
                <Button variant="outline" className="w-full">
                  Book another visit
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel this appointment?</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                {cancelPreview?.reason ? <p>{cancelPreview.reason}</p> : null}
                {cancelPreview?.policy_note ? (
                  <p className="text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    {cancelPreview.policy_note}
                  </p>
                ) : null}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCancelOpen(false)} disabled={cancelMutation.isPending}>
              Keep booking
            </Button>
            <Button
              variant="destructive"
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? 'Cancelling…' : 'Yes, cancel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
