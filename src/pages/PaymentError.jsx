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
  const reason = searchParams.get('reason') || 'An error occurred while processing your payment';

  const commonErrors = [
    {
      title: 'Insufficient funds',
      description: 'Check your account balance or try a different card',
    },
    {
      title: 'Expired card',
      description: 'Your card expiration date has passed',
    },
    {
      title: 'Incorrect details',
      description: 'Verify your card number, expiration date, and CVC',
    },
    {
      title: 'Declined by bank',
      description: 'Contact your bank to allow online payments',
    },
  ];

  return (
    <div className="min-h-screen py-12 bg-gradient-to-br from-slate-50 to-red-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="border-2 border-red-200 overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-red-500 to-orange-600 p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring' }}
              >
                <div className="w-20 h-20 bg-card rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
                  <XCircle className="w-12 h-12 text-red-600" />
                </div>
              </motion.div>

              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Payment Failed
              </h1>
              <p className="text-red-100 text-lg">
                Your payment could not be processed
              </p>
            </div>

            <CardContent className="p-8">
              <Alert className="bg-red-50 border-red-200 mb-6">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <AlertDescription className="text-red-800 font-semibold">
                  {reason}
                </AlertDescription>
              </Alert>

              <div className="mb-8">
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-primary" />
                  Possible causes
                </h3>
                <div className="space-y-3">
                  {commonErrors.map((error, idx) => (
                    <div key={idx} className="p-4 bg-muted/50 rounded-xl border border-slate-200">
                      <p className="font-semibold text-foreground mb-1">{error.title}</p>
                      <p className="text-sm text-muted-foreground">{error.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Alert className="bg-muted border-border mb-6">
                <AlertDescription className="text-foreground">
                  <strong>Don&apos;t worry:</strong> No amount was charged to your account.
                  Your items are still in your bag.
                </AlertDescription>
              </Alert>

              <div className="grid md:grid-cols-2 gap-4">
                <Button
                  onClick={() => navigate(createPageUrl('Checkout'))}
                  className="w-full h-12"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try payment again
                </Button>

                <Button
                  variant="outline"
                  onClick={() => navigate(createPageUrl('Cart'))}
                  className="w-full border-slate-300 h-12"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to bag
                </Button>
              </div>

              <div className="mt-8 p-6 bg-muted rounded-[13px] border border-border">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <HelpCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-foreground mb-2">
                      Need help?
                    </h4>
                    <p className="text-sm text-foreground/90 mb-4">
                      Our team can help you resolve this issue.
                    </p>
                    <Link to={createPageUrl('Messages')}>
                      <Button variant="outline" size="sm">
                        Contact support
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200">
            <CardContent className="p-6">
              <h3 className="font-bold text-foreground mb-4">
                Other payment options
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-xl border border-slate-200">
                  <CreditCard className="w-8 h-8 text-primary mb-2" />
                  <p className="font-semibold text-foreground mb-1">Different card</p>
                  <p className="text-sm text-muted-foreground">
                    Try another payment card
                  </p>
                </div>

                <div className="p-4 bg-muted/50 rounded-xl border border-slate-200">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mb-2">
                    <span className="text-white font-bold text-sm">P</span>
                  </div>
                  <p className="font-semibold text-foreground mb-1">PayPal</p>
                  <p className="text-sm text-muted-foreground">
                    Pay securely with PayPal
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
