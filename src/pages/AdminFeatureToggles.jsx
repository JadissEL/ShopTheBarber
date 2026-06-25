import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ToggleLeft, Zap, Shield } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminFeatureToggles() {
    const features = [
        { id: 1, name: "Réservations en Ligne", description: "Permettre aux clients de réserver en ligne", enabled: true, category: "core" },
        { id: 2, name: "Programme de Fidélité", description: "Système de points et récompenses", enabled: true, category: "engagement" },
        { id: 3, name: "Paiements en Ligne", description: "Accepter les paiements par carte", enabled: true, category: "payment" },
        { id: 4, name: "Chat en Direct", description: "Messagerie instantanée client-barbier", enabled: false, category: "communication" },
        { id: 5, name: "Notifications Push", description: "Notifications navigateur", enabled: true, category: "notification" },
        { id: 6, name: "Mode Maintenance", description: "Mettre la plateforme en maintenance", enabled: false, category: "system" }
    ];

    const categoryConfig = {
        core: { label: "Fonctionnalité Principale", color: "bg-blue-100 text-blue-800" },
        engagement: { label: "Engagement", color: "bg-purple-100 text-purple-800" },
        payment: { label: "Paiement", color: "bg-emerald-100 text-emerald-800" },
        communication: { label: "Communication", color: "bg-amber-100 text-amber-800" },
        notification: { label: "Notification", color: "bg-pink-100 text-pink-800" },
        system: { label: "Système", color: "bg-red-100 text-red-800" }
    };

    return (
        <div className="min-h-screen py-12 bg-background-light dark:bg-background-dark font-sans">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <h1 className="text-4xl font-display font-bold text-charcoal dark:text-white mb-2">Gestion des Fonctionnalités</h1>
                    <p className="text-lg text-slate dark:text-matte-silver">Activez ou désactivez les fonctionnalités de la plateforme</p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    {[
                        { label: "Fonctionnalités Actives", value: features.filter(f => f.enabled).length, icon: Zap, color: "text-emerald-600" },
                        { label: "Fonctionnalités Désactivées", value: features.filter(f => !f.enabled).length, icon: Shield, color: "text-slate-600" },
                        { label: "Total", value: features.length, icon: ToggleLeft, color: "text-blue-600" }
                    ].map((stat, idx) => (
                        <Card key={idx} className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                            <CardContent className="p-6">
                                <stat.icon className={`w-10 h-10 ${stat.color} mb-3`} />
                                <p className="text-sm text-slate dark:text-matte-silver mb-1">{stat.label}</p>
                                <p className="text-4xl font-display font-bold text-charcoal dark:text-white">{stat.value}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="space-y-4">
                    {features.map((feature, idx) => (
                        <motion.div key={feature.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                            <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${feature.enabled ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                                                <ToggleLeft className={`w-6 h-6 ${feature.enabled ? 'text-emerald-600' : 'text-slate-400'}`} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className="font-bold text-charcoal dark:text-white text-lg">{feature.name}</h3>
                                                    <Badge variant="outline" className={`${categoryConfig[feature.category].color} border-0`}>
                                                        {categoryConfig[feature.category].label}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-slate dark:text-matte-silver">{feature.description}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <Badge variant="secondary" className={feature.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}>
                                                {feature.enabled ? 'Activé' : 'Désactivé'}
                                            </Badge>
                                            <Switch checked={feature.enabled} />
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
