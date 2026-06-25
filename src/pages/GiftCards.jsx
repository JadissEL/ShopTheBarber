import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Gift, ShoppingBag, Plus, Minus, Check } from "lucide-react";
import { motion } from "framer-motion";

export default function GiftCards() {
    const [amount, setAmount] = useState(50);
    const presetAmounts = [25, 50, 100, 150];

    const myGiftCards = [
        { id: 1, code: "GIFT-ABC123", balance: 75, original: 100, expiry: "2026-12-31" },
        { id: 2, code: "GIFT-XYZ789", balance: 50, original: 50, expiry: "2026-06-30" }
    ];

    return (
        <div className="min-h-screen py-12 bg-background-light dark:bg-background-dark font-sans">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
                    <Gift className="w-16 h-16 text-primary mx-auto mb-4" />
                    <h1 className="text-4xl font-display font-bold text-charcoal dark:text-white mb-2">Cartes Cadeaux</h1>
                    <p className="text-lg text-slate dark:text-matte-silver">Offrez le cadeau d'une coiffure parfaite</p>
                </motion.div>

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Purchase Card */}
                    <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                        <CardContent className="p-8">
                            <h2 className="text-2xl font-bold text-charcoal dark:text-white mb-6">Acheter une Carte Cadeau</h2>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate dark:text-matte-silver mb-3">Montant</label>
                                    <div className="grid grid-cols-4 gap-3 mb-4">
                                        {presetAmounts.map(preset => (
                                            <button
                                                key={preset}
                                                onClick={() => setAmount(preset)}
                                                className={`py-3 rounded-xl font-bold transition-all ${amount === preset
                                                        ? 'bg-primary text-white shadow-md'
                                                        : 'bg-background-light dark:bg-background-dark text-charcoal dark:text-white hover:bg-primary/10'
                                                    }`}
                                            >
                                                {preset}€
                                            </button>
                                        ))}
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setAmount(Math.max(10, amount - 10))}
                                            className="rounded-xl"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </Button>
                                        <Input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(Math.max(10, parseInt(e.target.value) || 10))}
                                            className="text-center text-2xl font-bold h-14 rounded-xl"
                                        />
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setAmount(amount + 10)}
                                            className="rounded-xl"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-primary to-primary/80 text-white p-6 rounded-2xl">
                                    <p className="text-sm text-white/80 mb-1">Valeur de la Carte</p>
                                    <p className="text-4xl font-display font-bold">{amount}€</p>
                                </div>

                                <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold rounded-xl h-14 text-lg">
                                    <ShoppingBag className="w-5 h-5 mr-2" />
                                    Acheter Maintenant
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* My Gift Cards */}
                    <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                        <CardContent className="p-8">
                            <h2 className="text-2xl font-bold text-charcoal dark:text-white mb-6">Mes Cartes Cadeaux</h2>

                            <div className="space-y-4">
                                {myGiftCards.map((card, idx) => (
                                    <motion.div
                                        key={card.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-6 rounded-2xl"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <p className="text-sm text-white/80 mb-1">Code</p>
                                                <p className="font-mono font-bold text-lg">{card.code}</p>
                                            </div>
                                            <Badge className="bg-white/20 text-white border-0">
                                                Actif
                                            </Badge>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <p className="text-sm text-white/80">Solde</p>
                                                <p className="text-2xl font-bold">{card.balance}€</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-white/80">Valeur Initiale</p>
                                                <p className="text-2xl font-bold">{card.original}€</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-white/20">
                                            <p className="text-sm text-white/80">Expire le {new Date(card.expiry).toLocaleDateString('fr-FR')}</p>
                                            <Button size="sm" className="bg-white text-emerald-600 hover:bg-white/90 rounded-lg">
                                                Utiliser
                                            </Button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Benefits */}
                <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark mt-8">
                    <CardContent className="p-8">
                        <h3 className="text-2xl font-bold text-charcoal dark:text-white mb-6">Pourquoi Offrir une Carte Cadeau?</h3>
                        <div className="grid md:grid-cols-3 gap-6">
                            {[
                                { title: "Cadeau Parfait", desc: "Idéal pour toutes les occasions" },
                                { title: "Pas d'Expiration", desc: "Valable pendant 2 ans" },
                                { title: "Facile à Utiliser", desc: "Utilisable sur tous les services" }
                            ].map((benefit, idx) => (
                                <div key={idx} className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Check className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-charcoal dark:text-white mb-1">{benefit.title}</h4>
                                        <p className="text-sm text-slate dark:text-matte-silver">{benefit.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
