import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { MetaTags } from '@/components/seo/MetaTags';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageLoading } from '@/components/ui/page-loading';
import { PageError } from '@/components/ui/page-error';
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    AreaChart,
    Area,
    ComposedChart,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts';
import {
    TrendingUp,
    Users,
    ShoppingBag,
    Filter,
    Wallet,
    RefreshCw,
    Download,
    Target,
    CalendarX,
    Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const PIE_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444'];

function retentionHeatColor(pct) {
    if (pct >= 60) return 'bg-emerald-500/25 text-emerald-800 dark:text-emerald-200';
    if (pct >= 40) return 'bg-emerald-500/15 text-emerald-900 dark:text-emerald-100';
    if (pct >= 25) return 'bg-amber-500/15 text-amber-900 dark:text-amber-100';
    if (pct >= 10) return 'bg-orange-500/10 text-orange-900 dark:text-orange-100';
    return 'bg-muted text-muted-foreground';
}

function BenchmarkPill({ value, good, great, suffix = '%' }) {
    if (value == null) return null;
    const tier = value >= great ? 'great' : value >= good ? 'good' : 'below';
    const label = tier === 'great' ? 'Top quartile' : tier === 'good' ? 'On track' : 'Below benchmark';
    const cls =
        tier === 'great'
            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
            : tier === 'good'
              ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300'
              : 'bg-amber-500/15 text-amber-800 dark:text-amber-200';
    return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
            {label}, {value}{suffix} (good {good}{suffix}, great {great}{suffix})
        </span>
    );
}

function StatCard({ label, value, sub, icon: Icon }) {
    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
                        <p className="text-2xl font-bold mt-1">{value}</p>
                        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
                    </div>
                    {Icon && (
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <Icon className="w-5 h-5" />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function downloadFunnelCsv(funnel, periodDays) {
    const rows = [
        ['Step', 'Sessions (loose)', 'Strict sessions', 'Users', 'From previous %', 'From home %', 'Strict from home %'],
        ...(funnel?.steps ?? []).map((s) => [
            s.label,
            s.sessions,
            s.strict_sessions ?? 0,
            s.users,
            s.conversion_from_previous_pct,
            s.conversion_from_home_pct,
            s.strict_conversion_from_home_pct ?? 0,
        ]),
    ];
    const trendHeader = ['Date', 'Home', 'Explore', 'Profile', 'Booking started', 'Booking created', 'Paid'];
    const trendRows = (funnel?.daily_trend ?? []).map((d) => [
        d.date,
        d.home ?? 0,
        d.explore ?? 0,
        d.profile ?? 0,
        d.booking_started ?? 0,
        d.booking_created ?? 0,
        d.paid_booking ?? 0,
    ]);
    const csv = [
        `# Funnel export, last ${periodDays} days`,
        rows.map((r) => r.join(',')).join('\n'),
        '',
        '# Daily trend',
        trendHeader.join(','),
        ...trendRows.map((r) => r.join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `funnel-analytics-${periodDays}d.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

export default function AdminProductAnalytics() {
    const [days, setDays] = useState('30');

    const { data, isLoading, isError, refetch, isFetching } = useQuery({
        queryKey: ['admin-product-analytics', days],
        queryFn: () => sovereign.productAnalytics.getDashboard(parseInt(days, 10)),
        staleTime: 60_000,
    });

    if (isLoading) return <PageLoading message="Loading product analytics..." />;
    if (isError || !data) return <PageError onRetry={refetch} />;

    const funnelChart = data.funnel?.steps?.map((s) => ({
        name: s.label,
        sessions: s.sessions,
        strict: s.strict_sessions ?? 0,
        users: s.users,
        from_home: s.conversion_from_home_pct,
    })) ?? [];

    const dailyTrend = data.funnel?.daily_trend ?? [];

    const ltvDistribution = data.ltv?.distribution ?? [];
    const revenueMix = [
        { name: 'Commission', value: data.fee_adoption?.revenue_mix?.commission_eur ?? 0 },
        { name: 'Fixed fee', value: data.fee_adoption?.revenue_mix?.fixed_fee_eur ?? 0 },
    ].filter((x) => x.value > 0);

    const bookingFeeSplit = [
        { name: 'Commission model', value: data.fee_adoption?.bookings?.commission_model ?? 0 },
        { name: 'Fixed-fee waived', value: data.fee_adoption?.bookings?.fixed_fee_waived ?? 0 },
    ];

    const cohortRetentionCurve = data.cohorts?.signup_retention_curve ?? [];
    const rebookChart = (data.cohorts?.first_booking_cohorts ?? []).map((row) => ({
        month: row.cohort,
        m1: row.rebook_m1_pct,
        m3: row.rebook_m3_pct,
        m6: row.rebook_m6_pct,
    }));

    const ltvMonthly = data.trends?.ltv_monthly ?? [];
    const feeMonthly = data.trends?.fee_adoption_monthly ?? [];
    const marketplaceMonthly = data.trends?.marketplace_monthly ?? [];

    const eventCounts = data.analytics_events?.counts ?? {};
    const benchmarks = data.benchmarks ?? {};
    const northStar = data.north_star ?? {};
    const stepTiming = data.funnel?.step_timing ?? [];
    const ltvByCohort = data.ltv_by_signup_cohort ?? [];
    const revenueRetention = data.revenue_retention_cohorts ?? [];
    const monthlyRetentionCurve = data.cohorts?.signup_monthly_retention_curve ?? [];
    const retentionMonths = data.cohorts?.retention_months ?? [0, 1, 2, 3, 6];

    return (
        <div className="stb-page pb-16">
            <MetaTags title="Product Analytics" description="Funnel, cohorts, LTV, and marketplace metrics" />
            <div className="container mx-auto px-6 py-8 max-w-7xl">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Data & Analytics</h1>
                        <p className="text-muted-foreground mt-1">
                            Funnel, cohort retention, customer LTV, fee adoption, and marketplace attachment.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Select value={days} onValueChange={setDays}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Period" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7">Last 7 days</SelectItem>
                                <SelectItem value="30">Last 30 days</SelectItem>
                                <SelectItem value="90">Last 90 days</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
                            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>

                <div className="mb-6">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-2">
                        <Target className="w-4 h-4" /> North-star metrics
                    </h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            label="Booked GMV"
                            value={`€${(northStar.booked_gmv_eur ?? 0).toLocaleString()}`}
                            sub={`${northStar.booked_count ?? 0} bookings, ${northStar.trends?.booked_gmv_change_pct != null ? `${northStar.trends.booked_gmv_change_pct >= 0 ? '+' : ''}${northStar.trends.booked_gmv_change_pct}% vs prior` : '-'}`}
                            icon={Wallet}
                        />
                        <StatCard
                            label="No-show rate"
                            value={`${northStar.no_show_rate_percent ?? 0}%`}
                            sub={`${northStar.no_show_count ?? 0} no-shows, resolved bookings`}
                            icon={CalendarX}
                        />
                        <StatCard
                            label="Provider activation"
                            value={`${northStar.provider_activation_rate_percent ?? 0}%`}
                            sub={
                                <span className="flex flex-col gap-1">
                                    <span>{northStar.providers_fully_activated ?? 0}/{northStar.providers_total ?? 0} fully live</span>
                                    <BenchmarkPill
                                        value={northStar.provider_activation_rate_percent}
                                        good={benchmarks.provider_activation_pct?.good ?? 40}
                                        great={benchmarks.provider_activation_pct?.great ?? 65}
                                    />
                                </span>
                            }
                            icon={Zap}
                        />
                        <StatCard
                            label="D7 retention"
                            value={`${northStar.d7_retention_percent ?? 0}%`}
                            sub={
                                <span className="flex flex-col gap-1">
                                    <span>Paid activity days 1-7, n={northStar.d7_retention_cohort_size ?? 0}</span>
                                    <BenchmarkPill
                                        value={northStar.d7_retention_percent}
                                        good={benchmarks.d7_retention_pct?.good ?? 25}
                                        great={benchmarks.d7_retention_pct?.great ?? 40}
                                    />
                                </span>
                            }
                            icon={Users}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatCard
                        label="Funnel conversion"
                        value={`${data.funnel?.overall_conversion_pct ?? 0}%`}
                        sub={`7d window: ${data.funnel?.windowed_strict_overall_conversion_pct ?? 0}% strict, Home paid`}
                        icon={Filter}
                    />
                    <StatCard
                        label="Avg customer LTV"
                        value={`€${data.ltv?.average_ltv_eur ?? 0}`}
                        sub={`${data.ltv?.customers_with_revenue ?? 0} paying clients`}
                        icon={Wallet}
                    />
                    <StatCard
                        label="Fixed-fee adoption"
                        value={`${data.fee_adoption?.providers?.adoption_rate_pct ?? 0}%`}
                        sub={`${data.fee_adoption?.providers?.on_fixed_fee_plan ?? 0} active plans`}
                        icon={TrendingUp}
                    />
                    <StatCard
                        label="Marketplace attachment"
                        value={`${data.marketplace_attachment?.attachment_rate_ever_pct ?? 0}%`}
                        sub={`90d: ${data.marketplace_attachment?.attachment_within_90d_of_first_booking_pct ?? 0}%, booking order`}
                        icon={ShoppingBag}
                    />
                </div>

                <Card className="mb-8">
                    <CardContent className="py-4">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">
                            Tracked events (last {data.period_days} days), person-level identity stitching on login
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm items-center">
                            <span><strong>{eventCounts.booking_created ?? 0}</strong> booking created</span>
                            <span><strong>{eventCounts.booking_paid ?? 0}</strong> booking paid</span>
                            <span><strong>{eventCounts.marketplace_order_paid ?? 0}</strong> marketplace orders</span>
                            <span><strong>{eventCounts.fixed_fee_enrolled ?? 0}</strong> fixed-fee enrollments</span>
                            {data.marketplace_attachment?.benchmark && (
                                <BenchmarkPill
                                    value={data.marketplace_attachment.benchmark.attach_rate_pct}
                                    good={data.marketplace_attachment.benchmark.industry_good_pct}
                                    great={data.marketplace_attachment.benchmark.industry_great_pct}
                                />
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Tabs defaultValue="funnel" className="space-y-6">
                    <TabsList className="flex flex-wrap h-auto gap-1">
                        <TabsTrigger value="funnel">Booking funnel</TabsTrigger>
                        <TabsTrigger value="cohorts">Cohort retention</TabsTrigger>
                        <TabsTrigger value="ltv">Customer LTV</TabsTrigger>
                        <TabsTrigger value="fees">Commission vs fixed fee</TabsTrigger>
                        <TabsTrigger value="marketplace">Marketplace attachment</TabsTrigger>
                    </TabsList>

                    <TabsContent value="funnel">
                        <Card>
                            <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                <div>
                                    <CardTitle>Homepage Explore Profile Booking Paid</CardTitle>
                                    <CardDescription>
                                        Loose = any step hit. Strict = sequential, no skips. Windowed strict = sequential within{' '}
                                        {data.funnel?.conversion_window_hours ?? 168}h of first homepage view (Mixpanel/Amplitude standard).
                                    </CardDescription>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="shrink-0"
                                    onClick={() => downloadFunnelCsv(data.funnel, data.period_days)}
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Export CSV
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {(data.funnel?.database_truth || data.funnel?.blended_terminal) && (
                                    <div className="grid sm:grid-cols-2 gap-3 mb-6 text-sm">
                                        <div className="rounded-lg border border-border p-3 bg-muted/30">
                                            <p className="text-muted-foreground text-xs uppercase mb-1">Database truth</p>
                                            <p>
                                                {data.funnel.database_truth?.bookings_created ?? 0} bookings created, {' '}
                                                {data.funnel.database_truth?.bookings_paid ?? 0} paid
                                            </p>
                                        </div>
                                        <div className="rounded-lg border border-border p-3 bg-muted/30">
                                            <p className="text-muted-foreground text-xs uppercase mb-1">Blended terminal (events ∪ DB)</p>
                                            <p>
                                                {data.funnel.blended_terminal?.booking_created ?? 0} created, {' '}
                                                {data.funnel.blended_terminal?.paid_booking ?? 0} paid sessions
                                            </p>
                                        </div>
                                    </div>
                                )}
                                <div className="h-80 mb-8">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={funnelChart}>
                                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="sessions" fill="#6366f1" name="Sessions (loose)" radius={[6, 6, 0, 0]} />
                                            <Bar dataKey="strict" fill="#312e81" name="Strict sessions" radius={[6, 6, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                {dailyTrend.length > 0 && (
                                    <div className="h-64 mb-8">
                                        <p className="text-sm font-medium mb-3">Daily trend, home vs paid (sessions)</p>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={dailyTrend}>
                                                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                                                <YAxis />
                                                <Tooltip />
                                                <Legend />
                                                <Line type="monotone" dataKey="home" stroke="#6366f1" name="Home" dot={false} />
                                                <Line type="monotone" dataKey="paid_booking" stroke="#10b981" name="Paid" dot={false} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-border text-left text-muted-foreground">
                                                <th className="py-2 pr-4">Step</th>
                                                <th className="py-2 pr-4">Sessions</th>
                                                <th className="py-2 pr-4">Strict</th>
                                                <th className="py-2 pr-4">7d window</th>
                                                <th className="py-2 pr-4">Users</th>
                                                <th className="py-2 pr-4">Drop-off</th>
                                                <th className="py-2 pr-4">From home</th>
                                                <th className="py-2">Window from home</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.funnel?.steps?.map((step) => (
                                                <tr key={step.key} className="border-b border-border/60">
                                                    <td className="py-3 font-medium">{step.label}</td>
                                                    <td className="py-3">{step.sessions.toLocaleString()}</td>
                                                    <td className="py-3">{(step.strict_sessions ?? 0).toLocaleString()}</td>
                                                    <td className="py-3">{(step.windowed_strict_sessions ?? 0).toLocaleString()}</td>
                                                    <td className="py-3">{step.users.toLocaleString()}</td>
                                                    <td className="py-3">{step.strict_drop_off_from_previous_pct ?? 0}%</td>
                                                    <td className="py-3">{step.conversion_from_home_pct}%</td>
                                                    <td className="py-3">{step.windowed_strict_conversion_from_home_pct ?? 0}%</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {stepTiming.length > 0 && (
                                    <div className="mt-8 overflow-x-auto">
                                        <p className="text-sm font-medium mb-3">Median time between steps (hours)</p>
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b text-muted-foreground text-left">
                                                    <th className="py-2">Transition</th>
                                                    <th className="py-2">Median hours</th>
                                                    <th className="py-2">Sample size</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {stepTiming.map((row) => (
                                                    <tr key={`${row.from_step}-${row.to_step}`} className="border-b border-border/50">
                                                        <td className="py-2">{row.from_label} {row.to_label}</td>
                                                        <td className="py-2">{row.median_hours ?? '-'}</td>
                                                        <td className="py-2">{row.sample_size}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="cohorts">
                        <div className="grid lg:grid-cols-2 gap-6 mb-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Average signup retention curve</CardTitle>
                                    <CardDescription>Weighted avg % with paid booking per week after signup</CardDescription>
                                </CardHeader>
                                <CardContent className="h-64">
                                    {cohortRetentionCurve.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={cohortRetentionCurve}>
                                                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                                <XAxis dataKey="label" />
                                                <YAxis unit="%" domain={[0, 100]} />
                                                <Tooltip formatter={(v) => `${v}%`} />
                                                <Line type="monotone" dataKey="avg_retention_pct" stroke="#6366f1" name="Retention" strokeWidth={2} dot />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No cohort data yet.</p>
                                    )}
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>First-booking rebook rates by cohort</CardTitle>
                                    <CardDescription>% returning for another paid booking</CardDescription>
                                </CardHeader>
                                <CardContent className="h-64">
                                    {rebookChart.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={rebookChart}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                                                <YAxis unit="%" />
                                                <Tooltip formatter={(v) => `${v}%`} />
                                                <Legend />
                                                <Bar dataKey="m1" fill="#a5b4fc" name="M+1" radius={[4, 4, 0, 0]} />
                                                <Bar dataKey="m3" fill="#6366f1" name="M+3" radius={[4, 4, 0, 0]} />
                                                <Bar dataKey="m6" fill="#312e81" name="M+6" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No rebook cohorts yet.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                        {data.cohorts?.vintage_comparison && (
                            <Card className="mb-6">
                                <CardContent className="py-4 flex flex-wrap gap-4 items-center text-sm">
                                    <span>
                                        Latest cohort <strong>{data.cohorts.vintage_comparison.latest_cohort}</strong> M+1:{' '}
                                        <strong>{data.cohorts.vintage_comparison.latest_m1_retention_pct}%</strong>
                                    </span>
                                    {data.cohorts.vintage_comparison.prior_cohorts_avg_m1_pct != null && (
                                        <span className="text-muted-foreground">
                                            Prior avg {data.cohorts.vintage_comparison.prior_cohorts_avg_m1_pct}%, {' '}
                                            {data.cohorts.vintage_comparison.improving ? 'Improving' : 'Below prior vintages'}
                                        </span>
                                    )}
                                    <BenchmarkPill
                                        value={data.cohorts.vintage_comparison.latest_m1_retention_pct}
                                        good={benchmarks.signup_m1_retention_pct?.good ?? 40}
                                        great={benchmarks.signup_m1_retention_pct?.great ?? 60}
                                    />
                                </CardContent>
                            </Card>
                        )}
                        {monthlyRetentionCurve.length > 0 && (
                            <Card className="mb-6">
                                <CardHeader>
                                    <CardTitle>Monthly retention curve (M0-M+6)</CardTitle>
                                    <CardDescription>Flattening curve = PMF signal (ProfitWell / Mixpanel)</CardDescription>
                                </CardHeader>
                                <CardContent className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={monthlyRetentionCurve}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="label" />
                                            <YAxis unit="%" domain={[0, 100]} />
                                            <Tooltip formatter={(v) => `${v}%`} />
                                            <Line type="monotone" dataKey="avg_retention_pct" stroke="#10b981" strokeWidth={2} dot name="Retention" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        )}
                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle>Signup cohort heatmap, monthly retention</CardTitle>
                            </CardHeader>
                            <CardContent className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="text-muted-foreground border-b">
                                            <th className="py-2 text-left">Cohort</th>
                                            <th className="py-2">Size</th>
                                            {retentionMonths.map((m) => (
                                                <th key={m} className="py-2 px-1">{m === 0 ? 'M0' : `M+${m}`}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(data.cohorts?.signup_cohorts ?? []).map((row) => (
                                            <tr key={row.cohort} className="border-b border-border/50">
                                                <td className="py-2 font-medium">{row.cohort}</td>
                                                <td className="py-2 text-center">{row.cohort_size}</td>
                                                {retentionMonths.map((m) => {
                                                    const pct = row.retention[`month_${m}`] ?? 0;
                                                    return (
                                                        <td key={m} className={`py-2 text-center font-medium ${retentionHeatColor(pct)}`}>
                                                            {pct}%
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>
                        {revenueRetention.length > 0 && (
                            <Card className="mb-6">
                                <CardHeader>
                                    <CardTitle>Revenue retention by signup cohort (% of M0)</CardTitle>
                                </CardHeader>
                                <CardContent className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="text-muted-foreground border-b">
                                                <th className="py-2 text-left">Cohort</th>
                                                <th className="py-2">M0 €</th>
                                                {[0, 1, 2, 3, 4, 5, 6].map((m) => (
                                                    <th key={m} className="py-2 px-1">{m === 0 ? 'M0' : `M+${m}`}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {revenueRetention.map((row) => (
                                                <tr key={row.cohort} className="border-b border-border/50">
                                                    <td className="py-2 font-medium">{row.cohort}</td>
                                                    <td className="py-2 text-center">{row.m0_revenue_eur}</td>
                                                    {[0, 1, 2, 3, 4, 5, 6].map((m) => {
                                                        const pct = row.revenue_retention?.[`month_${m}`] ?? 0;
                                                        return (
                                                            <td key={m} className={`py-2 text-center ${retentionHeatColor(Math.min(pct, 100))}`}>
                                                                {pct}%
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </CardContent>
                            </Card>
                        )}
                        <div className="grid lg:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Signup cohorts, weekly paid-booking retention</CardTitle>
                                    <CardDescription>% of signups with a paid booking in each week after signup</CardDescription>
                                </CardHeader>
                                <CardContent className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="text-muted-foreground border-b">
                                                <th className="py-2 text-left">Cohort</th>
                                                <th className="py-2">Size</th>
                                                {(data.cohorts?.retention_weeks ?? []).map((w) => (
                                                    <th key={w} className="py-2 px-1">W{w}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(data.cohorts?.signup_cohorts ?? []).map((row) => (
                                                <tr key={row.cohort} className="border-b border-border/50">
                                                    <td className="py-2 font-medium">{row.cohort}</td>
                                                    <td className="py-2 text-center">{row.cohort_size}</td>
                                                    {(data.cohorts?.retention_weeks ?? []).map((w) => {
                                                        const pct = row.retention[`week_${w}`] ?? 0;
                                                        return (
                                                            <td key={w} className={`py-2 text-center ${retentionHeatColor(pct)}`}>
                                                                {pct}%
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>First-booking cohorts, rebook rate</CardTitle>
                                    <CardDescription>Clients who return for another paid booking</CardDescription>
                                </CardHeader>
                                <CardContent className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-muted-foreground border-b">
                                                <th className="py-2 text-left">First booking</th>
                                                <th className="py-2">Size</th>
                                                <th className="py-2">M+1</th>
                                                <th className="py-2">M+3</th>
                                                <th className="py-2">M+6</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(data.cohorts?.first_booking_cohorts ?? []).map((row) => (
                                                <tr key={row.cohort} className="border-b border-border/50">
                                                    <td className="py-2 font-medium">{row.cohort}</td>
                                                    <td className="py-2 text-center">{row.cohort_size}</td>
                                                    <td className="py-2 text-center">{row.rebook_m1_pct}%</td>
                                                    <td className="py-2 text-center">{row.rebook_m3_pct}%</td>
                                                    <td className="py-2 text-center">{row.rebook_m6_pct}%</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="ltv">
                        <div className="grid lg:grid-cols-3 gap-4 mb-6">
                            <StatCard label="Median LTV" value={`€${data.ltv?.median_ltv_eur ?? 0}`} icon={Users} />
                            <StatCard label="P90 LTV" value={`€${data.ltv?.p90_ltv_eur ?? 0}`} />
                            <StatCard label="Total GMV (clients)" value={`€${data.ltv?.total_platform_gmv_eur ?? 0}`} />
                        </div>
                        <div className="grid lg:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>LTV distribution</CardTitle>
                                </CardHeader>
                                <CardContent className="h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={ltvDistribution}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                                            <YAxis allowDecimals={false} />
                                            <Tooltip />
                                            <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Revenue composition per client</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <p>Avg booking revenue: <strong>€{data.ltv?.avg_booking_revenue_eur ?? 0}</strong></p>
                                    <p>Avg marketplace spend: <strong>€{data.ltv?.avg_marketplace_spend_eur ?? 0}</strong></p>
                                    <p className="text-muted-foreground text-xs pt-4">
                                        LTV = paid bookings + marketplace orders + tips (all time).
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                        {ltvMonthly.length > 0 && (
                            <Card className="mt-6">
                                <CardHeader>
                                    <CardTitle>Monthly GMV trend (12 months)</CardTitle>
                                    <CardDescription>Booking, marketplace, and tips revenue by month</CardDescription>
                                </CardHeader>
                                <CardContent className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={ltvMonthly}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                                            <YAxis />
                                            <Tooltip formatter={(v) => `€${v}`} />
                                            <Legend />
                                            <Area type="monotone" dataKey="booking_gmv_eur" stackId="1" fill="#6366f1" stroke="#6366f1" name="Bookings" />
                                            <Area type="monotone" dataKey="marketplace_gmv_eur" stackId="1" fill="#10b981" stroke="#10b981" name="Marketplace" />
                                            <Area type="monotone" dataKey="tips_gmv_eur" stackId="1" fill="#f59e0b" stroke="#f59e0b" name="Tips" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        )}
                        {ltvByCohort.length > 0 && (
                            <Card className="mt-6">
                                <CardHeader>
                                    <CardTitle>Realised LTV by signup cohort</CardTitle>
                                    <CardDescription>Segment LTV by acquisition vintage, compare channels and onboarding changes (Kissmetrics pattern)</CardDescription>
                                </CardHeader>
                                <CardContent className="h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={ltvByCohort}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="cohort" tick={{ fontSize: 10 }} />
                                            <YAxis />
                                            <Tooltip formatter={(v) => `€${v}`} />
                                            <Legend />
                                            <Bar dataKey="avg_ltv_eur" fill="#6366f1" name="Avg LTV" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="median_ltv_eur" fill="#a5b4fc" name="Median LTV" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="fees">
                        <div className="grid lg:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Provider fee model adoption</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 text-sm">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="rounded-xl bg-muted/50 p-3">
                                            <p className="text-muted-foreground text-xs">Unique providers</p>
                                            <p className="text-xl font-bold">{data.fee_adoption?.providers?.total_unique_providers ?? 0}</p>
                                        </div>
                                        <div className="rounded-xl bg-muted/50 p-3">
                                            <p className="text-muted-foreground text-xs">On fixed fee</p>
                                            <p className="text-xl font-bold">{data.fee_adoption?.providers?.on_fixed_fee_plan ?? 0}</p>
                                        </div>
                                        <div className="rounded-xl bg-muted/50 p-3">
                                            <p className="text-muted-foreground text-xs">Est. MRR (active plans)</p>
                                            <p className="text-xl font-bold">€{data.fee_adoption?.fixed_fee_plans?.active_plan_mrr_estimate_eur ?? 0}</p>
                                        </div>
                                        <div className="rounded-xl bg-muted/50 p-3">
                                            <p className="text-muted-foreground text-xs">Commission revenue</p>
                                            <p className="text-xl font-bold">€{data.fee_adoption?.bookings?.estimated_commission_revenue_eur ?? 0}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Booking fee path split</CardTitle>
                                </CardHeader>
                                <CardContent className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={bookingFeeSplit} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                                {bookingFeeSplit.map((_, i) => (
                                                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>
                        {revenueMix.length > 0 && (
                            <Card className="mt-6">
                                <CardHeader>
                                    <CardTitle>Platform revenue mix</CardTitle>
                                </CardHeader>
                                <CardContent className="h-56">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={revenueMix}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip formatter={(v) => `€${v}`} />
                                            <Bar dataKey="value" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        )}
                        {feeMonthly.length > 0 && (
                            <Card className="mt-6">
                                <CardHeader>
                                    <CardTitle>Fee adoption trend (12 months)</CardTitle>
                                    <CardDescription>
                                        DB enrollments vs analytics events; commission vs waived booking split
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={feeMonthly}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                                            <YAxis yAxisId="left" />
                                            <YAxis yAxisId="right" orientation="right" unit="%" />
                                            <Tooltip />
                                            <Legend />
                                            <Bar yAxisId="left" dataKey="commission_revenue_eur" fill="#6366f1" name="Commission €" radius={[4, 4, 0, 0]} />
                                            <Bar yAxisId="left" dataKey="fixed_fee_revenue_eur" fill="#f59e0b" name="Fixed fee €" radius={[4, 4, 0, 0]} />
                                            <Line yAxisId="right" type="monotone" dataKey="waived_share_pct" stroke="#10b981" name="Waived %" dot={false} />
                                            <Line yAxisId="left" type="monotone" dataKey="enrollments_db" stroke="#312e81" name="Enrollments (DB)" dot />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="marketplace">
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            <StatCard
                                label="Clients with booking"
                                value={data.marketplace_attachment?.clients_with_paid_booking ?? 0}
                            />
                            <StatCard
                                label="Also bought products"
                                value={`${data.marketplace_attachment?.attachment_rate_ever_pct ?? 0}%`}
                            />
                            <StatCard
                                label="Within 30 days"
                                value={`${data.marketplace_attachment?.attachment_within_30d_of_first_booking_pct ?? 0}%`}
                            />
                            <StatCard
                                label="Within 90 days"
                                value={`${data.marketplace_attachment?.attachment_within_90d_of_first_booking_pct ?? 0}%`}
                            />
                            <StatCard
                                label="Avg orders / attached client"
                                value={data.marketplace_attachment?.avg_orders_per_attached_client ?? 0}
                            />
                            <StatCard
                                label="Cross-sell opportunity"
                                value={data.marketplace_attachment?.cross_sell_opportunity ?? 0}
                                sub="Booked, never ordered"
                            />
                        </div>
                        {data.marketplace_attachment?.attach_time_buckets && (
                            <Card className="mb-6">
                                <CardHeader>
                                    <CardTitle>Time to first marketplace order after first booking</CardTitle>
                                    <CardDescription>Leading indicator for cross-sell UX (marketplace attach rate benchmarks: good ~25%, great ~40%)</CardDescription>
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                    {Object.entries(data.marketplace_attachment.attach_time_buckets).map(([key, val]) => (
                                        <div key={key} className="rounded-lg bg-muted/40 p-3 text-center">
                                            <p className="text-xs text-muted-foreground uppercase">{key.replace(/_/g, ' ')}</p>
                                            <p className="text-xl font-bold">{val}</p>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}
                        <Card>
                            <CardHeader>
                                <CardTitle>Marketplace attachment</CardTitle>
                                <CardDescription>
                                    Share of grooming clients who also purchase on the marketplace.
                                    {data.marketplace_attachment?.avg_days_to_first_marketplace_order != null && (
                                        <> Avg {data.marketplace_attachment.avg_days_to_first_marketplace_order} days to first order after first booking.</>
                                    )}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground">
                                <p>Marketplace-only buyers (no booking): {data.marketplace_attachment?.marketplace_only_buyers ?? 0}</p>
                                <p className="mt-2">Total clients with paid orders: {data.marketplace_attachment?.clients_with_paid_order ?? 0}</p>
                            </CardContent>
                        </Card>
                        {marketplaceMonthly.length > 0 && (
                            <Card className="mt-6">
                                <CardHeader>
                                    <CardTitle>Marketplace monthly trend</CardTitle>
                                    <CardDescription>Orders, GMV, and 30-day attachment rate for new booking cohorts</CardDescription>
                                </CardHeader>
                                <CardContent className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={marketplaceMonthly}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                                            <YAxis yAxisId="left" />
                                            <YAxis yAxisId="right" orientation="right" unit="%" />
                                            <Tooltip />
                                            <Legend />
                                            <Bar yAxisId="left" dataKey="paid_orders" fill="#6366f1" name="Paid orders" radius={[4, 4, 0, 0]} />
                                            <Line yAxisId="left" type="monotone" dataKey="marketplace_gmv_eur" stroke="#10b981" name="GMV €" dot={false} />
                                            <Line yAxisId="right" type="monotone" dataKey="attachment_within_30d_pct" stroke="#f59e0b" name="30d attach %" dot />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>
                </Tabs>

                <p className="text-xs text-muted-foreground mt-8 text-center">
                    Generated {new Date(data.generated_at).toLocaleString()}, Events stored in product_analytics_events
                </p>
            </div>
        </div>
    );
}
