import { useQuery } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DollarSign,
    TrendingUp,
    Calendar,
    Download,
    BarChart3,
    Users,
    RefreshCw,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { MetaTags } from '@/components/seo/MetaTags';
import { PageLoading } from '@/components/ui/page-loading';
import { PageError } from '@/components/ui/page-error';

const PIE_COLORS = ['#D08B3D', '#0B2545', '#4B5563', '#9CA3AF', '#6366f1', '#10b981', '#f59e0b', '#ef4444'];

function BenchmarkTierBadge({ tier }) {
    const map = {
        great: { label: 'Top quartile', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200' },
        good: { label: 'On track', cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' },
        below: { label: 'Below peers', cls: 'bg-amber-100 text-amber-800 dark:bg-energy/10/30 dark:text-amber-200' },
    };
    const t = map[tier] ?? map.below;
    return <Badge className={t.cls}>{t.label}</Badge>;
}

function formatMetricValue(value, unit) {
    if (value == null) return '-';
    if (unit === 'eur') return `€${value.toLocaleString()}`;
    if (unit === 'percent') return `${value}%`;
    return String(value);
}

function ComparisonRow({ row }) {
    const better =
        row.lower_is_better
            ? row.yours <= row.cohort_median
            : row.yours >= row.cohort_median;

    return (
        <div className="rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
                <p className="font-medium text-foreground">{row.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                    vs {row.cohort_size} similar {row.cohort_size === 1 ? 'shop' : 'shops'}, median{' '}
                    {formatMetricValue(row.cohort_median, row.unit)}, top 25%{' '}
                    {formatMetricValue(row.cohort_p75, row.unit)}
                </p>
            </div>
            <div className="flex items-center gap-4">
                <div className="text-right">
                    <p className="text-2xl font-bold">{formatMetricValue(row.yours, row.unit)}</p>
                    <p className={`text-xs ${better ? 'text-emerald-600' : 'text-muted-foreground'}`}>You</p>
                </div>
                <BenchmarkTierBadge tier={row.tier} />
            </div>
        </div>
    );
}

export default function ShopAnalytics() {
    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => sovereign.auth.me(),
    });

    const { data: myBarberProfile } = useQuery({
        queryKey: ['shop-analytics-barber', user?.id],
        queryFn: async () => {
            if (!user?.id) return null;
            const byUserId = await sovereign.entities.Barber.filter({ user_id: user.id });
            if (byUserId.length > 0) return byUserId[0];
            if (user.email) {
                const byEmail = await sovereign.entities.Barber.filter({ created_by: user.email });
                if (byEmail.length > 0) return byEmail[0];
            }
            return null;
        },
        enabled: !!user,
    });

    const { data: ownedShop } = useQuery({
        queryKey: ['shop-analytics-owned', user?.id],
        queryFn: async () => {
            if (!user?.id) return null;
            const shops = await sovereign.entities.Shop.filter({ owner_id: user.id });
            return shops[0] ?? null;
        },
        enabled: !!user,
    });

    const { data: membership } = useQuery({
        queryKey: ['shop-analytics-membership', myBarberProfile?.id],
        queryFn: async () => {
            if (!myBarberProfile?.id) return null;
            const members = await sovereign.entities.ShopMember.filter({ barber_id: myBarberProfile.id });
            return members.find((m) => ['owner', 'manager'].includes(m.role)) ?? null;
        },
        enabled: !!myBarberProfile?.id,
    });

    const shopId = ownedShop?.id ?? membership?.shop_id ?? null;

    const { data, isLoading, isError, refetch, isFetching } = useQuery({
        queryKey: ['shop-benchmarks', shopId, myBarberProfile?.id],
        queryFn: () =>
            shopId
                ? sovereign.providerStats.getBenchmarks({ shop_id: shopId })
                : sovereign.providerStats.getBenchmarks({ barber_id: myBarberProfile?.id }),
        enabled: !!(shopId || myBarberProfile?.id),
        staleTime: 60_000,
    });

    if (!user || (myBarberProfile === undefined && ownedShop === undefined)) {
        return <PageLoading message="Loading shop context..." />;
    }

    if (!shopId && !myBarberProfile?.id) {
        return (
            <div className="min-h-screen py-12 px-4">
                <PageError title="No shop linked" message="Connect a shop or barber profile to view benchmarks." />
            </div>
        );
    }

    if (isLoading) return <PageLoading message="Loading shop analytics..." />;
    if (isError || !data) return <PageError onRetry={refetch} />;

    const you = data.you ?? {};
    const revenueTrend = data.revenue_trend ?? [];
    const serviceMix = (data.service_mix ?? []).map((s, i) => ({
        ...s,
        color: PIE_COLORS[i % PIE_COLORS.length],
    }));
    const totalServices = serviceMix.reduce((sum, s) => sum + (s.count ?? 0), 0);

    return (
        <div className="min-h-screen py-12 bg-background-light dark:bg-background-dark font-sans">
            <MetaTags
                title="Shop Analytics"
                description="Performance benchmarks vs similar shops on ShopTheBarber."
            />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                    <div>
                        <h1 className="text-4xl font-display font-bold text-charcoal dark:text-white mb-2">
                            Shop Analytics
                        </h1>
                        <p className="text-lg text-slate dark:text-matte-silver">
                            You vs similar shops, {data.cohort?.label}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                            {data.shop?.name}, {data.shop?.size_band_label}, {data.shop?.chair_count}{' '}
                            {data.shop?.chair_count === 1 ? 'chair' : 'chairs'}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="rounded-xl" onClick={() => refetch()} disabled={isFetching}>
                            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                        <Button variant="outline" className="rounded-xl" disabled>
                            <Download className="w-4 h-4 mr-2" />
                            Export
                        </Button>
                    </div>
                </motion.div>

                <div className="grid md:grid-cols-4 gap-6 mb-8">
                    {[
                        {
                            label: 'Revenue (30d)',
                            value: `€${(you.revenue_30d_eur ?? 0).toLocaleString()}`,
                            sub: `€${you.revenue_per_chair_30d_eur ?? 0}/chair`,
                            icon: DollarSign,
                        },
                        {
                            label: 'Completed bookings',
                            value: String(you.completed_bookings ?? 0),
                            sub: `Avg ticket €${you.avg_booking_value ?? 0}`,
                            icon: TrendingUp,
                        },
                        {
                            label: 'Rebooking rate',
                            value: `${you.rebooking_rate_percent ?? 0}%`,
                            sub: 'Repeat clients',
                            icon: Users,
                        },
                        {
                            label: 'No-show rate',
                            value: `${you.no_show_rate_percent ?? 0}%`,
                            sub: `${you.cancellation_rate_percent ?? 0}% cancellations`,
                            icon: Calendar,
                        },
                    ].map((stat, idx) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                        >
                            <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                                <CardContent className="p-6">
                                    <stat.icon className="w-10 h-10 text-primary mb-4" />
                                    <p className="text-sm text-slate dark:text-matte-silver mb-1">{stat.label}</p>
                                    <p className="text-3xl font-display font-bold text-charcoal dark:text-white">
                                        {stat.value}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5" />
                            Benchmark dashboard
                        </CardTitle>
                        <CardDescription>
                            SQUIRE-style peer comparison, {data.cohort?.peer_count ?? 0} shops in your cohort
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {(data.comparisons ?? []).map((row) => (
                            <ComparisonRow key={row.metric} row={row} />
                        ))}
                    </CardContent>
                </Card>

                {revenueTrend.length > 0 && (
                    <div className="grid lg:grid-cols-2 gap-6 mb-8">
                        <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                            <CardContent className="p-6">
                                <h3 className="text-xl font-bold text-charcoal dark:text-white mb-6">Revenue trend</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={revenueTrend}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip formatter={(v) => [`€${v}`, 'Revenue']} />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="revenue_eur"
                                            stroke="#D08B3D"
                                            strokeWidth={3}
                                            name="Revenue (€)"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {serviceMix.length > 0 && (
                            <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                                <CardContent className="p-6">
                                    <h3 className="text-xl font-bold text-charcoal dark:text-white mb-6">
                                        Service mix
                                    </h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={serviceMix}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, count }) =>
                                                    totalServices > 0
                                                        ? `${name} ${Math.round((count / totalServices) * 100)}%`
                                                        : name
                                                }
                                                outerRadius={100}
                                                dataKey="count"
                                            >
                                                {serviceMix.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

                {revenueTrend.length > 0 && (
                    <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                        <CardContent className="p-6">
                            <h3 className="text-xl font-bold text-charcoal dark:text-white mb-6">Monthly bookings</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={revenueTrend}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar
                                        dataKey="bookings"
                                        fill="#D08B3D"
                                        radius={[8, 8, 0, 0]}
                                        name="Bookings"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
