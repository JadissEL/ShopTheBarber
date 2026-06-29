import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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
            <Card className="h-full p-5 border border-border bg-card shadow-sm hover:shadow-md transition-all rounded-[13px] flex flex-col justify-between group stb-card-lift">
                <div className="flex justify-between items-start mb-2">
                    <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">{title}</p>
                    {Icon && (
                        <div className="p-2 bg-muted rounded-lg text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                            <Icon className="w-4 h-4" />
                        </div>
                    )}
                </div>

                <div>
                    <h3 className="text-2xl font-bold text-foreground mb-1">{value}</h3>
                    {subValue && <p className="text-xs text-muted-foreground mb-2">{subValue}</p>}

                    {(trendValue) && (
                        <div className={cn(
                            "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border",
                            isPositive ? "bg-success/10 text-success border-success/20" :
                                isNeutral ? "bg-muted text-muted-foreground border-border" :
                                    "bg-rose-50 text-rose-700 border-rose-100"
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
