import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Eye, Edit, Trash2, Plus } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminContentManagement() {
    const content = [
        { id: 1, title: "Guide du Barbier Débutant", type: "article", status: "published", views: 1250, date: "2024-11-15" },
        { id: 2, title: "Tendances Coiffure 2025", type: "article", status: "draft", views: 0, date: "2024-12-01" },
        { id: 3, title: "Tutoriel Fade Classique", type: "video", status: "published", views: 3400, date: "2024-10-20" }
    ];

    const statusColors = {
        published: { bg: "bg-emerald-100", text: "text-emerald-800", label: "Publié" },
        draft: { bg: "bg-amber-100", text: "text-amber-800", label: "Brouillon" },
        archived: { bg: "bg-slate-100", text: "text-slate-600", label: "Archivé" }
    };

    const typeLabels = {
        article: "Article",
        video: "Vidéo",
        tutorial: "Tutoriel"
    };

    return (
        <div className="min-h-screen py-12 bg-background-light dark:bg-background-dark font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-display font-bold text-charcoal dark:text-white mb-2">Gestion du Contenu</h1>
                        <p className="text-lg text-slate dark:text-matte-silver">Gérez les articles et tutoriels de la plateforme</p>
                    </div>
                    <Button className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl h-12 px-6">
                        <Plus className="w-5 h-5 mr-2" />
                        Nouveau Contenu
                    </Button>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    {[
                        { label: "Total Contenus", value: content.length },
                        { label: "Publiés", value: content.filter(c => c.status === 'published').length },
                        { label: "Vues Totales", value: content.reduce((sum, c) => sum + c.views, 0).toLocaleString() }
                    ].map((stat, idx) => (
                        <Card key={idx} className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                            <CardContent className="p-6">
                                <p className="text-sm text-slate dark:text-matte-silver mb-1">{stat.label}</p>
                                <p className="text-4xl font-display font-bold text-charcoal dark:text-white">{stat.value}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="space-y-4">
                    {content.map((item, idx) => (
                        <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                            <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                                                <FileText className="w-6 h-6 text-primary" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-bold text-charcoal dark:text-white text-lg mb-1">{item.title}</h3>
                                                <div className="flex items-center gap-3">
                                                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-0">{typeLabels[item.type]}</Badge>
                                                    <Badge variant="default" className={`${statusColors[item.status].bg} ${statusColors[item.status].text} border-0`}>
                                                        {statusColors[item.status].label}
                                                    </Badge>
                                                    <span className="text-sm text-slate dark:text-matte-silver">
                                                        {new Date(item.date).toLocaleDateString('fr-FR')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="text-center">
                                                <p className="text-sm text-slate dark:text-matte-silver">Vues</p>
                                                <p className="text-xl font-bold text-charcoal dark:text-white">{item.views.toLocaleString()}</p>
                                            </div>

                                            <div className="flex gap-2">
                                                <Button variant="outline" size="sm" className="rounded-lg">
                                                    <Eye className="w-4 h-4" />
                                                </Button>
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
