import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { useAuth } from '@/lib/AuthContext';
import { getProviderIntent } from '@/lib/bootstrapProvider';
import {
  getOnboardingSteps,
  computeStepCompletion,
  getOnboardingProgress,
  readOnboardingState,
  shouldShowOnboardingPrompt,
  resolveOnboardingRole,
  getPayoutReadyProgress,
  isPayoutReady,
  shouldShowPayoutSetupOnDashboard,
} from '@/lib/onboardingWizard';

export function useOnboardingProgress() {
  const queryClient = useQueryClient();
  const {
    user: authUser,
    role: authRole,
    syncStatus,
    syncError,
    isSignedIn,
    retrySync,
  } = useAuth();
  const providerIntent = getProviderIntent();
  const role = resolveOnboardingRole(authUser?.role, authRole, providerIntent);
  const isProviderFlow = role === 'provider' || role === 'shop_owner';
  const authReady = syncStatus === 'ready' && !!authUser?.id;

  const user = useMemo(() => {
    if (!authReady || !authUser?.id) return null;
    return authUser;
  }, [authReady, authUser]);

  const steps = useMemo(() => getOnboardingSteps(role), [role]);

  const { data: barber, refetch: refetchBarber, isLoading: barberLoading } = useQuery({
    queryKey: ['onboarding-barber', user?.email, user?.id],
    queryFn: async () => {
      if (!user) return null;
      if (user.id) {
        const byUser = await sovereign.entities.Barber.filter({ user_id: user.id });
        if (byUser.length > 0) return byUser[0];
      }
      const byEmail = await sovereign.entities.Barber.filter({ created_by: user.email });
      if (byEmail.length > 0) return byEmail[0];
      return null;
    },
    enabled: !!user?.id && isProviderFlow,
  });

  const { data: shopMembership, isLoading: membershipLoading } = useQuery({
    queryKey: ['onboarding-shop-member', barber?.id, user?.id],
    queryFn: async () => {
      if (user?.id) {
        const byUser = await sovereign.entities.ShopMember.filter({ user_id: user.id });
        const owner = byUser.find((m) => ['owner', 'manager'].includes(m.role));
        if (owner) return owner;
        if (byUser.length > 0) return byUser[0];
      }
      if (!barber?.id) return null;
      const members = await sovereign.entities.ShopMember.filter({ barber_id: barber.id });
      return members.find((m) => ['owner', 'manager'].includes(m.role)) ?? members[0] ?? null;
    },
    enabled: !!user?.id && isProviderFlow,
  });

  const shopId = shopMembership?.shop_id;

  const { data: shop, isLoading: shopLoading } = useQuery({
    queryKey: ['onboarding-shop', shopId],
    queryFn: () => (shopId ? sovereign.entities.Shop.get(shopId) : null),
    enabled: !!shopId,
  });

  const { data: services = [] } = useQuery({
    queryKey: ['onboarding-services', shopId, barber?.id],
    queryFn: async () => {
      if (shopId) return sovereign.entities.Service.filter({ shop_id: shopId });
      if (barber?.id) return sovereign.entities.Service.filter({ barber_id: barber.id });
      return [];
    },
    enabled: !!(shopId || barber?.id) && isProviderFlow,
  });

  const { data: shifts = [] } = useQuery({
    queryKey: ['onboarding-shifts', shopId, barber?.id],
    queryFn: async () => {
      if (shopId) return sovereign.entities.Shift.filter({ shop_id: shopId });
      if (barber?.id) return sovereign.entities.Shift.filter({ barber_id: barber.id });
      return [];
    },
    enabled: !!(shopId || barber?.id) && isProviderFlow,
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['onboarding-bookings', user?.email],
    queryFn: () => sovereign.entities.Booking.filter({ created_by: user.email }),
    enabled: !!user?.email && !!user?.id && role === 'client' && !providerIntent,
  });

  const completion = useMemo(
    () =>
      computeStepCompletion({
        role,
        user,
        barber,
        shop,
        servicesCount: services.length,
        shiftsCount: shifts.length,
        bookingsCount: bookings.length,
      }),
    [role, user, barber, shop, services.length, shifts.length, bookings.length],
  );

  const progress = useMemo(
    () => getOnboardingProgress(steps, completion),
    [steps, completion],
  );

  const payoutReady = useMemo(
    () => getPayoutReadyProgress(steps, completion),
    [steps, completion],
  );

  const payoutReadyComplete = useMemo(() => isPayoutReady(completion), [completion]);

  const showPayoutSetupOnDashboard = useMemo(
    () => shouldShowPayoutSetupOnDashboard(role, completion),
    [role, completion],
  );

  const storageState = user?.id ? readOnboardingState(user.id, role) : { dismissed: false };

  const showPrompt = user?.id ? shouldShowOnboardingPrompt(user.id, role, progress) : false;

  const needsProviderBootstrap =
    isProviderFlow && !!user?.id && !barber && !shopMembership && !shopId;

  const syncBlocked = syncStatus === 'error';

  const isLoading =
    (isSignedIn && !authReady && syncStatus !== 'error') ||
    (isProviderFlow &&
      !!user?.id &&
      (barberLoading || membershipLoading || (shopId ? shopLoading : false)));

  return {
    role,
    providerIntent,
    steps,
    completion,
    progress,
    payoutReady,
    payoutReadyComplete,
    showPayoutSetupOnDashboard,
    storageState,
    showPrompt,
    needsProviderBootstrap,
    isLoading,
    syncBlocked,
    syncError,
    retrySync,
    user,
    barber,
    shop,
    shopId,
    services,
    shifts,
    refetchBarber,
    refresh: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-barber'] });
      queryClient.invalidateQueries({ queryKey: ['onboarding-shop-member'] });
      queryClient.invalidateQueries({ queryKey: ['onboarding-shop'] });
      queryClient.invalidateQueries({ queryKey: ['onboarding-services'] });
      queryClient.invalidateQueries({ queryKey: ['onboarding-shifts'] });
    },
  };
}
