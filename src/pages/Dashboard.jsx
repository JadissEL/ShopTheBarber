import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { Search, MapPin, Bell, Menu, MessageSquare, Calendar, Award, DollarSign, Zap, UserCheck, CloudSun, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { RefreshIndicator } from '@/components/ui/refresh-indicator';
import { MetaTags } from '@/components/seo/MetaTags';
import { Button } from '@/components/ui/button';
import NextAppointmentCard from '@/components/dashboard/NextAppointmentCard';
import QuickActions from '@/components/dashboard/QuickActions';
import SmartSuggestions from '@/components/dashboard/SmartSuggestions';
import LoyaltyGoalCard from '@/components/dashboard/LoyaltyGoalCard';
import MonthlySpendingCard from '@/components/dashboard/MonthlySpendingCard';
import ClientBottomNav from '@/components/dashboard/ClientBottomNav';
import BarberCard from '@/components/ui/barber-card';
import SidebarMenu from '@/components/dashboard/SidebarMenu';
import InsightBanner from '@/components/dashboard/InsightBanner';
import QuickInsights from '@/components/dashboard/QuickInsights';
import AIRecommendations from '@/components/dashboard/AIRecommendations';
import MessagesPanel from '@/components/dashboard/MessagesPanel';
import NotificationsPanel from '@/components/dashboard/NotificationsPanel';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Dashboard() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const { data: user, isFetching: isUserFetching } = useQuery({ queryKey: ['currentUser'], queryFn: () => sovereign.auth.me() });

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
    queryKey: ['my-bookings'],
    queryFn: () => sovereign.entities.Booking.filter({ created_by: user?.email }),
    enabled: !!user?.email,
    initialData: []
  });

  const { data: services } = useQuery({
    queryKey: ['dashboard-services'],
    queryFn: () => sovereign.entities.Service.list(),
    initialData: []
  });

  const { data: loyaltyProfile } = useQuery({
    queryKey: ['loyalty-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const profiles = await sovereign.entities.LoyaltyProfile.filter({ user_id: user.id });
      if (profiles.length > 0) return profiles[0];
      return await sovereign.entities.LoyaltyProfile.create({
        user_id: user.id,
        current_points: 0,
        lifetime_points: 0,
        tier: 'Bronze',
        joined_date: new Date().toISOString()
      });
    },
    enabled: !!user
  });

  const { data: _messages = [] } = useQuery({
    queryKey: ['messages', user?.email],
    queryFn: () => user ? sovereign.entities.Message.filter({ receiver_email: user.email, is_read: false }, '-created_at', 5) : [],
    enabled: !!user
  });

  const { data: loyaltyTransactions = [] } = useQuery({
    queryKey: ['loyalty-transactions', user?.id],
    queryFn: () => user ? sovereign.entities.LoyaltyTransaction.filter({ user_id: user.id }, '-date_text', 10) : [],
    enabled: !!user
  });

  const nextBooking = {
    month: 'DEC',
    day: '12',
    time: '10:30',
    time_label: 'Tomorrow at 10:30 AM · 45 mins',
    duration_minutes: 45,
    service_name: 'Signature Fade & Beard Sculpt',
    barber_name: 'James St. Patrick',
    barber_image: 'https://images.unsplash.com/photo-1503951914290-93d32b06769c?w=100&auto=format&fit=crop',
    shop_name: 'Mayfair, London'
  };

  const isRefreshing = isUserFetching || isBarbersFetching || isShopsFetching;
  const lastBooking = myBookings && myBookings.length > 0 ? myBookings[0] : null;

  const insights = [
    lastBooking
      ? { text: `Your last cut was on ${lastBooking.date_text || 'recent'} with ${lastBooking.barber_name || 'your barber'}. Time to rebook?`, icon: <UserCheck className="w-3 h-3" /> }
      : { text: "Welcome! Start your journey by booking your first cut today.", icon: <UserCheck className="w-3 h-3" /> },
    { text: "You usually book on Fridays—book early to secure your slot.", icon: <Calendar className="w-3 h-3" /> },
    { text: "You've saved $120 with loyalty rewards this year. Nice work!", icon: <DollarSign className="w-3 h-3" /> }
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const displayBarbers = barbers.length > 0 ? barbers : [
    { id: '1', name: 'James St. Patrick', rating: 5.0, review_count: 88, location: 'Tribeca', image_url: 'https://images.unsplash.com/photo-1503951914290-93d32b06769c?w=200&fit=crop' },
    { id: '2', name: 'Tasha Green', rating: 4.9, review_count: 124, location: 'SoHo', image_url: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=200&fit=crop' },
    { id: '3', name: 'Marcus Brooks', rating: 4.8, review_count: 56, location: 'Brooklyn', image_url: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=200&fit=crop' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans pb-24 lg:pb-8 selection:bg-primary/20">
      <MetaTags
        title="Dashboard"
        description="Control center for your grooming life."
      />

      {/* Client dashboard header: profile, elite status, gold badge, notifications */}
      <header className="sticky top-0 z-40 bg-card border-b border-border shadow-sm">
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
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Elite Client</p>
                <h1 className="text-lg font-bold text-foreground truncate">{user?.full_name || 'Guest'}</h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
                    <Award className="w-3.5 h-3.5" /> {(loyaltyProfile?.tier || 'Gold').replace(/^./, (c) => c.toUpperCase())} Member
                  </span>
                  <span className="text-muted-foreground text-sm font-medium">
                    {(loyaltyProfile?.current_points ?? 8420).toLocaleString()} pts
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <RefreshIndicator isRefreshing={isRefreshing} />
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground relative"
                onClick={() => setIsNotificationsOpen(true)}
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
                onClick={() => setIsMenuOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Find a barber, service, or shop..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              />
            </div>
            <Link to={createPageUrl('Marketplace')} className="hidden sm:inline-flex items-center self-center text-sm font-semibold text-muted-foreground hover:text-primary whitespace-nowrap">
              Marketplace
            </Link>
            <Link to={createPageUrl('Explore')}>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm h-auto py-2.5 px-4 rounded-xl shadow-sm">
                Book
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <SidebarMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} user={user} />
      <MessagesPanel isOpen={isMessagesOpen} onClose={() => setIsMessagesOpen(false)} />
      <NotificationsPanel isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />

      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">

        <div className="space-y-8">
          {/* Next Appointment */}
          <section>
            <NextAppointmentCard booking={nextBooking} />
            <div className="flex gap-3 mt-4">
              <Link to={createPageUrl('UserBookings')} className="flex-1">
                <Button variant="outline" className="w-full border-border bg-card text-foreground hover:bg-muted hover:border-primary/30 text-xs font-semibold h-9 rounded-xl">
                  View All Bookings
                </Button>
              </Link>
              <Button variant="outline" className="flex-1 w-full border-border bg-card text-foreground hover:bg-muted hover:border-primary/30 text-xs font-semibold h-9 rounded-xl">
                View History
              </Button>
            </div>
          </section>

          {/* Loyalty Goal + Monthly Spending */}
          <section className="grid grid-cols-2 gap-4">
            <LoyaltyGoalCard
              percent={Math.min(100, Math.round(((loyaltyProfile?.current_points ?? 8420) / ((loyaltyProfile?.current_points ?? 8420) + 1500)) * 100)) || 75}
              currentPoints={loyaltyProfile?.current_points ?? 8420}
              nextTier="Platinum"
              pointsToNext={1500}
            />
            <MonthlySpendingCard amount="342.00" trend="+12%" currency="$" />
          </section>

          <section>
            <SmartSuggestions />
          </section>

          <section>
            <QuickActions />
          </section>

          <InsightBanner
            message={<span>You've earned <span className="font-bold text-primary">120 points</span> this month—only 40 more to unlock a free cut!</span>}
            actionText="View Rewards"
          />

          <section>
            <QuickInsights insights={insights} />
          </section>

          <section>
            <AIRecommendations />
          </section>

          {/* Recommended For You */}
          <section>
            <div className="mb-4">
              <h2 className="text-xl font-bold text-foreground tracking-tight">Recommended for You</h2>
              <p className="text-sm text-muted-foreground mt-1">Based on your recent style.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(services.length > 0 ? services.slice(0, 4) : [
                { name: 'Hot Towel Shave', category: 'Relaxing add-on', price: 25, image_url: 'https://images.unsplash.com/photo-1503951914290-93d32b06769c?w=400' },
                { name: 'Scalp Treatment', category: 'Deep cleansing', price: 35, image_url: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400' },
                { name: 'Beard Sculpting', category: 'Precision detail', price: 30, image_url: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=400' },
                { name: 'Gray Blending', category: 'Natural look', price: 45, image_url: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=400' }
              ]).map((item, i) => {
                const serviceData = item.data || item;
                const price = serviceData.price || parseFloat((serviceData.price_text || '0').replace(/[^0-9.]/g, '')) || 0;
                return (
                  <Link key={i} to={createPageUrl(`Explore?q=${encodeURIComponent(serviceData.name)}`)}>
                    <div className="group cursor-pointer bg-card border border-border rounded-2xl p-3 shadow-sm hover:shadow-md hover:border-primary/20 transition-all flex gap-4 items-center sm:block sm:text-center h-full">
                      <OptimizedImage
                        src={serviceData.image_url}
                        alt={serviceData.name}
                        className="w-16 h-16 sm:w-full sm:h-32 object-cover rounded-xl sm:mb-3"
                        width={300}
                      />
                      <div className="flex-1 text-left sm:text-center min-w-0">
                        <h3 className="font-bold text-foreground text-sm truncate" title={serviceData.name}>{serviceData.name}</h3>
                        <p className="text-xs text-muted-foreground truncate">{serviceData.category || 'Service'}</p>
                        <span className="block mt-1 text-xs font-semibold text-primary">${price.toFixed(2)}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Book with Your Top Barbers */}
          <section>
            <div className="mb-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-foreground tracking-tight">Book with Your Top Barbers</h2>
                <Link to={createPageUrl('Explore')} className="text-sm text-primary hover:underline font-medium">View All</Link>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Professionals you've booked with before.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayBarbers.slice(0, 3).map((barber) => {
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
          </section>

          {/* Loyalty & Wallet */}
          <section>
            <div className="mb-4">
              <h2 className="text-xl font-bold text-foreground tracking-tight">Loyalty & Wallet</h2>
              <p className="text-sm text-muted-foreground mt-1">Earn points, unlock rewards, and manage your payment methods.</p>
            </div>

            {loyaltyProfile ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-primary to-primary/90 rounded-2xl p-6 text-primary-foreground shadow-lg">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-primary-foreground/80 text-sm mb-1">Your Points</p>
                        <h3 className="text-4xl font-bold">{loyaltyProfile.current_points || 0}</h3>
                      </div>
                      <div className="px-3 py-1 bg-card/20 rounded-full text-xs font-bold">
                        {loyaltyProfile.tier || 'Bronze'}
                      </div>
                    </div>
                    <div className="h-2 bg-card/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-card rounded-full transition-all"
                        style={{ width: `${Math.min(100, (loyaltyProfile.current_points / 1000) * 100)}%` }}
                      />
                    </div>
                    <p className="text-primary-foreground/80 text-xs mt-2">
                      {1000 - (loyaltyProfile.current_points || 0)} points to next reward
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-muted-foreground text-sm mb-1">Wallet Balance</p>
                        <h3 className="text-4xl font-bold text-foreground">$45.00</h3>
                      </div>
                      <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">Add Funds</Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Available for bookings & tips</p>
                  </div>
                </div>

                <div className="mt-6">
                  <Link to={createPageUrl('Loyalty')} className="inline-block">
                    <Button variant="outline" className="border-border text-primary hover:bg-primary/5 hover:border-primary/30">
                      View All Rewards & History →
                    </Button>
                  </Link>
                </div>

                {loyaltyTransactions.length > 0 && (
                  <Card className="border-border bg-card shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-base text-foreground">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {loyaltyTransactions.slice(0, 5).map((tx, i) => (
                          <div key={i} className="flex justify-between items-center text-sm py-2 border-b border-border last:border-0">
                            <span className="text-muted-foreground">{tx.description}</span>
                            <span className={`font-bold ${tx.points > 0 ? 'text-primary' : 'text-rose-600'}`}>
                              {tx.points > 0 ? '+' : ''}{tx.points}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="border-border bg-card shadow-sm">
                <CardContent className="py-8 text-center">
                  <Award className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Sign in to start earning loyalty points</p>
                </CardContent>
              </Card>
            )}
          </section>

          {/* Featured Studios */}
          <section className="pb-4">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-foreground tracking-tight">Featured Studios Nearby You</h2>
              <p className="text-sm text-muted-foreground mt-1">Top-rated spots in your area.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(shops.length > 0 ? shops.slice(0, 2) : [
                { id: 's1', name: 'Downtown Cuts', location: 'Downtown', image_url: 'https://images.unsplash.com/photo-1512690459411-b9245aed8ad6?w=800&q=80' },
                { id: 's2', name: "The Gentlemen's Den", location: 'West End', image_url: 'https://images.unsplash.com/photo-1521590832169-ddad1f9f1977?w=800&q=80' }
              ]).map((shop, i) => (
                <Link key={shop.id || i} to={createPageUrl(`ShopProfile?id=${shop.id}`)}>
                  <div className="group relative aspect-[16/9] rounded-2xl overflow-hidden border border-border bg-card shadow-sm hover:shadow-md transition-all">
                    <OptimizedImage
                      src={shop.image_url}
                      alt={shop.name}
                      fill
                      imgClassName="group-hover:scale-105 transition-transform duration-700"
                      width={800}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <div className="flex justify-between items-end">
                        <div>
                          <h3 className="text-xl font-bold text-white mb-1 drop-shadow-md">{shop.name}</h3>
                          <p className="text-muted-foreground text-sm flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" /> {shop.location || "Central District"}
                          </p>
                        </div>
                        <span className="bg-card/95 text-foreground text-xs font-bold px-3 py-1 rounded-full shadow">
                          4.9 ★
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>

      <ClientBottomNav />
    </div>
  );
}
