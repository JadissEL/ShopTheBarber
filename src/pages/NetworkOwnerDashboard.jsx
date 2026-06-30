import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { sovereign } from '@/api/apiClient';
import { createPageUrl } from '@/utils';
import { MetaTags } from '@/components/seo/MetaTags';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageLoading } from '@/components/ui/page-loading';
import {
  Building2, Users, Wallet, Package, DollarSign, Palette, BarChart3, UserCog, ArrowRight,
} from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import PageContent from '@/components/layout/PageContent';
import { stb } from '@/lib/stbUi';

const SHOP_OPS_LINKS = [
  { label: 'Inventory', page: 'ShopInventoryManagement', icon: Package },
  { label: 'Expenses', page: 'ShopExpenseTracking', icon: DollarSign },
  { label: 'Branding', page: 'ShopBrandingManagement', icon: Palette },
  { label: 'Analytics', page: 'ShopAnalytics', icon: BarChart3 },
  { label: 'Staff HR', page: 'ShopEmployeeManagement', icon: UserCog },
];

export default function NetworkOwnerDashboard() {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['network-rollup'],
        queryFn: () => sovereign.network.getRollup(),
    });

    if (isLoading) return <PageLoading message="Loading network…" />;

    return (
        <div className={stb.page}>
            <MetaTags title="Network Dashboard" description="Multi-shop owner rollup" />
            <PageHeader
                label="Provider"
                title="Network dashboard"
                subtitle="All shops you own — Phase 3 rollup"
                compact
                variant="light"
                tier="app"
            />
            <PageContent narrow>

            {isError || !data?.shops?.length ? (
                <Card>
                    <CardContent className="p-6 text-muted-foreground">
                        No shops linked to your account yet, or migrations pending.
                    </CardContent>
                </Card>
            ) : (
                <>
                    <div className="grid sm:grid-cols-3 gap-4 mb-8">
                        <Card>
                            <CardContent className="p-4">
                                <p className="text-xs text-muted-foreground">Completed bookings</p>
                                <p className="text-2xl font-bold">{data.totals.bookings}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <p className="text-xs text-muted-foreground">Revenue (completed)</p>
                                <p className="text-2xl font-bold">€{data.totals.revenue.toFixed(0)}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4 flex items-center gap-2">
                                <Users className="w-5 h-5 text-primary" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Active staff</p>
                                    <p className="text-2xl font-bold">{data.totals.staff}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="mb-8">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Shop operations</CardTitle>
                            <p className="text-xs text-muted-foreground">Manage inventory, costs, branding, and staff across your network.</p>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-2">
                            {SHOP_OPS_LINKS.map((link) => (
                                <Button key={link.page} variant="outline" size="sm" asChild className="gap-2">
                                    <Link to={createPageUrl(link.page)}>
                                        <link.icon className="w-3.5 h-3.5" />
                                        {link.label}
                                    </Link>
                                </Button>
                            ))}
                            <Button variant="ghost" size="sm" asChild className="gap-1 text-primary">
                                <Link to={createPageUrl('ProviderPayouts')}>
                                    Payouts <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    <div className="space-y-4">
                        {data.shops.map((shop) => (
                            <Card key={shop.id}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base">{shop.name}</CardTitle>
                                    {shop.city && <p className="text-xs text-muted-foreground">{shop.city}</p>}
                                </CardHeader>
                                <CardContent className="flex flex-wrap gap-6 text-sm">
                                    <span>{shop.completed_bookings} bookings</span>
                                    <span>€{shop.revenue_eur.toFixed(0)} revenue</span>
                                    <span className="inline-flex items-center gap-1">
                                        <Wallet className="w-3.5 h-3.5" />
                                        €{(shop.wallet_balance ?? 0).toFixed(2)} · {shop.wallet_health}
                                    </span>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </>
            )}
            </PageContent>
        </div>
    );
}
