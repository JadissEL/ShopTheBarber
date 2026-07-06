import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { sovereign } from '@/api/apiClient';
import { getAnalyticsSessionId } from '@/lib/analyticsSession';
import { dashboardPageForAccountType } from '@/lib/accountType';
import { useEffectiveRole } from '@/hooks/useEffectiveRole';
import SearchField from '@/components/ui/search-field';
import { Bell, Menu, Calendar, Award, MessageSquare, Check } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { stb } from '@/lib/stbUi';
import { cn } from '@/lib/utils';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { RefreshIndicator } from '@/components/ui/refresh-indicator';
import { MetaTags } from '@/components/seo/MetaTags';
import { Button } from '@/components/ui/button';
import NextAppointmentCard from '@/components/dashboard/NextAppointmentCard';
import OnboardingSetupBanner from '@/components/onboarding/OnboardingSetupBanner';
import PendingReviewBanner from '@/components/reviews/PendingReviewBanner';
import QuickActions from '@/components/dashboard/QuickActions';
import LoyaltyGoalCard from '@/components/dashboard/LoyaltyGoalCard';
import ClientReputationCard from '@/components/dashboard/ClientReputationCard';
import MonthlySpendingCard from '@/components/dashboard/MonthlySpendingCard';
import BarberCard from '@/components/ui/barber-card';
import SidebarMenu from '@/components/dashboard/SidebarMenu';
import PageContent from '@/components/layout/PageContent';
import PersonalizedBarberPicks from '@/components/dashboard/PersonalizedBarberPicks';
import MessagesPanel from '@/components/dashboard/MessagesPanel';
import NotificationsPanel from '@/components/dashboard/NotificationsPanel';
import RebookButton from '@/components/booking/RebookButton';
import { EmptyState } from '@/components/ui/empty-state';
import {
  computeMonthlySpending,
  resolveTopBarbers,
} from '@/lib/clientDashboardStats';

export default function Dashboard() {
  const navigate = useNavigate();
  const { isProvider, isAdmin, isLoading: roleLoading, accountType } = useEffectiveRole();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const { data: user, isFetching: isUserFetching } = useQuery({ queryKey: ['currentUser'], queryFn: () => sovereign.auth.me() });

  useEffect(() => {
    if (roleLoading) return;
    if (isAdmin) {
      navigate(createPageUrl('GlobalFinancials'), { replace: true });
      return;
    }
    if (accountType && accountType !== 'client') {
      navigate(createPageUrl(dashboardPageForAccountType(accountType)), { replace: true });
    }
  }, [roleLoading, isAdmin, accountType, navigate]);

  useEffect(() => {
    const status = searchParams.get('status');
    const step = searchParams.get('step');
    const bookingId = searchParams.get('bookingId');
    if (status !== 'success') return;
    if (bookingId) {
      sovereign.analytics.track({
        eventName: 'booking_paid',
        session_id: getAnalyticsSessionId(),
        properties: { booking_id: bookingId, source: 'dashboard_return', step: step || 'paid' },
      });
    }
    if (step === 'deposit_paid') toast.success('Deposit paid, your appointment is confirmed!');
    else if (step === 'auth_held') toast.success('Card authorized, see you at your appointment!');
    else if (step === 'card_saved') toast.success('Card saved on file.');
    else toast.success('Payment successful, booking confirmed!');
    searchParams.delete('status');
    searchParams.delete('step');
    searchParams.delete('bookingId');
    setSearchParams(searchParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const { data: barbers, isFetching: isBarbersFetching } = useQuery({
    queryKey: ['dashboard-barbers'],
    queryFn: () => sovereign.entities.Barber.list(),
    initialData: []
  });

  const { data: shops, isFetching: isShopsFetching } = useQuery({
    queryKey: ['dashboard-shops'],
    queryFn: () => sovereign.entities.Shop.list(),
    initialData: []
  });

  const { data: myBookings } = useQuery({
    queryKey: ['my-bookings-dashboard', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const byClient = await sovereign.entities.Booking.filter({ client_id: user.id }, '-start_time', 50);
      if (byClient.length > 0) return byClient;
      if (user.email) {
        return sovereign.entities.Booking.filter({ created_by: user.email }, '-start_time', 50);
      }
      return [];
    },
    enabled: !!user?.id,
    initialData: [],
  });

  const { data: loyaltySummary } = useQuery({
    queryKey: ['loyalty-me', user?.id],
    queryFn: () => sovereign.loyalty.getMe(),
    enabled: !!user,
  });

  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ['wallet-me', user?.id],
    queryFn: () => sovereign.wallet.getMe(),
    enabled: !!user?.id,
  });

  const loyaltyProfile = loyaltySummary?.profile
    ? {
        ...loyaltySummary.profile,
        current_points: loyaltySummary.current_points ?? 0,
        lifetime_points: loyaltySummary.lifetime_points ?? 0,
        tier: loyaltySummary.tier ?? 'Bronze',
      }
    : null;

  const { data: unreadMessages = [] } = useQuery({
    queryKey: ['messages', user?.email],
    queryFn: () => user ? sovereign.entities.Message.filter({ receiver_email: user.email, is_read: false }, '-created_at', 5) : [],
    enabled: !!user
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['user-notifications-badge', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return sovereign.entities.Notification.filter({ user_id: user.id }, '-created_at', 20);
    },
    enabled: !!user?.id,
  });

  const hasUnreadNotifications = notifications.some((n) => !n.is_read);
  const hasUnreadMessages = unreadMessages.length > 0;
  const memberTier = loyaltyProfile?.tier ?? 'Bronze';
  const isEliteClient = memberTier === 'Gold' || memberTier === 'Platinum';

  const pointsToNextReward = Math.max(0, 50 - (loyaltyProfile?.current_points ?? 0));

  const nextBooking = (() => {
    const upcoming = (myBookings || [])
      .filter(b => b.status !== 'cancelled' && b.status !== 'no_show' && new Date(b.start_time) > new Date())
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    if (upcoming.length > 0) {
      const b = upcoming[0];
      const dt = new Date(b.start_time);
      const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
      const barber = barbers.find(br => br.id === b.barber_id);
      const shop = shops.find(s => s.id === b.shop_id);
      return {
        month: months[dt.getMonth()],
        day: String(dt.getDate()),
        time: dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
        time_label: `${dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at ${dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`,
        duration_minutes: b.duration_at_booking || 30,
        service_name: b.service_name || 'Appointment',
        barber_name: barber?.name || 'Your Barber',
        barber_image: barber?.image_url || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=100&auto=format&fit=crop',
        shop_name: shop?.name || shop?.location || ''
      };
    }
    return null;
  })();

  const isRefreshing = isUserFetching || isBarbersFetching || isShopsFetching;
  const lastCompletedForRebook = (myBookings || []).find(
    (b) => b.status === 'completed' && b.barber_id
  );

  const monthlySpending = useMemo(() => computeMonthlySpending(myBookings), [myBookings]);
  const topBarbers = useMemo(() => resolveTopBarbers(myBookings, barbers, 3), [myBookings, barbers]);

  const walletSymbol = (wallet?.currency ?? 'USD') === 'EUR' ? '€' : '$';

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    navigate(q ? `${createPageUrl('Explore')}?q=${encodeURIComponent(q)}` : createPageUrl('Explore'));
  };

  return (
    <div className={`${stb.page  } font-sans lg:pb-8 selection:bg-primary/20`}>
      <MetaTags
        title="Dashboard"
        description="Control center for your grooming life."
      />

      {/* Client dashboard toolbar: profile, search, notifications */}
      <header className="sticky top-0 z-40 stb-glass border-b border-border/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-start gap-3">
            <div className="flex gap-3 min-w-0 flex-1">
              <div className="relative shrink-0">
                <OptimizedImage
                  src={user?.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&fit=crop'}
                  alt={user?.full_name || 'You'}
                  className="w-14 h-14 rounded-full object-cover border-2 border-border"
                  width={56}
                  height={56}
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-primary flex items-center justify-center border-2 border-white">
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {isEliteClient ? 'Elite Client' : 'Member'}
                </p>
                <h1 className={cn(stb.uiHeading, 'text-lg truncate')}>{user?.full_name || 'Guest'}</h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                    <Award className="w-3.5 h-3.5" /> {(loyaltyProfile?.tier || 'Bronze').replace(/^./, (c) => c.toUpperCase())} Member
                  </span>
                  <span className="text-muted-foreground text-sm font-medium">
                    {(loyaltyProfile?.current_points ?? 0).toLocaleString()} pts
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <RefreshIndicator isRefreshing={isRefreshing} />
              <Button
                variant="ghost"
                size="icon"
                className=" text-muted-foreground hover:bg-muted hover:text-foreground relative"
                aria-label="Messages"
                onClick={() => setIsMessagesOpen(true)}
              >
                <MessageSquare className="w-5 h-5" />
                {hasUnreadMessages && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive/100 rounded-full border-2 border-white" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className=" text-muted-foreground hover:bg-muted hover:text-foreground relative"
                aria-label="Notifications"
                onClick={() => setIsNotificationsOpen(true)}
              >
                <Bell className="w-5 h-5" />
                {hasUnreadNotifications && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive/100 rounded-full border-2 border-white" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className=" text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
                onClick={() => setIsMenuOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
            </div>
          </div>
          <form className="flex gap-2 mt-4" onSubmit={handleSearchSubmit}>
            <SearchField
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
              placeholder="Find a barber, service, or shop..."
              className="flex-1"
              aria-label="Search barbers and services"
            />
            <Link to={createPageUrl('Marketplace')} className="hidden sm:inline-flex items-center self-center text-sm font-semibold text-muted-foreground hover:text-primary whitespace-nowrap">
              Marketplace
            </Link>
            <Link to={createPageUrl('Explore')}>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm h-auto py-2.5 px-4 rounded-lg shadow-sm">
                Book
              </Button>
            </Link>
          </form>
        </div>
      </header>

      <SidebarMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} user={user} />
      <MessagesPanel isOpen={isMessagesOpen} onClose={() => setIsMessagesOpen(false)} />
      <NotificationsPanel isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />

      <PageContent>

        <OnboardingSetupBanner autoOpenModal audience="client" />
        <PendingReviewBanner />

        <div className="space-y-8">
          {/* Next Appointment */}
          <section>
            <NextAppointmentCard booking={nextBooking} />
            {!nextBooking && lastCompletedForRebook && (
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 stb-notice-warm bg-primary/5">
                <p className="text-sm text-foreground">
                  Time to rebook with <span className="font-semibold">{lastCompletedForRebook.barber_name || 'your barber'}</span>?
                </p>
                <RebookButton booking={lastCompletedForRebook} className=" shrink-0" />
              </div>
            )}
            <div className="flex gap-3 mt-4">
              <Link to={createPageUrl('UserBookings')} className="flex-1">
                <Button variant="outline" className="w-full border-border bg-card text-foreground hover:bg-muted hover:border-primary/30 text-xs font-semibold h-9 rounded-lg">
                  View All Bookings
                </Button>
              </Link>
              <Link to={`${createPageUrl('UserBookings')}?tab=past`} className="flex-1">
                <Button variant="outline" className="w-full border-border bg-card text-foreground hover:bg-muted hover:border-primary/30 text-xs font-semibold h-9 rounded-lg">
                  View History
                </Button>
              </Link>
            </div>
          </section>

          {/* Loyalty Goal + Monthly Spending */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ClientReputationCard />
            <LoyaltyGoalCard
              percent={Math.min(100, Math.round(((loyaltyProfile?.current_points ?? 0) / 50) * 100))}
              currentPoints={loyaltyProfile?.current_points ?? 0}
              nextTier={loyaltySummary?.next_tier ?? 'Silver'}
              pointsToNext={pointsToNextReward > 0 ? pointsToNextReward : (loyaltySummary?.points_to_next_tier ?? 50)}
            />
            <MonthlySpendingCard
              amount={monthlySpending.amount}
              trend={monthlySpending.trend}
              currency={walletSymbol}
              loading={walletLoading}
            />
          </section>

          <div className="flex flex-wrap gap-2">
            <Link to={createPageUrl('Loyalty')}>
              <Button variant="outline" size="sm" className="text-xs font-semibold h-9">
                Loyalty rewards
              </Button>
            </Link>
            <Link to={createPageUrl('ClientWallet')}>
              <Button variant="outline" size="sm" className="text-xs font-semibold h-9">
                Wallet
              </Button>
            </Link>
            <Link to={createPageUrl('Favorites')}>
              <Button variant="outline" size="sm" className="text-xs font-semibold h-9">
                Favorites
              </Button>
            </Link>
          </div>

          <section>
            <QuickActions />
          </section>

          <section>
            <PersonalizedBarberPicks />
          </section>

          {/* Book with Your Top Barbers */}
          <section>
            <div className="mb-4">
              <div className="flex justify-between items-center">
                <h2 className={cn(stb.uiHeading, 'text-xl')}>Book with Your Top Barbers</h2>
                <Link to={createPageUrl('Explore')} className="text-sm text-primary hover:underline font-medium">View All</Link>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Professionals you've booked with before.</p>
            </div>
            {topBarbers.length === 0 ? (
              <EmptyState
                title="No barbers yet"
                description="Book your first appointment to see your go-to pros here."
                actionLabel="Find a barber"
                actionHref={createPageUrl('Explore')}
              />
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topBarbers.map((barber) => {
                const normalizedBarber = {
                  id: barber.id,
                  name: barber.name || 'Unknown Barber',
                  location: barber.location || 'Location Not Set',
                  image_url: barber.image_url,
                  rating: barber.rating || 0,
                  review_count: barber.review_count || 0,
                  title: barber.title || 'Professional Barber'
                };
                return (
                  <div key={barber.id} className="relative group">
                    <BarberCard barber={normalizedBarber} variant="horizontal" appearance="light" />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:block opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link to={createPageUrl(`BookingFlow?barberId=${barber.id}`)}>
                        <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm rounded-lg text-xs font-bold h-8 px-4">
                          Book
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </section>

          {/* Featured Studios */}
          <section className="pb-4">
            <div className="mb-4">
              <h2 className={cn(stb.uiHeading, 'text-xl')}>Featured Studios Nearby You</h2>
              <p className="text-sm text-muted-foreground mt-1">Top-rated spots in your area.</p>
            </div>
            {shops.length === 0 ? (
              <EmptyState
                title="No studios nearby yet"
                description="When shops join your area, they'll show up here."
                actionLabel="Explore shops"
                actionHref={createPageUrl('Explore')}
              />
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shops.slice(0, 2).map((shop) => {
                const rating = shop.rating ?? shop.average_rating;
                return (
                <Link key={shop.id} to={createPageUrl(`ShopProfile?id=${shop.id}`)}>
                  <div className="group relative aspect-[16/9] stb-panel overflow-hidden bg-card shadow-sm hover:shadow-md transition-all">
                    <OptimizedImage
                      src={shop.image_url}
                      alt={shop.name}
                      fill
                      imgClassName="group-hover:scale-105 transition-transform duration-700"
                      width={800}
                    />
                    <div className="absolute inset-0 bg-foreground/40" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <div className="flex justify-between items-end">
                        <div>
                          <h3 className="text-xl font-bold text-white mb-1 drop-shadow-md">{shop.name}</h3>
                          <p className="text-white/80 text-sm flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" /> {shop.location || shop.city || 'Location not set'}
                          </p>
                        </div>
                        {rating != null && rating > 0 && (
                          <span className="bg-card/95 text-foreground text-xs font-bold px-3 py-1 rounded-full shadow">
                            {Number(rating).toFixed(1)} ★
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );})}
            </div>
            )}
          </section>
        </div>
      </PageContent>
    </div>
  );
}
