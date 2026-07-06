import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { sovereign } from '@/api/apiClient';
import {
  isAdminRole,
  isProviderRole,
  isProviderAccountType,
  resolveEffectiveRole,
  resolveAccountType,
  canAccessBookingProviderTools,
} from '@/lib/userRole';

/**
 * Auth account type + workspace for routing and nav.
 */
export function useEffectiveRole() {
  const { user, role: authRole, accountType: authAccountType, isAuthenticated, isLoadingAuth } = useAuth();

  const accountType = resolveAccountType(authAccountType, authRole);

  const { data: workspace, isLoading: workspaceLoading } = useQuery({
    queryKey: ['provider-workspace', user?.id],
    queryFn: async () => {
      const [barbers, members] = await Promise.all([
        sovereign.entities.Barber.filter({ user_id: user.id }),
        sovereign.entities.ShopMember.filter({ user_id: user.id }),
      ]);
      const barber = barbers[0] ?? null;
      const ownerMembership = members.some(
        (m) => m.role === 'owner' && m.status !== 'inactive',
      );
      return { barber, ownerMembership, members };
    },
    enabled: !!user?.id && isAuthenticated && isProviderAccountType(accountType),
    staleTime: 30_000,
  });

  const effectiveRole = useMemo(
    () =>
      resolveEffectiveRole({
        accountType,
        authRole,
        barber: workspace?.barber,
        ownerMembership: workspace?.ownerMembership,
      }),
    [accountType, authRole, workspace?.barber, workspace?.ownerMembership],
  );

  const isAdmin = isAdminRole(effectiveRole);
  const isProvider = isProviderRole(effectiveRole) || isProviderAccountType(accountType);
  const isBookingProvider = canAccessBookingProviderTools(accountType);

  return {
    authRole,
    accountType,
    effectiveRole,
    isAdmin,
    isProvider,
    isBookingProvider,
    workspace,
    isLoading: isLoadingAuth || (!!user?.id && isAuthenticated && isProviderAccountType(accountType) && workspaceLoading),
  };
}
