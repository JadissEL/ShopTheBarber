import { motion } from 'framer-motion';
import { Lightbulb, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function InsightBanner({ message, actionText, onAction, type: _type = 'info' }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8"
        >
            <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-full shrink-0">
                    <Lightbulb className="w-4 h-4 text-primary" />
                </div>
                <div>
                    <p className="text-sm text-foreground font-medium leading-relaxed">
                        {message}
                    </p>
                </div>
            </div>
            {actionText && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onAction}
                    className="text-primary hover:text-primary/80 hover:bg-primary/10 font-semibold text-xs shrink-0"
                >
                    {actionText} <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
            )}
        </motion.div>
    );
}
