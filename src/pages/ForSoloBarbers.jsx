import { Scissors } from 'lucide-react';
import { IcpPageLayout } from '@/components/gtm/IcpPageLayout';
import { createPageUrl } from '@/utils';

export default function ForSoloBarbers() {
  const signUp = `${createPageUrl('SignUp')}?type=barber`;

  return (
    <IcpPageLayout
      title="For Solo Barbers"
      description="ShopTheBarber for independent barbers: flat monthly fee, 0% commission on direct bookings, reminders, and card on file."
      canonicalPath="/for-barbers"
      badge="ICP, Solo barber"
      headline="Your chair. Your clients. No commission on your regulars."
      subhead="You did not spend years building a book to give 20% to a marketplace. ShopTheBarber is built for solo pros who want Cutly-simple booking with Squire-grade ops, at a flat monthly rate per chair."
      icon={<Scissors className="w-12 h-12" />}
      pains={[
        'DMs and paper calendars turn into double bookings and no-shows',
        'Marketplace apps take a cut even when the client is already yours',
        'You want deposits and reminders but not another complicated POS',
        'Instagram traffic has nowhere clean to land and convert',
      ]}
      wins={[
        {
          title: 'Direct booking link',
          body: 'Share one link or QR, guest checkout works without forcing an account.',
        },
        {
          title: 'No-show protection',
          body: 'SMS/email reminders plus card on file and no-show fees you control.',
        },
        {
          title: 'Flat pricing',
          body: '0% platform commission on direct bookings with an active plan, predictable every month.',
        },
      ]}
      ctaLabel="Join as barber"
      ctaHref={signUp}
      secondaryHref="/pricing"
    />
  );
}
