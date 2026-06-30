import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SearchField from '@/components/ui/search-field';
import { AlertTriangle, TrendingUp, Target, Users, CalendarX, Zap } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { MetaTags } from '@/components/seo/MetaTags';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { PageLoading } from '@/components/ui/page-loading';
import { PageError } from '@/components/ui/page-error';
import AdminPromotionsPanel from '@/components/admin/AdminPromotionsPanel';
import AdminVipBarbersPanel from '@/components/admin/AdminVipBarbersPanel';
import AdminPromotionalCreditPanel from '@/components/admin/AdminPromotionalCreditPanel';
import AdminAdCreditsGrantPanel from '@/components/admin/AdminAdCreditsGrantPanel';
import AdminPartnerKeysPanel from '@/components/admin/AdminPartnerKeysPanel';
import AdminFinancingApplicationsPanel from '@/components/admin/AdminFinancingApplicationsPanel';
import AdminWalletReconciliationPanel from '@/components/admin/AdminWalletReconciliationPanel';
import AdminLiveMetricsPanel from '@/components/admin/AdminLiveMetricsPanel';
import AdminFraudAlertsPanel from '@/components/admin/AdminFraudAlertsPanel';
import AdminDisputeAppealsPanel from '@/components/admin/AdminDisputeAppealsPanel';
import OnboardingSetupBanner from '@/components/onboarding/OnboardingSetupBanner';
import { chartColor, chartFill, stb } from '@/lib/stbUi';
import { cn } from '@/lib/utils';
import PageHeader from '@/components/layout/PageHeader';
import PageContent from '@/components/layout/PageContent';

export default function GlobalFinancials() {
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerEventType, setLedgerEventType] = useState('all');

  const { data: financialData, isLoading: isFinLoading, isError: isFinError, refetch: refetchFin } = useQuery({
    queryKey: ['admin-financials'],
    queryFn: () => sovereign.functions.invoke('financial-analytics', {})
  });

  const { data: ledgerData, isLoading: isLedgerLoading } = useQuery({
    queryKey: ['admin-ledger', ledgerSearch, ledgerEventType],
    queryFn: () =>
      sovereign.admin.listLedger({
        limit: 100,
        search: ledgerSearch.trim() || undefined,
        event_type: ledgerEventType === 'all' ? undefined : ledgerEventType,
      }),
  });

  const { data: payouts = [] } = useQuery({
    queryKey: ['global-payouts'],
    queryFn: () => sovereign.entities.Payout.list(),
    initialData: []
  });

  const { data: disputes = [] } = useQuery({
    queryKey: ['disputes'],
    queryFn: () => sovereign.entities.Dispute.filter({ status: { $nin: ['resolved'] } }),
    initialData: []
  });

  const { data: users = [] } = useQuery({
    queryKey: ['platform-users'],
    queryFn: () => sovereign.entities.User.list(),
    initialData: []
  });

  const queryClient = useQueryClient();
  const { data: pricingRules = [] } = useQuery({
    queryKey: ['pricing-rules'],
    queryFn: () => sovereign.entities.PricingRule.list(),
    initialData: []
  });

  const currentRule = pricingRules[0] || {};
  const [formData, setFormData] = useState({
    surgeMultiplier: '1.5',
    offPeakDiscount: '0.8',
    freelancerComm: '20',
    shopComm: '15',
    fixedFeeBarber: '79',
    fixedFeeShop: '149',
  });

  useEffect(() => {
    if (!currentRule.id) return;
    setFormData({
      surgeMultiplier: String(currentRule.multiplier ?? '1.5'),
      offPeakDiscount: String(currentRule.discount_rate ?? '0.8'),
      freelancerComm: String((currentRule.commission_freelancer ?? 0.15) * 100),
      shopComm: String((currentRule.commission_shop ?? 0.05) * 100),
      fixedFeeBarber: String(currentRule.fixed_fee_monthly_barber ?? 79),
      fixedFeeShop: String(currentRule.fixed_fee_monthly_shop ?? 149),
    });
  }, [currentRule.id, currentRule.commission_freelancer, currentRule.commission_shop, currentRule.fixed_fee_monthly_barber, currentRule.fixed_fee_monthly_shop]);

  const { data: fixedFeePlans = [], refetch: refetchFixedFeePlans } = useQuery({
    queryKey: ['admin-fixed-fee-plans'],
    queryFn: () => sovereign.fixedFee.adminListPlans(),
  });

  const cancelPlanMutation = useMutation({
    mutationFn: (planId) => sovereign.fixedFee.adminCancelPlan(planId),
    onSuccess: () => {
      refetchFixedFeePlans();
      toast.success('Plan cancelled');
    },
    onError: (e) => toast.error(e.message),
  });

  const saveRulesMutation = useMutation({
    mutationFn: (data) => {
      if (currentRule.id) return sovereign.entities.PricingRule.update(currentRule.id, data);
      return sovereign.entities.PricingRule.create({ ...data, name: "Default Rules" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-rules'] });
      toast.success("Pricing rules saved");
    }
  });

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  const overview = financialData?.overview || {};
  const chartData = financialData?.chartData || [];
  const northStar = financialData?.north_star || {};
  const reconciliationDelta =
    (overview.platformRevenue ?? 0) - (overview.totalPayouts ?? 0) - (overview.pendingPayouts ?? 0);

  if (isFinLoading) return <PageLoading message="Loading financial data..." />;
  if (isFinError) return <PageError title="Failed to load financials" onRetry={refetchFin} />;

  return (
    <div className="stb-page pb-16 font-sans">
      <MetaTags
        title="Global Financials"
        description="Comprehensive financial overview and reporting."
      />

      <OnboardingSetupBanner audience="admin" />

      <div className="mb-8 space-y-6 px-4 md:px-6 max-w-7xl mx-auto">
        <AdminLiveMetricsPanel />
        <AdminFraudAlertsPanel />
      </div>

      <PageHeader
        label="Admin"
        title="Financial command"
        subtitle="Real-time platform performance and liquidity control."
        compact
        variant="light"
        tier="app"
      >
        <div className="flex flex-wrap gap-3">
          <Link to={createPageUrl('AdminOrders')}>
            <Button variant="outline">Orders</Button>
          </Link>
          <Link to={createPageUrl('AdminDisputes')}>
            <Button variant="outline">Disputes</Button>
          </Link>
          <Button variant="outline">Monthly Report</Button>
          <Button>Generate Payouts</Button>
        </div>
      </PageHeader>

      <PageContent>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-2">Platform Gross</p>
            <div className="flex items-baseline gap-2">
              <h3 className={cn(stb.metricValue, 'text-3xl text-foreground')}>${overview.totalGross?.toLocaleString() || '0'}</h3>
              <span className="text-primary text-xs font-bold">+12.5%</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-primary text-primary-foreground border-none">
          <CardContent className="pt-6">
            <p className="text-white/70 text-xs font-bold uppercase tracking-wider mb-2">Platform Revenue</p>
            <div className="flex items-baseline gap-2">
              <h3 className={cn(stb.metricValue, 'text-3xl text-white')}>${overview.platformRevenue?.toLocaleString() || '0'}</h3>
              <span className="text-muted-foreground text-xs">Net Margin {overview.netMargin?.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-2">Pending Payouts</p>
            <h3 className={cn(stb.metricValue, 'text-3xl text-foreground')}>${overview.pendingPayouts?.toLocaleString() || '0'}</h3>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-2">Settled Payouts</p>
            <h3 className={cn(stb.metricValue, 'text-3xl text-foreground')}>${overview.totalPayouts?.toLocaleString() || '0'}</h3>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              North-star metrics
            </h2>
            <p className="text-sm text-muted-foreground">
              Platform health KPIs, last {northStar.period_days ?? 30} days
            </p>
          </div>
          <Link to={createPageUrl('AdminProductAnalytics')}>
            <Button variant="outline" size="sm">Full analytics</Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Booked GMV</p>
              <p className="text-2xl font-bold">€{(northStar.booked_gmv_eur ?? overview.booked_gmv_eur ?? 0).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {northStar.booked_count ?? 0} bookings
                {northStar.trends?.booked_gmv_change_pct != null && (
                  <span className={northStar.trends.booked_gmv_change_pct >= 0 ? ' text-primary' : ' text-destructive'}>
                    {', '}{northStar.trends.booked_gmv_change_pct >= 0 ? '+' : ''}{northStar.trends.booked_gmv_change_pct}% vs prior period
                  </span>
                )}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
                <CalendarX className="w-3.5 h-3.5" /> No-show rate
              </p>
              <p className="text-2xl font-bold">{northStar.no_show_rate_percent ?? 0}%</p>
              <p className="text-xs text-muted-foreground mt-1">
                {northStar.no_show_count ?? 0} of {northStar.resolved_bookings_count ?? 0} resolved
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" /> Provider activation
              </p>
              <p className="text-2xl font-bold">{northStar.provider_activation_rate_percent ?? 0}%</p>
              <p className="text-xs text-muted-foreground mt-1">
                {northStar.providers_fully_activated ?? 0} / {northStar.providers_total ?? 0}, profile + services + Stripe
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> D7 retention
              </p>
              <p className="text-2xl font-bold">{northStar.d7_retention_percent ?? 0}%</p>
              <p className="text-xs text-muted-foreground mt-1">
                Paid return within 7 days, n={northStar.d7_retention_cohort_size ?? 0}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-muted p-1 rounded-lg">
          <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
          <TabsTrigger value="revenue" className="rounded-lg">Revenue</TabsTrigger>
          <TabsTrigger value="payouts" className="rounded-lg">Payouts</TabsTrigger>
          <TabsTrigger value="reconciliation" className="rounded-lg">Reconciliation</TabsTrigger>
          <TabsTrigger value="disputes" className="rounded-lg">
            Disputes
            {disputes.length > 0 && <span className="ml-2 bg-destructive/100 text-white text-[10px] px-1.5 py-0.5 rounded-full">{disputes.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="pricing" className="rounded-lg">Rules</TabsTrigger>
          <TabsTrigger value="fixedfee" className="rounded-lg">Fixed fees</TabsTrigger>
          <TabsTrigger value="promos" className="rounded-lg">Promotions</TabsTrigger>
          <TabsTrigger value="vip" className="rounded-lg">VIP / Groups</TabsTrigger>
          <TabsTrigger value="wallet-credits" className="rounded-lg">Wallet credits</TabsTrigger>
          <TabsTrigger value="partners" className="rounded-lg">Partners</TabsTrigger>
          <TabsTrigger value="users" className="rounded-lg">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Revenue Velocity</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Daily platform gross vs commission</p>
                </div>
                <Select defaultValue="7d">
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent className="h-[350px]">
                {chartData.length > 0 ? (
                  <div className="h-full w-full flex items-end gap-2 pb-8">
                    {chartData.map((day, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center group relative cursor-help">
                        <div className="w-full flex flex-col justify-end gap-1 h-48">
                          <div
                            className="w-full bg-muted rounded-t-md group-hover:bg-muted transition-all"
                            style={{ height: `${(day.gross / Math.max(...chartData.map(d => d.gross), 1)) * 100}%` }}
                          />
                          <div
                            className="w-full bg-primary rounded-b-md group-hover:opacity-90 transition-all"
                            style={{ height: `${(day.commission / Math.max(...chartData.map(d => d.gross), 1)) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground mt-2 font-bold uppercase">{day.day}</span>

                        {/* Tooltip emulation */}
                        <div className="absolute bottom-full mb-2 bg-foreground text-background text-[10px] p-2 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap shadow-elevation-lg">
                          <p className="font-bold border-b border-white/10 pb-1 mb-1">{day.date}</p>
                          <p>Gross: ${day.gross}</p>
                          <p className="text-primary">Comm: ${day.commission}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm italic">
                    Insufficient data for visualization
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Health Check</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Stripe Integration</span>
                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-md text-[10px] font-bold">ACTIVE</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Auto-Payouts</span>
                    <span className="px-2 py-0.5 bg-muted text-foreground/90 rounded-md text-[10px] font-bold">ENABLED</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Dispute Rate</span>
                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-md text-[10px] font-bold">0.12%</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-primary/10 border-amber-100">
                <CardContent className="pt-6">
                  <div className="flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-primary shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-foreground">Liquidity Alert</p>
                      <p className="text-[11px] text-muted-foreground mt-1">Pending payouts exceed last 24h platform revenue. Monitor reserve balance.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
              <CardTitle>Global Ledger</CardTitle>
              <div className="flex gap-2 flex-wrap">
                <Input
                  placeholder="Search entity, event, payload…"
                  className="w-64 h-8 text-xs"
                  value={ledgerSearch}
                  onChange={(e) => setLedgerSearch(e.target.value)}
                />
                <Select value={ledgerEventType} onValueChange={setLedgerEventType}>
                  <SelectTrigger className="w-40 h-8 text-xs">
                    <SelectValue placeholder="Event type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All events</SelectItem>
                    <SelectItem value="deposit_lock">Deposit lock</SelectItem>
                    <SelectItem value="deposit_release">Deposit release</SelectItem>
                    <SelectItem value="deposit_forfeit">Deposit forfeit</SelectItem>
                    <SelectItem value="promotional_credit">Promotional credit</SelectItem>
                    <SelectItem value="platform_fee">Platform fee</SelectItem>
                    <SelectItem value="top_up">Top up</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8"
                  onClick={() => {
                    const rows = ledgerData?.entries ?? [];
                    const header = 'timestamp,event_type,entity_type,entity_id,actor_id,payload\n';
                    const csv = rows
                      .map((row) =>
                        [
                          row.created_at,
                          row.event_type,
                          row.entity_type,
                          row.entity_id,
                          row.actor_id ?? '',
                          JSON.stringify(row.payload ?? {}),
                        ]
                          .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
                          .join(',')
                      )
                      .join('\n');
                    const blob = new Blob([header + csv], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `ledger-${format(new Date(), 'yyyy-MM-dd')}.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  disabled={!ledgerData?.entries?.length}
                >
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr className="text-muted-foreground font-medium text-[11px] uppercase tracking-wider">
                      <th className="p-4 text-left">Timestamp</th>
                      <th className="p-4 text-left">Event</th>
                      <th className="p-4 text-left">Entity</th>
                      <th className="p-4 text-left">Actor</th>
                      <th className="p-4 text-left">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {isLedgerLoading ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground text-sm">
                          Loading ledger…
                        </td>
                      </tr>
                    ) : (ledgerData?.entries ?? []).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground text-sm">
                          No ledger entries yet.
                        </td>
                      </tr>
                    ) : (
                      (ledgerData?.entries ?? []).map((row) => (
                        <tr key={row.id} className="hover:bg-muted/50 transition-colors">
                          <td className="p-4 text-muted-foreground text-xs whitespace-nowrap">
                            {row.created_at
                              ? format(new Date(row.created_at), 'MMM dd, HH:mm:ss')
                              : '—'}
                          </td>
                          <td className="p-4 font-medium text-foreground text-xs">{row.event_type}</td>
                          <td className="p-4 text-muted-foreground text-xs">
                            {row.entity_type} · {row.entity_id?.substring(0, 8)}…
                          </td>
                          <td className="p-4 text-muted-foreground text-xs">{row.actor_id?.substring(0, 8) ?? 'system'}</td>
                          <td className="p-4 text-muted-foreground text-xs font-mono max-w-md truncate">
                            {row.payload ? JSON.stringify(row.payload) : '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {ledgerData?.total != null && (
                <p className="text-xs text-muted-foreground mt-3">
                  Showing {(ledgerData.entries ?? []).length} of {ledgerData.total} entries
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold">Settlement History</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Download Tax Docs</Button>
              <Select defaultValue="all">
                <SelectTrigger className="w-32 h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr className="text-muted-foreground font-medium text-[11px] uppercase tracking-wider">
                  <th className="p-4 text-left">Provider</th>
                  <th className="p-4 text-left">Period</th>
                  <th className="p-4 text-right">Amount</th>
                  <th className="p-4 text-center">Method</th>
                  <th className="p-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payouts.map(p => (
                  <tr key={p.id}>
                    <td className="p-4 font-medium">{p.provider_id?.substring(0, 8) || 'Multi-Provider'}</td>
                    <td className="p-4 text-muted-foreground text-xs">{p.period_start} - {p.period_end}</td>
                    <td className="p-4 text-right font-bold text-foreground">${p.amount}</td>
                    <td className="p-4 text-center text-xs text-muted-foreground">Stripe Connect</td>
                    <td className="p-4 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.status === 'Completed' ? 'bg-primary/10 text-primary' : 'bg-warning/15 text-muted-foreground'}`}>
                        {p.status?.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Weekly gross & commission
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No paid bookings this week yet.</p>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, '']} />
                      <Area type="monotone" dataKey="gross" name="Gross" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" />
                      <Area type="monotone" dataKey="commission" name="Platform fee" stroke={chartColor(2)} fill={chartFill(2, 0.15)} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Daily gross (bar)</CardTitle>
              </CardHeader>
              <CardContent className="h-56">
                {chartData.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">, </p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v) => `$${Number(v).toFixed(2)}`} />
                      <Bar dataKey="gross" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform gross</span>
                  <span className="font-semibold">${(overview.totalGross ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform revenue (fees)</span>
                  <span className="font-semibold text-primary">${(overview.platformRevenue ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Net margin</span>
                  <span className="font-semibold">{(overview.netMargin ?? 0).toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reconciliation" className="space-y-6">
          <AdminWalletReconciliationPanel />
          <Card>
            <CardHeader>
              <CardTitle>Platform liquidity snapshot</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-4 gap-4 text-sm">
              <div className="p-4 rounded-lg bg-muted/40">
                <p className="text-muted-foreground mb-1">Fees collected</p>
                <p className="text-2xl font-bold">${(overview.platformRevenue ?? 0).toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/40">
                <p className="text-muted-foreground mb-1">Paid out</p>
                <p className="text-2xl font-bold">${(overview.totalPayouts ?? 0).toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/40">
                <p className="text-muted-foreground mb-1">Pending payouts</p>
                <p className="text-2xl font-bold">${(overview.pendingPayouts ?? 0).toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/40">
                <p className="text-muted-foreground mb-1">Residual (fees − payouts)</p>
                <p className={`text-2xl font-bold ${reconciliationDelta >= 0 ? 'text-primary' : 'text-primary'}`}>
                  ${reconciliationDelta.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Settlement vs bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Compare provider settlements against booking gross. Large negative residuals may indicate pending Stripe Connect transfers.
              </p>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr className="text-muted-foreground font-medium text-[11px] uppercase tracking-wider">
                      <th className="p-4 text-left">Metric</th>
                      <th className="p-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="p-4">Total booking gross (paid)</td>
                      <td className="p-4 text-right font-bold">${(overview.totalGross ?? 0).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="p-4">Platform fees</td>
                      <td className="p-4 text-right font-bold text-primary">${(overview.platformRevenue ?? 0).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="p-4">Provider share (est.)</td>
                      <td className="p-4 text-right font-bold">
                        ${Math.max(0, (overview.totalGross ?? 0) - (overview.platformRevenue ?? 0)).toLocaleString()}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-4">Settlements recorded</td>
                      <td className="p-4 text-right font-bold">${(overview.totalPayouts ?? 0).toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="disputes" className="space-y-6">
          <AdminDisputeAppealsPanel />
          <Card>
            <CardHeader>
              <CardTitle>Active Disputes & Refunds</CardTitle>
            </CardHeader>
            <CardContent>
              {disputes.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No active disputes</p>
              ) : (
                <div className="space-y-4">
                  {disputes.map((dispute) => (
                    <div key={dispute.id} className="flex items-start justify-between p-4 border rounded-lg">
                      <div className="flex gap-3">
                        <AlertTriangle className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-semibold">{dispute.reason || 'Dispute Reported'}</p>
                          <p className="text-sm text-muted-foreground">Booking ID: {dispute.booking_id?.substring(0, 8)}</p>
                          <p className="text-xs text-muted-foreground mt-1">{dispute.description}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">Investigate</Button>
                        <Button size="sm">Resolve</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing">
          <Card>
            <CardHeader>
              <CardTitle>Pricing & Commission Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-sm font-medium mb-2">Dynamic Pricing Rules</Label>
                <Select>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a rule" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard Demand</SelectItem>
                    <SelectItem value="high">High Demand</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-2">Surge Pricing Multiplier</Label>
                  <Input
                    value={formData.surgeMultiplier}
                    onChange={(e) => setFormData({ ...formData, surgeMultiplier: e.target.value })}
                    placeholder="e.g. 1.5"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2">Off-Peak Discount</Label>
                  <Input
                    value={formData.offPeakDiscount}
                    onChange={(e) => setFormData({ ...formData, offPeakDiscount: e.target.value })}
                    placeholder="e.g. 0.8"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-2">Freelancer Commission (%)</Label>
                  <Input
                    value={formData.freelancerComm}
                    onChange={(e) => setFormData({ ...formData, freelancerComm: e.target.value })}
                    placeholder="e.g. 20"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2">Barbershop Commission (%)</Label>
                  <Input
                    value={formData.shopComm}
                    onChange={(e) => setFormData({ ...formData, shopComm: e.target.value })}
                    placeholder="e.g. 15"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2">Payout Frequency</Label>
                <Select>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select payout frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Bi-weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-2">Fixed fee, barber (€/month)</Label>
                  <Input
                    value={formData.fixedFeeBarber}
                    onChange={(e) => setFormData({ ...formData, fixedFeeBarber: e.target.value })}
                    placeholder="e.g. 79"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2">Fixed fee, shop (€/month)</Label>
                  <Input
                    value={formData.fixedFeeShop}
                    onChange={(e) => setFormData({ ...formData, fixedFeeShop: e.target.value })}
                    placeholder="e.g. 149"
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Fixed-fee plans waive per-booking commission. Providers enroll Jan-Mar only; annual prepay gets 30% off.
              </p>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => saveRulesMutation.mutate({
                    multiplier: parseFloat(formData.surgeMultiplier),
                    discount_rate: parseFloat(formData.offPeakDiscount),
                    commission_freelancer: parseFloat(formData.freelancerComm) / 100,
                    commission_shop: parseFloat(formData.shopComm) / 100,
                    fixed_fee_monthly_barber: parseFloat(formData.fixedFeeBarber),
                    fixed_fee_monthly_shop: parseFloat(formData.fixedFeeShop),
                  })}
                  disabled={saveRulesMutation.isPending}
                >
                  {saveRulesMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fixedfee">
          <Card>
            <CardHeader>
              <CardTitle>Provider fixed-fee plans</CardTitle>
            </CardHeader>
            <CardContent>
              {fixedFeePlans.length === 0 ? (
                <p className="text-sm text-muted-foreground">No fixed-fee plans yet.</p>
              ) : (
                <div className="space-y-3">
                  {fixedFeePlans.map((plan) => (
                    <div key={plan.id} className="flex flex-wrap items-center justify-between gap-3 p-4 border rounded-lg">
                      <div>
                        <p className="font-semibold capitalize">{plan.scope}, {plan.billing_cycle}, {plan.coverage_year}</p>
                        <p className="text-sm text-muted-foreground">
                          {plan.user_name || plan.user_email}, €{plan.total_paid ?? 0} paid
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {plan.status}, until {plan.period_end ? format(new Date(plan.period_end), 'PP') : '-'}
                        </p>
                      </div>
                      {plan.status === 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={cancelPlanMutation.isPending}
                          onClick={() => cancelPlanMutation.mutate(plan.id)}
                        >
                          Cancel plan
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="promos">
          <AdminPromotionsPanel />
        </TabsContent>

        <TabsContent value="vip">
          <Card className="p-6">
            <AdminVipBarbersPanel />
          </Card>
        </TabsContent>

        <TabsContent value="wallet-credits">
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            <AdminPromotionalCreditPanel />
            <AdminAdCreditsGrantPanel />
          </div>
        </TabsContent>

        <TabsContent value="partners" className="space-y-6">
          <AdminPartnerKeysPanel />
          <AdminFinancingApplicationsPanel />
        </TabsContent>

        <TabsContent value="users">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">User Management</h3>
              <SearchField
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                onClear={() => setUserSearchTerm('')}
                placeholder="Search users..."
                className="w-64"
                aria-label="Search users"
              />
            </div>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 border-b">
                  <tr>
                    <th className="p-3 text-left font-medium">Name</th>
                    <th className="p-3 text-left font-medium">Email</th>
                    <th className="p-3 text-center font-medium">Role</th>
                    <th className="p-3 text-right font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/50">
                      <td className="p-3">{user.full_name || 'Unknown'}</td>
                      <td className="p-3 text-muted-foreground">{user.email}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                          {user.role || 'user'}
                        </span>
                      </td>
                      <td className="p-3 text-right text-muted-foreground">{new Date(user.created_date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">No users found</div>
              )}
            </div>
          </Card>
        </TabsContent>


      </Tabs>
      </PageContent>
    </div>
  );
}