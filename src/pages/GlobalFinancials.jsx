import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, AlertTriangle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { MetaTags } from '@/components/seo/MetaTags';
import { toast } from 'sonner';

export default function GlobalFinancials() {
  const [userSearchTerm, setUserSearchTerm] = useState('');

  const { data: financialData } = useQuery({
    queryKey: ['admin-financials'],
    queryFn: () => sovereign.functions.invoke('financial-analytics', {})
  });

  const { data: _bookings = [] } = useQuery({
    queryKey: ['global-bookings'],
    queryFn: () => sovereign.entities.Booking.list('-created_date', 100),
    initialData: []
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
    shopComm: '15'
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

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
      <MetaTags
        title="Global Financials"
        description="Comprehensive financial overview and reporting."
      />

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Financial Command</h1>
          <p className="text-slate-500 mt-1">Real-time platform performance and liquidity control.</p>
        </div>
        <div className="flex gap-3">
          <Link to={createPageUrl('AdminOrders')}>
            <Button variant="outline" className="bg-white">Orders</Button>
          </Link>
          <Link to={createPageUrl('AdminDisputes')}>
            <Button variant="outline" className="bg-white">Disputes</Button>
          </Link>
          <Button variant="outline" className="bg-white">Monthly Report</Button>
          <Button className="bg-primary text-primary-foreground">Generate Payouts</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-white border-slate-200">
          <CardContent className="pt-6">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Platform Gross</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-foreground">${overview.totalGross?.toLocaleString() || '0'}</h3>
              <span className="text-emerald-600 text-xs font-bold">+12.5%</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-primary text-primary-foreground border-none">
          <CardContent className="pt-6">
            <p className="text-slate-300 text-xs font-bold uppercase tracking-wider mb-2">Platform Revenue</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-white">${overview.platformRevenue?.toLocaleString() || '0'}</h3>
              <span className="text-slate-400 text-xs">Net Margin {overview.netMargin?.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200">
          <CardContent className="pt-6">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Pending Payouts</p>
            <h3 className="text-3xl font-black text-foreground">${overview.pendingPayouts?.toLocaleString() || '0'}</h3>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200">
          <CardContent className="pt-6">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Settled Payouts</p>
            <h3 className="text-3xl font-black text-foreground">${overview.totalPayouts?.toLocaleString() || '0'}</h3>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
          <TabsTrigger value="payouts" className="rounded-lg">Payouts</TabsTrigger>
          <TabsTrigger value="disputes" className="rounded-lg">
            Disputes
            {disputes.length > 0 && <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{disputes.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="pricing" className="rounded-lg">Rules</TabsTrigger>
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
                            className="w-full bg-slate-100 rounded-t-md group-hover:bg-slate-200 transition-all"
                            style={{ height: `${(day.gross / Math.max(...chartData.map(d => d.gross), 1)) * 100}%` }}
                          />
                          <div
                            className="w-full bg-primary rounded-b-md group-hover:opacity-90 transition-all"
                            style={{ height: `${(day.commission / Math.max(...chartData.map(d => d.gross), 1)) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 mt-2 font-bold uppercase">{day.day}</span>

                        {/* Tooltip emulation */}
                        <div className="absolute bottom-full mb-2 bg-foreground text-background text-[10px] p-2 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap shadow-xl">
                          <p className="font-bold border-b border-white/10 pb-1 mb-1">{day.date}</p>
                          <p>Gross: ${day.gross}</p>
                          <p className="text-emerald-400">Comm: ${day.commission}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">
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
                    <span className="text-xs text-slate-500">Stripe Integration</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md text-[10px] font-bold">ACTIVE</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">Auto-Payouts</span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold">ENABLED</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">Dispute Rate</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md text-[10px] font-bold">0.12%</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-amber-50 border-amber-100">
                <CardContent className="pt-6">
                  <div className="flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-amber-900">Liquidity Alert</p>
                      <p className="text-[11px] text-amber-700 mt-1">Pending payouts exceed last 24h platform revenue. Monitor reserve balance.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Global Ledger</CardTitle>
              <div className="flex gap-2">
                <Input placeholder="Search ledger..." className="w-64 h-8 text-xs" />
                <Button size="sm" variant="outline" className="h-8">Export CSV</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b">
                    <tr className="text-slate-500 font-medium text-[11px] uppercase tracking-wider">
                      <th className="p-4 text-left">Timestamp</th>
                      <th className="p-4 text-left">Actor</th>
                      <th className="p-4 text-left">Context</th>
                      <th className="p-4 text-right">Gross</th>
                      <th className="p-4 text-right">Platform Fee</th>
                      <th className="p-4 text-center">Settlement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(financialData?.bookings || []).map((b) => {
                      const bd = b.financial_breakdown ? JSON.parse(b.financial_breakdown) : {};
                      return (
                        <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 text-slate-500 text-xs">{format(new Date(b.created_at || b.start_time), 'MMM dd, HH:mm')}</td>
                          <td className="p-4 font-medium text-foreground">{b.created_by?.split('@')[0] || 'Client'}</td>
                          <td className="p-4 text-slate-500 text-xs">Booking #{b.id?.substring(0, 6)}</td>
                          <td className="p-4 text-right font-bold text-foreground">${b.price_at_booking || 0}</td>
                          <td className="p-4 text-right text-emerald-600 font-bold">${bd.platform_fee || (b.price_at_booking * 0.15).toFixed(2)}</td>
                          <td className="p-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${b.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                              {b.status?.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
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

          <div className="border rounded-xl overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr className="text-slate-500 font-medium text-[11px] uppercase tracking-wider">
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
                    <td className="p-4 text-slate-500 text-xs">{p.period_start} - {p.period_end}</td>
                    <td className="p-4 text-right font-bold text-foreground">${p.amount}</td>
                    <td className="p-4 text-center text-xs text-slate-400">Stripe Connect</td>
                    <td className="p-4 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {p.status?.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="revenue">
          <div className="text-center text-muted-foreground py-12">Revenue analytics coming soon</div>
        </TabsContent>

        <TabsContent value="reconciliation">
          <div className="text-center text-muted-foreground py-12">Reconciliation tools coming soon</div>
        </TabsContent>

        <TabsContent value="disputes">
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
                        <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
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

              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => saveRulesMutation.mutate({
                    multiplier: parseFloat(formData.surgeMultiplier),
                    discount_rate: parseFloat(formData.offPeakDiscount),
                    commission_freelancer: parseFloat(formData.freelancerComm),
                    commission_shop: parseFloat(formData.shopComm)
                  })}
                  disabled={saveRulesMutation.isPending}
                >
                  {saveRulesMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">User Management</h3>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  className="pl-9"
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                />
              </div>
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
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-600'}`}>
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
    </div>
  );
}