import { useEffect } from 'react';

import { useSearchParams, Link } from 'react-router-dom';

import { createPageUrl } from '@/utils';

import { useEffectiveRole } from '@/hooks/useEffectiveRole';
import { dashboardPageForRole } from '@/lib/userRole';

import { useQuery, useMutation } from '@tanstack/react-query';

import { sovereign } from '@/api/apiClient';

import { getAnalyticsSessionId } from '@/lib/analyticsSession';

import { Button } from '@/components/ui/button';

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
import PageHeader from '@/components/layout/PageHeader';
import PageContent from '@/components/layout/PageContent';
import { MetaTags } from '@/components/seo/MetaTags';
import { cn } from '@/lib/utils';
import { stb } from '@/lib/stbUi';



export default function PaymentSuccess() {

  const [searchParams] = useSearchParams();
  const { effectiveRole } = useEffectiveRole();
  const dashboardPage = dashboardPageForRole(effectiveRole);
  const dashboardLabel = dashboardPage === 'GlobalFinancials' ? 'Admin' : 'Dashboard';

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

      <div className="stb-page flex items-center justify-center">

        <div className="text-center">

          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />

          <p className={cn(stb.body, 'text-muted-foreground')}>Loading your order…</p>

        </div>

      </div>

    );

  }



  return (

    <div className="stb-page lg:pb-8">

      <MetaTags title="Payment Successful" description="Your order was placed successfully." />

      <PageHeader
        label="Marketplace"
        title="Payment successful"
        subtitle="Thank you for your purchase"
        compact
        variant="light"
        tier="app"
      />

      <PageContent narrow>

        <motion.div

          initial={{ opacity: 0, scale: 0.9 }}

          animate={{ opacity: 1, scale: 1 }}

          transition={{ duration: 0.5 }}

        >

          <div className={cn(stb.panel, 'overflow-hidden mb-8 border-success/30')}>

            <div className="bg-success p-8 text-center text-success-foreground">

              <motion.div

                initial={{ scale: 0 }}

                animate={{ scale: 1 }}

                transition={{ delay: 0.2, type: "spring" }}

              >

                <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center mx-auto mb-4 shadow-elevation-lg">

                  <CheckCircle className="w-12 h-12 text-success" />

                </div>

              </motion.div>

              <p className={cn(stb.body, 'text-success-foreground/90 text-lg')}>

                Order #{orderId.slice(0, 8)} confirmed

              </p>

            </div>



            <div className="p-8">

              <div className="grid md:grid-cols-2 gap-6 mb-6">

                <div className={cn(stb.surfaceMuted, 'p-4 rounded-lg')}>

                  <p className={cn(stb.caption, 'text-muted-foreground mb-1')}>Order number</p>

                  <p className={cn(stb.uiSubheading, 'font-mono')}>

                    #{orderId.slice(0, 8)}

                  </p>

                </div>



                <div className={cn(stb.surfaceMuted, 'p-4 rounded-lg')}>

                  <p className={cn(stb.caption, 'text-muted-foreground mb-1')}>Amount paid</p>

                  <p className={cn(stb.metricValue, 'text-2xl text-success')}>

                    ${order.total_amount.toFixed(2)}

                  </p>

                </div>



                {order.tracking_number && (

                  <div className={cn(stb.surfaceMuted, 'p-4 rounded-lg')}>

                    <p className={cn(stb.caption, 'text-muted-foreground mb-1')}>Tracking number</p>

                    <p className={cn(stb.uiSubheading, 'font-mono')}>

                      {order.tracking_number}

                    </p>

                  </div>

                )}



              </div>



              <Separator className="my-6" />



              <div className="space-y-4">

                <h3 className={cn(stb.uiSubheading, 'mb-4')}>What happens next</h3>



                <div className={cn(stb.notice, 'flex items-start gap-4 p-4 rounded-lg')}>

                  <div className={cn(stb.iconBox, 'bg-primary text-primary-foreground shrink-0')}>

                    <Mail className="w-5 h-5" />

                  </div>

                  <div className="flex-1">

                    <p className={cn(stb.uiSubheading, 'text-sm mb-1')}>

                      Confirmation email sent

                    </p>

                    <p className={cn(stb.caption, 'text-muted-foreground')}>

                      Check your inbox for order details and receipt

                    </p>

                  </div>

                </div>



                <div className={cn(stb.noticeWarm, 'flex items-start gap-4 p-4 rounded-lg')}>

                  <div className={cn(stb.iconBox, 'bg-primary text-primary-foreground shrink-0')}>

                    <Package className="w-5 h-5" />

                  </div>

                  <div className="flex-1">

                    <p className={cn(stb.uiSubheading, 'text-sm mb-1')}>

                      Preparing your order

                    </p>

                    <p className={cn(stb.caption, 'text-muted-foreground')}>

                      We&apos;re getting your items ready to ship

                    </p>

                  </div>

                </div>



                <div className={cn(stb.surfaceMuted, 'flex items-start gap-4 p-4 rounded-lg border border-success/20')}>

                  <div className={cn(stb.iconBox, 'bg-success text-success-foreground shrink-0')}>

                    <Truck className="w-5 h-5" />

                  </div>

                  <div className="flex-1">

                    <p className={cn(stb.uiSubheading, 'text-sm mb-1')}>

                      Shipping soon

                    </p>

                    <p className={cn(stb.caption, 'text-muted-foreground')}>

                      Your package will ship within 24-48 hours

                    </p>

                  </div>

                </div>

              </div>



              {order.items && (

                <>

                  <Separator className="my-6" />

                  <div>

                    <h3 className={cn(stb.uiSubheading, 'mb-4')}>Order items</h3>

                    <div className="space-y-3">

                      {order.items.map((item, idx) => (

                        <div key={idx} className={cn(stb.surfaceMuted, 'flex justify-between items-center p-3 rounded-lg')}>

                          <div className="flex-1">

                            <p className={cn(stb.uiSubheading, 'text-sm')}>{item.name}</p>

                            <p className={cn(stb.caption, 'text-muted-foreground')}>Qty: {item.quantity}</p>

                          </div>

                          <p className={cn(stb.metricValue)}>

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

                  <Button variant="outline" className="w-full">

                    <Package className="w-4 h-4 mr-2" />

                    My orders

                  </Button>

                </Link>



                <Link to={createPageUrl("Marketplace")}>

                  <Button variant="outline" className="w-full">

                    <ShoppingBag className="w-4 h-4 mr-2" />

                    Continue shopping

                  </Button>

                </Link>

              </div>

            </div>

          </div>



          <div className="text-center">

            <Link to={createPageUrl(dashboardPage)}>

              <Button variant="ghost" className="text-foreground/90 hover:bg-muted">

                <Home className="w-4 h-4 mr-2" />

                Back to {dashboardLabel.toLowerCase()}

              </Button>

            </Link>

          </div>

        </motion.div>

      </PageContent>

    </div>

  );

}
