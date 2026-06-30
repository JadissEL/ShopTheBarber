import { Progress } from '@/components/ui/progress';
import { Award, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { stb } from '@/lib/stbUi';
import { motion } from 'framer-motion';

const TIER_STYLES = {
  Bronze: 'border-primary/40 bg-primary/5',
  Silver: 'border-foreground/25 bg-muted',
  Gold: 'border-primary bg-primary/10',
  Platinum: 'border-foreground bg-[hsl(var(--navy))] text-white',
};

export default function LoyaltyCard({ profile, nextTierPoints, progress }) {
  const tierProgressLabel =
    profile.tier === 'Platinum' || !nextTierPoints
      ? `${profile.lifetime_points} lifetime pts`
      : `${profile.lifetime_points} / ${nextTierPoints} Lifetime Pts`;

  const pointsToNext =
    profile.tier !== 'Platinum' && nextTierPoints
      ? Math.max(0, nextTierPoints - profile.lifetime_points)
      : null;

  const tierStyle = TIER_STYLES[profile.tier] ?? TIER_STYLES.Bronze;
  const isPlatinum = profile.tier === 'Platinum';

  return (
    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full">
      <div
        className={cn(
          'relative overflow-hidden p-6 min-h-[220px] flex flex-col justify-between',
          isPlatinum ? cn(stb.surfaceDark, stb.surfaceDarkHover) : cn(stb.surface, stb.surfaceInteractive, tierStyle),
          isPlatinum && '[&_.stb-tier-label]:text-white/80 [&_.stb-tier-value]:text-white [&_.stb-tier-body]:text-white/85',
        )}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 -translate-y-1/2 translate-x-1/2 pointer-events-none" aria-hidden />

        <div className="relative z-10 flex justify-between items-start gap-4">
          <div>
            <p className="stb-tier-label stb-section-label mb-1">Member Status</p>
            <h2 className={cn(stb.title, 'text-3xl flex items-center gap-2')}>
              {profile.tier}
              <Award className={cn('w-6 h-6', isPlatinum ? 'text-primary' : 'text-primary')} />
            </h2>
          </div>
          <div className="text-right">
            <p className="stb-tier-label stb-section-label mb-1">Current Balance</p>
            <h3 className={cn(stb.metricValue, 'text-4xl tracking-wide')}>{profile.current_points.toLocaleString()}</h3>
            <p className="stb-tier-body text-xs uppercase tracking-wider">pts</p>
          </div>
        </div>

        <div className="relative z-10 mt-8">
          <div className="flex justify-between text-sm font-medium mb-2 stb-tier-body">
            <span>Progress to {profile.tier === 'Platinum' ? 'Max Level' : 'Next Tier'}</span>
            <span>{tierProgressLabel}</span>
          </div>
          <Progress
            value={progress}
            className={cn('h-2.5', isPlatinum ? 'bg-white/15' : 'bg-foreground/10')}
            indicatorClassName="bg-primary"
          />
          {pointsToNext != null && pointsToNext > 0 && (
            <p className="stb-tier-body text-xs mt-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-primary" />
              Only {pointsToNext} more lifetime points to reach next level
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
