/**
 * Platform user-journey matrix — personas and critical paths.
 * Playwright specs in e2e/journeys/ implement these flows.
 */
export const JOURNEY_PERSONAS = {
  guest: 'guest',
  client: 'client',
  provider: 'provider',
  seller: 'seller',
  company: 'company',
  blogger: 'blogger',
  admin: 'admin',
  mobileClient: 'mobile-client',
  roleRbac: 'role-rbac',
} as const;

export type JourneyPersona = (typeof JOURNEY_PERSONAS)[keyof typeof JOURNEY_PERSONAS];

/** Read-only mode: no booking confirm / checkout mutations (production smoke). */
export function isJourneyReadonly(): boolean {
  return process.env.JOURNEY_READONLY === '1' || process.env.QA_JOURNEY_READONLY === '1';
}

export const GUEST_STEPS = [
  'Home loads with primary CTA',
  'Explore discovery search',
  'Guest BookingFlow entry (no Sign In redirect)',
  'Marketplace browse',
  'Help Center',
] as const;

export const CLIENT_STEPS = [
  'Dashboard loads',
  'Explore shows professionals',
  'My Bookings',
  'Wallet balance page',
  'Marketplace browse',
  'Shopping bag page',
  'Favorites',
  'BookingFlow services step',
] as const;

export const PROVIDER_STEPS = [
  'Provider dashboard',
  'Provider bookings',
  'Provider settings',
  'Provider payouts',
] as const;

export const SELLER_STEPS = [
  'Seller dashboard',
  'Seller products',
  'Seller orders',
  'Seller settings',
] as const;

export const COMPANY_STEPS = [
  'Company hub dashboard',
  'Company jobs',
  'Company applicants',
] as const;

export const BLOGGER_STEPS = [
  'Blogger dashboard',
  'Blogger articles',
  'Blogger marketplace products',
] as const;

export const ROLE_RBAC_STEPS = [
  'Seller blocked from provider settings',
  'Company blocked from provider dashboard',
  'Blogger blocked from provider settings',
] as const;

export const ADMIN_STEPS = [
  'Global financials',
  'Dispute resolution',
  'User moderation',
] as const;

export const MOBILE_CLIENT_STEPS = [
  'Mobile dashboard',
  'No client bottom nav on Explore (guest shell)',
  'Mobile wallet',
  'Mobile marketplace',
] as const;
