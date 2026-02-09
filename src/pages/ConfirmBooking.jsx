import { useSearchParams, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { MetaTags } from '@/components/seo/MetaTags';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ClientBottomNav from '@/components/dashboard/ClientBottomNav';

/**
 * Standalone booking confirmation entry — e.g. from email link.
 * If no booking id, redirects to UserBookings. Otherwise shows confirmation and link to bookings.
 */
export default function ConfirmBooking() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('id');

  return (
    <div className="min-h-screen bg-background flex flex-col items-center p-4 pb-24 lg:pb-8">
      <MetaTags title="Booking Confirmation" description="Your booking has been confirmed" />
      <Card className="w-full max-w-md lg:max-w-lg">
        <CardContent className="py-8 text-center">
          <CheckCircle className="w-14 h-14 text-primary mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Booking confirmed</h1>
          <p className="text-muted-foreground text-sm mb-6">
            {bookingId ? `Booking #${bookingId} is confirmed.` : 'Your appointment is confirmed.'}
          </p>
          <Link to={createPageUrl('UserBookings')}>
            <Button className="w-full">View my bookings</Button>
          </Link>
          <Link to={createPageUrl('Dashboard')} className="inline-flex items-center gap-1 mt-4 text-sm text-primary hover:underline">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </CardContent>
      </Card>
      <ClientBottomNav />
    </div>
  );
}
