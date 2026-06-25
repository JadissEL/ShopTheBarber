/**
 * DB smoke test (Prisma + Neon): create a user and read it back.
 * Registration is now handled by Clerk; the backend only provisions/links DB rows.
 */
import { describe, it, expect, afterAll } from 'vitest';
import { prisma } from '../db/prisma';

describe('users (Prisma DB)', () => {
    const testEmail = `register-test-${Date.now()}@example.com`;
    let testId: string;

    afterAll(async () => {
        if (testId) {
            await prisma.users.deleteMany({ where: { id: testId } });
        }
    });

    it('creates a user and can read it back by id', async () => {
        const created = await prisma.users.create({
            data: {
                email: testEmail,
                full_name: 'Test User',
                role: 'client',
                avatar_url: 'https://example.com/avatar.png',
            },
        });
        testId = created.id;
        expect(created.id).toBeTruthy();

        const user = await prisma.users.findUnique({ where: { id: testId } });
        expect(user).toBeTruthy();
        expect(user!.email).toBe(testEmail);
        expect(user!.full_name).toBe('Test User');
    });
});
