import { describe, it, expect, afterEach } from 'vitest';
import {
  AUTH_RETURN_KEY,
  stashAuthReturn,
  consumeAuthReturn,
  resolvePostAuthDestination,
} from '@/lib/authReturn';

describe('authReturn', () => {
  afterEach(() => {
    sessionStorage.clear();
  });

  it('stashAuthReturn stores path in sessionStorage', () => {
    stashAuthReturn('/BookingFlow?step=confirm');
    expect(sessionStorage.getItem(AUTH_RETURN_KEY)).toBe('/BookingFlow?step=confirm');
  });

  it('consumeAuthReturn returns stashed path once', () => {
    stashAuthReturn('/Favorites');
    expect(consumeAuthReturn('/SetupGuide')).toBe('/Favorites');
    expect(sessionStorage.getItem(AUTH_RETURN_KEY)).toBeNull();
  });

  it('resolvePostAuthDestination prefers query param over stash', () => {
    stashAuthReturn('/Favorites');
    expect(resolvePostAuthDestination('/BookingFlow?step=confirm')).toBe('/BookingFlow?step=confirm');
    expect(sessionStorage.getItem(AUTH_RETURN_KEY)).toBe('/Favorites');
  });

  it('resolvePostAuthDestination falls back to stash then default', () => {
    stashAuthReturn('/Chat');
    expect(resolvePostAuthDestination(null)).toBe('/Chat');
    expect(resolvePostAuthDestination(undefined, '/Home')).toBe('/Home');
  });
});
