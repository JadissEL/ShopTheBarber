import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { sovereign } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { invalidateOnboardingQueries } from '@/lib/bootstrapProvider';
import { useAuth } from '@/lib/AuthContext';

const schema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z
    .string()
    .min(10, 'Enter a 10-digit phone number')
    .max(15)
    .regex(/^[\d\s+\-()]+$/, 'Invalid phone'),
});

export function OnboardingClientEmbed({ user, onSaved }) {
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: user?.full_name || '',
      phone: (user?.phone || '').replace(/\D/g, '').slice(-10),
    },
  });

  useEffect(() => {
    form.reset({
      full_name: user?.full_name || '',
      phone: (user?.phone || '').replace(/\D/g, '').slice(-10),
    });
  }, [user?.full_name, user?.phone, form]);

  const saveMutation = useMutation({
    mutationFn: (data) =>
      sovereign.entities.User.update(user.id, {
        full_name: data.full_name.trim(),
        phone: data.phone.replace(/\D/g, '').slice(-10),
      }),
    onSuccess: async () => {
      invalidateOnboardingQueries(queryClient);
      await refreshUser?.();
      toast.success('Profile saved');
      onSaved?.();
    },
    onError: () => toast.error('Could not save profile'),
  });

  return (
    <Card>
      <CardContent className="p-6">
        <form
          className="space-y-4 max-w-md"
          onSubmit={form.handleSubmit((data) => saveMutation.mutate(data))}
        >
          <div className="space-y-2">
            <Label htmlFor="onb-full-name">Full name</Label>
            <Input id="onb-full-name" {...form.register('full_name')} placeholder="Your name" />
            {form.formState.errors.full_name && (
              <p className="text-sm text-destructive">{form.formState.errors.full_name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="onb-phone">Mobile phone</Label>
            <Input id="onb-phone" {...form.register('phone')} placeholder="5551234567" inputMode="tel" />
            {form.formState.errors.phone && (
              <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>
            )}
            <p className="text-xs text-muted-foreground">Used for SMS appointment reminders.</p>
          </div>
          <Button type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save profile
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
