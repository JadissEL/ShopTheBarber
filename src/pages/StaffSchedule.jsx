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
import { ArrowLeft, Users, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';

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
      <div className="max-w-lg mx-auto py-20 px-4 text-center">
        <MetaTags title="Schedules" description="Manage shop availability" />
        <p className="text-muted-foreground mb-4">Shop owner or manager access is required.</p>
        <Link to={createPageUrl('ProviderDashboard')} className="text-primary font-bold">Back to dashboard</Link>
      </div>
    );
  }

  const dateObj = new Date(`${selectedDate  }T12:00:00`);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 pb-24">
      <MetaTags title="Staff Schedules" description={`Availability for ${shop?.name || 'your shop'}`} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <Link to={createPageUrl('StaffRoster')} className="inline-flex items-center gap-2 text-sm text-primary mb-2">
            <ArrowLeft className="w-4 h-4" /> Team roster
          </Link>
          <h1 className="text-3xl font-black tracking-tight">Schedules & Availability</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Set weekly shifts, time off, and view the multi-barber calendar for {shop?.name}.
          </p>
        </div>
        <Button asChild variant="outline" className="rounded-xl font-bold">
          <Link to={createPageUrl('StaffRoster')}>
            <Users className="w-4 h-4 mr-2" /> Manage team
          </Link>
        </Button>
      </div>

      <div className="mb-10">
        <AvailabilityManager barber={barber} shopId={shopId} />
      </div>

      <section className="border-t border-slate-200 pt-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-black">Shop calendar</h2>
          </div>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto rounded-xl max-w-[200px]"
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
    </div>
  );
}
