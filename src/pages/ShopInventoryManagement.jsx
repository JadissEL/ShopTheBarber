import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Plus, Edit, Trash2, TrendingDown, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { MetaTags } from '@/components/seo/MetaTags';
import PageHeader from '@/components/layout/PageHeader';
import PageContent from '@/components/layout/PageContent';

export default function ShopInventoryManagement() {
    const inventory = [
        { id: 1, name: "Shampoing Professionnel", category: "Soins", stock: 45, minStock: 20, price: 12.50, status: "in_stock" },
        { id: 2, name: "Cire Coiffante", category: "Styling", stock: 15, minStock: 20, price: 8.99, status: "low_stock" },
        { id: 3, name: "Tondeuse Pro", category: "Équipement", stock: 3, minStock: 5, price: 150, status: "low_stock" },
        { id: 4, name: "Gel Fixation Forte", category: "Styling", stock: 0, minStock: 15, price: 9.50, status: "out_of_stock" }
    ];

    const getStatusBadge = (status) => {
        const variants = {
            in_stock: { bg: "bg-primary/10", text: "text-primary", label: "En Stock" },
            low_stock: { bg: "bg-warning/15", text: "text-foreground", label: "Stock Faible" },
            out_of_stock: { bg: "bg-destructive/10", text: "text-destructive", label: "Rupture" }
        };
        const variant = variants[status];
        return <Badge className={`${variant.bg} ${variant.text} border-0`}>{variant.label}</Badge>;
    };

    return (
        <div className="stb-page pb-16 font-sans">
            <MetaTags title="Inventory" description="Manage shop product inventory" />
            <PageHeader
                label="Provider"
                title="Inventory management"
                subtitle="Gérez votre inventaire de produits"
                compact
                variant="light"
                tier="app"
            >
                <Button className="h-11">
                    <Plus className="w-5 h-5 mr-2" />
                    Ajouter un Produit
                </Button>
            </PageHeader>

            <PageContent>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <Card className=" border-none shadow-sm bg-card ">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <Package className="w-5 h-5 text-primary" />
                                <span className="text-sm text-muted-foreground">Total Produits</span>
                            </div>
                            <p className="text-3xl font-bold text-foreground dark:text-white">{inventory.length}</p>
                        </CardContent>
                    </Card>

                    <Card className=" border-none shadow-sm bg-card ">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <AlertTriangle className="w-5 h-5 text-primary" />
                                <span className="text-sm text-muted-foreground">Stock Faible</span>
                            </div>
                            <p className="text-3xl font-bold text-primary">{inventory.filter(i => i.status === 'low_stock').length}</p>
                        </CardContent>
                    </Card>

                    <Card className=" border-none shadow-sm bg-card ">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <TrendingDown className="w-5 h-5 text-destructive" />
                                <span className="text-sm text-muted-foreground">Ruptures</span>
                            </div>
                            <p className="text-3xl font-bold text-destructive">{inventory.filter(i => i.status === 'out_of_stock').length}</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-4">
                    {inventory.map((item, idx) => (
                        <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                            <Card className=" border-none shadow-sm bg-card ">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                                <Package className="w-6 h-6 text-primary" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-bold text-foreground dark:text-white mb-1">{item.name}</h3>
                                                <p className="text-sm text-muted-foreground">{item.category}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="text-center">
                                                <p className="text-sm text-muted-foreground mb-1">Stock</p>
                                                <p className={`text-2xl font-bold ${item.stock <= item.minStock ? 'text-destructive' : 'text-foreground'}`}>
                                                    {item.stock}
                                                </p>
                                            </div>

                                            <div className="text-center">
                                                <p className="text-sm text-muted-foreground mb-1">Prix</p>
                                                <p className="text-2xl font-bold text-foreground dark:text-white">{item.price}€</p>
                                            </div>

                                            <div className="w-32">
                                                {getStatusBadge(item.status)}
                                            </div>

                                            <div className="flex gap-2">
                                                <Button variant="outline" size="sm" className="rounded-lg">
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button variant="outline" size="sm" className="rounded-lg border-destructive/20 text-destructive hover:bg-destructive/10">
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
            </PageContent>
        </div>
    );
}
