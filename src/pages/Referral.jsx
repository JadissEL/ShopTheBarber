import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Gift, Share2, Copy, Check } from "lucide-react";
import { motion } from "framer-motion";

export default function Referral() {
    const [copied, setCopied] = useState(false);
    const referralCode = "BARBER2025";
    const referralsCount = 5;
    const earnedRewards = 50;

    const handleCopy = () => {
        navigator.clipboard.writeText(referralCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const benefits = [
        { title: "Vous Gagnez 10€", description: "Pour chaque ami qui réserve" },
        { title: "Votre Ami Gagne 10€", description: "Sur sa première réservation" },
        { title: "Bonus Illimités", description: "Pas de limite de parrainages" }
    ];

    return (
        <div className="min-h-screen py-12 bg-background-light dark:bg-background-dark font-sans">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
                    <Users className="w-16 h-16 text-primary mx-auto mb-4" />
                    <h1 className="text-4xl font-display font-bold text-charcoal dark:text-white mb-4">Programme de Parrainage</h1>
                    <p className="text-xl text-slate dark:text-matte-silver">Partagez ShopTheBarber avec vos amis et gagnez des récompenses</p>
                </motion.div>

                <div className="space-y-8">
                    {/* Referral Code Card */}
                    <Card className="rounded-2xl border-none shadow-soft bg-gradient-to-br from-primary to-primary/80 text-white">
                        <CardContent className="p-8 text-center">
                            <h2 className="text-2xl font-bold mb-4">Votre Code de Parrainage</h2>
                            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 mb-6">
                                <p className="text-4xl font-display font-bold tracking-wider">{referralCode}</p>
                            </div>
                            <Button onClick={handleCopy} className="bg-white text-primary hover:bg-white/90 font-bold rounded-xl h-12 px-8">
                                {copied ? <><Check className="w-5 h-5 mr-2" />Copié!</> : <><Copy className="w-5 h-5 mr-2" />Copier le Code</>}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Stats */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center">
                                        <Users className="w-8 h-8 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-3xl font-display font-bold text-charcoal dark:text-white">{referralsCount}</p>
                                        <p className="text-slate dark:text-matte-silver">Amis Parrainés</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                                        <Gift className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="text-3xl font-display font-bold text-charcoal dark:text-white">{earnedRewards}€</p>
                                        <p className="text-slate dark:text-matte-silver">Récompenses Gagnées</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Benefits */}
                    <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                        <CardContent className="p-6">
                            <h3 className="text-2xl font-bold text-charcoal dark:text-white mb-6">Comment ça Marche?</h3>
                            <div className="grid md:grid-cols-3 gap-6">
                                {benefits.map((benefit, idx) => (
                                    <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="text-center">
                                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <span className="text-xl font-bold text-primary">{idx + 1}</span>
                                        </div>
                                        <h4 className="font-bold text-charcoal dark:text-white mb-2">{benefit.title}</h4>
                                        <p className="text-sm text-slate dark:text-matte-silver">{benefit.description}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Share Options */}
                    <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                        <CardContent className="p-6">
                            <h3 className="text-2xl font-bold text-charcoal dark:text-white mb-6">Partager avec vos Amis</h3>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12">
                                    <Share2 className="w-5 h-5 mr-2" />
                                    Partager sur Facebook
                                </Button>
                                <Button className="flex-1 bg-sky-500 hover:bg-sky-600 text-white rounded-xl h-12">
                                    <Share2 className="w-5 h-5 mr-2" />
                                    Partager sur Twitter
                                </Button>
                                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-12">
                                    <Share2 className="w-5 h-5 mr-2" />
                                    Partager par Email
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
