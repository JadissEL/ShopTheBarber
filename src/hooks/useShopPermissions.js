import { useQuery } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';

/**
 * Load shop RBAC permissions for the current user.
 * @param {string | null | undefined} shopId
 */
export function useShopPermissions(shopId) {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['shop-permissions', shopId],
        queryFn: () => sovereign.shops.getMyPermissions(shopId),
        enabled: !!shopId,
        staleTime: 60_000,
    });

    const permissions = data?.permissions ?? [];
    const role = data?.role ?? null;

    const can = (permission) => permissions.includes(permission);

    return {
        role,
        permissions,
        can,
        isLoading,
        isError,
        hasFinanceView: can('finance:view'),
        hasFinanceManage: can('finance:manage'),
        hasBookingsManage: can('bookings:manage'),
        hasBookingsCheckIn: can('bookings:check_in'),
        hasStaffManage: can('staff:manage'),
        hasShopEdit: can('shop:edit'),
    };
}
