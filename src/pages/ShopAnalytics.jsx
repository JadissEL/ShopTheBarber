import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, TrendingDown, Calendar, Download } from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function ShopAnalytics() {
    const revenueData = [
        { month: "Jan", revenue: 12500, bookings: 245 },
        { month: "Fév", revenue: 15200, bookings: 298 },
        { month: "Mar", revenue: 14800, bookings: 276 },
        { month: "Avr", revenue: 16900, bookings: 312 },
        { month: "Mai", revenue: 18500, bookings: 345 }
    ];

    const serviceData = [
        { name: "Coupes", value: 45, color: "#D08B3D" },
        { name: "Barbes", value: 25, color: "#0B2545" },
        { name: "Forfaits", value: 20, color: "#4B5563" },
        { name: "Autres", value: 10, color: "#9CA3AF" }
    ];

    return (
        <div className="min-h-screen py-12 bg-background-light dark:bg-background-dark font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-display font-bold text-charcoal dark:text-white mb-2">Analytiques du Salon</h1>
                        <p className="text-lg text-slate dark:text-matte-silver">Suivez les performances de votre salon</p>
                    </div>
                    <Button variant="outline" className="rounded-xl">
                        <Download className="w-4 h-4 mr-2" />
                        Exporter le Rapport
                    </Button>
                </motion.div>

                <div className="grid md:grid-cols-4 gap-6 mb-8">
                    {[
                        { label: "Revenus ce mois", value: "18,500€", change: "+12%", icon: DollarSign, trend: "up" },
                        { label: "Réservations", value: "345", change: "+8%", icon: TrendingUp, trend: "up" },
                        { label: "Taux d'occupation", value: "87%", change: "+5%", icon: Calendar, trend: "up" },
                        { label: "Ticket moyen", value: "53€", change: "-2%", icon: TrendingDown, trend: "down" }
                    ].map((stat, idx) => (
                        <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                            <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <stat.icon className={`w-10 h-10 ${stat.trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`} />
                                        <Badge className={stat.trend === 'up' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}>
                                            {stat.change}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-slate dark:text-matte-silver mb-1">{stat.label}</p>
                                    <p className="text-3xl font-display font-bold text-charcoal dark:text-white">{stat.value}</p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                <div className="grid lg:grid-cols-2 gap-6 mb-8">
                    <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                        <CardContent className="p-6">
                            <h3 className="text-xl font-bold text-charcoal dark:text-white mb-6">Évolution des Revenus</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={revenueData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="revenue" stroke="#D08B3D" strokeWidth={3} name="Revenus (€)" />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                        <CardContent className="p-6">
                            <h3 className="text-xl font-bold text-charcoal dark:text-white mb-6">Répartition des Services</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie data={serviceData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={100} fill="#8884d8" dataKey="value">
                                        {serviceData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                    <CardContent className="p-6">
                        <h3 className="text-xl font-bold text-charcoal dark:text-white mb-6">Réservations Mensuelles</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="bookings" fill="#D08B3D" radius={[8, 8, 0, 0]} name="Réservations" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
