import { Progress } from '@/components/ui/progress';
import { Award, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function LoyaltyCard({ profile, nextTierPoints, progress }) {
    const getTierColor = (tier) => {
        switch(tier) {
            case 'Silver': return 'from-slate-300 to-slate-400 text-slate-900';
            case 'Gold': return 'from-yellow-300 to-amber-500 text-amber-950';
            case 'Platinum': return 'from-slate-800 to-black text-white border-slate-700';
            default: return 'from-orange-100 to-orange-200 text-orange-900'; // Bronze
        }
    };

    const getIconColor = (tier) => {
        if (tier === 'Platinum') return 'text-slate-200';
        return 'text-current opacity-50';
    };

    return (
        <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full"
        >
            <div className={cn(
                "relative overflow-hidden rounded-2xl p-6 shadow-xl bg-gradient-to-br min-h-[220px] flex flex-col justify-between",
                getTierColor(profile.tier)
            )}>
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 rounded-full bg-white/20 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 rounded-full bg-black/5 blur-3xl"></div>

                <div className="relative z-10 flex justify-between items-start">
                    <div>
                        <p className="text-sm font-medium opacity-80 uppercase tracking-wider">Member Status</p>
                        <h2 className="text-3xl font-bold flex items-center gap-2 mt-1">
                            {profile.tier}
                            <Award className={cn("w-6 h-6", getIconColor(profile.tier))} />
                        </h2>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-medium opacity-80 uppercase tracking-wider">Current Balance</p>
                        <h3 className="text-4xl font-extrabold mt-1">{profile.current_points.toLocaleString()}</h3>
                        <p className="text-xs opacity-70">pts</p>
                    </div>
                </div>

                <div className="relative z-10 mt-8">
                    <div className="flex justify-between text-sm font-medium mb-2 opacity-90">
                        <span>Progress to {profile.tier === 'Platinum' ? 'Max Level' : 'Next Tier'}</span>
                        <span>{profile.lifetime_points} / {nextTierPoints} Lifetime Pts</span>
                    </div>
                    <Progress value={progress} className="h-3 bg-black/10" indicatorClassName="bg-current opacity-80" />
                    {profile.tier !== 'Platinum' && (
                        <p className="text-xs mt-2 opacity-75 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            Only {nextTierPoints - profile.lifetime_points} more points to reach next level
                        </p>
                    )}
                </div>
            </div>
        </motion.div>
    );
}