import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Scissors, Store, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  bootstrapProviderWorkspace,
  invalidateOnboardingQueries,
  getProviderIntent,
  setProviderIntent,
  clearProviderIntent,
} from '@/lib/bootstrapProvider';
import { useAuth } from '@/lib/AuthContext';
import { cn } from '@/lib/utils';

export function OnboardingProviderBootstrap({ user, onReady }) {
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();
  const storedIntent = getProviderIntent();
  const [intent, setIntent] = useState(storedIntent || 'barber');

  const bootstrapMutation = useMutation({
    mutationFn: () => bootstrapProviderWorkspace({ user, intent }),
    onSuccess: async () => {
      invalidateOnboardingQueries(queryClient);
      await refreshUser?.();
      clearProviderIntent();
      toast.success('Provider workspace created, continue with your profile');
      onReady?.();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Setup failed, try again');
    },
  });

  const selectIntent = (next) => {
    setIntent(next);
    setProviderIntent(next);
  };

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="p-6 space-y-4">
        <p className="font-semibold">Set up your professional workspace</p>
        <p className="text-sm text-muted-foreground">
          Choose how you work, then we will create your barber profile and listing.
        </p>

        <div className="grid sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => selectIntent('barber')}
            className={cn(
              'rounded-xl border p-4 text-left transition-colors',
              intent === 'barber' ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/50',
            )}
          >
            <Scissors className="w-5 h-5 text-primary mb-2" />
            <p className="font-medium text-sm">Independent barber</p>
            <p className="text-xs text-muted-foreground mt-1">Solo chair, your schedule & payouts</p>
          </button>
          <button
            type="button"
            onClick={() => selectIntent('shop')}
            className={cn(
              'rounded-xl border p-4 text-left transition-colors',
              intent === 'shop' ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/50',
            )}
          >
            <Store className="w-5 h-5 text-primary mb-2" />
            <p className="font-medium text-sm">Shop owner</p>
            <p className="text-xs text-muted-foreground mt-1">Multiple barbers & team management</p>
          </button>
        </div>

        <Button
          type="button"
          onClick={() => bootstrapMutation.mutate()}
          disabled={bootstrapMutation.isPending}
          className="w-full sm:w-auto"
        >
          {bootstrapMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : intent === 'shop' ? (
            <Store className="w-4 h-4 mr-2" />
          ) : (
            <Scissors className="w-4 h-4 mr-2" />
          )}
          Create {intent === 'shop' ? 'shop' : 'barber'} workspace
        </Button>
      </CardContent>
    </Card>
  );
}
