import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  XCircle,
  AlertTriangle,
  CreditCard,
  ArrowLeft,
  HelpCircle,
  RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function PaymentError() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const reason = searchParams.get('reason') || 'Une erreur est survenue lors du paiement';

  const commonErrors = [
    {
      title: "Fonds insuffisants",
      description: "Vérifiez le solde de votre compte ou utilisez une autre carte"
    },
    {
      title: "Carte expirée",
      description: "La date d'expiration de votre carte est dépassée"
    },
    {
      title: "Informations incorrectes",
      description: "Vérifiez le numéro de carte, la date d'expiration et le code CVC"
    },
    {
      title: "Transaction refusée par la banque",
      description: "Contactez votre banque pour débloquer les paiements en ligne"
    }
  ];

  return (
    <div className="min-h-screen py-12 bg-gradient-to-br from-slate-50 to-red-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {/* Error Header */}
          <Card className="border-2 border-red-200 overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-red-500 to-orange-600 p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring" }}
              >
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
                  <XCircle className="w-12 h-12 text-red-600" />
                </div>
              </motion.div>

              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Paiement Échoué
              </h1>
              <p className="text-red-100 text-lg">
                Votre paiement n'a pas pu être traité
              </p>
            </div>

            <CardContent className="p-8">
              {/* Error Message */}
              <Alert className="bg-red-50 border-red-200 mb-6">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <AlertDescription className="text-red-800 font-semibold">
                  {reason}
                </AlertDescription>
              </Alert>

              {/* Common Errors */}
              <div className="mb-8">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-blue-600" />
                  Causes possibles
                </h3>
                <div className="space-y-3">
                  {commonErrors.map((error, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="font-semibold text-slate-900 mb-1">{error.title}</p>
                      <p className="text-sm text-slate-600">{error.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reassurance */}
              <Alert className="bg-blue-50 border-blue-200 mb-6">
                <AlertDescription className="text-blue-900">
                  <strong>Rassurez-vous:</strong> Aucun montant n'a été débité de votre compte. 
                  Vos articles sont toujours dans votre panier.
                </AlertDescription>
              </Alert>

              {/* Action Buttons */}
              <div className="grid md:grid-cols-2 gap-4">
                <Button
                  onClick={() => navigate(createPageUrl("Checkout"))}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white h-12"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Réessayer le paiement
                </Button>

                <Button
                  variant="outline"
                  onClick={() => navigate(createPageUrl("Cart"))}
                  className="w-full border-slate-300 h-12"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour au panier
                </Button>
              </div>

              {/* Support */}
              <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <HelpCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 mb-2">
                      Besoin d'aide ?
                    </h4>
                    <p className="text-sm text-slate-700 mb-4">
                      Notre équipe est disponible pour vous aider à résoudre ce problème.
                    </p>
                    <Link to={createPageUrl("Messages")}>
                      <Button variant="outline" size="sm" className="border-purple-300 text-purple-700">
                        Contacter le support
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alternative Payment Methods */}
          <Card className="border-2 border-slate-200">
            <CardContent className="p-6">
              <h3 className="font-bold text-slate-900 mb-4">
                Autres moyens de paiement
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <CreditCard className="w-8 h-8 text-blue-600 mb-2" />
                  <p className="font-semibold text-slate-900 mb-1">Carte bancaire différente</p>
                  <p className="text-sm text-slate-600">
                    Essayez avec une autre carte de paiement
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mb-2">
                    <span className="text-white font-bold text-sm">P</span>
                  </div>
                  <p className="font-semibold text-slate-900 mb-1">PayPal</p>
                  <p className="text-sm text-slate-600">
                    Payez en toute sécurité avec PayPal
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}