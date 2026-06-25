import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, AlertCircle, CheckCircle, Database, Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminPlatformHealth() {
    const healthMetrics = [
        { label: "Uptime", value: "99.9%", status: "healthy", icon: CheckCircle },
        { label: "Response Time", value: "45ms", status: "healthy", icon: Zap },
        { label: "Error Rate", value: "0.1%", status: "healthy", icon: Activity },
        { label: "Database", value: "Optimal", status: "healthy", icon: Database }
    ];

    const recentIssues = [
        { id: 1, title: "Slow API Response", severity: "warning", time: "2h ago", resolved: false },
        { id: 2, title: "Database Connection Timeout", severity: "critical", time: "5h ago", resolved: true },
        { id: 3, title: "High Memory Usage", severity: "info", time: "1d ago", resolved: true }
    ];

    const severityColors = {
        critical: { bg: "bg-red-100", text: "text-red-800", label: "Critique" },
        warning: { bg: "bg-amber-100", text: "text-amber-800", label: "Attention" },
        info: { bg: "bg-blue-100", text: "text-blue-800", label: "Info" }
    };

    return (
        <div className="min-h-screen py-12 bg-background-light dark:bg-background-dark font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                        <h1 className="text-4xl font-display font-bold text-charcoal dark:text-white">Santé de la Plateforme</h1>
                    </div>
                    <p className="text-lg text-slate dark:text-matte-silver">Surveillez les performances du système</p>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {healthMetrics.map((metric, idx) => (
                        <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                            <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                                            <metric.icon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <Badge className="bg-emerald-100 text-emerald-800 border-0">Healthy</Badge>
                                    </div>
                                    <p className="text-sm text-slate dark:text-matte-silver mb-1">{metric.label}</p>
                                    <p className="text-3xl font-display font-bold text-charcoal dark:text-white">{metric.value}</p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold text-charcoal dark:text-white">Incidents Récents</h3>
                            <Button variant="outline" className="rounded-xl">Voir Tous</Button>
                        </div>

                        <div className="space-y-4">
                            {recentIssues.map((issue, idx) => (
                                <motion.div
                                    key={issue.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="flex items-center justify-between p-4 bg-background-light dark:bg-background-dark rounded-xl"
                                >
                                    <div className="flex items-center gap-4">
                                        <AlertCircle className={`w-6 h-6 ${issue.resolved ? 'text-slate' : severityColors[issue.severity].text.replace('text-', 'text-')}`} />
                                        <div>
                                            <h4 className="font-bold text-charcoal dark:text-white">{issue.title}</h4>
                                            <p className="text-sm text-slate dark:text-matte-silver">{issue.time}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Badge className={`${severityColors[issue.severity].bg} ${severityColors[issue.severity].text} border-0`}>
                                            {severityColors[issue.severity].label}
                                        </Badge>
                                        {issue.resolved ? (
                                            <Badge className="bg-emerald-100 text-emerald-800 border-0">Résolu</Badge>
                                        ) : (
                                            <Badge className="bg-amber-100 text-amber-800 border-0">En Cours</Badge>
                                        )}
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
