import { describe, it, expect, afterEach } from 'vitest';
import {
  buildRebookSearchParams,
  buildRebookPath,
  canRebookBooking,
  extractServiceIdsFromBooking,
  resolveRebookContext,
  saveRebookPrefill,
  loadRebookPrefill,
  clearRebookPrefill,
  REBOOK_PREFILL_KEY,
} from '@/lib/rebook';

describe('rebook — all provider types', () => {
  afterEach(() => {
    sessionStorage.clear();
  });

  it('shop chair booking with multiple services', () => {
    const params = buildRebookSearchParams({
      id: 'b1',
      barber_id: 'barber-1',
      shop_id: 'shop-1',
      visit_type: 'shop',
      rebook_service_ids: ['s1', 's2'],
    });
    expect(params.get('barberId')).toBe('barber-1');
    expect(params.get('shopId')).toBe('shop-1');
    expect(params.get('location')).toBeNull();
    expect(params.get('serviceIds')).toBe('s1,s2');
    expect(params.get('rebook')).toBe('1');
    expect(params.get('context')).toBeNull();
  });

  it('independent barber at home (mobile)', () => {
    const params = buildRebookSearchParams({
      barber_id: 'barber-2',
      visit_type: 'mobile',
      is_at_home: true,
      rebook_service_ids: ['svc-a'],
    });
    expect(params.get('context')).toBe('independent');
    expect(params.get('location')).toBe('mobile');
    expect(params.get('serviceId')).toBe('svc-a');
    expect(params.has('shopId')).toBe(false);
  });

  it('group booking at shop', () => {
    const params = buildRebookSearchParams({
      barber_id: 'b3',
      shop_id: 's3',
      booking_type: 'group',
      party_size: 4,
      rebook_service_ids: ['x1'],
    });
    expect(params.get('group')).toBe('1');
    expect(params.get('shopId')).toBe('s3');
  });

  it('extracts service ids from service_snapshot', () => {
    const ids = extractServiceIdsFromBooking({
      service_snapshot: JSON.stringify({
        services: [{ service_id: 'a' }, { id: 'b' }],
      }),
    });
    expect(ids).toEqual(['a', 'b']);
  });

  it('resolveRebookContext for shop vs independent', () => {
    expect(resolveRebookContext({ shop_id: 's1' }).context).toBe('shop');
    expect(resolveRebookContext({ barber_id: 'b' }).context).toBe('independent');
    expect(resolveRebookContext({ visit_type: 'mobile' }).visitType).toBe('mobile');
  });

  it('canRebookBooking requires barber_id', () => {
    expect(canRebookBooking({ barber_id: 'x' })).toBe(true);
    expect(canRebookBooking({})).toBe(false);
  });

  it('saveRebookPrefill and load round-trip', () => {
    saveRebookPrefill({
      id: 'bk1',
      location_text: '123 Main St',
      client_latitude: 1.1,
      client_longitude: 2.2,
      booking_type: 'group',
      party_size: 3,
      barber_name: 'Alex',
    });
    const loaded = loadRebookPrefill();
    expect(loaded?.address).toBe('123 Main St');
    expect(loaded?.party_size).toBe(3);
    clearRebookPrefill();
    expect(sessionStorage.getItem(REBOOK_PREFILL_KEY)).toBeNull();
  });

  it('buildRebookPath', () => {
    const path = buildRebookPath({ barber_id: 'b1' }, (p) => `/App/${p}`);
    expect(path).toContain('/App/BookingFlow');
    expect(path).toContain('barberId=b1');
    expect(path).toContain('rebook=1');
  });
});
