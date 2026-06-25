/**
 * Vitest setup: warm the Neon (test branch) compute before tests run.
 * The branch auto-suspends when idle, so the first connection can cold-start;
 * retry a lightweight query until the compute is reachable.
 */
import { beforeAll } from 'vitest';
import { prisma } from '../db/prisma';

beforeAll(async () => {
    let lastErr: unknown;
    for (let attempt = 0; attempt < 6; attempt++) {
        try {
            await prisma.$queryRaw`SELECT 1`;
            return;
        } catch (e) {
            lastErr = e;
            await new Promise((r) => setTimeout(r, 3000));
        }
    }
    throw lastErr;
}, 30000);
