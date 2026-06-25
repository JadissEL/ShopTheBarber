import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserPlus, Edit, Trash2, Mail, Phone, Calendar } from "lucide-react";
import { motion } from "framer-motion";

export default function ShopEmployeeManagement() {
    const employees = [
        { id: 1, name: "Alex Martin", role: "Barbier Senior", email: "alex@shop.com", phone: "+33 6 12 34 56 78", status: "active", avatar: null, joinDate: "2023-01-15" },
        { id: 2, name: "Sophie Dubois", role: "Barbier", email: "sophie@shop.com", phone: "+33 6 23 45 67 89", status: "active", avatar: null, joinDate: "2023-06-20" },
        { id: 3, name: "Marc Lefebvre", role: "Apprenti", email: "marc@shop.com", phone: "+33 6 34 56 78 90", status: "active", avatar: null, joinDate: "2024-01-10" }
    ];

    return (
        <div className="min-h-screen py-12 bg-background-light dark:bg-background-dark font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-display font-bold text-charcoal dark:text-white mb-2">Gestion des Employés</h1>
                        <p className="text-lg text-slate dark:text-matte-silver">Gérez votre équipe de barbiers</p>
                    </div>
                    <Button className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl h-12 px-6">
                        <UserPlus className="w-5 h-5 mr-2" />
                        Ajouter un Employé
                    </Button>
                </motion.div>

                <div className="grid lg:grid-cols-2 gap-6">
                    {employees.map((employee, idx) => (
                        <motion.div key={employee.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                            <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                                <CardContent className="p-6">
                                    <div className="flex items-start gap-4 mb-4">
                                        <Avatar className="w-16 h-16 ring-4 ring-primary/20">
                                            <AvatarImage src={employee.avatar} />
                                            <AvatarFallback className="bg-primary text-white text-xl">{employee.name[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-charcoal dark:text-white text-lg mb-1">{employee.name}</h3>
                                            <p className="text-slate dark:text-matte-silver mb-2">{employee.role}</p>
                                            <Badge className="bg-emerald-100 text-emerald-800 border-0">Actif</Badge>
                                        </div>
                                    </div>

                                    <div className="space-y-3 mb-4">
                                        <div className="flex items-center gap-3 text-sm">
                                            <Mail className="w-4 h-4 text-primary" />
                                            <span className="text-slate dark:text-matte-silver">{employee.email}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                            <Phone className="w-4 h-4 text-primary" />
                                            <span className="text-slate dark:text-matte-silver">{employee.phone}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                            <Calendar className="w-4 h-4 text-primary" />
                                            <span className="text-slate dark:text-matte-silver">Depuis {new Date(employee.joinDate).toLocaleDateString('fr-FR')}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <Button variant="outline" className="flex-1 rounded-xl">
                                            <Edit className="w-4 h-4 mr-2" />
                                            Modifier
                                        </Button>
                                        <Button variant="outline" className="flex-1 rounded-xl border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Retirer
                                        </Button>
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
