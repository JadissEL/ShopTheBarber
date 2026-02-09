import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { FormField } from '@/components/ui/form-field';
import { shopSchema } from '@/components/schemas';
import { Upload } from 'lucide-react';

export default function ProfileSetup({ shop, onNext }) {
  const queryClient = useQueryClient();
  
  const form = useForm({
    resolver: zodResolver(shopSchema),
    defaultValues: {
      name: shop?.name || '',
      location: shop?.location || '',
      description: shop?.description || '',
      phone: shop?.phone || '',
      website: shop?.website || '',
    }
  });

  // Update default values when shop data loads
  useEffect(() => {
    if (shop) {
      form.reset({
        name: shop.name,
        location: shop.location,
        description: shop.description,
        phone: shop.phone || '',
        website: shop.website || '',
      });
    }
  }, [shop, form]);

  const updateShopMutation = useMutation({
    mutationFn: (data) => sovereign.entities.Shop.update(shop.id, data),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['my-shop'] });
        onNext();
    }
  });

  const onSubmit = (data) => {
    updateShopMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Complete Your Profile</h2>
        <p className="text-gray-400">Add more details to help clients find and contact you.</p>
      </div>

      <div className="bg-[#1A1D24] p-6 rounded-xl border border-white/10">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                  control={form.control}
                  name="name"
                  label="Shop Name"
                  render={(field) => (
                      <Input {...field} className="bg-slate-950 border-white/10 text-white" />
                  )}
              />

              <FormField
                  control={form.control}
                  name="location"
                  label="Address"
                  render={(field) => (
                      <Input {...field} className="bg-slate-950 border-white/10 text-white" />
                  )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                      control={form.control}
                      name="phone"
                      label="Phone Number"
                      render={(field) => (
                          <Input {...field} placeholder="(555) 123-4567" className="bg-slate-950 border-white/10 text-white" />
                      )}
                  />
                  <FormField
                      control={form.control}
                      name="website"
                      label="Website (Optional)"
                      render={(field) => (
                          <Input {...field} placeholder="https://" className="bg-slate-950 border-white/10 text-white" />
                      )}
                  />
              </div>

              <FormField
                  control={form.control}
                  name="description"
                  label="Description"
                  render={(field) => (
                      <Textarea {...field} className="min-h-[100px] bg-slate-950 border-white/10 text-white" />
                  )}
              />

              <div className="pt-2">
                  <div className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center hover:bg-white/5 transition-colors cursor-pointer">
                      <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Upload className="w-5 h-5 text-gray-400" />
                      </div>
                      <p className="text-gray-300 text-sm font-medium">Update Shop Banner</p>
                  </div>
              </div>

              <div className="pt-4">
                  <Button type="submit" disabled={updateShopMutation.isPending} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white">
                      {updateShopMutation.isPending ? 'Saving...' : 'Save & Continue'}
                  </Button>
              </div>
          </form>
      </div>
    </div>
  );
}
