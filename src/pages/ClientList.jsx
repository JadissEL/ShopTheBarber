import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { MetaTags } from '@/components/seo/MetaTags';
import { ArrowLeft, DollarSign, Calendar } from 'lucide-react';
import ContextualBackLink from '@/components/ui/ContextualBackLink';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { useManagedShop } from '@/hooks/useManagedShop';
import { UserAvatar } from '@/components/ui/user-avatar';
import { PageLoading } from '@/components/ui/page-loading';
import { format, parseISO } from 'date-fns';
import { stb } from '@/lib/stbUi';
import { cn } from '@/lib/utils';
import PageHeader from '@/components/layout/PageHeader';
import PageContent from '@/components/layout/PageContent';

export default function ClientList() {
  const { user, shopId, isManager, isLoading: shopLoading } = useManagedShop();
  const isProvider = user && ['provider', 'barber', 'shop_owner', 'admin'].includes(user.role);

  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['shop-clients', shopId],
    queryFn: () => sovereign.shop.getClients(shopId),
    enabled: !!shopId && isManager,
  });

  const { data: barberBookings = [] } = useQuery({
    queryKey: ['provider-client-bookings', user?.email],
    queryFn: async () => {
      const barbers = await sovereign.entities.Barber.filter({ created_by: user.email });
      const barber = barbers[0];
      if (!barber) return [];
      return sovereign.entities.Booking.filter({ barber_id: barber.id });
    },
    enabled: !!user && isProvider && !shopId,
  });

  if (!user) {
    return (
      <div className="stb-page flex items-center justify-center p-4">
        <MetaTags title="Client List" description="View your clients" />
        <Card className="max-w-md w-full">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">Sign in to view client list.</p>
            <Link to={createPageUrl('SignIn')} className="text-primary font-semibold hover:underline">Sign in</Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isProvider) {
    return (
      <div className="stb-page flex items-center justify-center p-4">
        <MetaTags title="Client List" description="View your clients" />
        <Card className="max-w-md w-full">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">This page is for providers.</p>
            <ContextualBackLink />
          </CardContent>
        </Card>
      </div>
    );
  }

  const soloClients = !shopId
    ? Object.values(
        barberBookings.reduce((acc, b) => {
          const key = b.client_id || b.client_name || b.id;
          if (!acc[key]) {
            acc[key] = {
              client_id: b.client_id,
              full_name: b.client_name || 'Guest',
              email: b.created_by,
              visit_count: b.status === 'completed' ? 1 : 0,
              total_spent: b.status === 'completed' ? (b.price_at_booking || 0) : 0,
              last_visit: b.start_time,
            };
          } else if (b.status === 'completed') {
            acc[key].visit_count += 1;
            acc[key].total_spent += b.price_at_booking || 0;
          }
          if (b.start_time > acc[key].last_visit) acc[key].last_visit = b.start_time;
          return acc;
        }, {})
      )
    : clients;

  const loading = shopLoading || (shopId && clientsLoading);

  return (
    <div className="stb-page pb-20 font-sans">
      <MetaTags title="Client List" description="Clients who have booked with you" />
      <PageHeader
        label="Provider"
        title="Client list"
        subtitle="Visit history and spend from completed bookings"
        compact
        variant="light"
        tier="app"
      />

      <PageContent narrow>
        <Link to={createPageUrl('ProviderDashboard')} className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        {loading ? (
          <PageLoading message="Loading clients…" />
        ) : soloClients.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No clients yet. Completed bookings will appear here.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {soloClients.map((c) => (
              <Card key={c.client_id || c.full_name} className=" border-border">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                  <UserAvatar name={c.full_name} src={c.avatar_url} className="w-12 h-12" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{c.full_name || 'Guest'}</p>
                    {c.email && <p className="text-xs text-muted-foreground truncate">{c.email}</p>}
                  </div>
                  <div className="flex gap-6 text-sm">
                    <div className="text-center">
                      <p className={stb.metricValue}>{c.visit_count}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Visits</p>
                    </div>
                    <div className="text-center">
                      <p className={cn(stb.metricValue, 'flex items-center gap-0.5')}><DollarSign className="w-3 h-3" />{c.total_spent?.toFixed(0)}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Spent</p>
                    </div>
                    <div className="text-center min-w-[80px]">
                      <p className="font-bold text-xs flex items-center gap-1 justify-center">
                        <Calendar className="w-3 h-3" />
                        {c.last_visit ? format(parseISO(c.last_visit), 'MMM d') : '-'}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Last visit</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </PageContent>
    </div>
  );
}
