import { describe, it, expect } from 'vitest';
import {
    parseAttestationFlag,
    effectiveLicensed,
    effectiveInsured,
    hasAnyAttestation,
} from '@/lib/providerAttestation';

describe('providerAttestation lib', () => {
    it('parseAttestationFlag only accepts true', () => {
        expect(parseAttestationFlag(true)).toBe(true);
        expect(parseAttestationFlag(false)).toBe(false);
        expect(parseAttestationFlag(null)).toBe(false);
    });

    it('effectiveLicensed and effectiveInsured merge barber and shop', () => {
        expect(effectiveLicensed(true, false)).toBe(true);
        expect(effectiveInsured(false, true)).toBe(true);
        expect(effectiveLicensed(false, false)).toBe(false);
    });

    it('hasAnyAttestation detects either badge', () => {
        expect(hasAnyAttestation(true, false)).toBe(true);
        expect(hasAnyAttestation(false, true)).toBe(true);
        expect(hasAnyAttestation(false, false)).toBe(false);
    });
});
