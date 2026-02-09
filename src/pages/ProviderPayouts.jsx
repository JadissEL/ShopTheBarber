import { useQuery } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { DollarSign, TrendingUp, Clock, CheckCircle2, AlertCircle, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MetaTags } from '@/components/seo/MetaTags';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';

const PLATFORM_FEE_PERCENT = 15; // 15% platform fee

export default function ProviderPayouts() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => sovereign.auth.me(),
  });

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

  const { data: bookings = [] } = useQuery({
    queryKey: ['payout-bookings', shopId],
    queryFn: () => shopId ? sovereign.entities.Booking.filter({ shop_id: shopId }) : [],
    enabled: !!shopId
  });

  const { data: payouts = [] } = useQuery({
    queryKey: ['payouts', myBarberProfile?.id],
    queryFn: () => {
      const providerId = shopId || myBarberProfile?.id;
      return providerId ? sovereign.entities.Payout.filter({ provider_id: providerId }, '-created_date') : [];
    },
    enabled: !!myBarberProfile
  });

  // Calculate metrics
  const paidBookings = bookings.filter(b => b.payment_status === 'paid' || b.data?.payment_status === 'paid');
  const totalGrossRevenue = paidBookings.reduce((sum, b) => sum + ((b.data?.price_at_booking || b.price_at_booking) || 0), 0);
  const platformFee = totalGrossRevenue * (PLATFORM_FEE_PERCENT / 100);
  const netRevenue = totalGrossRevenue - platformFee;

  const totalPaidOut = payouts
    .filter(p => p.status === 'Completed' || p.status === 'Processing')
    .reduce((sum, p) => sum + (parseFloat(p.amount_text) || 0), 0);

  const pendingAmount = netRevenue - totalPaidOut;

  const statusConfig = {
    'Pending': { color: 'bg-yellow-50 text-yellow-700', icon: Clock, label: 'Pending' },
    'Processing': { color: 'bg-primary/10 text-primary', icon: TrendingUp, label: 'Processing' },
    'Completed': { color: 'bg-primary/10 text-primary', icon: CheckCircle2, label: 'Completed' },
    'Failed': { color: 'bg-red-50 text-red-700', icon: AlertCircle, label: 'Failed' }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <MetaTags title="Payouts" description="Manage your payouts and earnings" />
        <Card>
          <CardContent className="py-8 text-center">
            <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Sign in to view your payouts</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      <MetaTags 
        title="Payouts" 
        description="View your earnings and payout history"
      />

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Payouts & Earnings</h1>
            <p className="text-muted-foreground">Track your revenue and payout history</p>
          </div>
          <Link to={createPageUrl('ProviderSettings')}>
            <Button variant="outline" className="gap-2">
              <Settings className="w-4 h-4" />
              Bank Details
            </Button>
          </Link>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Gross Revenue</p>
                  <h3 className="text-3xl font-bold">${totalGrossRevenue.toFixed(2)}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{paidBookings.length} paid bookings</p>
                </div>
                <DollarSign className="w-8 h-8 text-muted-foreground opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Platform Fee</p>
                  <h3 className="text-3xl font-bold">${platformFee.toFixed(2)}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{PLATFORM_FEE_PERCENT}% of gross</p>
                </div>
                <TrendingUp className="w-8 h-8 text-destructive opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Net Revenue</p>
                  <h3 className="text-3xl font-bold text-primary">${netRevenue.toFixed(2)}</h3>
                  <p className="text-xs text-muted-foreground mt-1">After platform fee</p>
                </div>
                <TrendingUp className="w-8 h-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Pending Payout</p>
                  <h3 className="text-3xl font-bold">${Math.max(0, pendingAmount).toFixed(2)}</h3>
                  <p className="text-xs text-muted-foreground mt-1">Ready to process</p>
                </div>
                <Clock className="w-8 h-8 text-amber-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs: Payout History & Breakdown */}
        <Tabs defaultValue="history" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="history">Payout History</TabsTrigger>
            <TabsTrigger value="breakdown">Revenue Breakdown</TabsTrigger>
          </TabsList>

          {/* Payout History */}
          <TabsContent value="history" className="space-y-4">
            {payouts.length > 0 ? (
              <div className="space-y-3">
                {payouts.map((payout, idx) => {
                  const config = statusConfig[payout.status] || statusConfig['Pending'];
                  const Icon = config.icon;
                  return (
                    <Card key={idx} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <div className={`p-3 rounded-lg ${config.color} bg-opacity-10`}>
                              <Icon className={`w-5 h-5 ${config.color.split(' ')[1]}`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold">Payout</p>
                                <Badge className={config.color}>{config.label}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {payout.date_text ? format(new Date(payout.date_text), 'MMM d, yyyy') : 'Pending'}
                              </p>
                              {payout.method && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Method: {payout.method}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold">${parseFloat(payout.amount_text).toFixed(2)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No payout history yet</p>
                  <p className="text-sm text-muted-foreground mt-2">Payouts will appear here after your first booking</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Revenue Breakdown */}
          <TabsContent value="breakdown" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Revenue Structure</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Gross Revenue Breakdown */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Gross Revenue</span>
                    <span className="font-bold">${totalGrossRevenue.toFixed(2)}</span>
                  </div>
                  <div className="bg-gray-100 rounded-lg h-3 overflow-hidden w-full"></div>
                </div>

                {/* Platform Fee */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <p className="font-medium">Platform Fee ({PLATFORM_FEE_PERCENT}%)</p>
                      <p className="text-sm text-muted-foreground">Booking processing & support</p>
                    </div>
                    <span className="font-bold text-destructive">${platformFee.toFixed(2)}</span>
                  </div>
                  <div className="bg-gray-100 rounded-lg h-3 overflow-hidden w-full">
                    <div 
                      className="bg-destructive h-full" 
                      style={{ width: `${(platformFee / totalGrossRevenue) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Net Revenue */}
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <p className="font-bold text-lg">Net Revenue (Your Earnings)</p>
                      <p className="text-sm text-muted-foreground">After platform fee</p>
                    </div>
                    <span className="text-2xl font-bold text-primary">${netRevenue.toFixed(2)}</span>
                  </div>
                  <div className="bg-gray-100 rounded-lg h-4 overflow-hidden w-full">
                    <div 
                      className="bg-primary h-full" 
                      style={{ width: `${(netRevenue / totalGrossRevenue) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Payout Status */}
                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Paid Out</span>
                    <span className="font-semibold">${totalPaidOut.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pending Payout</span>
                    <span className="font-semibold text-amber-600">${Math.max(0, pendingAmount).toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods Info */}
            <Card className="bg-muted/30 border-muted">
              <CardContent className="p-6">
                <h4 className="font-semibold mb-2">Next Payout</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Payouts are processed weekly, typically within 2-3 business days to your connected bank account.
                </p>
                <Link to={createPageUrl('ProviderSettings')}>
                  <Button variant="outline" size="sm">
                    Update Bank Details
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
