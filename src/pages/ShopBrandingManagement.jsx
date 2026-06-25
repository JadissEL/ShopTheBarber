import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Save, Eye } from "lucide-react";
import { motion } from "framer-motion";

export default function ShopBrandingManagement() {
    return (
        <div className="min-h-screen py-12 bg-background-light dark:bg-background-dark font-sans">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <h1 className="text-4xl font-display font-bold text-charcoal dark:text-white mb-2">Image de Marque</h1>
                    <p className="text-lg text-slate dark:text-matte-silver">Personnalisez l'apparence de votre salon</p>
                </motion.div>

                <div className="space-y-6">
                    <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                        <CardContent className="p-6">
                            <h3 className="text-xl font-bold text-charcoal dark:text-white mb-6">Logo et Images</h3>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <Label className="text-charcoal dark:text-white mb-2 block">Logo du Salon</Label>
                                    <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center hover:border-primary transition-colors cursor-pointer">
                                        <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                                        <p className="text-sm text-slate dark:text-matte-silver">Cliquez pour télécharger</p>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-charcoal dark:text-white mb-2 block">Image de Couverture</Label>
                                    <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center hover:border-primary transition-colors cursor-pointer">
                                        <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                                        <p className="text-sm text-slate dark:text-matte-silver">Cliquez pour télécharger</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                        <CardContent className="p-6">
                            <h3 className="text-xl font-bold text-charcoal dark:text-white mb-6">Informations du Salon</h3>
                            <div className="space-y-4">
                                <div>
                                    <Label className="text-charcoal dark:text-white">Nom du Salon</Label>
                                    <Input placeholder="Nom de votre salon" className="rounded-xl mt-2" />
                                </div>
                                <div>
                                    <Label className="text-charcoal dark:text-white">Slogan</Label>
                                    <Input placeholder="Votre slogan" className="rounded-xl mt-2" />
                                </div>
                                <div>
                                    <Label className="text-charcoal dark:text-white">Description</Label>
                                    <Textarea placeholder="Décrivez votre salon..." className="rounded-xl mt-2 min-h-[120px]" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                        <CardContent className="p-6">
                            <h3 className="text-xl font-bold text-charcoal dark:text-white mb-6">Couleurs de Marque</h3>
                            <div className="grid md:grid-cols-3 gap-4">
                                {["Couleur Principale", "Couleur Secondaire", "Couleur d'Accent"].map((label, idx) => (
                                    <div key={idx}>
                                        <Label className="text-charcoal dark:text-white mb-2 block">{label}</Label>
                                        <div className="flex gap-3">
                                            <input type="color" className="w-16 h-12 rounded-lg cursor-pointer" defaultValue="#D08B3D" />
                                            <Input placeholder="#D08B3D" className="flex-1 rounded-xl" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex gap-4">
                        <Button className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl h-12">
                            <Save className="w-5 h-5 mr-2" />
                            Enregistrer les Modifications
                        </Button>
                        <Button variant="outline" className="flex-1 rounded-xl h-12">
                            <Eye className="w-5 h-5 mr-2" />
                            Prévisualiser
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
