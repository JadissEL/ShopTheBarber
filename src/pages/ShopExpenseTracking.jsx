import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, TrendingDown, AlertCircle, Receipt } from "lucide-react";
import { motion } from "framer-motion";

export default function ShopExpenseTracking() {
    const expenses = [
        { id: 1, category: "Loyer", amount: 1500, date: "2024-12-01", recurring: true },
        { id: 2, category: "Produits", amount: 450, date: "2024-11-28", recurring: false },
        { id: 3, category: "Électricité", amount: 180, date: "2024-11-25", recurring: true },
        { id: 4, category: "Marketing", amount: 300, date: "2024-11-20", recurring: false }
    ];

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const recurringExpenses = expenses.filter(e => e.recurring).reduce((sum, e) => sum + e.amount, 0);

    const categories = ["Loyer", "Produits", "Électricité", "Marketing", "Salaires", "Autres"];

    return (
        <div className="min-h-screen py-12 bg-background-light dark:bg-background-dark font-sans">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-display font-bold text-charcoal dark:text-white mb-2">Suivi des Dépenses</h1>
                        <p className="text-lg text-slate dark:text-matte-silver">Gérez vos dépenses professionnelles</p>
                    </div>
                    <Button className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl h-12 px-6">
                        <Plus className="w-5 h-5 mr-2" />
                        Nouvelle Dépense
                    </Button>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <Card className="rounded-2xl border-none shadow-soft bg-gradient-to-br from-red-500 to-red-600 text-white">
                        <CardContent className="p-6">
                            <TrendingDown className="w-10 h-10 mb-3" />
                            <p className="text-sm text-white/80 mb-1">Dépenses Totales</p>
                            <p className="text-4xl font-display font-bold">{totalExpenses}€</p>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                        <CardContent className="p-6">
                            <Receipt className="w-10 h-10 text-amber-600 mb-3" />
                            <p className="text-sm text-slate dark:text-matte-silver mb-1">Dépenses Récurrentes</p>
                            <p className="text-4xl font-display font-bold text-charcoal dark:text-white">{recurringExpenses}€</p>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                        <CardContent className="p-6">
                            <AlertCircle className="w-10 h-10 text-blue-600 mb-3" />
                            <p className="text-sm text-slate dark:text-matte-silver mb-1">Catégories</p>
                            <p className="text-4xl font-display font-bold text-charcoal dark:text-white">{categories.length}</p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                    <CardContent className="p-6">
                        <h3 className="text-2xl font-bold text-charcoal dark:text-white mb-6">Dépenses Récentes</h3>
                        <div className="space-y-4">
                            {expenses.map((expense, idx) => (
                                <motion.div
                                    key={expense.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="flex items-center justify-between p-4 bg-background-light dark:bg-background-dark rounded-xl"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                                            <Minus className="w-6 h-6 text-red-600 dark:text-red-400" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-charcoal dark:text-white">{expense.category}</h4>
                                            <p className="text-sm text-slate dark:text-matte-silver">
                                                {new Date(expense.date).toLocaleDateString('fr-FR')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        {expense.recurring && (
                                            <Badge className="bg-blue-100 text-blue-800 border-0">Récurrent</Badge>
                                        )}
                                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">-{expense.amount}€</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
