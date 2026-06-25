/**
 * Prisma Client — the single runtime data layer for ShopTheBarber.
 * Backed by Neon PostgreSQL (the only database). In tests (`NODE_ENV=test`)
 * it routes to the isolated Neon test branch via `TEST_DATABASE_URL` when set.
 */
import '../loadEnv';
import { PrismaClient } from '@prisma/client';

const databaseUrl =
    process.env.NODE_ENV === 'test' && process.env.TEST_DATABASE_URL
        ? process.env.TEST_DATABASE_URL
        : process.env.DATABASE_URL;

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        ...(databaseUrl ? { datasources: { db: { url: databaseUrl } } } : {}),
        log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}
