import { motion } from 'framer-motion';
import { Sparkles, TrendingUp } from 'lucide-react';

export default function QuickInsights({ insights }) {
    if (!insights || insights.length === 0) return null;

    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Your Insights</h3>
            </div>

            <div className="space-y-4">
                {insights.map((insight, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-start gap-3 pb-4 border-b border-slate-100 last:border-0 last:pb-0"
                    >
                        <div className="mt-0.5 p-1.5 bg-slate-100 rounded-md text-slate-600 border border-slate-200">
                            {insight.icon || <TrendingUp className="w-3 h-3" />}
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            {insight.text}
                        </p>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
