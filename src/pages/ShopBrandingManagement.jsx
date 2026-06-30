import { Card, CardContent } from "@/components/ui/card";
import { stb } from '@/lib/stbUi';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Save, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { MetaTags } from '@/components/seo/MetaTags';
import PageHeader from '@/components/layout/PageHeader';
import PageContent from '@/components/layout/PageContent';

export default function ShopBrandingManagement() {
    return (
        <div className="stb-page pb-16 font-sans">
            <MetaTags title="Branding" description="Customize your shop appearance" />
            <PageHeader
                label="Provider"
                title="Brand image"
                subtitle="Personnalisez l'apparence de votre salon"
                compact
                variant="light"
                tier="app"
            />

            <PageContent narrow>

                <div className="space-y-6">
                    <Card className=" border-none shadow-sm bg-card ">
                        <CardContent className="p-6">
                            <h3 className="text-xl font-bold text-foreground dark:text-white mb-6">Logo et Images</h3>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <Label className="text-foreground dark:text-white mb-2 block">Logo du Salon</Label>
                                    <div className="border-2 border-dashed border-foreground/20 dark:border-foreground/25 rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                                        <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                                        <p className="text-sm text-muted-foreground">Cliquez pour télécharger</p>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-foreground dark:text-white mb-2 block">Image de Couverture</Label>
                                    <div className="border-2 border-dashed border-foreground/20 dark:border-foreground/25 rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                                        <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                                        <p className="text-sm text-muted-foreground">Cliquez pour télécharger</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className=" border-none shadow-sm bg-card ">
                        <CardContent className="p-6">
                            <h3 className="text-xl font-bold text-foreground dark:text-white mb-6">Informations du Salon</h3>
                            <div className="space-y-4">
                                <div>
                                    <Label className="text-foreground dark:text-white">Nom du Salon</Label>
                                    <Input placeholder="Nom de votre salon" className=" mt-2" />
                                </div>
                                <div>
                                    <Label className="text-foreground dark:text-white">Slogan</Label>
                                    <Input placeholder="Votre slogan" className=" mt-2" />
                                </div>
                                <div>
                                    <Label className="text-foreground dark:text-white">Description</Label>
                                    <Textarea placeholder="Décrivez votre salon..." className=" mt-2 min-h-[120px]" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className=" border-none shadow-sm bg-card ">
                        <CardContent className="p-6">
                            <h3 className="text-xl font-bold text-foreground dark:text-white mb-6">Couleurs de Marque</h3>
                            <div className="grid md:grid-cols-3 gap-4">
                                {["Couleur Principale", "Couleur Secondaire", "Couleur d'Accent"].map((label, idx) => (
                                    <div key={idx}>
                                        <Label className="text-foreground dark:text-white mb-2 block">{label}</Label>
                                        <div className="flex gap-3">
                                            <input type="color" className="w-16 h-12 rounded-lg cursor-pointer" defaultValue="hsl(22 95% 52%)" />
                                            <Input placeholder="hsl(var(--primary))" className="flex-1 rounded-lg" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex gap-4">
                        <Button className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg h-12">
                            <Save className="w-5 h-5 mr-2" />
                            Enregistrer les Modifications
                        </Button>
                        <Button variant="outline" className="flex-1 rounded-lg h-12">
                            <Eye className="w-5 h-5 mr-2" />
                            Prévisualiser
                        </Button>
                    </div>
                </div>
            </PageContent>
        </div>
    );
}
