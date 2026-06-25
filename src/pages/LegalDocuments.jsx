import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Shield, Cookie } from "lucide-react";
import { motion } from "framer-motion";

export default function LegalDocuments() {
    return (
        <div className="min-h-screen py-12 bg-background-light dark:bg-background-dark font-sans">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 text-center"
                >
                    <FileText className="w-16 h-16 text-primary mx-auto mb-4" />
                    <h1 className="text-4xl font-display font-bold text-charcoal dark:text-white mb-2">
                        Documents Légaux
                    </h1>
                    <p className="text-lg text-slate dark:text-matte-silver">
                        Consultez nos conditions d'utilisation et politiques
                    </p>
                </motion.div>

                <Tabs defaultValue="terms" className="space-y-6">
                    <TabsList className="bg-surface-light dark:bg-surface-dark rounded-xl p-1 w-full justify-start">
                        <TabsTrigger value="terms" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
                            <FileText className="w-4 h-4 mr-2" />
                            Conditions d'Utilisation
                        </TabsTrigger>
                        <TabsTrigger value="privacy" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
                            <Shield className="w-4 h-4 mr-2" />
                            Politique de Confidentialité
                        </TabsTrigger>
                        <TabsTrigger value="cookies" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
                            <Cookie className="w-4 h-4 mr-2" />
                            Politique des Cookies
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="terms">
                        <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                            <CardContent className="p-8 prose dark:prose-invert max-w-none">
                                <h2>Conditions Générales d'Utilisation</h2>
                                <p className="text-slate dark:text-matte-silver">Dernière mise à jour: 02 Décembre 2025</p>

                                <h3>1. Acceptation des Conditions</h3>
                                <p>En accédant et en utilisant ShopTheBarber, vous acceptez d'être lié par ces conditions d'utilisation.</p>

                                <h3>2. Utilisation du Service</h3>
                                <p>ShopTheBarber est une plateforme de réservation de services de coiffure. Vous vous engagez à utiliser le service de manière responsable et légale.</p>

                                <h3>3. Compte Utilisateur</h3>
                                <p>Vous êtes responsable de maintenir la confidentialité de votre compte et de votre mot de passe. Vous acceptez de nous informer immédiatement de toute utilisation non autorisée de votre compte.</p>

                                <h3>4. Réservations et Paiements</h3>
                                <p>Toutes les réservations sont soumises à la disponibilité. Les paiements doivent être effectués selon les modalités convenues avec le prestataire de services.</p>

                                <h3>5. Annulations</h3>
                                <p>Les annulations doivent être effectuées au moins 24 heures avant le rendez-vous prévu pour être éligibles à un remboursement.</p>

                                <h3>6. Propriété Intellectuelle</h3>
                                <p>Tout le contenu de ShopTheBarber, y compris les textes, graphiques, logos et logiciels, est la propriété de ShopTheBarber et est protégé par les lois sur la propriété intellectuelle.</p>

                                <h3>7. Limitation de Responsabilité</h3>
                                <p>ShopTheBarber ne sera pas responsable des dommages indirects, accessoires ou consécutifs résultant de l'utilisation ou de l'impossibilité d'utiliser le service.</p>

                                <h3>8. Modifications</h3>
                                <p>Nous nous réservons le droit de modifier ces conditions à tout moment. Les modifications entreront en vigueur dès leur publication sur le site.</p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="privacy">
                        <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                            <CardContent className="p-8 prose dark:prose-invert max-w-none">
                                <h2>Politique de Confidentialité</h2>
                                <p className="text-slate dark:text-matte-silver">Dernière mise à jour: 02 Décembre 2025</p>

                                <h3>1. Collecte des Données</h3>
                                <p>Nous collectons les informations que vous nous fournissez directement, telles que votre nom, adresse e-mail, numéro de téléphone et informations de paiement.</p>

                                <h3>2. Utilisation des Données</h3>
                                <p>Nous utilisons vos données pour:</p>
                                <ul>
                                    <li>Fournir et améliorer nos services</li>
                                    <li>Traiter vos réservations</li>
                                    <li>Communiquer avec vous</li>
                                    <li>Personnaliser votre expérience</li>
                                </ul>

                                <h3>3. Partage des Données</h3>
                                <p>Nous ne vendons pas vos données personnelles. Nous pouvons partager vos informations avec les barbiers pour faciliter vos réservations.</p>

                                <h3>4. Sécurité</h3>
                                <p>Nous mettons en œuvre des mesures de sécurité appropriées pour protéger vos données contre l'accès non autorisé.</p>

                                <h3>5. Vos Droits</h3>
                                <p>Vous avez le droit d'accéder, de corriger ou de supprimer vos données personnelles. Contactez-nous pour exercer ces droits.</p>

                                <h3>6. Cookies</h3>
                                <p>Nous utilisons des cookies pour améliorer votre expérience. Consultez notre politique des cookies pour plus d'informations.</p>

                                <h3>7. Contact</h3>
                                <p>Pour toute question concernant cette politique, contactez-nous à privacy@shopthebarber.com</p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="cookies">
                        <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                            <CardContent className="p-8 prose dark:prose-invert max-w-none">
                                <h2>Politique des Cookies</h2>
                                <p className="text-slate dark:text-matte-silver">Dernière mise à jour: 02 Décembre 2025</p>

                                <h3>1. Qu'est-ce qu'un Cookie?</h3>
                                <p>Un cookie est un petit fichier texte stocké sur votre appareil lorsque vous visitez notre site.</p>

                                <h3>2. Types de Cookies Utilisés</h3>
                                <ul>
                                    <li><strong>Cookies Essentiels:</strong> Nécessaires au fonctionnement du site</li>
                                    <li><strong>Cookies de Performance:</strong> Nous aident à comprendre comment vous utilisez le site</li>
                                    <li><strong>Cookies de Fonctionnalité:</strong> Mémorisent vos préférences</li>
                                    <li><strong>Cookies Publicitaires:</strong> Utilisés pour afficher des publicités pertinentes</li>
                                </ul>

                                <h3>3. Gestion des Cookies</h3>
                                <p>Vous pouvez contrôler et gérer les cookies via les paramètres de votre navigateur. Notez que la désactivation des cookies peut affecter la fonctionnalité du site.</p>

                                <h3>4. Cookies Tiers</h3>
                                <p>Nous utilisons des services tiers qui peuvent placer des cookies sur votre appareil, notamment pour l'analyse et la publicité.</p>

                                <h3>5. Modifications</h3>
                                <p>Nous pouvons mettre à jour cette politique de temps en temps. Consultez cette page régulièrement pour rester informé.</p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
