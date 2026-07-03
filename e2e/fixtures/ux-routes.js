/**
 * Public route matrix for UX / a11y audit (no auth required).
 * Extend when adding marketing or guest-critical pages.
 */
export const PUBLIC_UX_ROUTES = [
  { path: '/Home', label: 'Home', expectHeading: true },
  { path: '/Explore', label: 'Explore', expectHeading: false },
  { path: '/About', label: 'About', expectHeading: true },
  { path: '/HelpCenter', label: 'Help Center', expectHeading: true },
  { path: '/Marketplace', label: 'Marketplace', expectHeading: true },
  { path: '/CareerHub', label: 'Career Hub', expectHeading: true },
  { path: '/SignIn', label: 'Sign In', expectHeading: false },
  { path: '/Blog', label: 'Blog', expectHeading: true },
  { path: '/cities', label: 'Cities Directory', expectHeading: true },
  { path: '/TermsOfService', label: 'Terms of Service', expectHeading: true },
  { path: '/GiftCards', label: 'Gift Cards', expectHeading: true },
  { path: '/ChampionshipLeaderboard', label: 'Championship', expectHeading: true },
];

/** Routes that must never show the client desktop sidebar (public marketing shell). */
export const NO_CLIENT_SIDEBAR_ROUTES = ['/Home', '/Explore', '/About', '/Marketplace', '/HelpCenter'];
