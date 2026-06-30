import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, BarChart3, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { stb } from '@/lib/stbUi';

const BAR_HEIGHTS = [40, 65, 55, 90];

export default function MonthlySpendingCard({
  amount = '0.00',
  trend = '-',
  currency = '$',
  loading = false,
}) {
  const trendUp = trend.startsWith('+') || trend === 'New';
  const TrendIcon = trendUp ? TrendingUp : TrendingDown;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
      <Card className={cn(stb.panel, 'h-full p-5 flex flex-col justify-between')}>
        <div className="flex justify-between items-start mb-3">
          <BarChart3 className="w-5 h-5 text-muted-foreground" />
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : (
            <span className={`inline-flex items-center gap-1 text-xs font-semibold ${trendUp ? 'text-primary' : 'text-muted-foreground'}`}>
              <TrendIcon className="w-3.5 h-3.5" /> {trend}
            </span>
          )}
        </div>
        <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1">Monthly Spending</p>
        <p className="text-2xl font-bold text-foreground mb-4">
          {loading ? '-' : `${currency}${amount}`}
        </p>
        <div className="flex items-end gap-1.5 h-8">
          {BAR_HEIGHTS.map((h, i) => (
            <div
              key={i}
              className={cn(
                'flex-1 rounded-t min-w-[6px] max-w-[12px] transition-all duration-500',
                i === BAR_HEIGHTS.length - 1 ? 'bg-primary' : i === BAR_HEIGHTS.length - 2 ? 'bg-primary/40' : 'bg-muted'
              )}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </Card>
    </motion.div>
  );
}
