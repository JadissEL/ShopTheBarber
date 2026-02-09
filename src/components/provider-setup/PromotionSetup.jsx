import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMutation } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { FormField } from '@/components/ui/form-field';
import { z } from 'zod';

const simplePromoSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  code: z.string().min(3, 'Code is required'),
  discountAmount: z.string().min(1, 'Amount is required'),
});

export default function PromotionSetup({ shopId, onComplete, onBack }) {
  const form = useForm({
    resolver: zodResolver(simplePromoSchema),
    defaultValues: {
      title: 'First Visit Special',
      code: 'WELCOME20',
      discountAmount: '20',
    }
  });

  const createOfferMutation = useMutation({
    mutationFn: (data) => sovereign.entities.Promotion.create(data),
    onSuccess: () => {
        onComplete();
    }
  });

  const onSubmit = (data) => {
    createOfferMutation.mutate({
      title: data.title,
      description: 'Exclusive offer for new clients.',
      code: data.code.toUpperCase(),
      discount_text: `${data.discountAmount}% OFF`,
      image_url: "https://images.unsplash.com/photo-1585747861443-e20c4f323e6a?w=600&auto=format&fit=crop",
      type: 'shop',
      shop_id: shopId,
      expiry_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0] // 1 month from now
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Create Your First Offer</h2>
        <p className="text-gray-400">Attract new clients with a welcome discount.</p>
      </div>

      <div className="bg-[#1A1D24] p-6 rounded-xl border border-white/10">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                  control={form.control}
                  name="title"
                  label="Offer Title"
                  render={(field) => (
                      <Input {...field} className="bg-slate-950 border-white/10 text-white" />
                  )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                  <FormField
                      control={form.control}
                      name="code"
                      label="Promo Code"
                      render={(field) => (
                          <Input {...field} className="bg-slate-950 border-white/10 text-white uppercase" />
                      )}
                  />
                  <FormField
                      control={form.control}
                      name="discountAmount"
                      label="Discount (%)"
                      render={(field) => (
                          <Input {...field} type="number" className="bg-slate-950 border-white/10 text-white" />
                      )}
                  />
              </div>

              <div className="pt-4 flex flex-col gap-3">
                  <Button type="submit" disabled={createOfferMutation.isPending} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white">
                      {createOfferMutation.isPending ? 'Creating...' : 'Launch Offer & Finish'}
                  </Button>
                  <Button type="button" variant="ghost" onClick={onComplete} className="text-gray-400 hover:text-white">
                      Skip for now
                  </Button>
              </div>
          </form>
      </div>

      <div className="flex justify-start">
          <Button variant="ghost" onClick={onBack} className="text-gray-400 hover:text-white">
              Back
          </Button>
      </div>
    </div>
  );
}
