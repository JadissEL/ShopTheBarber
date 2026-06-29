import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, ArrowUpRight, ArrowDownLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, parseISO, isValid } from 'date-fns';
import { MetaTags } from '@/components/seo/MetaTags';
import { signInUrlWithReturn } from '@/utils';

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
            <div className="min-h-screen py-12 flex items-center justify-center px-4">
                <MetaTags title="Wallet" description="Platform wallet balance" />
                <Card className="max-w-md w-full">
                    <CardContent className="p-8 text-center space-y-4">
                        <Wallet className="w-12 h-12 text-primary mx-auto" />
                        <h1 className="text-2xl font-bold">Wallet</h1>
                        <p className="text-muted-foreground">Sign in to view your balance and referral credits.</p>
                        <Button asChild>
                            <a href={signInUrlWithReturn('/ClientWallet')}>Sign in</a>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-12 bg-background-light dark:bg-background-dark font-sans">
            <MetaTags title="Wallet" description="Platform wallet and referral credits" />
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <h1 className="text-4xl font-display font-bold text-charcoal dark:text-white mb-2">Wallet</h1>
                    <p className="text-lg text-slate dark:text-matte-silver">
                        Referral credits and platform balance, use at checkout when available.
                    </p>
                </motion.div>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="space-y-6">
                        <Card className="rounded-2xl border-none shadow-soft bg-gradient-to-br from-primary to-primary/80 text-white overflow-hidden">
                            <CardContent className="p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <p className="text-white/80 mb-2">Available balance</p>
                                        <h2 className="text-5xl font-display font-bold">
                                            {symbol}{balance.toFixed(2)}
                                        </h2>
                                    </div>
                                    <Wallet className="w-16 h-16 text-white/30" />
                                </div>
                                <p className="text-sm text-white/70">
                                    Credits from referrals and promotions appear here automatically.
                                </p>
                            </CardContent>
                        </Card>

                        <div className="grid md:grid-cols-2 gap-6">
                            <Card className="rounded-2xl border-none shadow-soft">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                                            <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
                                        </div>
                                        <p className="text-sm text-muted-foreground">Received this month</p>
                                    </div>
                                    <p className="text-2xl font-bold">{symbol}{monthStats.received.toFixed(2)}</p>
                                </CardContent>
                            </Card>
                            <Card className="rounded-2xl border-none shadow-soft">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                                            <ArrowUpRight className="w-5 h-5 text-red-600" />
                                        </div>
                                        <p className="text-sm text-muted-foreground">Used this month</p>
                                    </div>
                                    <p className="text-2xl font-bold">{symbol}{monthStats.spent.toFixed(2)}</p>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="rounded-2xl border-none shadow-soft">
                            <CardContent className="p-6">
                                <h3 className="text-2xl font-bold mb-6">Transaction history</h3>
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
                                                    className="flex items-center justify-between p-4 bg-muted/40 rounded-xl"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isCredit ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                                                            {isCredit ? (
                                                                <ArrowDownLeft className="w-6 h-6 text-emerald-600" />
                                                            ) : (
                                                                <ArrowUpRight className="w-6 h-6 text-red-600" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold">{tx.description || tx.type}</p>
                                                            <p className="text-sm text-muted-foreground">{formatTxDate(tx.created_at)}</p>
                                                        </div>
                                                    </div>
                                                    <p className={`text-xl font-bold ${isCredit ? 'text-emerald-600' : 'text-red-600'}`}>
                                                        {isCredit ? '+' : ''}{symbol}{Math.abs(tx.amount).toFixed(2)}
                                                    </p>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
