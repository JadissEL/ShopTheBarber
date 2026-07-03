/**
 * Pages kept in the main bundle for faster TTI on critical client paths.
 * All other pages under src/pages/ are lazy-loaded via import.meta.glob in pages.config.js.
 *
 * Aligns with featureRegistry "core" booking/discovery funnel, not every core page is eager.
 */
export const CORE_EAGER_PAGE_NAMES = new Set([
  'Home',
  'Explore',
  'Barbers',
  'BarberProfile',
  'ShopProfile',
  'BookingFlow',
  'GuestBooking',
  'SignIn',
  'SignUp',
  'Auth',
  'Dashboard',
  'UserBookings',
  'ConfirmBooking',
  'Review',
  'About',
  'Privacy',
  'TermsOfService',
  'HelpCenter',
  'StatusPage',
  'Offline',
]);

/** Routed only from App.jsx with custom paths, exclude from auto /PageName routes. */
export const CUSTOM_APP_ROUTE_PAGES = new Set([
  'CityLanding',
  'CitiesDirectory',
  'InviteLanding',
  'PlatformPricing',
  'ForSoloBarbers',
  'ForShopOwners',
  'ForNetworkAdmins',
  'PilotProgram',
  'Partners',
  'MarketplaceSellerTerms',
  'MarketplaceBuyerTerms',
]);

export function isEagerPage(pageName) {
  return CORE_EAGER_PAGE_NAMES.has(pageName);
}
