import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { stb } from '@/lib/stbUi';

export default function MetricCard({ title, value, subValue, trend, trendValue, icon: Icon, className, delay = 0, children }) {
    const isPositive = trend === 'up';
    const isNeutral = trend === 'neutral';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className={cn("h-full", className)}
        >
            <Card className={cn('h-full p-5 flex flex-col justify-between group', stb.surface, stb.surfaceInteractive)}>
                <div className="flex justify-between items-start mb-2">
                    <p className={stb.label}>{title}</p>
                    {Icon && (
                        <div className={cn(stb.iconBox, 'w-9 h-9 p-0 group-hover:bg-primary/15 transition-colors')}>
                            <Icon className="w-4 h-4" />
                        </div>
                    )}
                </div>

                <div>
                    <h3 className={cn(stb.uiHeading, 'text-2xl mb-1')}>{value}</h3>
                    {subValue && <p className={cn(stb.body, 'mb-2')}>{subValue}</p>}

                    {(trendValue) && (
                        <div className={cn(
                            'stb-chip text-[10px]',
                            isPositive ? 'stb-chip-active border-success/30 bg-success/10 text-success' :
                                isNeutral ? 'bg-muted text-muted-foreground' :
                                    'border-destructive/30 bg-destructive/10 text-destructive'
                        )}>
                            {isPositive ? <ArrowUpRight className="w-3 h-3" /> : isNeutral ? <Minus className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {trendValue}
                        </div>
                    )}
                </div>
                {children && <div className="mt-3">{children}</div>}
            </Card>
        </motion.div>
    );
}
