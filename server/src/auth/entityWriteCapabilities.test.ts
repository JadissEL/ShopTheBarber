import { describe, it, expect } from 'vitest';
import { canWriteEntity } from './entityWriteCapabilities';
import { capabilityContextFromUser } from './capabilities';

describe('entityWriteCapabilities', () => {
    it('blocks client from writing services', () => {
        const ctx = capabilityContextFromUser({ role: 'client', accountType: 'client' });
        expect(canWriteEntity('service', ctx)).toBe(false);
    });

    it('allows solo barber to write services', () => {
        const ctx = capabilityContextFromUser({ role: 'barber', accountType: 'solo_barber' });
        expect(canWriteEntity('service', ctx)).toBe(true);
    });

    it('blocks seller from writing barber profiles', () => {
        const ctx = capabilityContextFromUser({ role: 'seller', accountType: 'seller' });
        expect(canWriteEntity('barber', ctx)).toBe(false);
    });

    it('allows shop to manage staff', () => {
        const ctx = capabilityContextFromUser({ role: 'shop_owner', accountType: 'shop' });
        expect(canWriteEntity('shop_member', ctx)).toBe(true);
    });

    it('allows blogger to write inspiration posts via article.write', () => {
        const ctx = capabilityContextFromUser({ role: 'blogger', accountType: 'blogger' });
        expect(canWriteEntity('inspiration_post', ctx)).toBe(true);
    });
});
