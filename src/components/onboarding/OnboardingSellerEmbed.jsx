import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { sovereign } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { invalidateOnboardingQueries } from '@/lib/bootstrapProvider';
import { useAuth } from '@/lib/AuthContext';
import { useOnboardingProgress } from '@/hooks/useOnboardingProgress';

const profileSchema = z.object({
  display_name: z.string().min(2, 'Store name must be at least 2 characters'),
  phone: z
    .string()
    .min(10, 'Enter a 10-digit phone number')
    .max(15)
    .regex(/^[\d\s+\-()]+$/, 'Invalid phone'),
});

const PRODUCT_CATEGORIES = [
  { id: 'hair', label: 'Hair' },
  { id: 'skincare', label: 'Skincare' },
  { id: 'beard', label: 'Beard' },
  { id: 'tools', label: 'Tools' },
  { id: 'fragrance', label: 'Fragrance' },
  { id: 'styling', label: 'Styling' },
];

export function OnboardingSellerEmbed({ stepId, user, onSaved }) {
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();
  const { sellerProfile, products } = useOnboardingProgress();

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      display_name: sellerProfile?.display_name || user?.full_name || '',
      phone: (user?.phone || '').replace(/\D/g, '').slice(-10),
    },
  });

  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    category: 'hair',
  });

  useEffect(() => {
    profileForm.reset({
      display_name: sellerProfile?.display_name || user?.full_name || '',
      phone: (user?.phone || '').replace(/\D/g, '').slice(-10),
    });
  }, [sellerProfile?.display_name, user?.full_name, user?.phone, profileForm]);

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
      toast.success('Seller profile saved');
      onSaved?.();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not save profile'),
  });

  const createProductMutation = useMutation({
    mutationFn: () =>
      sovereign.products.create({
        name: productForm.name.trim(),
        price: parseFloat(productForm.price),
        category: productForm.category,
        stock: 1,
        seller_type: 'vendor',
        vendor_name: sellerProfile?.display_name || profileForm.getValues('display_name'),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-products'] });
      toast.success('Product draft created');
      onSaved?.();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not create product'),
  });

  const initiateStripeMutation = useMutation({
    mutationFn: () =>
      sovereign.functions.invoke('initiateStripeConnect', {
        userId: user?.id,
        returnPath: '/SetupGuide?stripe=return',
        refreshPath: '/SetupGuide?stripe=return',
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
      invalidateOnboardingQueries(queryClient);
      await refreshUser?.();
      toast.success('Stripe status updated');
      onSaved?.();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not refresh Stripe status'),
  });

  if (stepId === 'profile') {
    return (
      <Card>
        <CardContent className="p-6">
          <form
            className="space-y-4 max-w-md"
            onSubmit={profileForm.handleSubmit((data) => saveProfileMutation.mutate(data))}
          >
            <div className="space-y-2">
              <Label htmlFor="seller-store-name">Store / business name</Label>
              <Input id="seller-store-name" {...profileForm.register('display_name')} placeholder="Your brand name" />
              {profileForm.formState.errors.display_name && (
                <p className="text-sm text-destructive">{profileForm.formState.errors.display_name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="seller-phone">Contact phone</Label>
              <Input id="seller-phone" {...profileForm.register('phone')} placeholder="5551234567" inputMode="tel" />
              {profileForm.formState.errors.phone && (
                <p className="text-sm text-destructive">{profileForm.formState.errors.phone.message}</p>
              )}
            </div>
            <Button type="submit" disabled={saveProfileMutation.isPending}>
              {saveProfileMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save seller profile
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  if (stepId === 'products') {
    if (products.length > 0) {
      return (
        <Card>
          <CardContent className="p-6 flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-primary shrink-0" />
            <div>
              <p className="font-semibold">You have {products.length} product draft{products.length === 1 ? '' : 's'}</p>
              <p className="text-sm text-muted-foreground">Continue to payout setup or open your catalog to add more.</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardContent className="p-6 space-y-4 max-w-lg">
          <div className="space-y-2">
            <Label htmlFor="product-name">Product name</Label>
            <Input
              id="product-name"
              value={productForm.name}
              onChange={(e) => setProductForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Beard oil"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product-price">Price (USD)</Label>
              <Input
                id="product-price"
                value={productForm.price}
                onChange={(e) => setProductForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="24.99"
                inputMode="decimal"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={productForm.category}
                onValueChange={(value) => setProductForm((f) => ({ ...f, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_CATEGORIES.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            type="button"
            disabled={createProductMutation.isPending || !productForm.name.trim() || !productForm.price}
            onClick={() => createProductMutation.mutate()}
          >
            {createProductMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create product draft
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (stepId === 'stripe') {
    const active = user?.stripe_connect_status === 'active';
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          {active ? (
            <div className="flex items-start gap-3 text-primary">
              <CheckCircle className="w-6 h-6 shrink-0" />
              <div>
                <p className="font-semibold">Stripe Connect is active</p>
                <p className="text-sm text-muted-foreground">You can receive payouts when orders ship.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-primary shrink-0" />
                <div>
                  <p className="font-semibold">Connect your bank account</p>
                  <p className="text-sm text-muted-foreground">
                    Stripe handles identity verification and payouts for marketplace sales.
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

  return null;
}
