import crypto from 'crypto';
import { addMinutes } from 'date-fns';
import { prisma } from '../../db/prisma';
import { isFinancialTrustSchemaError } from '../schemaGuard';

export const RESERVATION_TTL_MINUTES = 30;

export async function releaseExpiredReservations() {
    try {
        const now = new Date().toISOString();
        const expired = await prisma.marketplace_reservations.updateMany({
            where: { status: 'active', expires_at: { lt: now } },
            data: { status: 'expired' },
        });
        return expired.count;
    } catch (err) {
        if (isFinancialTrustSchemaError(err)) return 0;
        throw err;
    }
}

export async function getActiveReservedQuantity(productId: string, excludeUserId?: string): Promise<number> {
    await releaseExpiredReservations();
    const rows = await prisma.marketplace_reservations.findMany({
        where: {
            product_id: productId,
            status: 'active',
            expires_at: { gt: new Date().toISOString() },
            ...(excludeUserId ? { user_id: { not: excludeUserId } } : {}),
        },
        select: { quantity: true },
    });
    return rows.reduce((sum, r) => sum + (r.quantity ?? 1), 0);
}

export async function getAvailableStock(productId: string, userId?: string): Promise<number> {
    const product = await prisma.products.findUnique({
        where: { id: productId },
        select: { stock: true },
    });
    if (!product) return 0;
    const reserved = await getActiveReservedQuantity(productId, userId);
    return Math.max(0, (product.stock ?? 0) - reserved);
}

export async function createOrRefreshReservation(userId: string, productId: string, quantity: number) {
    await releaseExpiredReservations();
    const available = await getAvailableStock(productId, userId);
    if (available < quantity) {
        throw new Error('Insufficient stock — another customer may have reserved this item');
    }

    const expiresAt = addMinutes(new Date(), RESERVATION_TTL_MINUTES).toISOString();
    const existing = await prisma.marketplace_reservations.findFirst({
        where: { user_id: userId, product_id: productId, status: 'active' },
    });

    if (existing) {
        return prisma.marketplace_reservations.update({
            where: { id: existing.id },
            data: { quantity, expires_at: expiresAt },
        });
    }

    return prisma.marketplace_reservations.create({
        data: {
            id: crypto.randomUUID(),
            user_id: userId,
            product_id: productId,
            quantity,
            status: 'active',
            expires_at: expiresAt,
        },
    });
}

export async function finalizeReservationsForUser(userId: string) {
    const now = new Date().toISOString();
    const active = await prisma.marketplace_reservations.findMany({
        where: { user_id: userId, status: 'active' },
    });

    for (const reservation of active) {
        const product = await prisma.products.findUnique({
            where: { id: reservation.product_id },
            select: { stock: true },
        });
        if (!product) continue;
        const qty = reservation.quantity ?? 1;
        const newStock = Math.max(0, (product.stock ?? 0) - qty);
        await prisma.$transaction([
            prisma.products.update({
                where: { id: reservation.product_id },
                data: { stock: newStock },
            }),
            prisma.marketplace_reservations.update({
                where: { id: reservation.id },
                data: { status: 'converted', expires_at: now },
            }),
        ]);
    }
}

export async function releaseUserReservations(userId: string) {
    return prisma.marketplace_reservations.updateMany({
        where: { user_id: userId, status: 'active' },
        data: { status: 'released' },
    });
}
