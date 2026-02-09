import { useState } from 'react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { Calendar, DollarSign, TrendingUp, Clock, Zap, Download, UserCheck } from 'lucide-react';
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

export default function ProviderDashboard() {
    const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => sovereign.auth.me() });
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
    const { data: analytics } = useQuery({
        queryKey: ['provider-analytics', shopId, myBarberProfile?.id],
        queryFn: () => sovereign.functions.invoke('provider-analytics', { shopId, barberId: myBarberProfile?.id }),
        enabled: !!(shopId || myBarberProfile?.id)
    });

    const { data: bookings = [] } = useQuery({
        queryKey: ['dashboard-bookings', shopId],
        queryFn: () => shopId ? sovereign.entities.Booking.filter({ shop_id: shopId }) : [],
        enabled: !!shopId
    });

    const reviewQuery = {};
    if (shopId) reviewQuery.shop_id = shopId;
    else if (myBarberProfile?.id) reviewQuery.barber_id = myBarberProfile.id;
    if (ratingFilter) reviewQuery.rating = ratingFilter;

    const { data: reviews = [] } = useQuery({
        queryKey: ['dashboard-reviews', reviewQuery, reviewPage],
        queryFn: () => sovereign.entities.Review.filter(reviewQuery, '-created_at', pageSize, (reviewPage - 1) * pageSize),
        enabled: !!(shopId || myBarberProfile?.id)
    });

    const stats = analytics?.summary || {};
    const revenueChartData = analytics?.revenueChart || [];
    const staffData = analytics?.staffPerformance || [];

    const handleExport = () => {
        const dataToExport = prepareBookingsForExport(bookings);
        downloadCSV(dataToExport, `shop_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        toast.success("Analytics report exported");
    };

    return (
        <div className="min-h-screen bg-background pb-20 font-sans">
            <MetaTags title="Provider Dashboard" description="Real-time shop analytics and performance." />

            <div className="bg-card border-b border-border pt-8 pb-6 px-4 md:px-8">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-foreground tracking-tight">Shop Console</h1>
                        <p className="text-muted-foreground mt-1 font-medium">Monitoring platform health and booking velocity.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button onClick={handleExport} variant="outline" className="rounded-xl border-border font-bold bg-card">
                            <Download className="w-4 h-4 mr-2" /> Export
                        </Button>
                        <Button className="rounded-xl bg-primary text-primary-foreground font-bold px-6">
                            <Zap className="w-4 h-4 mr-2" /> Upgrade
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <MetricCard
                        title="Total Revenue"
                        value={`$${stats.totalRevenue?.toLocaleString() || '0'}`}
                        subValue="Confirmed Earnings"
                        icon={DollarSign}
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    <Card className="lg:col-span-2 border-slate-200 shadow-sm overflow-hidden bg-white rounded-2xl">
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
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                                    />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                                    <YAxis hide={true} />
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    <Card className="border-slate-200 shadow-sm bg-white rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-foreground mb-6">Staff Performance</h3>
                        <div className="space-y-5">
                            {staffData.length > 0 ? staffData.sort((a, b) => b.revenue - a.revenue).slice(0, 5).map((member) => (
                                <div key={member.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <UserAvatar src={member.image_url} name={member.name} className="w-10 h-10" />
                                        <div>
                                            <p className="text-sm font-bold text-foreground">{member.name}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase">{member.bookings} Bookings</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-foreground">${member.revenue?.toLocaleString()}</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="py-12 text-center text-slate-400 text-sm">No data available</div>
                            )}
                        </div>
                    </Card>
                </div>

                <Tabs defaultValue="upcoming" className="w-full">
                    <TabsList className="bg-slate-100 p-1 rounded-xl mb-6">
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
                                <div key={b.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl">
                                    <div className="flex items-center gap-4">
                                        <UserAvatar user={{ full_name: b.created_by?.split('@')[0] }} className="w-10 h-10" />
                                        <div>
                                            <p className="text-sm font-bold text-foreground">{b.created_by?.split('@')[0] || 'Guest'}</p>
                                            <p className="text-[11px] text-slate-400 font-medium">{format(new Date(b.start_time), 'MMM dd, HH:mm')}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-foreground">${b.price_at_booking}</p>
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
            </div>
        </div>
    );
}

function BookingCard({ booking }) {
    return (
        <Card className="hover:shadow-md transition-all p-5 border-slate-200 group bg-white rounded-3xl">
            <div className="flex justify-between items-start mb-4">
                <div className="text-right">
                    <p className="text-sm font-black text-foreground">{format(parseISO(booking.start_time), 'HH:mm')}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{format(parseISO(booking.start_time), 'EEE dd')}</p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                    <Clock className="w-5 h-5" />
                </div>
            </div>
            <div className="mb-4">
                <p className="text-sm font-bold text-foreground truncate">{booking.client_name || 'Guest User'}</p>
                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{booking.service_snapshot?.name || 'Standard Service'}</p>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-dashed border-slate-100">
                <div className="flex items-center gap-2">
                    <UserAvatar user={{ full_name: booking.barber_name }} className="w-6 h-6" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase truncate max-w-[80px]">{booking.barber_name}</span>
                </div>
                <span className="text-xs font-black text-foreground">${booking.price_at_booking}</span>
            </div>
        </Card>
    );
}