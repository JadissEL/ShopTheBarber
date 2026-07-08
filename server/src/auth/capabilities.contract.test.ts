import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import {
    CAPABILITY_KEYS as SERVER_KEYS,
    capabilityContextFromUser as beContext,
    hasCapability as beHasCapability,
} from './capabilities';

const require = createRequire(import.meta.url);
const feCaps = require(join(dirname(fileURLToPath(import.meta.url)), '../../../src/lib/capabilities.js'));

function extractFeCapabilityKeys(): string[] {
    return [...feCaps.CAPABILITY_KEYS];
}

/** Representative contexts — legacy role-only + canonical account_type. */
const PARITY_CONTEXTS: Array<{
    label: string;
    ctx: Parameters<typeof beContext>[0];
}> = [
    { label: 'client', ctx: { role: 'client', accountType: 'client' } },
    { label: 'solo_barber', ctx: { role: 'barber', accountType: 'solo_barber' } },
    { label: 'shop', ctx: { role: 'shop_owner', accountType: 'shop' } },
    { label: 'seller', ctx: { role: 'seller', accountType: 'seller' } },
    { label: 'company commerce off', ctx: { role: 'company', accountType: 'company', companyCommerceEnabled: false } },
    { label: 'company commerce on', ctx: { role: 'company', accountType: 'company', companyCommerceEnabled: true } },
    { label: 'blogger', ctx: { role: 'blogger', accountType: 'blogger' } },
    { label: 'admin', ctx: { role: 'admin', accountType: 'client' } },
    { label: 'legacy barber role only', ctx: { role: 'barber' } },
    { label: 'legacy shop_owner role only', ctx: { role: 'shop_owner' } },
];

describe('capabilities FE/BE contract', () => {
    it('frontend CAPABILITY_KEYS matches backend exactly', () => {
        const feKeys = extractFeCapabilityKeys();
        expect(feKeys).toEqual([...SERVER_KEYS]);
    });

    it.each(PARITY_CONTEXTS)('grant parity for all keys: $label', ({ ctx }) => {
        const beCtx = beContext(ctx);
        const feCtx = feCaps.capabilityContextFromUser(ctx);
        for (const key of SERVER_KEYS) {
            expect(feCaps.hasCapability(feCtx, key)).toBe(beHasCapability(beCtx, key));
        }
    });
});
