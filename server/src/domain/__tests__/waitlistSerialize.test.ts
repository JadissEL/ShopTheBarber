import { describe, expect, it } from 'vitest';
import { serializeWaitlistEntry } from '../waitlist/serialize';

describe('serializeWaitlistEntry', () => {
    it('enriches entry with barber, service, and client names', () => {
        const maps = {
            barbers: new Map([
                ['b1', { id: 'b1', name: 'Marco', image_url: 'https://example.com/m.jpg' }],
            ]),
            services: new Map([
                ['s1', { id: 's1', name: 'Skin Fade', price: 35, duration_minutes: 45 }],
            ]),
            clients: new Map([
                ['c1', { id: 'c1', full_name: 'Alex Client', email: 'alex@test.com', avatar_url: null }],
            ]),
            shops: new Map([['sh1', { id: 'sh1', name: 'Downtown Cuts' }]]),
        };

        const result = serializeWaitlistEntry(
            {
                id: 'e1',
                client_id: 'c1',
                barber_id: 'b1',
                shop_id: 'sh1',
                service_id: 's1',
                slot_start: '2026-07-01T14:00:00.000Z',
                preferred_time: '2:00 PM',
                position: 2,
                status: 'pending',
            },
            maps,
            true
        );

        expect(result.barber_name).toBe('Marco');
        expect(result.service_name).toBe('Skin Fade');
        expect(result.service_price).toBe(35);
        expect(result.shop_name).toBe('Downtown Cuts');
        expect(result.client_name).toBe('Alex Client');
        expect(result.position).toBe(2);
    });

    it('falls back to email local-part for client display name', () => {
        const maps = {
            barbers: new Map(),
            services: new Map(),
            clients: new Map([
                ['c1', { id: 'c1', full_name: null, email: 'jamie@shop.com', avatar_url: null }],
            ]),
            shops: new Map(),
        };

        const result = serializeWaitlistEntry(
            {
                id: 'e1',
                client_id: 'c1',
                barber_id: null,
                shop_id: null,
                service_id: null,
                slot_start: null,
                preferred_time: null,
                position: 1,
                status: 'pending',
            },
            maps,
            true
        );

        expect(result.client_name).toBe('jamie');
    });
});
