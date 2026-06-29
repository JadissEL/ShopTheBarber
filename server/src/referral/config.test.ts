import { describe, it, expect } from 'vitest';
import { REFERRAL_PROGRAMS, resolveProgramType, programForRole } from './config';

describe('referral config', () => {
    it('resolves client-to-client as client_b2c', () => {
        expect(resolveProgramType('client', 'client')).toBe('client_b2c');
    });

    it('resolves barber inviting client as provider_client', () => {
        expect(resolveProgramType('barber', 'client')).toBe('provider_client');
    });

    it('resolves pro-to-pro as pro_b2b', () => {
        expect(resolveProgramType('shop_owner', 'barber')).toBe('pro_b2b');
    });

    it('programForRole returns client program for clients', () => {
        const programs = programForRole('client');
        expect(programs).toHaveLength(1);
        expect(programs[0].type).toBe('client_b2c');
    });

    it('programForRole returns provider programs for barbers', () => {
        const programs = programForRole('barber');
        expect(programs.map((p) => p.type)).toEqual(['provider_client', 'pro_b2b']);
    });

    it('all programs define referrer and referee benefits', () => {
        for (const cfg of Object.values(REFERRAL_PROGRAMS)) {
            expect(cfg.referrer_benefit.length).toBeGreaterThan(5);
            expect(cfg.referee_benefit.length).toBeGreaterThan(5);
        }
    });
});
