import { useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { capabilityContextFromAuth } from '@/lib/navCapabilities';

/** Resolved capability context for nav and page gates. */
export function useCapabilityContext() {
  const { role, accountType, user } = useAuth();

  return useMemo(
    () =>
      capabilityContextFromAuth({
        role,
        accountType,
        companyCommerceEnabled: user?.company_commerce_enabled === true,
      }),
    [role, accountType, user?.company_commerce_enabled],
  );
}
