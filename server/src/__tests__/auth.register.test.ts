/**
 * Integration test: register flow (insert user and fetch).
 * Uses the same DB and schema as the real API.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '../db';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '../auth/password';

describe('auth/register (DB)', () => {
    const testEmail = `register-test-${Date.now()}@example.com`;
    const testId = crypto.randomUUID();

    afterAll(async () => {
        await db.delete(schema.users).where(eq(schema.users.id, testId));
    });

    it('inserts user with explicit id and can select by id', async () => {
        const hashedPassword = await hashPassword('password123');
        await db.insert(schema.users).values({
            id: testId,
            email: testEmail,
            password_hash: hashedPassword,
            full_name: 'Test User',
            role: 'client',
            phone: null,
            avatar_url: 'https://example.com/avatar.png'
        });

        const [user] = await db.select().from(schema.users).where(eq(schema.users.id, testId));
        expect(user).toBeDefined();
        expect(user!.id).toBe(testId);
        expect(user!.email).toBe(testEmail);
        expect(user!.full_name).toBe('Test User');
    });
});
