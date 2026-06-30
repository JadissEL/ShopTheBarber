import { useSearchParams, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { createPageUrl } from '@/utils';
import { sovereign } from '@/api/apiClient';
import { getAnalyticsSessionId } from '@/lib/analyticsSession';
import { MetaTags } from '@/components/seo/MetaTags';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReferralShareCard from '@/components/referral/ReferralShareCard';
import ContextualBackLink from '@/components/ui/ContextualBackLink';
import PageHeader from '@/components/layout/PageHeader';
import PageContent from '@/components/layout/PageContent';
import { stb } from '@/lib/stbUi';
/**
 * Standalone booking confirmation entry, e.g. from email link.
 * If no booking id, redirects to UserBookings. Otherwise shows confirmation and link to bookings.
 */
export default function ConfirmBooking() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('id');

  useEffect(() => {
    if (!bookingId) return;
    sovereign.analytics.track({
      eventName: 'booking_paid',
      session_id: getAnalyticsSessionId(),
      properties: { booking_id: bookingId, source: 'confirm_booking_page' },
    });
  }, [bookingId]);

  return (
    <div className={stb.page + ' pb-24 lg:pb-8'}>
      <MetaTags title="Booking Confirmation" description="Your booking has been confirmed" noindex />
      <PageHeader
        label="Booking"
        title="Booking confirmed"
        subtitle={bookingId ? `Booking #${bookingId} is confirmed.` : 'Your appointment is confirmed.'}
        compact
        variant="light"
        tier="app"
      />
      <PageContent narrow className="flex flex-col items-center gap-6">
      <Card className="w-full max-w-md lg:max-w-lg">
        <CardContent className="py-8 text-center">
          <CheckCircle className="w-14 h-14 text-primary mx-auto mb-4" />
          <p className="text-muted-foreground text-sm mb-6">
            You&apos;re all set. We sent a confirmation if email is on file.
          </p>
          <Link to={createPageUrl('UserBookings')}>
            <Button className="w-full">View my bookings</Button>
          </Link>
          <ContextualBackLink className="mt-4 text-sm" />
        </CardContent>
      </Card>
      <div className="w-full max-w-md lg:max-w-lg">
        <ReferralShareCard
          title="Loved the experience?"
          subtitle="Invite a friend, you earn when they complete their first booking."
        />
      </div>
      </PageContent>
    </div>
  );
}
