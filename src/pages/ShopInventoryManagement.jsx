import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Plus, Edit, Trash2, TrendingDown, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export default function ShopInventoryManagement() {
    const inventory = [
        { id: 1, name: "Shampoing Professionnel", category: "Soins", stock: 45, minStock: 20, price: 12.50, status: "in_stock" },
        { id: 2, name: "Cire Coiffante", category: "Styling", stock: 15, minStock: 20, price: 8.99, status: "low_stock" },
        { id: 3, name: "Tondeuse Pro", category: "Équipement", stock: 3, minStock: 5, price: 150, status: "low_stock" },
        { id: 4, name: "Gel Fixation Forte", category: "Styling", stock: 0, minStock: 15, price: 9.50, status: "out_of_stock" }
    ];

    const getStatusBadge = (status) => {
        const variants = {
            in_stock: { bg: "bg-emerald-100", text: "text-emerald-800", label: "En Stock" },
            low_stock: { bg: "bg-amber-100", text: "text-amber-800", label: "Stock Faible" },
            out_of_stock: { bg: "bg-red-100", text: "text-red-800", label: "Rupture" }
        };
        const variant = variants[status];
        return <Badge className={`${variant.bg} ${variant.text} border-0`}>{variant.label}</Badge>;
    };

    return (
        <div className="min-h-screen py-12 bg-background-light dark:bg-background-dark font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-display font-bold text-charcoal dark:text-white mb-2">Gestion des Stocks</h1>
                        <p className="text-lg text-slate dark:text-matte-silver">Gérez votre inventaire de produits</p>
                    </div>
                    <Button className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl h-12 px-6">
                        <Plus className="w-5 h-5 mr-2" />
                        Ajouter un Produit
                    </Button>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <Package className="w-5 h-5 text-primary" />
                                <span className="text-sm text-slate dark:text-matte-silver">Total Produits</span>
                            </div>
                            <p className="text-3xl font-bold text-charcoal dark:text-white">{inventory.length}</p>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <AlertTriangle className="w-5 h-5 text-amber-600" />
                                <span className="text-sm text-slate dark:text-matte-silver">Stock Faible</span>
                            </div>
                            <p className="text-3xl font-bold text-amber-600">{inventory.filter(i => i.status === 'low_stock').length}</p>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <TrendingDown className="w-5 h-5 text-red-600" />
                                <span className="text-sm text-slate dark:text-matte-silver">Ruptures</span>
                            </div>
                            <p className="text-3xl font-bold text-red-600">{inventory.filter(i => i.status === 'out_of_stock').length}</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-4">
                    {inventory.map((item, idx) => (
                        <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                            <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                                                <Package className="w-6 h-6 text-primary" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-bold text-charcoal dark:text-white mb-1">{item.name}</h3>
                                                <p className="text-sm text-slate dark:text-matte-silver">{item.category}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="text-center">
                                                <p className="text-sm text-slate dark:text-matte-silver mb-1">Stock</p>
                                                <p className={`text-2xl font-bold ${item.stock <= item.minStock ? 'text-red-600' : 'text-charcoal dark:text-white'}`}>
                                                    {item.stock}
                                                </p>
                                            </div>

                                            <div className="text-center">
                                                <p className="text-sm text-slate dark:text-matte-silver mb-1">Prix</p>
                                                <p className="text-2xl font-bold text-charcoal dark:text-white">{item.price}€</p>
                                            </div>

                                            <div className="w-32">
                                                {getStatusBadge(item.status)}
                                            </div>

                                            <div className="flex gap-2">
                                                <Button variant="outline" size="sm" className="rounded-lg">
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button variant="outline" size="sm" className="rounded-lg border-red-200 text-red-600 hover:bg-red-50">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
