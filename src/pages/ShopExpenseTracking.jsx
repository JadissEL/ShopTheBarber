import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, TrendingDown, AlertCircle, Receipt } from "lucide-react";
import { motion } from "framer-motion";
import { MetaTags } from '@/components/seo/MetaTags';
import PageHeader from '@/components/layout/PageHeader';
import PageContent from '@/components/layout/PageContent';

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
        <div className="stb-page pb-16 font-sans">
            <MetaTags title="Expenses" description="Track shop business expenses" />
            <PageHeader
                label="Provider"
                title="Expense tracking"
                subtitle="Gérez vos dépenses professionnelles"
                compact
                variant="light"
                tier="app"
            >
                <Button className="h-11">
                    <Plus className="w-5 h-5 mr-2" />
                    Nouvelle Dépense
                </Button>
            </PageHeader>

            <PageContent narrow>

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <Card className="border-none shadow-sm bg-destructive text-destructive-foreground">
                        <CardContent className="p-6">
                            <TrendingDown className="w-10 h-10 mb-3" />
                            <p className="text-sm text-white/80 mb-1">Dépenses Totales</p>
                            <p className="stb.metricValue text-4xl">{totalExpenses}€</p>
                        </CardContent>
                    </Card>

                    <Card className=" border-none shadow-sm bg-card ">
                        <CardContent className="p-6">
                            <Receipt className="w-10 h-10 text-primary mb-3" />
                            <p className="text-sm text-muted-foreground mb-1">Dépenses Récurrentes</p>
                            <p className="stb.metricValue text-4xl">{recurringExpenses}€</p>
                        </CardContent>
                    </Card>

                    <Card className=" border-none shadow-sm bg-card ">
                        <CardContent className="p-6">
                            <AlertCircle className="w-10 h-10 text-primary mb-3" />
                            <p className="text-sm text-muted-foreground mb-1">Catégories</p>
                            <p className="stb.metricValue text-4xl">{categories.length}</p>
                        </CardContent>
                    </Card>
                </div>

                <Card className=" border-none shadow-sm bg-card ">
                    <CardContent className="p-6">
                        <h3 className="text-2xl font-bold text-foreground dark:text-white mb-6">Dépenses Récentes</h3>
                        <div className="space-y-4">
                            {expenses.map((expense, idx) => (
                                <motion.div
                                    key={expense.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="flex items-center justify-between p-4 bg-background  rounded-lg"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
                                            <Minus className="w-6 h-6 text-destructive" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-foreground dark:text-white">{expense.category}</h4>
                                            <p className="text-sm text-muted-foreground">
                                                {new Date(expense.date).toLocaleDateString('fr-FR')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        {expense.recurring && (
                                            <Badge className="bg-primary/10 text-primary border-0">Récurrent</Badge>
                                        )}
                                        <p className="text-2xl font-bold text-destructive">-{expense.amount}€</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </PageContent>
        </div>
    );
}
