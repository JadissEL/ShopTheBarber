import { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { useManagedShop } from '@/hooks/useManagedShop';
import { MetaTags } from '@/components/seo/MetaTags';
import { PageLoading } from '@/components/ui/page-loading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AvailabilityManager from '@/components/provider-settings/AvailabilityManager';
import ShopTeamCalendar from '@/components/provider/ShopTeamCalendar';
import { Users, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import PageHeader from '@/components/layout/PageHeader';
import PageContent from '@/components/layout/PageContent';
import { stb } from '@/lib/stbUi';

export default function StaffSchedule() {
  const { shopId, shop, barber, isManager, isLoading } = useManagedShop();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data: schedule, isLoading: scheduleLoading } = useQuery({
    queryKey: ['shop-schedule', shopId],
    queryFn: () => sovereign.shop.getSchedule(shopId),
    enabled: !!shopId && isManager,
  });

  if (isLoading) return <PageLoading message="Loading schedule…" />;

  if (!isManager || !shopId) {
    return (
      <div className={stb.page}>
        <MetaTags title="Schedules" description="Manage shop availability" />
        <PageContent narrow className="py-20 text-center">
          <p className="text-muted-foreground mb-4">Shop owner or manager access is required.</p>
          <Link to={createPageUrl('ProviderDashboard')} className="text-primary font-bold">Back to dashboard</Link>
        </PageContent>
      </div>
    );
  }

  const dateObj = new Date(`${selectedDate  }T12:00:00`);

  return (
    <div className={`${stb.page  } pb-24 lg:pb-8`}>
      <MetaTags title="Staff Schedules" description={`Availability for ${shop?.name || 'your shop'}`} />

      <PageHeader
        label="Provider"
        title="Schedules & availability"
        subtitle={`Weekly shifts, time off, and team calendar for ${shop?.name}.`}
        compact
        variant="light"
        tier="app"
      >
        <Button asChild variant="outline">
          <Link to={createPageUrl('StaffRoster')}>
            <Users className="w-4 h-4 mr-2" /> Manage team
          </Link>
        </Button>
      </PageHeader>

      <PageContent>
        <Link to={createPageUrl('StaffRoster')} className="inline-flex items-center gap-2 text-sm text-primary mb-6">
          ← Team roster
        </Link>

        <div className="mb-10">
        <AvailabilityManager barber={barber} shopId={shopId} />
      </div>

      <section className="border-t border-border pt-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" />
            <h2 className={stb.uiSubheading}>Shop calendar</h2>
          </div>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto rounded-lg max-w-[200px]"
          />
        </div>

        {scheduleLoading ? (
          <PageLoading message="Loading calendar…" />
        ) : (
          <ShopTeamCalendar
            members={schedule?.members ?? []}
            shifts={schedule?.shifts ?? []}
            bookings={schedule?.upcoming_bookings ?? []}
            selectedDate={dateObj}
          />
        )}
      </section>
      </PageContent>
    </div>
  );
}
