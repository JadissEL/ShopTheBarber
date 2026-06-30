import { Card, CardContent } from "@/components/ui/card";
import { stb } from '@/lib/stbUi';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { MetaTags } from '@/components/seo/MetaTags';
import PageHeader from '@/components/layout/PageHeader';
import PageContent from '@/components/layout/PageContent';

export default function AdminAuditLogs() {
    const logs = [
        { id: 1, user: "Admin", action: "User Created", details: "New barber account created", timestamp: "2024-12-02 10:30", severity: "info" },
        { id: 2, user: "System", action: "Payment Processed", details: "Payment of 450€ completed", timestamp: "2024-12-02 10:15", severity: "success" },
        { id: 3, user: "Admin", action: "User Suspended", details: "User account suspended for violation", timestamp: "2024-12-02 09:45", severity: "warning" },
        { id: 4, user: "System", action: "Database Backup", details: "Automated backup completed", timestamp: "2024-12-02 03:00", severity: "success" }
    ];

    const severityConfig = {
        info: { icon: FileText, color: "text-primary", bg: "bg-primary/10", label: "Info" },
        success: { icon: CheckCircle, color: "text-success", bg: "bg-success/10", label: "Succès" },
        warning: { icon: AlertCircle, color: "text-foreground", bg: "bg-warning/15", label: "Attention" },
        error: { icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10", label: "Erreur" }
    };

    return (
        <div className="stb-page pb-16 font-sans">
            <MetaTags title="Audit Logs" description="Track all platform activity" />
            <PageHeader
                label="Admin"
                title="Audit logs"
                subtitle="Suivez toutes les activités de la plateforme"
                compact
                variant="light"
                tier="app"
            />

            <PageContent>

                <div className="grid md:grid-cols-4 gap-6 mb-8">
                    {Object.entries(severityConfig).map(([key, config], _idx) => (
                        <Card key={key} className=" border-none shadow-sm bg-card ">
                            <CardContent className="p-6">
                                <config.icon className={`w-8 h-8 ${config.color} mb-3`} />
                                <p className="text-sm text-muted-foreground mb-1">{config.label}</p>
                                <p className="stb.metricValue text-3xl">
                                    {logs.filter(l => l.severity === key).length}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card className=" border-none shadow-sm bg-card ">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold text-foreground dark:text-white">Activités Récentes</h3>
                            <Button variant="outline" className="">Filtrer</Button>
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
                                        className="flex items-center justify-between p-4 bg-background  rounded-lg"
                                    >
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className={`w-12 h-12 ${config.bg} rounded-lg flex items-center justify-center`}>
                                                <config.icon className={`w-6 h-6 ${config.color}`} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h4 className="font-bold text-foreground dark:text-white">{log.action}</h4>
                                                    <Badge variant="default" className={`${config.bg} ${config.color} border-0`}>{config.label}</Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground">{log.details}</p>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-sm font-medium text-foreground dark:text-white">{log.user}</p>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
            </PageContent>
        </div>
    );
}
