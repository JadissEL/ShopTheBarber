/**
 * Discovery (browse/search) vs booking flow entry points.
 * Use these for nav and marketing CTAs. BookingFlow requires a barber, shop, or service context.
 */
export const DISCOVERY_ROUTES = {
  explore: 'Explore',
  mobile: 'Explore?mobile=1',
  shop: 'Explore?shop=1',
  group: 'Explore?group=1',
  mobileGroup: 'Explore?mobile=1&group=1',
  deals: 'Explore?filter=Deals',
  cities: '/cities',
};

/**
 * BookingFlow opened with only discovery-style query params (no barber/shop/service).
 * Returns an Explore path to redirect to, or null if entry is valid.
 */
export function resolveBareBookingFlowRedirect(searchParams, ctx = {}) {
  const hasBookingTarget =
    ctx.barberId ||
    ctx.shopId ||
    ctx.serviceId ||
    ctx.serviceIds ||
    ctx.isRebook ||
    searchParams.get('fromBooking') ||
    searchParams.get('step');

  if (hasBookingTarget) return null;

  const location = searchParams.get('location');
  const group = searchParams.get('group') === '1';

  if (location === 'mobile' && group) return DISCOVERY_ROUTES.mobileGroup;
  if (location === 'mobile') return DISCOVERY_ROUTES.mobile;
  if (location === 'shop') return DISCOVERY_ROUTES.shop;
  if (group) return DISCOVERY_ROUTES.group;

  return null;
}

export function discoveryHref(path) {
  return path.startsWith('/') ? path : path;
}
