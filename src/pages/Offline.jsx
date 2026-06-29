import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WifiOff, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { MetaTags } from "@/components/seo/MetaTags";

export default function Offline() {
    const handleRetry = () => {
        window.location.reload();
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark font-sans p-4">
            <MetaTags title="Offline" description="You are offline" noindex />
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full"
            >
                <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                    <CardContent className="p-8 text-center">
                        <div className="w-24 h-24 bg-muted dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                            <WifiOff className="w-12 h-12 text-slate-400" />
                        </div>

                        <h1 className="text-3xl font-display font-bold text-charcoal dark:text-white mb-4">
                            You&apos;re offline
                        </h1>

                        <p className="text-lg text-slate dark:text-matte-silver mb-8">
                            Check your connection and try again. Your installed app shell is still available for basic navigation.
                        </p>

                        <div className="space-y-4">
                            <Button
                                onClick={handleRetry}
                                className="w-full bg-primary hover:bg-primary/90 text-white font-bold rounded-xl h-14 text-lg"
                            >
                                <RefreshCw className="w-5 h-5 mr-2" />
                                Try again
                            </Button>
                            <Button asChild variant="outline" className="w-full rounded-xl h-12">
                                <Link to="/">Go home</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
