import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';

export default function LoyaltyGoalCard({ percent = 75, currentPoints = 8420, nextTier = 'Platinum', pointsToNext = 1500 }) {
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
      <Card className="h-full p-5 border border-slate-200 bg-white shadow-sm rounded-2xl flex flex-col items-center justify-center text-center">
        <div className="relative w-24 h-24 mb-3">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
            <circle
              cx="48"
              cy="48"
              r="36"
              fill="none"
              stroke="rgb(226 232 240)"
              strokeWidth="8"
            />
            <circle
              cx="48"
              cy="48"
              r="36"
              fill="none"
              stroke="rgb(249 115 22)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-700"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-foreground">{percent}%</span>
        </div>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Loyalty Goal</p>
        <p className="text-slate-700 text-sm font-medium">{pointsToNext.toLocaleString()} to {nextTier}</p>
      </Card>
    </motion.div>
  );
}
