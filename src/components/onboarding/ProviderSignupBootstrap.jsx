import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/lib/AuthContext';
import { useEffectiveRole } from '@/hooks/useEffectiveRole';
import {
  bootstrapProviderWorkspace,
  invalidateOnboardingQueries,
  clearProviderIntent,
} from '@/lib/bootstrapProvider';

/**
 * Auto-provision barber/shop workspace when user signed up as a provider but role is still client.
 */
export default function ProviderSignupBootstrap() {
  const queryClient = useQueryClient();
  const { user, refreshUser, isAuthenticated } = useAuth();
  const { needsProviderBootstrap, providerIntent, isLoading } = useEffectiveRole();
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user?.id || !needsProviderBootstrap) return;
    if (attemptedRef.current) return;
    attemptedRef.current = true;

    void bootstrapProviderWorkspace({
      user,
      intent: providerIntent || 'barber',
    })
      .then(async () => {
        invalidateOnboardingQueries(queryClient);
        await refreshUser?.();
        clearProviderIntent();
      })
      .catch((err) => {
        attemptedRef.current = false;
        toast.error(
          err instanceof Error ? err.message : 'Could not create your provider workspace',
        );
      });
  }, [
    isLoading,
    isAuthenticated,
    user,
    needsProviderBootstrap,
    providerIntent,
    queryClient,
    refreshUser,
  ]);

  return null;
}
