import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Wallet, ArrowUpRight, ArrowDownLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, parseISO, isValid } from 'date-fns';
import { MetaTags } from '@/components/seo/MetaTags';
import { signInUrlWithReturn } from '@/utils';
import PageHeader from '@/components/layout/PageHeader';
import PageContent from '@/components/layout/PageContent';
import { cn } from '@/lib/utils';
import { stb } from '@/lib/stbUi';

function formatTxDate(value) {
    if (!value) return '-';
    const d = typeof value === 'string' ? parseISO(value) : new Date(value);
    return isValid(d) ? format(d, 'MMM d, yyyy') : '-';
}

export default function ClientWallet() {
    const { user, isAuthenticated } = useAuth();

    const { data: wallet, isLoading } = useQuery({
        queryKey: ['wallet-me', user?.id],
        queryFn: () => sovereign.wallet.getMe(),
        enabled: isAuthenticated && !!user?.id,
    });

    const balance = wallet?.balance ?? 0;
    const currency = wallet?.currency ?? 'USD';
    const symbol = currency === 'EUR' ? '€' : '$';
    const transactions = wallet?.transactions ?? [];

    const monthStats = useMemo(() => {
        const now = new Date();
        const month = now.getMonth();
        const year = now.getFullYear();
        let received = 0;
        let spent = 0;
        for (const tx of transactions) {
            const d = tx.created_at ? parseISO(tx.created_at) : null;
            if (!d || !isValid(d) || d.getMonth() !== month || d.getFullYear() !== year) continue;
            if (tx.amount >= 0) received += tx.amount;
            else spent += Math.abs(tx.amount);
        }
        return { received, spent };
    }, [transactions]);

    if (!isAuthenticated) {
        return (
            <div className="stb-page flex items-center justify-center py-12 px-4">
                <MetaTags title="Wallet" description="Platform wallet balance" />
                <div className={cn(stb.panel, 'max-w-md w-full p-8 text-center space-y-4')}>
                    <Wallet className="w-12 h-12 text-primary mx-auto" />
                    <h1 className={cn(stb.uiHeading, 'text-2xl')}>Wallet</h1>
                    <p className={cn(stb.body, 'text-muted-foreground')}>Sign in to view your balance and referral credits.</p>
                    <Button asChild>
                        <a href={signInUrlWithReturn('/ClientWallet')}>Sign in</a>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="stb-page lg:pb-8 font-sans">
            <MetaTags title="Wallet" description="Platform wallet and referral credits" />
            <PageHeader
                label="Account"
                title="Wallet"
                subtitle="Referral credits and platform balance — use at checkout when available."
                compact
                variant="light"
                tier="app"
            />

            <PageContent narrow>
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className={cn(stb.panel, 'bg-primary text-primary-foreground overflow-hidden p-8')}>
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <p className={cn(stb.caption, 'text-primary-foreground/80 mb-2')}>Available balance</p>
                                        <h2 className={cn(stb.uiHeading, 'text-5xl')}>
                                            {symbol}{balance.toFixed(2)}
                                        </h2>
                                    </div>
                                    <Wallet className="w-16 h-16 text-primary-foreground/30" />
                                </div>
                                <p className={cn(stb.caption, 'text-primary-foreground/70')}>
                                    Credits from referrals and promotions appear here automatically.
                                </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className={cn(stb.panel, 'p-6')}>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className={cn(stb.iconBox, 'bg-success/10')}>
                                            <ArrowDownLeft className="w-5 h-5 text-success" />
                                        </div>
                                        <p className={cn(stb.caption, 'text-muted-foreground')}>Received this month</p>
                                    </div>
                                    <p className={cn(stb.metricValue, 'text-2xl')}>{symbol}{monthStats.received.toFixed(2)}</p>
                            </div>
                            <div className={cn(stb.panel, 'p-6')}>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className={cn(stb.iconBox, 'bg-destructive/10')}>
                                            <ArrowUpRight className="w-5 h-5 text-destructive" />
                                        </div>
                                        <p className={cn(stb.caption, 'text-muted-foreground')}>Used this month</p>
                                    </div>
                                    <p className={cn(stb.metricValue, 'text-2xl')}>{symbol}{monthStats.spent.toFixed(2)}</p>
                            </div>
                        </div>

                        <div className={cn(stb.panel, 'p-6')}>
                                <h3 className={cn(stb.uiHeading, 'text-2xl mb-6')}>Transaction history</h3>
                                {transactions.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-8">No transactions yet. Refer friends to earn credits.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {transactions.map((tx, idx) => {
                                            const isCredit = tx.amount >= 0;
                                            return (
                                                <motion.div
                                                    key={tx.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    className={cn(stb.surfaceMuted, 'flex items-center justify-between p-4 rounded-lg')}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center', isCredit ? 'bg-success/10' : 'bg-destructive/10')}>
                                                            {isCredit ? (
                                                                <ArrowDownLeft className="w-6 h-6 text-success" />
                                                            ) : (
                                                                <ArrowUpRight className="w-6 h-6 text-destructive" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold">{tx.description || tx.type}</p>
                                                            <p className="text-sm text-muted-foreground">{formatTxDate(tx.created_at)}</p>
                                                        </div>
                                                    </div>
                                                    <p className={cn(stb.metricValue, 'text-xl', isCredit ? 'text-success' : 'text-destructive')}>
                                                        {isCredit ? '+' : ''}{symbol}{Math.abs(tx.amount).toFixed(2)}
                                                    </p>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                )}
                        </div>
                    </div>
                )}
            </PageContent>
        </div>
    );
}
