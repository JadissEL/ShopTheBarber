import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sovereign } from '@/api/apiClient';

describe('sovereign entity client HTTP contract', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });
  afterEach(() => vi.restoreAllMocks());

  it('list() requests GET with limit, offset, and order query params', async () => {
    global.fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });

    await sovereign.entities.Barber.list('-created_at', 50, 10);

    const [url] = global.fetch.mock.calls[0];
    expect(String(url)).toContain('/api/barbers');
    expect(String(url)).toContain('limit=50');
    expect(String(url)).toContain('offset=10');
    expect(String(url)).toContain(encodeURIComponent('-created_at'));
  });

  it('filter() POSTs criteria, order, limit, and offset', async () => {
    global.fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });

    await sovereign.entities.Notification.filter({ user_id: 'u1' }, '-created_at', 20, 0);

    const [url, init] = global.fetch.mock.calls[0];
    expect(String(url)).toContain('/api/notifications/filter');
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body);
    expect(body.query).toEqual({ user_id: 'u1' });
    expect(body.order).toBe('-created_at');
    expect(body.limit).toBe(20);
    expect(body.offset).toBe(0);
  });

  it('public.getActivePromotions() uses BASE_URL and optional barber_id', async () => {
    global.fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ shop_ids: [], has_platform_promos: false }) });

    await sovereign.public.getActivePromotions();

    expect(global.fetch.mock.calls[0][0]).toContain('/api/public/active-promotions');

    global.fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });
    await sovereign.public.getActivePromotions('b42');
    expect(String(global.fetch.mock.calls[1][0])).toContain('barber_id=b42');
  });
});
