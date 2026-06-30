import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMutation } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { FormField } from '@/components/ui/form-field';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { useProviderSetupTheme } from '@/components/provider-setup/providerSetupTheme';
import { stb } from '@/lib/stbUi';

const simplePromoSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  code: z.string().min(3, 'Code is required'),
  discountAmount: z.string().min(1, 'Amount is required'),
});

export default function PromotionSetup({ shopId, onComplete, onBack }) {
  const theme = useProviderSetupTheme('light');
  const form = useForm({
    resolver: zodResolver(simplePromoSchema),
    defaultValues: {
      title: 'First Visit Special',
      code: 'WELCOME20',
      discountAmount: '20',
    }
  });

  const createOfferMutation = useMutation({
    mutationFn: (payload) => sovereign.entities.PromoCode.create(payload),
    onSuccess: () => {
        onComplete();
    }
  });

  const onSubmit = (data) => {
    if (!shopId) return;
    const pct = Number(data.discountAmount);
    if (!Number.isFinite(pct) || pct <= 0) return;
    createOfferMutation.mutate({
      code: data.code.trim().toUpperCase(),
      discount_type: 'percentage',
      discount_value: pct,
      shop_id: shopId,
      is_active: true,
      expiry_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className={cn(stb.uiHeading, 'text-2xl mb-2')}>Create Your First Offer</h2>
        <p className={theme.subtitle}>Attract new clients with a welcome discount.</p>
      </div>

      <div className={theme.panel}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                  control={form.control}
                  name="title"
                  label="Offer Title"
                  render={(field) => (
                      <Input {...field} />
                  )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                  <FormField
                      control={form.control}
                      name="code"
                      label="Promo Code"
                      render={(field) => (
                          <Input {...field} className="uppercase" />
                      )}
                  />
                  <FormField
                      control={form.control}
                      name="discountAmount"
                      label="Discount (%)"
                      render={(field) => (
                          <Input {...field} type="number" />
                      )}
                  />
              </div>

              <div className="pt-4 flex flex-col gap-3">
                  <Button type="submit" disabled={createOfferMutation.isPending} className={cn(stb.btn, 'w-full')}>
                      {createOfferMutation.isPending ? 'Creating...' : 'Launch Offer & Finish'}
                  </Button>
                  <Button type="button" variant="ghost" onClick={onComplete} className={theme.ghostBtn}>
                      Skip for now
                  </Button>
              </div>
          </form>
      </div>

      <div className="flex justify-start">
          <Button variant="ghost" onClick={onBack} className={theme.ghostBtn}>
              Back
          </Button>
      </div>
    </div>
  );
}
