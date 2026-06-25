import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WifiOff, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

export default function Offline() {
    const handleRetry = () => {
        window.location.reload();
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark font-sans p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full"
            >
                <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                    <CardContent className="p-8 text-center">
                        <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                            <WifiOff className="w-12 h-12 text-slate-400" />
                        </div>

                        <h1 className="text-3xl font-display font-bold text-charcoal dark:text-white mb-4">
                            Pas de Connexion Internet
                        </h1>

                        <p className="text-lg text-slate dark:text-matte-silver mb-8">
                            Impossible de se connecter au réseau. Vérifiez votre connexion Internet et réessayez.
                        </p>

                        <div className="space-y-4">
                            <Button
                                onClick={handleRetry}
                                className="w-full bg-primary hover:bg-primary/90 text-white font-bold rounded-xl h-14 text-lg"
                            >
                                <RefreshCw className="w-5 h-5 mr-2" />
                                Réessayer
                            </Button>

                            <div className="pt-4 border-t border-soft-gray dark:border-slate/10">
                                <p className="text-sm text-slate dark:text-matte-silver mb-4">
                                    Conseils de dépannage:
                                </p>
                                <ul className="text-sm text-slate dark:text-matte-silver text-left space-y-2">
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary">•</span>
                                        <span>Vérifiez que le Wi-Fi ou les données mobiles sont activés</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary">•</span>
                                        <span>Essayez de vous rapprocher de votre routeur Wi-Fi</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary">•</span>
                                        <span>Redémarrez votre appareil</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
