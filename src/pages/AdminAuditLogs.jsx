import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminAuditLogs() {
    const logs = [
        { id: 1, user: "Admin", action: "User Created", details: "New barber account created", timestamp: "2024-12-02 10:30", severity: "info" },
        { id: 2, user: "System", action: "Payment Processed", details: "Payment of 450€ completed", timestamp: "2024-12-02 10:15", severity: "success" },
        { id: 3, user: "Admin", action: "User Suspended", details: "User account suspended for violation", timestamp: "2024-12-02 09:45", severity: "warning" },
        { id: 4, user: "System", action: "Database Backup", details: "Automated backup completed", timestamp: "2024-12-02 03:00", severity: "success" }
    ];

    const severityConfig = {
        info: { icon: FileText, color: "text-blue-600", bg: "bg-blue-100", label: "Info" },
        success: { icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-100", label: "Succès" },
        warning: { icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-100", label: "Attention" },
        error: { icon: AlertCircle, color: "text-red-600", bg: "bg-red-100", label: "Erreur" }
    };

    return (
        <div className="min-h-screen py-12 bg-background-light dark:bg-background-dark font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <h1 className="text-4xl font-display font-bold text-charcoal dark:text-white mb-2">Journaux d'Audit</h1>
                    <p className="text-lg text-slate dark:text-matte-silver">Suivez toutes les activités de la plateforme</p>
                </motion.div>

                <div className="grid md:grid-cols-4 gap-6 mb-8">
                    {Object.entries(severityConfig).map(([key, config], _idx) => (
                        <Card key={key} className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                            <CardContent className="p-6">
                                <config.icon className={`w-8 h-8 ${config.color} mb-3`} />
                                <p className="text-sm text-slate dark:text-matte-silver mb-1">{config.label}</p>
                                <p className="text-3xl font-display font-bold text-charcoal dark:text-white">
                                    {logs.filter(l => l.severity === key).length}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold text-charcoal dark:text-white">Activités Récentes</h3>
                            <Button variant="outline" className="rounded-xl">Filtrer</Button>
                        </div>

                        <div className="space-y-4">
                            {logs.map((log, idx) => {
                                const config = severityConfig[log.severity];
                                return (
                                    <motion.div
                                        key={log.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="flex items-center justify-between p-4 bg-background-light dark:bg-background-dark rounded-xl"
                                    >
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className={`w-12 h-12 ${config.bg} rounded-xl flex items-center justify-center`}>
                                                <config.icon className={`w-6 h-6 ${config.color}`} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h4 className="font-bold text-charcoal dark:text-white">{log.action}</h4>
                                                    <Badge variant="default" className={`${config.bg} ${config.color} border-0`}>{config.label}</Badge>
                                                </div>
                                                <p className="text-sm text-slate dark:text-matte-silver">{log.details}</p>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-sm font-medium text-charcoal dark:text-white">{log.user}</p>
                                            <div className="flex items-center gap-2 text-sm text-slate dark:text-matte-silver">
                                                <Clock className="w-4 h-4" />
                                                <span>{log.timestamp}</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
