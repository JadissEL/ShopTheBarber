import { describe, it, expect } from 'vitest';
import {
  DISCOVERY_ROUTES,
  resolveBareBookingFlowRedirect,
} from './discoveryRoutes';

describe('discoveryRoutes', () => {
  it('maps bare mobile booking URL to Explore mobile filter', () => {
    const params = new URLSearchParams('location=mobile');
    expect(resolveBareBookingFlowRedirect(params, {})).toBe(DISCOVERY_ROUTES.mobile);
  });

  it('maps bare group booking URL to Explore group filter', () => {
    const params = new URLSearchParams('group=1');
    expect(resolveBareBookingFlowRedirect(params, {})).toBe(DISCOVERY_ROUTES.group);
  });

  it('allows booking flow when barber is selected', () => {
    const params = new URLSearchParams('location=mobile&barberId=abc');
    expect(
      resolveBareBookingFlowRedirect(params, { barberId: 'abc' })
    ).toBeNull();
  });

  it('allows booking flow for rebook entry', () => {
    const params = new URLSearchParams('rebook=1&fromBooking=x');
    expect(
      resolveBareBookingFlowRedirect(params, { isRebook: true })
    ).toBeNull();
  });
});
