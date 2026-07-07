import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { useAuth } from '@/lib/AuthContext';
import { useEffectiveRole } from '@/hooks/useEffectiveRole';
import { dashboardPageForAccountType } from '@/lib/accountType';
import { MetaTags } from '@/components/seo/MetaTags';
import PageHeader from '@/components/layout/PageHeader';
import PageContent from '@/components/layout/PageContent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle, Loader2, Store } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { stb } from '@/lib/stbUi';
import { ReplaySetupGuideLink } from '@/components/onboarding/ReplaySetupGuideLink';
import { invalidateOnboardingQueries } from '@/lib/bootstrapProvider';

const profileSchema = z.object({
  display_name: z.string().min(2, 'Store name must be at least 2 characters'),
  phone: z
    .string()
    .min(10, 'Enter a 10-digit phone number')
    .max(15)
    .regex(/^[\d\s+\-()]+$/, 'Invalid phone'),
});

export default function SellerSettings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, refreshUser } = useAuth();
  const { accountType, isLoading: roleLoading } = useEffectiveRole();

  useEffect(() => {
    if (roleLoading) return;
    if (accountType && accountType !== 'seller') {
      navigate(createPageUrl(dashboardPageForAccountType(accountType)), { replace: true });
    }
  }, [accountType, roleLoading, navigate]);

  const { data: sellerProfile, isLoading } = useQuery({
    queryKey: ['onboarding-seller-profile', user?.id],
    queryFn: () => sovereign.onboarding.getSellerProfile(),
    enabled: !!user?.id && accountType === 'seller',
  });

  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      display_name: sellerProfile?.display_name || user?.full_name || '',
      phone: (user?.phone || '').replace(/\D/g, '').slice(-10),
    },
  });

  useEffect(() => {
    form.reset({
      display_name: sellerProfile?.display_name || user?.full_name || '',
      phone: (user?.phone || '').replace(/\D/g, '').slice(-10),
    });
  }, [sellerProfile?.display_name, user?.full_name, user?.phone, form]);

  const saveProfileMutation = useMutation({
    mutationFn: async (data) => {
      await sovereign.onboarding.updateSellerProfile({ display_name: data.display_name.trim() });
      if (user?.id) {
        await sovereign.entities.User.update(user.id, {
          phone: data.phone.replace(/\D/g, '').slice(-10),
        });
      }
    },
    onSuccess: async () => {
      invalidateOnboardingQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: ['onboarding-seller-profile'] });
      await refreshUser?.();
      toast.success('Store profile saved');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not save profile'),
  });

  const initiateStripeMutation = useMutation({
    mutationFn: () =>
      sovereign.functions.invoke('initiateStripeConnect', {
        userId: user?.id,
        returnPath: '/SellerSettings?tab=payments',
        refreshPath: '/SellerSettings?tab=payments',
      }),
    onSuccess: (data) => {
      if (data.data?.url) window.location.href = data.data.url;
      else toast.error('Could not start Stripe onboarding');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Stripe Connect failed'),
  });

  const checkStripeMutation = useMutation({
    mutationFn: () => sovereign.functions.invoke('checkStripeConnectStatus', { userId: user?.id }),
    onSuccess: async () => {
      await refreshUser?.();
      toast.success('Stripe status updated');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not refresh Stripe status'),
  });

  if (roleLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading seller settings…
      </div>
    );
  }

  const stripeActive = user?.stripe_connect_status === 'active';

  return (
    <div className={stb.page}>
      <MetaTags title="Seller settings | Shop The Barber" description="Store profile and marketplace payouts." />
      <PageHeader
        label="Seller"
        title="Settings"
        subtitle="Manage your store profile and payout account."
        compact
        variant="light"
        tier="app"
      />
      <PageContent narrow>
        <Tabs defaultValue="store" className="space-y-6">
          <TabsList>
            <TabsTrigger value="store">Store</TabsTrigger>
            <TabsTrigger value="payments">Payouts</TabsTrigger>
          </TabsList>

          <TabsContent value="store">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Store className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-semibold">Store profile</p>
                    <p className="text-sm text-muted-foreground">Shown to buyers on the marketplace.</p>
                  </div>
                </div>
                <form
                  className="space-y-4 max-w-md"
                  onSubmit={form.handleSubmit((data) => saveProfileMutation.mutate(data))}
                >
                  <div className="space-y-2">
                    <Label htmlFor="seller-settings-name">Business / store name</Label>
                    <Input id="seller-settings-name" {...form.register('display_name')} />
                    {form.formState.errors.display_name && (
                      <p className="text-sm text-destructive">{form.formState.errors.display_name.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seller-settings-phone">Contact phone</Label>
                    <Input id="seller-settings-phone" {...form.register('phone')} inputMode="tel" />
                    {form.formState.errors.phone && (
                      <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>
                    )}
                  </div>
                  <Button type="submit" disabled={saveProfileMutation.isPending}>
                    {saveProfileMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save store profile
                  </Button>
                </form>
                <ReplaySetupGuideLink />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card>
              <CardContent className="p-6 space-y-4">
                {stripeActive ? (
                  <div className="flex items-start gap-3 text-primary">
                    <CheckCircle className="w-6 h-6 shrink-0" />
                    <div>
                      <p className="font-semibold">Stripe Connect is active</p>
                      <p className="text-sm text-muted-foreground">Marketplace payouts will route to your connected account.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-6 h-6 text-primary shrink-0" />
                      <div>
                        <p className="font-semibold">Connect Stripe for payouts</p>
                        <p className="text-sm text-muted-foreground">
                          Required to receive payments when your product orders ship.
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
          </TabsContent>
        </Tabs>
      </PageContent>
    </div>
  );
}
