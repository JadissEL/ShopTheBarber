import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { CAPABILITY_KEYS as SERVER_KEYS } from './capabilities';

function extractFeCapabilityKeys(): string[] {
    const fePath = join(__dirname, '../../../src/lib/capabilities.js');
    const content = readFileSync(fePath, 'utf8');
    const match = content.match(/export const CAPABILITY_KEYS = \[([\s\S]*?)\];/);
    if (!match) throw new Error('CAPABILITY_KEYS not found in src/lib/capabilities.js');
    const inner = match[1];
    return [...inner.matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

describe('capabilities FE/BE contract', () => {
    it('frontend CAPABILITY_KEYS matches backend exactly', () => {
        const feKeys = extractFeCapabilityKeys();
        expect(feKeys).toEqual([...SERVER_KEYS]);
    });
});
