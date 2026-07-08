import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
    CAPABILITY_KEYS as SERVER_KEYS,
    capabilityContextFromUser,
    hasCapability,
    type CapabilityKey,
} from './capabilities';

function extractFeCapabilityKeys(): string[] {
    const fePath = join(__dirname, '../../../src/lib/capabilities.js');
    const content = readFileSync(fePath, 'utf8');
    const match = content.match(/export const CAPABILITY_KEYS = \[([\s\S]*?)\];/);
    if (!match) throw new Error('CAPABILITY_KEYS not found in src/lib/capabilities.js');
    const inner = match[1];
    return [...inner.matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

/** Sample matrix — extend when grants change. */
const GRANT_PARITY_CASES: Array<{
    label: string;
    ctx: Parameters<typeof capabilityContextFromUser>[0];
    cap: CapabilityKey;
    expected: boolean;
}> = [
    { label: 'client service.write', ctx: { role: 'client', accountType: 'client' }, cap: 'service.write', expected: false },
    { label: 'seller service.write', ctx: { role: 'seller', accountType: 'seller' }, cap: 'service.write', expected: false },
    { label: 'seller product.write', ctx: { role: 'seller', accountType: 'seller' }, cap: 'product.write', expected: true },
    { label: 'solo barber service.write', ctx: { role: 'barber', accountType: 'solo_barber' }, cap: 'service.write', expected: true },
    { label: 'company job.write', ctx: { role: 'company', accountType: 'company' }, cap: 'job.write', expected: true },
    { label: 'company product.write inactive', ctx: { role: 'company', accountType: 'company', companyCommerceEnabled: false }, cap: 'product.write', expected: false },
    { label: 'blogger article.write', ctx: { role: 'blogger', accountType: 'blogger' }, cap: 'article.write', expected: true },
    { label: 'blogger booking.provider.tools', ctx: { role: 'blogger', accountType: 'blogger' }, cap: 'booking.provider.tools', expected: false },
];

describe('capabilities FE/BE contract', () => {
    it('frontend CAPABILITY_KEYS matches backend exactly', () => {
        const feKeys = extractFeCapabilityKeys();
        expect(feKeys).toEqual([...SERVER_KEYS]);
    });

    it.each(GRANT_PARITY_CASES)('BE grant parity baseline: $label', ({ ctx, cap, expected }) => {
        expect(hasCapability(capabilityContextFromUser(ctx), cap)).toBe(expected);
    });
});
