import { useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery, useMutation } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle,
  Package,
  Truck,
  Mail,
  Home,
  ShoppingBag
} from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('orderId');

  const { data: order } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => orderId ? await sovereign.orders.get(orderId) : null,
    enabled: !!orderId
  });

  const sendConfirmationEmailMutation = useMutation({
    mutationFn: async () => {
      // Email confirmation is handled server-side after Stripe webhook
      return { ok: true };
    },
  });

  useEffect(() => {
    if (order) {
      // Launch confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Send confirmation email
      sendConfirmationEmailMutation.mutate();
    }
  }, [order]);

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Chargement de votre commande...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Success Header */}
          <Card className="border-2 border-green-200 overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
              </motion.div>

              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Paiement Réussi !
              </h1>
              <p className="text-green-100 text-lg">
                Merci pour votre confiance
              </p>
            </div>

            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-sm text-slate-600 mb-1">Numéro de commande</p>
                  <p className="text-lg font-bold text-slate-900 font-mono">
                    #{orderId.slice(0, 8)}
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-sm text-slate-600 mb-1">Montant payé</p>
                  <p className="text-2xl font-bold text-green-600">
                    {order.total_amount.toFixed(2)}€
                  </p>
                </div>

                {order.tracking_number && (
                  <div className="bg-slate-50 p-4 rounded-xl">
                    <p className="text-sm text-slate-600 mb-1">Numéro de suivi</p>
                    <p className="text-lg font-bold text-slate-900 font-mono">
                      {order.tracking_number}
                    </p>
                  </div>
                )}

                {transaction?.payment_method === 'installment' && transaction?.installment_plan && (
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                    <p className="text-sm text-blue-700 mb-1 font-semibold">Paiement en plusieurs fois</p>
                    <p className="text-lg font-bold text-blue-900">
                      {transaction.installment_plan.installments}x {transaction.installment_plan.amount_per_installment}€
                    </p>
                  </div>
                )}
              </div>

              <Separator className="my-6" />

              {/* Next Steps */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 mb-4">Prochaines étapes</h3>

                <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-blue-900 mb-1">
                      Email de confirmation envoyé
                    </p>
                    <p className="text-sm text-blue-700">
                      Consultez votre boîte mail pour les détails de votre commande
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-purple-900 mb-1">
                      Préparation de votre commande
                    </p>
                    <p className="text-sm text-purple-700">
                      Nous préparons votre commande avec soin
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Truck className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-green-900 mb-1">
                      Expédition prévue
                    </p>
                    <p className="text-sm text-green-700">
                      Votre colis sera expédié sous 24-48h
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Items Summary */}
              {order.items && (
                <>
                  <Separator className="my-6" />
                  <div>
                    <h3 className="font-bold text-slate-900 mb-4">Articles commandés</h3>
                    <div className="space-y-3">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-semibold text-slate-900">{item.name}</p>
                            <p className="text-sm text-slate-600">Quantité: {item.quantity}</p>
                          </div>
                          <p className="font-bold text-slate-900">
                            {(item.price * item.quantity).toFixed(2)}€
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="grid md:grid-cols-3 gap-4 mt-8">
                <Link to={createPageUrl(`OrderTracking?orderId=${orderId}`)}>
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    <Truck className="w-4 h-4 mr-2" />
                    Suivre ma commande
                  </Button>
                </Link>

                <Link to={createPageUrl("ClientDashboard")}>
                  <Button variant="outline" className="w-full border-slate-300">
                    <Package className="w-4 h-4 mr-2" />
                    Mes commandes
                  </Button>
                </Link>

                <Link to={createPageUrl("Marketplace")}>
                  <Button variant="outline" className="w-full border-slate-300">
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Continuer mes achats
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Back to Home */}
          <div className="text-center">
            <Link to={createPageUrl("Home")}>
              <Button variant="ghost" className="text-slate-700 hover:bg-slate-100">
                <Home className="w-4 h-4 mr-2" />
                Retour à l'accueil
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}