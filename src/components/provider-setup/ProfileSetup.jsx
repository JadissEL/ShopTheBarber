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
import { useProviderSetupTheme } from '@/components/provider-setup/providerSetupTheme';

export default function ProfileSetup({ shop, onNext, variant = 'dark' }) {
  const t = useProviderSetupTheme(variant);
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
        <p className={t.subtitle}>Add more details to help clients find and contact you.</p>
      </div>

      <div className={t.panel}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                  control={form.control}
                  name="name"
                  label="Shop Name"
                  render={(field) => (
                      <Input {...field} className={t.input} />
                  )}
              />

              <FormField
                  control={form.control}
                  name="location"
                  label="Address"
                  render={(field) => (
                      <Input {...field} className={t.input} placeholder="Street, city" />
                  )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                      control={form.control}
                      name="phone"
                      label="Phone Number"
                      render={(field) => (
                          <Input {...field} placeholder="(555) 123-4567" className={t.input} />
                      )}
                  />
                  <FormField
                      control={form.control}
                      name="website"
                      label="Website (Optional)"
                      render={(field) => (
                          <Input {...field} placeholder="https://" className={t.input} />
                      )}
                  />
              </div>

              <FormField
                  control={form.control}
                  name="description"
                  label="Description"
                  render={(field) => (
                      <Textarea {...field} className={t.cn('min-h-[100px]', t.input)} />
                  )}
              />

              <div className="pt-2">
                  <div className={t.uploadZone}>
                      <div className={t.uploadIcon}>
                          <Upload className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <p className={t.uploadText}>Update Shop Banner</p>
                  </div>
              </div>

              <div className="pt-4">
                  <Button type="submit" disabled={updateShopMutation.isPending} className={t.saveBtn}>
                      {updateShopMutation.isPending ? 'Saving...' : 'Save & Continue'}
                  </Button>
              </div>
          </form>
      </div>
    </div>
  );
}
