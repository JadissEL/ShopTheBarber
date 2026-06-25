/**
 * Prisma client for Neon PostgreSQL (production).
 * Runtime queries still use Drizzle (`db` from ./index) for compatibility;
 * Prisma owns schema migrations on Postgres via `prisma migrate deploy`.
 */
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}
