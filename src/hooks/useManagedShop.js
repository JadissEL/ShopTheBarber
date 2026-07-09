import { useQuery } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { useAuth } from '@/lib/AuthContext';

/**
 * Resolves the current provider's managed shop (owner or manager).
 * Uses AuthContext (Clerk + backend sync) — not a raw auth.me() query that races on load.
 */
export function useManagedShop() {
  const { user, isLoadingAuth, isSignedIn } = useAuth();

  const { data: barber, isLoading: barberLoading } = useQuery({
    queryKey: ['my-barber-profile', user?.email, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const byEmail = await sovereign.entities.Barber.filter({ created_by: user.email });
      if (byEmail.length > 0) return byEmail[0];
      if (user.id) {
        const byUserId = await sovereign.entities.Barber.filter({ user_id: user.id });
        if (byUserId.length > 0) return byUserId[0];
      }
      return null;
    },
    enabled: !!user?.id,
  });

  const { data: membership, isLoading: memberLoading } = useQuery({
    queryKey: ['my-shop-membership', barber?.id, user?.id],
    queryFn: async () => {
      if (user?.id) {
        const byUser = await sovereign.entities.ShopMember.filter({ user_id: user.id });
        const managed = byUser.find((m) => ['owner', 'manager'].includes(m.role));
        if (managed) return managed;
      }
      if (barber?.id) {
        const byBarber = await sovereign.entities.ShopMember.filter({ barber_id: barber.id });
        return byBarber.find((m) => ['owner', 'manager'].includes(m.role)) ?? null;
      }
      return null;
    },
    enabled: !!(user?.id || barber?.id),
  });

  const { data: staffMembership, isLoading: staffMemberLoading } = useQuery({
    queryKey: ['my-staff-membership', barber?.id, user?.id],
    queryFn: async () => {
      if (user?.id) {
        const byUser = await sovereign.entities.ShopMember.filter({ user_id: user.id });
        const staff = byUser.find((m) => m.status === 'active' || m.status == null);
        if (staff) return staff;
      }
      if (barber?.id) {
        const byBarber = await sovereign.entities.ShopMember.filter({ barber_id: barber.id });
        return byBarber.find((m) => m.status === 'active' || m.status == null) ?? null;
      }
      return null;
    },
    enabled: !!(user?.id || barber?.id),
  });

  const shopId = membership?.shop_id ?? staffMembership?.shop_id ?? barber?.shop_id ?? null;

  const { data: shop, isLoading: shopLoading } = useQuery({
    queryKey: ['my-shop', shopId],
    queryFn: () => (shopId ? sovereign.entities.Shop.get(shopId) : null),
    enabled: !!shopId,
  });

  const isManager = !!membership && ['owner', 'manager'].includes(membership.role);

  return {
    user,
    barber,
    shop,
    shopId,
    membership,
    isManager,
    isSignedIn,
    isLoadingAuth,
    isLoading:
      isLoadingAuth ||
      (!!user && (barberLoading || memberLoading || staffMemberLoading || shopLoading)),
  };
}
