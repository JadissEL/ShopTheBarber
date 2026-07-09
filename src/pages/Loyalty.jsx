import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { Award, TrendingUp, Gift, History, Copy, Plane } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TabPanelContent } from '@/components/ui/tab-panel-content';
import { MetaTags } from '@/components/seo/MetaTags';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import LoyaltyCard from '@/components/loyalty/LoyaltyCard';
import WalletSummary from '@/components/dashboard/WalletSummary';
import { toast } from 'sonner';
import PageHeader from '@/components/layout/PageHeader';
import PageContent from '@/components/layout/PageContent';
import { cn } from '@/lib/utils';
import { stb } from '@/lib/stbUi';

export default function Loyalty() {
  const [selectedReward, setSelectedReward] = useState(null);
  const [lastPromoCode, setLastPromoCode] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => sovereign.auth.me(),
  });

  const { data: program } = useQuery({
    queryKey: ['loyalty-program'],
    queryFn: () => sovereign.loyalty.getProgram(),
  });

  const { data: loyaltySummary, isLoading: summaryLoading } = useQuery({
    queryKey: ['loyalty-me', user?.id],
    queryFn: () => sovereign.loyalty.getMe(),
    enabled: !!user,
  });

  const redeemRewardMutation = useMutation({
    mutationFn: (rewardId) => sovereign.loyalty.redeem(rewardId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-me'] });
      queryClient.invalidateQueries({ queryKey: ['loyalty-profile'] });
      if (data.promo_code) {
        setLastPromoCode(data.promo_code);
        toast.success(data.message || `Reward claimed, use ${data.promo_code} at checkout`);
      } else {
        toast.success(data.message || `Reward claimed: ${data.reward?.title}`);
      }
      setSelectedReward(null);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to redeem reward');
    },
  });

  const rewards = program?.rewards ?? [];
  const transactions = loyaltySummary?.transactions ?? [];
  const activeCodes = loyaltySummary?.active_reward_codes ?? [];
  const currentPoints = loyaltySummary?.current_points ?? 0;
  const lifetimePoints = loyaltySummary?.lifetime_points ?? 0;
  const tier = loyaltySummary?.tier ?? 'Bronze';
  const nextTierPoints = loyaltySummary?.next_tier
    ? program?.tier_thresholds?.[loyaltySummary.next_tier]
    : null;

  const progress = nextTierPoints
    ? Math.min(100, (lifetimePoints / nextTierPoints) * 100)
    : 100;

  const loyaltyProfile = loyaltySummary?.profile
    ? {
        ...loyaltySummary.profile,
        current_points: currentPoints,
        lifetime_points: lifetimePoints,
        tier,
      }
    : null;

  if (!user) {
    return (
      <div className="stb-page flex items-center justify-center p-4">
        <MetaTags title="Loyalty" description="Earn and redeem loyalty points" />
        <Card>
          <CardContent className="py-8 text-center">
            <Award className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Sign in to access your loyalty rewards</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="stb-page lg:pb-8">
      <MetaTags
        title="Loyalty & Rewards"
        description="Earn points on bookings and redeem exclusive rewards"
      />

      <PageHeader
        label="Rewards"
        title="Loyalty & rewards"
        subtitle={program?.points_per_dollar_display ?? 'Earn points on every completed booking'}
        compact
        variant="light"
        tier="app"
      />

      <PageContent>
        {loyaltySummary?.dollar_value != null && (
          <p className={cn(stb.caption, 'text-primary -mt-4 mb-6')}>
            Your balance ≈ ${loyaltySummary.dollar_value.toFixed(2)} in rewards
          </p>
        )}

        <Link to={createPageUrl('TombolaLive')}>
          <div className={cn(stb.panel, stb.surfaceHover, 'mb-6 border-primary/30 bg-primary/10 p-5')}>
            <div className="flex items-center gap-4">
              <Plane className="w-10 h-10 text-primary shrink-0" />
              <div className="flex-1">
                <h2 className={cn(stb.uiSubheading, 'text-lg')}>Weekly Trip Tombola</h2>
                <p className={cn(stb.body, 'text-sm text-muted-foreground')}>Win a getaway for two — watch the live draw every Sunday.</p>
              </div>
              <Button size="sm" variant="secondary">Join & watch live</Button>
            </div>
          </div>
        </Link>

        {(lastPromoCode || activeCodes.length > 0) && (
          <div className={cn(stb.panel, 'mb-6 border-primary/30 bg-primary/5 p-4 space-y-3')}>
              <p className="text-sm font-semibold">Your active reward codes</p>
              {(lastPromoCode ? [{ code: lastPromoCode, discount_text: 'Just redeemed' }] : [])
                .concat(activeCodes.filter((c) => c.code !== lastPromoCode))
                .map((c) => (
                  <div key={c.code} className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-mono text-lg font-bold">{c.code}</p>
                      <p className="text-xs text-muted-foreground">{c.discount_text}, apply at checkout</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(c.code);
                        toast.success('Code copied');
                      }}
                    >
                      <Copy className="w-4 h-4 mr-1" /> Copy
                    </Button>
                  </div>
                ))}
          </div>
        )}

        <div className="mb-8">
          <WalletSummary hideHeader />
        </div>

        {summaryLoading ? (
          <div className="h-32 rounded-lg bg-muted animate-pulse mb-8" />
        ) : loyaltyProfile ? (
          <div className="mb-8">
            <LoyaltyCard
              profile={loyaltyProfile}
              nextTierPoints={nextTierPoints}
              progress={progress}
            />
          </div>
        ) : null}

        <Tabs defaultValue="rewards" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="rewards" className="flex items-center gap-2">
              <Gift className="w-4 h-4" />
              <span className="hidden sm:inline">Available Rewards</span>
              <span className="sm:hidden">Rewards</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">Activity History</span>
              <span className="sm:hidden">History</span>
            </TabsTrigger>
          </TabsList>

          <TabPanelContent
            value="rewards"
            className="space-y-4"
            isEmpty={rewards.length === 0}
            emptyIcon={Gift}
            emptyTitle="No rewards available"
            emptyDescription="Rewards will appear here as you earn points from bookings and marketplace purchases."
            emptyActionLabel="Book an appointment"
            emptyActionHref={createPageUrl('Explore')}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rewards.map((reward) => {
                const canRedeem = currentPoints >= reward.points_cost;
                return (
                  <div
                    key={reward.id}
                    className={cn(stb.panel, stb.surfaceHover, 'cursor-pointer', !canRedeem && 'opacity-60')}
                    onClick={() => canRedeem && setSelectedReward(reward)}
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="text-2xl">{reward.icon}</div>
                        <Badge variant={canRedeem ? 'default' : 'outline'} className="text-xs">
                          {reward.points_cost} pts
                        </Badge>
                      </div>
                      <h3 className="font-bold text-base mb-1">{reward.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{reward.description}</p>
                      <Button
                        size="sm"
                        disabled={!canRedeem}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReward(reward);
                        }}
                        className="w-full"
                      >
                        {canRedeem ? 'Redeem' : 'Insufficient Points'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabPanelContent>

          <TabPanelContent
            value="history"
            className="space-y-2"
            isEmpty={transactions.length === 0}
            emptyIcon={History}
            emptyTitle="No activity yet"
            emptyDescription="Book your first appointment to start earning loyalty points."
            emptyActionLabel="Find a barber"
            emptyActionHref={createPageUrl('Explore')}
          >
            <div className={cn(stb.panel, 'overflow-hidden')}>
                <div className="divide-y divide-border">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{tx.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {tx.date_text ? new Date(tx.date_text).toLocaleDateString() : '-'}
                        </p>
                      </div>
                      <div className={`font-bold text-sm ${tx.points > 0 ? 'text-success' : 'text-destructive'}`}>
                        {tx.points > 0 ? '+' : ''}{tx.points}
                      </div>
                    </div>
                  ))}
                </div>
            </div>
          </TabPanelContent>
        </Tabs>

        <section className={cn(stb.panel, 'mt-12 p-6')}>
          <h2 className={cn(stb.uiSubheading, 'text-lg mb-4 flex items-center gap-2')}>
            <TrendingUp className="w-5 h-5" />
            How Loyalty Points Work
          </h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>✓ {program?.points_per_dollar_display ?? 'Earn 1 point per $1 spent on completed bookings'}</li>
            <li>✓ {program?.redemption_display ?? '100 points = $2 off'}, competitive with Booksy & Fresha</li>
            <li>✓ {program?.first_reward_hint ?? 'First $5 reward after 2-3 visits'}</li>
            <li>✓ Tier bonuses: Silver +10%, Gold +25%, Platinum +50% earn on bookings</li>
            <li>✓ Marketplace purchases earn 2× points</li>
            <li>✓ Redeem for discount codes to use at checkout (valid 90 days)</li>
          </ul>
        </section>
      </PageContent>

      {selectedReward && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={cn(stb.surfaceOverlay, 'w-full max-w-sm p-0')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">{selectedReward.icon}</span>
                Redeem {selectedReward.title}?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Cost:</p>
                <p className="text-2xl font-bold text-primary">{selectedReward.points_cost} points</p>
              </div>
              <p className="text-sm text-muted-foreground">{selectedReward.description}</p>
              {selectedReward.reward_type === 'discount' && (
                <p className="text-xs text-muted-foreground">
                  You will receive a personal promo code to apply at checkout.
                </p>
              )}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSelectedReward(null)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => redeemRewardMutation.mutate(selectedReward.id)}
                  disabled={redeemRewardMutation.isPending}
                >
                  {redeemRewardMutation.isPending ? 'Redeeming...' : 'Confirm'}
                </Button>
              </div>
            </CardContent>
          </div>
        </div>
      )}
    </div>
  );
}
