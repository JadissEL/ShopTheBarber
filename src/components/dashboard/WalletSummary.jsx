import { useQuery } from '@tanstack/react-query';
import { Wallet, Gift, ChevronRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { sovereign } from '@/api/apiClient';
import { cn } from '@/lib/utils';
import { stb } from '@/lib/stbUi';

export default function WalletSummary({ hideHeader }) {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => sovereign.auth.me(),
  });

  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ['wallet-me', user?.id],
    queryFn: () => sovereign.wallet.getMe(),
    enabled: !!user?.id,
  });

  const { data: loyaltySummary, isLoading: loyaltyLoading } = useQuery({
    queryKey: ['loyalty-me', user?.id],
    queryFn: () => sovereign.loyalty.getMe(),
    enabled: !!user?.id,
  });

  const currency = wallet?.currency ?? 'USD';
  const symbol = currency === 'EUR' ? '€' : '$';
  const balance = wallet?.balance ?? 0;
  const currentPoints = loyaltySummary?.current_points ?? 0;
  const nextTierPoints = loyaltySummary?.points_to_next_tier ?? 50;
  const tier = loyaltySummary?.tier ?? 'Bronze';
  const progressPct = nextTierPoints > 0
    ? Math.min(100, Math.round((currentPoints / (currentPoints + nextTierPoints)) * 100))
    : 100;
  const pointsToNext = Math.max(0, nextTierPoints);

  const loading = walletLoading || loyaltyLoading;

  return (
    <div>
      {!hideHeader && (
        <div className="flex items-center justify-between mb-6 px-1">
          <h2 className="text-xl font-bold text-foreground tracking-tight">Wallet & Loyalty</h2>
          <Link to={createPageUrl('Loyalty')} className="text-sm text-primary hover:text-primary/80 font-medium">View Loyalty</Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={cn(stb.panel, stb.surfaceHover, 'p-5 flex flex-col justify-between h-full')}>
          <div>
            <div className="flex justify-between items-start mb-2">
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Wallet Balance</p>
              <Wallet className="w-4 h-4 text-primary" />
            </div>
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground my-2" />
            ) : (
              <h3 className="text-3xl font-bold text-foreground mb-1">{symbol}{balance.toFixed(2)}</h3>
            )}
            <p className="text-xs text-muted-foreground">Referral credits & platform balance</p>
          </div>
          <Button asChild size="sm" className="w-full bg-primary text-white hover:bg-primary/90 mt-4 h-9 text-xs font-bold">
            <Link to={createPageUrl('ClientWallet')}>View Wallet</Link>
          </Button>
        </div>

        <div className={cn(stb.panel, stb.surfaceHover, 'p-5 flex flex-col justify-between h-full')}>
          <div>
            <div className="flex justify-between items-start mb-2">
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Loyalty Points</p>
              <Gift className="w-4 h-4 text-primary" />
            </div>
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground my-2" />
            ) : (
              <>
                <div className="flex items-end gap-2 mb-2">
                  <h3 className="text-2xl font-bold text-foreground">{currentPoints.toLocaleString()}</h3>
                  <span className="text-xs text-muted-foreground mb-1.5 capitalize">{tier} tier</span>
                </div>
                <div className="w-full bg-muted h-2 rounded-full mt-1 mb-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="bg-primary h-full rounded-full"
                  />
                </div>
                <p className="text-[10px] text-primary font-medium">
                  {pointsToNext > 0
                    ? `${pointsToNext} points to your next reward`
                    : 'You can redeem a reward!'}
                </p>
              </>
            )}
          </div>
          <Button asChild size="sm" variant="ghost" className="w-full mt-2 text-primary hover:text-primary/80 hover:bg-primary/5 h-9 text-xs justify-between px-0 font-medium">
            <Link to={createPageUrl('Loyalty')}>
              Redeem Rewards <ChevronRight className="w-3 h-3" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
