/**
 * Server test: auth password hashing and verification.
 * Ensures hashPassword and comparePassword work correctly.
 */
import { describe, it, expect } from 'vitest';
import { hashPassword, comparePassword } from '../auth/password';

describe('auth/password', () => {
    it('hashes a password and returns a non-empty string', async () => {
        const hash = await hashPassword('testpassword123');
        expect(hash).toBeDefined();
        expect(typeof hash).toBe('string');
        expect(hash.length).toBeGreaterThan(0);
        expect(hash).not.toBe('testpassword123');
    });

    it('comparePassword returns true for correct password', async () => {
        const password = 'securePass456';
        const hash = await hashPassword(password);
        const match = await comparePassword(password, hash);
        expect(match).toBe(true);
    });

    it('comparePassword returns false for wrong password', async () => {
        const hash = await hashPassword('correct');
        const match = await comparePassword('wrong', hash);
        expect(match).toBe(false);
    });
});
