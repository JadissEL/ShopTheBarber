import { Store } from 'lucide-react';
import { IcpPageLayout } from '@/components/gtm/IcpPageLayout';
import { createPageUrl } from '@/utils';

export default function ForShopOwners() {
  const signUp = `${createPageUrl('SignUp')}?type=shop`;

  return (
    <IcpPageLayout
      title="For Shop Owners"
      description="Run your barbershop on ShopTheBarber: per-location flat fee, team schedules, 0% commission on direct bookings, and retail marketplace."
      canonicalPath="/for-shops"
      badge="ICP, Shop owner"
      headline="Run the floor, not five different apps."
      subhead="Shop owners need one system for chairs, barbers, walk-ins, and payouts, without paying commission on clients who already know your shop. Flat fee per location, optional per-chair add-ons, zero tax on direct rebooks."
      icon={<Store className="w-12 h-12" />}
      pains={[
        'Each barber uses a different calendar and the front desk cannot see the day',
        'Commission marketplaces eat margin on clients who found you on Google Maps',
        'Retail product sales live in a separate tool from appointments',
        'No-show gaps on busy Saturdays hurt revenue and morale',
      ]}
      wins={[
        {
          title: 'Location + team hub',
          body: 'Roster, staff schedules, shop profile, and consolidated booking inbox.',
        },
        {
          title: 'Per location pricing',
          body: 'One flat monthly rate per shop address, scale chairs without surprise commission stacks.',
        },
        {
          title: 'Retail ready',
          body: 'List products in the marketplace so clients add pomade or beard kits at checkout.',
        },
      ]}
      ctaLabel="Register your shop"
      ctaHref={signUp}
      secondaryHref="/pricing"
    />
  );
}
