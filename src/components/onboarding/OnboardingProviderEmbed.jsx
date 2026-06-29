import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, CheckCircle, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import ProfileSetup from '@/components/provider-setup/ProfileSetup';
import ServiceSetup from '@/components/provider-setup/ServiceSetup';
import AvailabilitySetup from '@/components/provider-setup/AvailabilitySetup';
import ProviderFixedFeePanel from '@/components/provider/ProviderFixedFeePanel';
import { Link } from 'react-router-dom';
import { getStepHref } from '@/lib/onboardingWizard';
import { useOnboardingProgress } from '@/hooks/useOnboardingProgress';
import { OnboardingProviderBootstrap } from '@/components/onboarding/OnboardingProviderBootstrap';
import { invalidateOnboardingQueries } from '@/lib/bootstrapProvider';

export function OnboardingProviderEmbed({ stepId, user, onAdvance, onWorkspaceReady }) {
  const queryClient = useQueryClient();
  const {
    barber,
    shop,
    shopId,
    needsProviderBootstrap,
    refresh,
  } = useOnboardingProgress();

  const initiateStripeMutation = useMutation({
    mutationFn: () => sovereign.functions.invoke('initiateStripeConnect', { userId: user?.id }),
    onSuccess: (data) => {
      if (data.data?.url) {
        const returnUrl = `${window.location.origin}/SetupGuide?stripe=return`;
        window.location.href = data.data.url.includes('return_url')
          ? data.data.url
          : `${data.data.url}${data.data.url.includes('?') ? '&' : '?'}return_url=${encodeURIComponent(returnUrl)}`;
      } else {
        toast.error('Could not start Stripe onboarding');
      }
    },
    onError: () => toast.error('Stripe Connect failed, try from Settings Payments'),
  });

  const checkStripeMutation = useMutation({
    mutationFn: () => sovereign.functions.invoke('checkStripeConnectStatus', { userId: user?.id }),
    onSuccess: () => {
      invalidateOnboardingQueries(queryClient);
      toast.success('Stripe status updated');
      refresh();
    },
  });

  if (needsProviderBootstrap && ['profile', 'services', 'availability', 'stripe', 'fixed_fee'].includes(stepId)) {
    return (
      <OnboardingProviderBootstrap
        user={user}
        onReady={() => {
          onWorkspaceReady?.();
          refresh();
        }}
      />
    );
  }

  if (stepId === 'profile') {
    if (!shop?.id) {
      return (
        <OnboardingProviderBootstrap
          user={user}
          onReady={() => {
            onWorkspaceReady?.();
            refresh();
          }}
        />
      );
    }
    return (
      <div className="rounded-2xl border bg-card p-4 md:p-6">
        <ProfileSetup
          shop={shop}
          variant="light"
          onNext={() => {
            invalidateOnboardingQueries(queryClient);
            refresh();
            onAdvance?.();
          }}
        />
      </div>
    );
  }

  if (stepId === 'services') {
    const context = shopId ? 'shop' : 'independent';
    return (
      <div className="rounded-2xl border bg-card p-4 md:p-6">
        <ServiceSetup
          shopId={shopId}
          barberId={barber?.id}
          context={context}
          variant="light"
          onNext={() => {
            invalidateOnboardingQueries(queryClient);
            refresh();
            onAdvance?.();
          }}
          onBack={() => {}}
        />
      </div>
    );
  }

  if (stepId === 'availability') {
    if (!shopId) {
      return (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center text-sm text-muted-foreground space-y-3">
            <p>Complete your business profile first to configure weekly hours.</p>
            <Button asChild variant="outline" size="sm">
              <Link to={getStepHref({ href: 'ProviderSettings', settingsTab: 'hours' })}>
                Open hours settings <ExternalLink className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      );
    }
    return (
      <div className="rounded-2xl border bg-card p-4 md:p-6">
        <AvailabilitySetup
          shopId={shopId}
          variant="light"
          onNext={() => {
            invalidateOnboardingQueries(queryClient);
            refresh();
            onAdvance?.();
          }}
          onBack={() => {}}
        />
      </div>
    );
  }

  if (stepId === 'stripe') {
    const active = user?.stripe_connect_status === 'active';
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          {active ? (
            <div className="flex items-start gap-3 text-emerald-700">
              <CheckCircle className="w-6 h-6 shrink-0" />
              <div>
                <p className="font-semibold">Stripe Connect is active</p>
                <p className="text-sm text-muted-foreground">You can receive payouts for card bookings.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
                <div>
                  <p className="font-semibold">Connect your bank account</p>
                  <p className="text-sm text-muted-foreground">
                    Stripe handles identity verification and payouts. You will be redirected to Stripe to finish setup.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => initiateStripeMutation.mutate()}
                  disabled={initiateStripeMutation.isPending}
                >
                  {initiateStripeMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Connect with Stripe
                </Button>
                {user?.stripe_account_id && (
                  <Button
                    variant="outline"
                    onClick={() => checkStripeMutation.mutate()}
                    disabled={checkStripeMutation.isPending}
                  >
                    Refresh status
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  if (stepId === 'fixed_fee') {
    if (!shopId) {
      return (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            Finish profile and Stripe setup first, then enroll in a fixed-fee plan here.
          </CardContent>
        </Card>
      );
    }
    return (
      <div className="rounded-2xl border bg-card p-4 md:p-6">
        <ProviderFixedFeePanel shopId={shopId} isShopOwner />
      </div>
    );
  }

  return null;
}
