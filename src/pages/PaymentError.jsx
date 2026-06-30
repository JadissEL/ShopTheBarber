import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
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
import PageHeader from '@/components/layout/PageHeader';
import PageContent from '@/components/layout/PageContent';
import { MetaTags } from '@/components/seo/MetaTags';
import { cn } from '@/lib/utils';
import { stb } from '@/lib/stbUi';

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
    <div className="stb-page lg:pb-8">
      <MetaTags title="Payment Failed" description="Your payment could not be processed." />
      <PageHeader
        label="Marketplace"
        title="Payment failed"
        subtitle="Your payment could not be processed"
        compact
        variant="light"
        tier="app"
      />

      <PageContent narrow>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className={cn(stb.panel, 'overflow-hidden mb-8 border-destructive/30')}>
            <div className="bg-destructive p-8 text-center text-destructive-foreground">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring' }}
              >
                <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center mx-auto mb-4 shadow-elevation-lg">
                  <XCircle className="w-12 h-12 text-destructive" />
                </div>
              </motion.div>
            </div>

            <div className="p-8">
              <Alert className="bg-destructive/10 border-destructive/30 mb-6">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <AlertDescription className="text-destructive font-semibold">
                  {reason}
                </AlertDescription>
              </Alert>

              <div className="mb-8">
                <h3 className={cn(stb.uiSubheading, 'mb-4 flex items-center gap-2')}>
                  <HelpCircle className="w-5 h-5 text-primary" />
                  Possible causes
                </h3>
                <div className="space-y-3">
                  {commonErrors.map((error, idx) => (
                    <div key={idx} className={cn(stb.surfaceMuted, 'p-4 rounded-lg border border-border')}>
                      <p className={cn(stb.uiSubheading, 'text-sm mb-1')}>{error.title}</p>
                      <p className={cn(stb.caption, 'text-muted-foreground')}>{error.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Alert className={cn(stb.surfaceMuted, 'border-border mb-6')}>
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
                  className="w-full h-12"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to bag
                </Button>
              </div>

              <div className={cn(stb.panel, 'mt-8 p-6')}>
                <div className="flex items-start gap-4">
                  <div className={cn(stb.iconBox, 'bg-primary text-primary-foreground shrink-0 w-12 h-12')}>
                    <HelpCircle className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className={cn(stb.uiSubheading, 'mb-2')}>
                      Need help?
                    </h4>
                    <p className={cn(stb.caption, 'text-muted-foreground mb-4')}>
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
            </div>
          </div>

          <div className={cn(stb.panel, 'p-6')}>
            <h3 className={cn(stb.uiSubheading, 'mb-4')}>
              Other payment options
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className={cn(stb.surfaceMuted, 'p-4 rounded-lg border border-border')}>
                <CreditCard className="w-8 h-8 text-primary mb-2" />
                <p className={cn(stb.uiSubheading, 'text-sm mb-1')}>Different card</p>
                <p className={cn(stb.caption, 'text-muted-foreground')}>
                  Try another payment card
                </p>
              </div>

              <div className={cn(stb.surfaceMuted, 'p-4 rounded-lg border border-border')}>
                <div className={cn(stb.iconBox, 'bg-primary text-primary-foreground mb-2 w-8 h-8')}>
                  <span className="font-bold text-sm">P</span>
                </div>
                <p className={cn(stb.uiSubheading, 'text-sm mb-1')}>PayPal</p>
                <p className={cn(stb.caption, 'text-muted-foreground')}>
                  Pay securely with PayPal
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </PageContent>
    </div>
  );
}
