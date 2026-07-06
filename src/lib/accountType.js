/**
 * Canonical account types — must match server/src/auth/accountType.ts
 */

export const ACCOUNT_TYPES = [
  'client',
  'solo_barber',
  'shop',
  'seller',
  'company',
  'blogger',
];

const ACCOUNT_TYPE_SET = new Set(ACCOUNT_TYPES);

/** @param {string | null | undefined} value */
export function isAccountType(value) {
  return !!value && ACCOUNT_TYPE_SET.has(value);
}

/** @typedef {'client'|'solo_barber'|'shop'|'seller'|'company'|'blogger'} AccountType */

export const ACCOUNT_TYPE_CARDS = [
  {
    id: 'client',
    title: 'Client',
    subtitle: 'Book beauty services',
    description: 'Discover barbers, book appointments, shop the marketplace, and earn rewards.',
    benefits: ['Book appointments', 'Reviews & favorites', 'Marketplace & gift cards'],
    features: ['Explore', 'Championships', 'Refer & Earn', 'Loyalty'],
    cta: 'Continue as client',
  },
  {
    id: 'solo_barber',
    title: 'Solo Barber',
    subtitle: 'Independent professional',
    description: 'Run your chair, calendar, clients, and earnings — with optional marketplace sales.',
    benefits: ['Calendar & bookings', 'Client CRM', 'Payouts & analytics'],
    features: ['Services & pricing', 'Blog & jobs', 'Marketplace seller'],
    cta: 'Continue as solo barber',
  },
  {
    id: 'shop',
    title: 'Shop',
    subtitle: 'Multi-chair business',
    description: 'Manage staff, schedules, shop analytics, and operations across your location(s).',
    benefits: ['Team roster', 'Staff scheduling', 'Shop analytics'],
    features: ['Everything in Solo Barber', 'Multi-chair ops', 'Manager tools'],
    cta: 'Continue as shop',
  },
  {
    id: 'seller',
    title: 'Seller',
    subtitle: 'Products only',
    description: 'Sell grooming products on the marketplace without offering appointment bookings.',
    benefits: ['Product catalog', 'Orders & shipping', 'Seller analytics'],
    features: ['No appointment system', 'Marketplace focus', 'Blog & jobs'],
    cta: 'Continue as seller',
  },
  {
    id: 'company',
    title: 'Company',
    subtitle: 'Beauty industry employer',
    description: 'Build your employer brand, post jobs, and manage candidates — no chair bookings.',
    benefits: ['Company profile', 'Job posting', 'Candidate pipeline'],
    features: ['Recruitment hub', 'Employer branding', 'Product sales'],
    cta: 'Continue as company',
  },
  {
    id: 'blogger',
    title: 'Blogger',
    subtitle: 'Content creator',
    description: 'Publish articles, grow your audience, and shop — with full client booking abilities.',
    benefits: ['Publish articles', 'Author profile', 'Community reach'],
    features: ['Client booking', 'Content analytics', 'Marketplace seller'],
    cta: 'Continue as blogger',
  },
];

/** @param {string | null | undefined} accountType */
export function platformRoleForAccountType(accountType) {
  switch (accountType) {
    case 'solo_barber':
      return 'barber';
    case 'shop':
      return 'shop_owner';
    case 'seller':
      return 'seller';
    case 'company':
      return 'company';
    case 'blogger':
      return 'blogger';
    default:
      return 'client';
  }
}

/** @param {string | null | undefined} accountType */
export function isBookingProviderAccountType(accountType) {
  return accountType === 'solo_barber' || accountType === 'shop';
}

/** @param {string | null | undefined} accountType */
export function isProviderShellAccountType(accountType) {
  return accountType === 'solo_barber' || accountType === 'shop';
}

/** @param {string | null | undefined} accountType */
export function isClientCapabilitiesAccountType(accountType) {
  return accountType === 'client' || accountType === 'blogger';
}

/** @param {string | null | undefined} accountType */
export function dashboardPageForAccountType(accountType) {
  switch (accountType) {
    case 'solo_barber':
    case 'shop':
      return 'ProviderDashboard';
    case 'seller':
      return 'SellerDashboard';
    case 'company':
      return 'CompanyDashboard';
    case 'blogger':
      return 'BloggerDashboard';
    default:
      return 'Dashboard';
  }
}

/** @param {string | null | undefined} role */
export function accountTypeFromRole(role) {
  if (role === 'barber') return 'solo_barber';
  if (role === 'shop_owner') return 'shop';
  if (role === 'seller') return 'seller';
  if (role === 'company') return 'company';
  if (role === 'blogger') return 'blogger';
  return 'client';
}
