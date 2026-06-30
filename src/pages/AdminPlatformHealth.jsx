import { Card, CardContent } from "@/components/ui/card";
import { stb } from '@/lib/stbUi';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, AlertCircle, CheckCircle, Database, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { MetaTags } from '@/components/seo/MetaTags';
import PageHeader from '@/components/layout/PageHeader';
import PageContent from '@/components/layout/PageContent';

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
        critical: { bg: "bg-destructive/10", text: "text-destructive", label: "Critique" },
        warning: { bg: "bg-warning/15", text: "text-foreground", label: "Attention" },
        info: { bg: "bg-primary/10", text: "text-primary", label: "Info" }
    };

    return (
        <div className="stb-page pb-16 font-sans">
            <MetaTags title="Platform Health" description="Monitor system performance and uptime" />
            <PageHeader
                label="Admin"
                title="Platform health"
                subtitle="Surveillez les performances du système"
                compact
                variant="light"
                tier="app"
            />

            <PageContent>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {healthMetrics.map((metric, idx) => (
                        <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                            <Card className=" border-none shadow-sm bg-card ">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                            <metric.icon className="w-6 h-6 text-primary dark:text-primary" />
                                        </div>
                                        <Badge className="stb-chip stb-chip-active border-0">Healthy</Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-1">{metric.label}</p>
                                    <p className="stb.metricValue text-3xl">{metric.value}</p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                <Card className=" border-none shadow-sm bg-card ">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold text-foreground dark:text-white">Incidents Récents</h3>
                            <Button variant="outline" className="">Voir Tous</Button>
                        </div>

                        <div className="space-y-4">
                            {recentIssues.map((issue, idx) => (
                                <motion.div
                                    key={issue.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="flex items-center justify-between p-4 bg-background  rounded-lg"
                                >
                                    <div className="flex items-center gap-4">
                                        <AlertCircle className={`w-6 h-6 ${issue.resolved ? 'text-slate' : severityColors[issue.severity].text.replace('text-', 'text-')}`} />
                                        <div>
                                            <h4 className="font-bold text-foreground dark:text-white">{issue.title}</h4>
                                            <p className="text-sm text-muted-foreground">{issue.time}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Badge className={`${severityColors[issue.severity].bg} ${severityColors[issue.severity].text} border-0`}>
                                            {severityColors[issue.severity].label}
                                        </Badge>
                                        {issue.resolved ? (
                                            <Badge className="stb-chip stb-chip-active border-0">Résolu</Badge>
                                        ) : (
                                            <Badge className="bg-warning/15 text-foreground border-0">En Cours</Badge>
                                        )}
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
