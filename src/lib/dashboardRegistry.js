/**
 * Dashboard registry — maps account_type → dashboard page key (V2 spec §4.7).
 */
import { dashboardPageForAccountType } from '@/lib/accountType';

/** @typedef {'client'|'solo_barber'|'shop'|'seller'|'company'|'blogger'} AccountType */

/** @type {Record<AccountType, string>} */
export const DASHBOARD_REGISTRY = {
  client: 'Dashboard',
  solo_barber: 'ProviderDashboard',
  shop: 'ProviderDashboard',
  seller: 'SellerDashboard',
  company: 'CompanyDashboard',
  blogger: 'BloggerDashboard',
};

/** @param {string | null | undefined} accountType */
export function resolveDashboardPage(accountType) {
  if (accountType && DASHBOARD_REGISTRY[accountType]) {
    return DASHBOARD_REGISTRY[accountType];
  }
  return dashboardPageForAccountType(accountType);
}

/** @param {string | null | undefined} accountType */
export function isAdaptiveProviderDashboard(accountType) {
  return accountType === 'solo_barber' || accountType === 'shop';
}
