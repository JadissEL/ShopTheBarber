import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { sovereign } from '@/api/apiClient';
import { getProviderIntent } from '@/lib/bootstrapProvider';
import { isProviderRole, resolveEffectiveRole } from '@/lib/userRole';

/**
 * Auth role + workspace inference for routing and nav (fixes client/barber mismatch).
 */
export function useEffectiveRole() {
  const { user, role: authRole, isAuthenticated, isLoadingAuth } = useAuth();
  const providerIntent = getProviderIntent();

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
    enabled: !!user?.id && isAuthenticated,
    staleTime: 30_000,
  });

  const effectiveRole = useMemo(
    () =>
      resolveEffectiveRole({
        authRole,
        barber: workspace?.barber,
        ownerMembership: workspace?.ownerMembership,
        providerIntent,
      }),
    [authRole, workspace?.barber, workspace?.ownerMembership, providerIntent],
  );

  const isProvider = isProviderRole(effectiveRole);
  const needsProviderBootstrap =
    isAuthenticated &&
    !!providerIntent &&
    !workspace?.barber &&
    !workspace?.ownerMembership &&
    isClientRole(authRole);

  return {
    authRole,
    effectiveRole,
    isProvider,
    needsProviderBootstrap,
    providerIntent,
    workspace,
    isLoading: isLoadingAuth || (!!user?.id && isAuthenticated && workspaceLoading),
  };
}

function isClientRole(role) {
  return !role || role === 'client';
}
