import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { MetaTags } from '@/components/seo/MetaTags';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SearchField from '@/components/ui/search-field';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    AlertCircle,
    Scissors,
    Ban,
    Scale,
    RefreshCw,
    Wallet,
    ChevronRight,
} from 'lucide-react';
import { PageLoading } from '@/components/ui/page-loading';
import { PageError } from '@/components/ui/page-error';
import PageHeader from '@/components/layout/PageHeader';
import PageContent from '@/components/layout/PageContent';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

function StatTile({ label, value, sub, tone = 'default' }) {
    const tones = {
        default: 'text-foreground',
        danger: 'text-destructive',
        success: 'text-primary',
        warn: 'text-primary',
    };
    return (
        <div className=" border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className={`text-2xl font-bold ${tones[tone] ?? tones.default}`}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
    );
}

function HealthBadge({ score, flags = [] }) {
    let color = 'bg-primary/10 text-primary';
    if (score < 60) color = 'bg-destructive/10 text-destructive';
    else if (score < 80) color = 'bg-warning/15 text-foreground';
    return (
        <div className="space-y-1">
            <Badge className={color}>Health {score}/100</Badge>
            {flags.length > 0 && (
                <p className="text-xs text-muted-foreground">{flags.slice(0, 2).join(', ')}</p>
            )}
        </div>
    );
}

function ProviderDetailPanel({ providerId, providerType }) {
    const isShop = providerType === 'shop';
    const { data: stats, isLoading, isError, refetch } = useQuery({
        queryKey: ['admin-provider-stats', providerType, providerId],
        queryFn: () =>
            isShop
                ? sovereign.providerStats.getAdminShop(providerId)
                : sovereign.providerStats.getAdminBarber(providerId),
        enabled: !!providerId,
    });

    if (!providerId) {
        return (
            <Card className="h-full">
                <CardContent className="py-16 text-center text-muted-foreground">
                    Select a provider to view full operational metrics
                </CardContent>
            </Card>
        );
    }

    if (isLoading) return <PageLoading message="Loading provider metrics..." />;
    if (isError || !stats) return <PageError onRetry={refetch} />;

    return (
        <Card className="h-full overflow-hidden">
            <CardHeader className="border-b border-border bg-muted/30">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <CardTitle className="text-xl">{stats.provider_name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1 capitalize">
                            {stats.provider_type}, ★ {stats.rating?.toFixed(1) ?? '-'} ({stats.review_count} reviews)
                        </p>
                    </div>
                    <HealthBadge score={stats.health_score} flags={stats.health_flags} />
                </div>
            </CardHeader>
            <CardContent className="p-6 space-y-8 max-h-[70vh] overflow-y-auto">
                <section>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                        <Scissors className="w-4 h-4" /> Service volume
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <StatTile label="Services completed" value={stats.completed_services.toLocaleString()} />
                        <StatTile label="Completed bookings" value={stats.completed_bookings} />
                        <StatTile label="Upcoming" value={stats.upcoming_bookings} />
                        <StatTile label="Avg booking value" value={`$${stats.avg_booking_value}`} />
                        <StatTile
                            label="Rebooking rate"
                            value={`${stats.rebooking_rate_percent}%`}
                            sub={`${stats.repeat_clients} repeat / ${stats.unique_clients} clients`}
                        />
                    </div>
                </section>

                <section>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                        <Ban className="w-4 h-4" /> Reliability
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <StatTile
                            label="Cancellations"
                            value={stats.cancelled_bookings}
                            sub={`${stats.cancellation_rate_percent}% rate`}
                            tone={stats.cancellation_rate_percent > 10 ? 'warn' : 'default'}
                        />
                        <StatTile
                            label="No-shows"
                            value={stats.no_show_bookings}
                            sub={`${stats.no_show_rate_percent}% rate`}
                            tone={stats.no_show_rate_percent > 5 ? 'warn' : 'default'}
                        />
                        <StatTile
                            label="Cash unpaid (client)"
                            value={stats.cash_unpaid_by_client}
                            tone={stats.cash_unpaid_by_client > 0 ? 'danger' : 'default'}
                        />
                    </div>
                </section>

                <section>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                        <Scale className="w-4 h-4" /> Disputes & refunds
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <StatTile label="Total disputes" value={stats.disputes_total} sub={`${stats.dispute_rate_percent}% of visits`} />
                        <StatTile label="Open" value={stats.disputes_open} tone={stats.disputes_open > 0 ? 'warn' : 'default'} />
                        <StatTile
                            label="Provider favored (correct)"
                            value={stats.disputes_provider_favored}
                            tone="success"
                        />
                        <StatTile
                            label="Client favored (provider at fault)"
                            value={stats.disputes_client_favored}
                            tone={stats.disputes_client_favored > 0 ? 'danger' : 'default'}
                        />
                        <StatTile label="Refunds approved" value={stats.dispute_refunds_approved} />
                        <StatTile label="Refund claims denied" value={stats.dispute_refunds_denied} />
                        <StatTile label="Payment refunds" value={stats.payment_refunds} />
                    </div>
                </section>

                <section>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                        <Wallet className="w-4 h-4" /> Platform fees & penalties
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <StatTile label="Platform fees paid" value={`$${stats.platform_fees_paid}`} />
                        <StatTile label="Fee refunds (cancel)" value={`$${stats.platform_fee_refunds}`} />
                        <StatTile
                            label="Penalty charges"
                            value={`$${stats.platform_penalty_charges}`}
                            tone={stats.platform_penalty_charges > 0 ? 'danger' : 'default'}
                        />
                    </div>
                </section>

                {stats.shop_id && stats.provider_type === 'barber' && (
                    <Button variant="outline" asChild className="w-full">
                        <Link to={createPageUrl(`ShopProfile?id=${stats.shop_id}`)}>View shop profile</Link>
                    </Button>
                )}
                {stats.provider_type === 'barber' && (
                <Button variant="outline" asChild className="w-full">
                    <Link to={createPageUrl(`BarberProfile?id=${providerId}`)}>View barber profile</Link>
                </Button>
                )}
                {stats.provider_type === 'shop' && (
                <Button variant="outline" asChild className="w-full">
                    <Link to={createPageUrl(`ShopProfile?id=${providerId}`)}>View shop profile</Link>
                </Button>
                )}
            </CardContent>
        </Card>
    );
}

export default function AdminProviderInsights() {
    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => sovereign.auth.me(),
    });

    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('name');
    const [typeFilter, setTypeFilter] = useState('all');
    const [selectedId, setSelectedId] = useState(null);
    const [selectedType, setSelectedType] = useState('barber');

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['admin-providers-overview', sort, typeFilter],
        queryFn: () => sovereign.providerStats.getAdminOverview({ sort, limit: 200, type: typeFilter }),
        enabled: user?.role === 'admin',
    });

    if (user && user.role !== 'admin') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <MetaTags title="Access Denied" />
                <Card>
                    <CardContent className="py-8 text-center">
                        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
                        <p className="font-semibold">Admin access required</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (isLoading) return <PageLoading message="Loading provider insights..." />;
    if (isError) return <PageError onRetry={refetch} />;

    const providers = (data?.providers ?? []).filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="stb-page pb-16">
            <MetaTags title="Provider Insights" description="Admin operational metrics per service provider" />

            <PageHeader
                label="Admin"
                title="Provider insights"
                subtitle="Operational health per barber and shop — completions, cancellations, cash issues, disputes, and penalties."
                compact
                variant="light"
                tier="app"
            >
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                    <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                </Button>
            </PageHeader>

            <PageContent>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <StatTile
                        label="Providers tracked"
                        value={data?.total ?? 0}
                        sub={typeFilter === 'shop' ? 'Shops' : typeFilter === 'barber' ? 'Barbers' : 'Barbers & shops'}
                    />
                    <StatTile
                        label="At-risk (health below 70)"
                        value={providers.filter((p) => p.health_score < 70).length}
                        tone="warn"
                    />
                    <StatTile
                        label="Open dispute exposure"
                        value={providers.reduce((s, p) => s + (p.disputes_total > 0 ? 1 : 0), 0)}
                        sub="Providers with any dispute history"
                    />
                    <StatTile
                        label="Cash collection issues"
                        value={providers.filter((p) => p.cash_unpaid_by_client > 0).length}
                        tone="danger"
                    />
                </div>

                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <SearchField
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onClear={() => setSearch('')}
                        placeholder="Search providers..."
                        className="flex-1"
                        aria-label="Search providers"
                    />
                    <select
                        value={typeFilter}
                        onChange={(e) => {
                            setTypeFilter(e.target.value);
                            setSelectedId(null);
                        }}
                        className="px-4 py-2 rounded-lg border border-border bg-background text-sm"
                    >
                        <option value="all">All providers</option>
                        <option value="barber">Barbers only</option>
                        <option value="shop">Shops only</option>
                    </select>
                    <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                        className="px-4 py-2 rounded-lg border border-border bg-background text-sm"
                    >
                        <option value="name">Sort by name</option>
                        <option value="completed">Most services completed</option>
                        <option value="health">Lowest health score</option>
                        <option value="disputes">Most disputes</option>
                    </select>
                </div>

                <div className="grid lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-2 space-y-2 max-h-[70vh] overflow-y-auto">
                        {providers.map((p) => (
                            <button
                                key={`${p.type}-${p.id}`}
                                type="button"
                                onClick={() => {
                                    setSelectedId(p.id);
                                    setSelectedType(p.type);
                                }}
                                className={`w-full text-left rounded-lg border p-4 transition-all hover:border-primary/40 ${
                                    selectedId === p.id && selectedType === p.type ? 'border-primary bg-primary/5' : 'border-border bg-card'
                                }`}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div>
                                        <p className="font-bold">{p.name}</p>
                                        <p className="text-xs text-muted-foreground capitalize">{p.type}</p>
                                        <p className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-2">
                                            <span>{p.completed_services} completed</span>
                                            <span>, {p.cancelled_bookings} cancelled</span>
                                            {p.disputes_total > 0 && (
                                                <span className="text-muted-foreground">{p.disputes_total} disputes</span>
                                            )}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline">{p.health_score}</Badge>
                                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                </div>
                            </button>
                        ))}
                        {providers.length === 0 && (
                            <p className="text-center text-muted-foreground py-8">No providers match your search</p>
                        )}
                    </div>
                    <div className="lg:col-span-3">
                        <ProviderDetailPanel providerId={selectedId} providerType={selectedType} />
                    </div>
                </div>
            </PageContent>
        </div>
    );
}
