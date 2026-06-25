import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, CreditCard, Plus, ArrowUpRight, ArrowDownLeft, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function ClientWallet() {
    const balance = 125.50;
    const transactions = [
        { id: 1, type: "credit", amount: 50, description: "Remboursement réservation", date: new Date(2025, 11, 1) },
        { id: 2, type: "debit", amount: 35, description: "Paiement coupe", date: new Date(2025, 10, 28) },
        { id: 3, type: "credit", amount: 100, description: "Recharge portefeuille", date: new Date(2025, 10, 25) },
        { id: 4, type: "debit", amount: 45, description: "Service barbe", date: new Date(2025, 10, 20) }
    ];

    return (
        <div className="min-h-screen py-12 bg-background-light dark:bg-background-dark font-sans">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <h1 className="text-4xl font-display font-bold text-charcoal dark:text-white mb-2">Mon Portefeuille</h1>
                    <p className="text-lg text-slate dark:text-matte-silver">Gérez votre solde et vos transactions</p>
                </motion.div>

                <div className="space-y-6">
                    {/* Balance Card */}
                    <Card className="rounded-2xl border-none shadow-soft bg-gradient-to-br from-primary to-primary/80 text-white overflow-hidden">
                        <CardContent className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <p className="text-white/80 mb-2">Solde Disponible</p>
                                    <h2 className="text-5xl font-display font-bold">{balance.toFixed(2)}€</h2>
                                </div>
                                <Wallet className="w-16 h-16 text-white/30" />
                            </div>
                            <div className="flex gap-4">
                                <Button className="flex-1 bg-white text-primary hover:bg-white/90 font-bold rounded-xl h-12">
                                    <Plus className="w-5 h-5 mr-2" />
                                    Recharger
                                </Button>
                                <Button variant="outline" className="flex-1 border-2 border-white text-white hover:bg-white/10 font-bold rounded-xl h-12">
                                    <CreditCard className="w-5 h-5 mr-2" />
                                    Retirer
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Stats */}
                    <div className="grid md:grid-cols-3 gap-6">
                        <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                                        <ArrowDownLeft className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <p className="text-sm text-slate dark:text-matte-silver">Reçu ce mois</p>
                                </div>
                                <p className="text-2xl font-bold text-charcoal dark:text-white">150.00€</p>
                            </CardContent>
                        </Card>

                        <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                                        <ArrowUpRight className="w-5 h-5 text-red-600 dark:text-red-400" />
                                    </div>
                                    <p className="text-sm text-slate dark:text-matte-silver">Dépensé ce mois</p>
                                </div>
                                <p className="text-2xl font-bold text-charcoal dark:text-white">80.00€</p>
                            </CardContent>
                        </Card>

                        <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                        <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <p className="text-sm text-slate dark:text-matte-silver">Économies</p>
                                </div>
                                <p className="text-2xl font-bold text-charcoal dark:text-white">70.00€</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Transactions */}
                    <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                        <CardContent className="p-6">
                            <h3 className="text-2xl font-bold text-charcoal dark:text-white mb-6">Historique des Transactions</h3>
                            <div className="space-y-3">
                                {transactions.map((transaction, idx) => (
                                    <motion.div
                                        key={transaction.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="flex items-center justify-between p-4 bg-background-light dark:bg-background-dark rounded-xl"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${transaction.type === 'credit' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'
                                                }`}>
                                                {transaction.type === 'credit' ? (
                                                    <ArrowDownLeft className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                                                ) : (
                                                    <ArrowUpRight className="w-6 h-6 text-red-600 dark:text-red-400" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-charcoal dark:text-white">{transaction.description}</p>
                                                <p className="text-sm text-slate dark:text-matte-silver">
                                                    {format(transaction.date, 'dd MMMM yyyy', { locale: fr })}
                                                </p>
                                            </div>
                                        </div>
                                        <p className={`text-xl font-bold ${transaction.type === 'credit' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                                            }`}>
                                            {transaction.type === 'credit' ? '+' : '-'}{transaction.amount.toFixed(2)}€
                                        </p>
                                    </motion.div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
