import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useEffectiveRole } from '@/hooks/useEffectiveRole';
import { dashboardPageForAccountType, isBookingProviderAccountType } from '@/lib/accountType';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { Calendar, DollarSign, TrendingUp, Clock, Download, UserCheck, Heart, Scissors, Ban, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { UserAvatar } from '@/components/ui/user-avatar';
import { MetaTags } from '@/components/seo/MetaTags';
import MetricCard from '@/components/dashboard/MetricCard';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { downloadCSV, prepareBookingsForExport } from '@/components/analytics/ExportUtils';
import ReviewCard from '@/components/ui/review-card';
import { PageLoading } from '@/components/ui/page-loading';
import OnboardingSetupBanner from '@/components/onboarding/OnboardingSetupBanner';
import ProviderSetupProgressCard from '@/components/onboarding/ProviderSetupProgressCard';
import ProviderTrustScoreCard from '@/components/provider/ProviderTrustScoreCard';
import PageHeader from '@/components/layout/PageHeader';
import PageContent from '@/components/layout/PageContent';
import { stb, chartColor } from '@/lib/stbUi';
import { cn } from '@/lib/utils';

export default function ProviderDashboard() {
    const navigate = useNavigate();
    const { isAdmin, isLoading: roleLoading, accountType } = useEffectiveRole();

    useEffect(() => {
        if (roleLoading) return;
        if (isAdmin) {
            navigate(createPageUrl('GlobalFinancials'), { replace: true });
            return;
        }
        if (accountType && !isBookingProviderAccountType(accountType)) {
            navigate(createPageUrl(dashboardPageForAccountType(accountType)), { replace: true });
        }
    }, [roleLoading, isAdmin, accountType, navigate]);

    const { data: user, isLoading: isUserLoading } = useQuery({ queryKey: ['currentUser'], queryFn: () => sovereign.auth.me() });
    const [reviewPage, _setReviewPage] = useState(1);
    const [ratingFilter, _setRatingFilter] = useState(null);
    const pageSize = 5;

    // 1. Resolve Shop Context
    const { data: myBarberProfile } = useQuery({
        queryKey: ['my-barber-profile', user?.email],
        queryFn: async () => {
            if (!user) return null;
            const barbers = await sovereign.entities.Barber.filter({ created_by: user.email });
            if (barbers.length > 0) return barbers[0];

            if (user.id) {
                const byUserId = await sovereign.entities.Barber.filter({ user_id: user.id });
                if (byUserId.length > 0) return byUserId[0];
            }
            return null;
        },
        enabled: !!user
    });

    const { data: myShopMembership } = useQuery({
        queryKey: ['my-shop-membership', myBarberProfile?.id],
        queryFn: async () => {
            if (!myBarberProfile) return null;
            const members = await sovereign.entities.ShopMember.filter({ barber_id: myBarberProfile.id });
            return members.find(m => ['owner', 'manager'].includes(m.role));
        },
        enabled: !!myBarberProfile
    });

    const shopId = myShopMembership?.shop_id;

    // 2. Fetch Provider Analytics
    const { data: operationalStats } = useQuery({
        queryKey: ['provider-operational-stats'],
        queryFn: () => sovereign.providerStats.getMyStats(),
        enabled: !!user,
    });

    const { data: analytics } = useQuery({
        queryKey: ['provider-analytics', shopId, myBarberProfile?.id],
        queryFn: () => sovereign.functions.invoke('provider-analytics', { shopId, barberId: myBarberProfile?.id }),
        enabled: !!(shopId || myBarberProfile?.id)
    });

    const { data: bookings = [] } = useQuery({
        queryKey: ['dashboard-bookings', shopId, myBarberProfile?.id],
        queryFn: async () => {
            if (shopId) {
                return sovereign.entities.Booking.filter({ shop_id: shopId });
            }
            if (myBarberProfile?.id) {
                return sovereign.entities.Booking.filter({ barber_id: myBarberProfile.id });
            }
            return [];
        },
        enabled: !!(shopId || myBarberProfile?.id),
    });

    const { data: reviews = [] } = useQuery({
        queryKey: ['dashboard-reviews', shopId, myBarberProfile?.id, ratingFilter, reviewPage],
        queryFn: () =>
            sovereign.reviews.listProvider({
                shop_id: shopId || undefined,
                barber_id: !shopId && myBarberProfile?.id ? myBarberProfile.id : undefined,
                min_rating: ratingFilter || undefined,
                limit: pageSize,
                offset: (reviewPage - 1) * pageSize,
            }),
        enabled: !!(shopId || myBarberProfile?.id),
    });

    const stats = analytics?.summary || {};
    const revenueChartData = analytics?.revenueChart || [];
    const staffData = analytics?.staffPerformance || [];

    const handleExport = () => {
        const dataToExport = prepareBookingsForExport(bookings);
        downloadCSV(dataToExport, `shop_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        toast.success("Analytics report exported");
    };

    if (isUserLoading || roleLoading) return <PageLoading message="Loading dashboard..." />;

    const isShopConsole = Boolean(shopId);
    const upcomingToday = bookings
        .filter(b => b.status === 'confirmed' && new Date(b.start_time) >= new Date())
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
        .slice(0, 3);

    return (
        <div className="stb-page pb-20 font-sans">
            <MetaTags title="Provider Dashboard" description="Real-time shop analytics and performance." />

            <PageHeader
                label="Provider"
                title={isShopConsole ? 'Shop console' : 'Your business'}
                subtitle={
                    isShopConsole
                        ? 'Team performance, revenue, and today\'s appointments.'
                        : 'Today\'s schedule, earnings, and client reviews.'
                }
                compact
                variant="light"
                tier="app"
            >
                <Button onClick={handleExport} variant="outline" className="h-11">
                    <Download className="w-4 h-4 mr-2" /> Export
                </Button>
                <Button asChild className="h-11">
                    <Link to={createPageUrl('ProviderBookings')}>
                        <Calendar className="w-4 h-4 mr-2 inline" /> Open calendar
                    </Link>
                </Button>
            </PageHeader>

            <PageContent>
                <ProviderSetupProgressCard />
                {myBarberProfile?.id && (
                    <div className="mb-6">
                        <ProviderTrustScoreCard barberId={myBarberProfile.id} />
                    </div>
                )}
                <OnboardingSetupBanner autoOpenModal audience="provider" />

                {upcomingToday.length > 0 ? (
                    <section className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-foreground">Today</h2>
                            <Link to={createPageUrl('ProviderBookings')} className="text-sm font-semibold text-primary hover:underline">
                                View all
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {upcomingToday.map((b) => (
                                <BookingCard key={b.id} booking={b} />
                            ))}
                        </div>
                    </section>
                ) : null}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                    <MetricCard
                        title="Total Revenue"
                        value={`$${stats.totalRevenue?.toLocaleString() || '0'}`}
                        subValue="Confirmed Earnings"
                        icon={DollarSign}
                    />
                    <MetricCard
                        title="Tips Received"
                        value={`$${stats.totalTips?.toLocaleString() || '0'}`}
                        subValue={`$${stats.tipsThisMonth?.toLocaleString() || '0'} this month`}
                        icon={Heart}
                    />
                    <MetricCard
                        title="Revenue Forecast"
                        value={`$${stats.revenueForecast?.toLocaleString() || '0'}`}
                        subValue="Expected Income"
                        icon={TrendingUp}
                    />
                    <MetricCard
                        title="Retention Rate"
                        value={`${stats.retentionRate?.toFixed(0) || '0'}%`}
                        subValue="Loyalty Index"
                        icon={UserCheck}
                    />
                    <MetricCard
                        title="Appointments"
                        value={stats.totalAppointments || "0"}
                        subValue={`${stats.upcomingAppointments || 0} Upcoming`}
                        icon={Calendar}
                    />
                </div>

                {operationalStats && (
                    <div className="mb-8">
                        <h2 className="text-lg font-bold text-foreground mb-4">Operational performance</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            <MetricCard
                                title="Services completed"
                                value={operationalStats.completed_services?.toLocaleString() ?? '0'}
                                subValue={`${operationalStats.completed_bookings ?? 0} bookings`}
                                icon={Scissors}
                            />
                            <MetricCard
                                title="Cancellation rate"
                                value={`${operationalStats.cancellation_rate_percent ?? 0}%`}
                                subValue={`${operationalStats.cancelled_bookings ?? 0} cancelled`}
                                icon={Ban}
                            />
                            <MetricCard
                                title="No-show rate"
                                value={`${operationalStats.no_show_rate_percent ?? 0}%`}
                                subValue={`${operationalStats.no_show_bookings ?? 0} no-shows`}
                                icon={Clock}
                            />
                            <MetricCard
                                title="Open disputes"
                                value={operationalStats.disputes_open ?? 0}
                                subValue={`${operationalStats.disputes_total ?? 0} total`}
                                icon={Scale}
                            />
                            <MetricCard
                                title="Rebooking rate"
                                value={`${operationalStats.rebooking_rate_percent ?? 0}%`}
                                subValue={`${operationalStats.repeat_clients ?? 0} repeat clients`}
                                icon={UserCheck}
                            />
                            <MetricCard
                                title="Health score"
                                value={`${operationalStats.health_score ?? 100}/100`}
                                subValue={operationalStats.health_flags?.[0] ?? 'On track'}
                                icon={TrendingUp}
                            />
                        </div>
                    </div>
                )}

                <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 ${shopId ? '' : 'lg:grid-cols-1'}`}>
                    <Card className={`border-border shadow-sm overflow-hidden bg-card rounded-lg ${shopId ? 'lg:col-span-2' : ''}`}>
                        <div className="pt-6 px-6 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold text-foreground">Revenue Velocity</h3>
                                <p className="text-muted-foreground text-sm">Last 7 days performance</p>
                            </div>
                        </div>
                        <div className="h-[320px] w-full pt-8 pr-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueChartData}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={chartColor(1)} stopOpacity={0.15} />
                                            <stop offset="95%" stopColor={chartColor(1)} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'hsl(var(--foreground))', border: 'none', borderRadius: '12px', color: 'hsl(var(--background))' }}
                                    />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                                    <YAxis hide={true} />
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                                    <Area type="monotone" dataKey="revenue" stroke={chartColor(1)} strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    {shopId ? (
                    <Card className="border-border shadow-sm bg-card rounded-lg p-6">
                        <h3 className="text-lg font-bold text-foreground mb-6">Staff Performance</h3>
                        <div className="space-y-5">
                            {staffData.length > 0 ? staffData.sort((a, b) => b.revenue - a.revenue).slice(0, 5).map((member) => (
                                <div key={member.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <UserAvatar src={member.image_url} name={member.name} className="w-10 h-10" />
                                        <div>
                                            <p className="text-sm font-bold text-foreground">{member.name}</p>
                                            <p className="text-[10px] text-muted-foreground font-bold uppercase">{member.bookings} Bookings</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={cn(stb.metricValue, 'text-sm text-foreground')}>${member.revenue?.toLocaleString()}</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="py-12 text-center text-muted-foreground text-sm">No data available</div>
                            )}
                        </div>
                    </Card>
                    ) : null}
                </div>

                <Tabs defaultValue="upcoming" className="w-full">
                    <TabsList className="bg-muted p-1 rounded-lg mb-6">
                        <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                        <TabsTrigger value="history">History</TabsTrigger>
                        <TabsTrigger value="reviews">Reviews</TabsTrigger>
                    </TabsList>

                    <TabsContent value="upcoming">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {bookings.filter(b => b.status === 'confirmed' && new Date(b.start_time) >= new Date()).slice(0, 8).map((b) => (
                                <BookingCard key={b.id} booking={b} />
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="history">
                        <div className="space-y-4">
                            {bookings.filter(b => b.status === 'completed' || (b.status === 'confirmed' && new Date(b.start_time) < new Date())).slice(0, 10).map((b) => (
                                <div key={b.id} className="flex items-center justify-between p-4 stb-panel">
                                    <div className="flex items-center gap-4">
                                        <UserAvatar user={{ full_name: b.created_by?.split('@')[0] }} className="w-10 h-10" />
                                        <div>
                                            <p className="text-sm font-bold text-foreground">{b.created_by?.split('@')[0] || 'Guest'}</p>
                                            <p className="text-[11px] text-muted-foreground font-medium">{format(new Date(b.start_time), 'MMM dd, HH:mm')}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={cn(stb.metricValue, 'text-sm text-foreground')}>${b.price_at_booking}</p>
                                        <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-full font-bold uppercase">Settled</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="reviews">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {reviews.map((review) => (
                                <ReviewCard key={review.id} review={review} />
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
            </PageContent>
        </div>
    );
}

function BookingCard({ booking }) {
    return (
        <Card className="hover:shadow-md transition-all p-5 border-border group bg-card  stb-surface-hover">
            <div className="flex justify-between items-start mb-4">
                <div className="text-right">
                    <p className={cn(stb.metricValue, 'text-sm text-foreground')}>{format(parseISO(booking.start_time), 'HH:mm')}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">{format(parseISO(booking.start_time), 'EEE dd')}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                    <Clock className="w-5 h-5" />
                </div>
            </div>
            <div className="mb-4">
                <p className="text-sm font-bold text-foreground truncate">{booking.client_name || 'Guest User'}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{booking.service_snapshot?.name || 'Standard Service'}</p>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-dashed border-border">
                <div className="flex items-center gap-2">
                    <UserAvatar user={{ full_name: booking.barber_name }} className="w-6 h-6" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase truncate max-w-[80px]">{booking.barber_name}</span>
                </div>
                <span className={cn(stb.metricValue, 'text-xs text-foreground')}>${booking.price_at_booking}</span>
            </div>
        </Card>
    );
}