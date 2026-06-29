import { useEffect } from 'react';

import { useSearchParams, Link } from 'react-router-dom';

import { createPageUrl } from '@/utils';

import { useQuery, useMutation } from '@tanstack/react-query';

import { sovereign } from '@/api/apiClient';

import { getAnalyticsSessionId } from '@/lib/analyticsSession';

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

  const orderId = searchParams.get('orderId');



  const { data: order } = useQuery({

    queryKey: ['order', orderId],

    queryFn: async () => orderId ? await sovereign.orders.get(orderId) : null,

    enabled: !!orderId

  });



  const sendConfirmationEmailMutation = useMutation({

    mutationFn: async () => {

      return { ok: true };

    },

  });



  useEffect(() => {

    if (order) {

      sovereign.analytics.track({

        eventName: 'marketplace_order_paid',

        session_id: getAnalyticsSessionId(),

        properties: {

          order_id: orderId,

          amount_eur: order.total_amount,

          source: 'payment_success_page',

        },

      });



      confetti({

        particleCount: 100,

        spread: 70,

        origin: { y: 0.6 }

      });



      sendConfirmationEmailMutation.mutate();

    }

  }, [order]);



  if (!order) {

    return (

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">

        <div className="text-center">

          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />

          <p className="text-muted-foreground">Loading your order…</p>

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

          <Card className="border-2 border-green-200 overflow-hidden mb-8">

            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-center">

              <motion.div

                initial={{ scale: 0 }}

                animate={{ scale: 1 }}

                transition={{ delay: 0.2, type: "spring" }}

              >

                <div className="w-20 h-20 bg-card rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">

                  <CheckCircle className="w-12 h-12 text-green-600" />

                </div>

              </motion.div>



              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">

                Payment Successful!

              </h1>

              <p className="text-green-100 text-lg">

                Thank you for your purchase

              </p>

            </div>



            <CardContent className="p-8">

              <div className="grid md:grid-cols-2 gap-6 mb-6">

                <div className="bg-muted/50 p-4 rounded-xl">

                  <p className="text-sm text-muted-foreground mb-1">Order number</p>

                  <p className="text-lg font-bold text-foreground font-mono">

                    #{orderId.slice(0, 8)}

                  </p>

                </div>



                <div className="bg-muted/50 p-4 rounded-xl">

                  <p className="text-sm text-muted-foreground mb-1">Amount paid</p>

                  <p className="text-2xl font-bold text-green-600">

                    ${order.total_amount.toFixed(2)}

                  </p>

                </div>



                {order.tracking_number && (

                  <div className="bg-muted/50 p-4 rounded-xl">

                    <p className="text-sm text-muted-foreground mb-1">Tracking number</p>

                    <p className="text-lg font-bold text-foreground font-mono">

                      {order.tracking_number}

                    </p>

                  </div>

                )}



              </div>



              <Separator className="my-6" />



              <div className="space-y-4">

                <h3 className="font-bold text-foreground mb-4">What happens next</h3>



                <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-xl border border-blue-200">

                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">

                    <Mail className="w-5 h-5 text-white" />

                  </div>

                  <div className="flex-1">

                    <p className="font-semibold text-blue-900 mb-1">

                      Confirmation email sent

                    </p>

                    <p className="text-sm text-blue-700">

                      Check your inbox for order details and receipt

                    </p>

                  </div>

                </div>



                <div className="flex items-start gap-4 p-4 bg-salmon/15 rounded-[13px] border border-salmon/30">

                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">

                    <Package className="w-5 h-5 text-white" />

                  </div>

                  <div className="flex-1">

                    <p className="font-semibold text-foreground mb-1">

                      Preparing your order

                    </p>

                    <p className="text-sm text-muted-foreground">

                      We&apos;re getting your items ready to ship

                    </p>

                  </div>

                </div>



                <div className="flex items-start gap-4 p-4 bg-green-50 rounded-xl border border-green-200">

                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">

                    <Truck className="w-5 h-5 text-white" />

                  </div>

                  <div className="flex-1">

                    <p className="font-semibold text-green-900 mb-1">

                      Shipping soon

                    </p>

                    <p className="text-sm text-green-700">

                      Your package will ship within 24-48 hours

                    </p>

                  </div>

                </div>

              </div>



              {order.items && (

                <>

                  <Separator className="my-6" />

                  <div>

                    <h3 className="font-bold text-foreground mb-4">Order items</h3>

                    <div className="space-y-3">

                      {order.items.map((item, idx) => (

                        <div key={idx} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">

                          <div className="flex-1">

                            <p className="font-semibold text-foreground">{item.name}</p>

                            <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>

                          </div>

                          <p className="font-bold text-foreground">

                            ${(item.price * item.quantity).toFixed(2)}

                          </p>

                        </div>

                      ))}

                    </div>

                  </div>

                </>

              )}



              <div className="grid md:grid-cols-3 gap-4 mt-8">

                <Link to={createPageUrl(`OrderTracking?orderId=${orderId}`)}>

                  <Button className="w-full">

                    <Truck className="w-4 h-4 mr-2" />

                    Track order

                  </Button>

                </Link>



                <Link to={createPageUrl("MyOrders")}>

                  <Button variant="outline" className="w-full border-slate-300">

                    <Package className="w-4 h-4 mr-2" />

                    My orders

                  </Button>

                </Link>



                <Link to={createPageUrl("Marketplace")}>

                  <Button variant="outline" className="w-full border-slate-300">

                    <ShoppingBag className="w-4 h-4 mr-2" />

                    Continue shopping

                  </Button>

                </Link>

              </div>

            </CardContent>

          </Card>



          <div className="text-center">

            <Link to={createPageUrl("Dashboard")}>

              <Button variant="ghost" className="text-foreground/90 hover:bg-muted">

                <Home className="w-4 h-4 mr-2" />

                Back to dashboard

              </Button>

            </Link>

          </div>

        </motion.div>

      </div>

    </div>

  );

}

