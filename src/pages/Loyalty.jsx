import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { Award, TrendingUp, Gift, History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MetaTags } from '@/components/seo/MetaTags';
import LoyaltyCard from '@/components/loyalty/LoyaltyCard';
import WalletSummary from '@/components/dashboard/WalletSummary';
import ClientBottomNav from '@/components/dashboard/ClientBottomNav';
import { toast } from 'sonner';

// Predefined rewards catalog
const REWARD_CATALOG = [
  { id: 1, title: 'Free Haircut', description: 'Full standard haircut', points_cost: 150, icon: '✂️' },
  { id: 2, title: 'Free Beard Trim', description: 'Beard shaping & trim', points_cost: 100, icon: '🧔' },
  { id: 3, title: '$10 Discount', description: 'Off any service', points_cost: 80, icon: '💰' },
  { id: 4, title: '$25 Discount', description: 'Off any service', points_cost: 200, icon: '💰' },
  { id: 5, title: 'Priority Booking', description: '1 month priority slots', points_cost: 120, icon: '⭐' },
  { id: 6, title: 'Bonus 50 Points', description: 'Free loyalty boost', points_cost: 250, icon: '🎁' },
];

export default function Loyalty() {
  const [selectedReward, setSelectedReward] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => sovereign.auth.me(),
  });

  const { data: loyaltyProfile } = useQuery({
    queryKey: ['loyalty-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const profiles = await sovereign.entities.LoyaltyProfile.filter({ user_id: user.id });
      if (profiles.length > 0) return profiles[0];
      return await sovereign.entities.LoyaltyProfile.create({
        user_id: user.id,
        current_points: 0,
        lifetime_points: 0,
        tier: 'Bronze',
        joined_date: new Date().toISOString()
      });
    },
    enabled: !!user
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['loyalty-transactions', user?.id],
    queryFn: () => user ? sovereign.entities.LoyaltyTransaction.filter({ user_id: user.id }, '-created_date') : [],
    enabled: !!user
  });

  const redeemRewardMutation = useMutation({
    mutationFn: async (reward) => {
      if (!loyaltyProfile || loyaltyProfile.current_points < reward.points_cost) {
        throw new Error('Not enough points');
      }
      const newPoints = loyaltyProfile.current_points - reward.points_cost;
      await sovereign.entities.LoyaltyProfile.update(loyaltyProfile.id, {
        current_points: newPoints
      });
      await sovereign.entities.LoyaltyTransaction.create({
        user_id: user.id,
        points: -reward.points_cost,
        type: 'redeemed_reward',
        description: `Redeemed: ${reward.title}`,
        related_entity_id: reward.id
      });
      return { newPoints, reward };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-profile'] });
      queryClient.invalidateQueries({ queryKey: ['loyalty-transactions'] });
      toast.success(`Reward claimed: ${data.reward.title}`);
      setSelectedReward(null);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to redeem reward');
    }
  });

  const getTierThreshold = (tier) => {
    switch(tier) {
      case 'Bronze': return 0;
      case 'Silver': return 500;
      case 'Gold': return 1500;
      case 'Platinum': return 3000;
      default: return 0;
    }
  };

  const getNextTier = (tier) => {
    const tiers = ['Bronze', 'Silver', 'Gold', 'Platinum'];
    const currentIndex = tiers.indexOf(tier);
    return currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : null;
  };

  const nextTierPoints = getNextTier(loyaltyProfile?.tier) 
    ? getTierThreshold(getNextTier(loyaltyProfile?.tier))
    : null;

  const progress = nextTierPoints
    ? Math.min(100, ((loyaltyProfile?.lifetime_points || 0) / nextTierPoints) * 100)
    : 100;

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
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
    <div className="min-h-screen bg-background text-foreground pb-24 lg:pb-8">
      <MetaTags 
        title="Loyalty & Rewards" 
        description="Earn points on bookings and redeem exclusive rewards"
      />

      <div className="w-full max-w-4xl lg:max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Loyalty & Rewards</h1>
          <p className="text-muted-foreground">Earn points on every booking and unlock exclusive perks</p>
        </div>

        {/* Wallet & Credits Summary */}
        <div className="mb-8">
          <WalletSummary hideHeader />
        </div>

        {/* Main Loyalty Card */}
        {loyaltyProfile && (
          <div className="mb-8">
            <LoyaltyCard 
              profile={loyaltyProfile} 
              nextTierPoints={nextTierPoints} 
              progress={progress}
            />
          </div>
        )}

        {/* Tabs: Rewards & History */}
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

          {/* Available Rewards */}
          <TabsContent value="rewards" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {REWARD_CATALOG.map((reward) => {
                const canRedeem = (loyaltyProfile?.current_points || 0) >= reward.points_cost;
                return (
                  <Card 
                    key={reward.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${!canRedeem ? 'opacity-60' : ''}`}
                    onClick={() => canRedeem && setSelectedReward(reward)}
                  >
                    <CardContent className="p-4">
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
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Activity History */}
          <TabsContent value="history" className="space-y-2">
            {transactions.length > 0 ? (
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {transactions.map((tx, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{tx.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(tx.created_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className={`font-bold text-sm ${tx.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.points > 0 ? '+' : ''}{tx.points}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <History className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No activity yet. Book your first appointment to earn points!</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* How It Works */}
        <section className="mt-12 p-6 bg-muted rounded-2xl">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            How Loyalty Points Work
          </h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>✓ Earn 1 point per $1 spent on bookings</li>
            <li>✓ Reach milestones to unlock tier status: Silver (500pts), Gold (1500pts), Platinum (3000pts)</li>
            <li>✓ Redeem points for free services, discounts, and exclusive perks</li>
            <li>✓ Bonus points on special occasions and referrals</li>
          </ul>
        </section>
      </div>

      {/* Redemption Confirmation Modal */}
      {selectedReward && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-sm">
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
                  onClick={() => redeemRewardMutation.mutate(selectedReward)}
                  disabled={redeemRewardMutation.isPending}
                >
                  {redeemRewardMutation.isPending ? 'Redeeming...' : 'Confirm'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      <ClientBottomNav />
    </div>
  );
}
