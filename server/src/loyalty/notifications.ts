import crypto from 'crypto';
import { prisma } from '../db/prisma';

export async function createLoyaltyNotification(
    userId: string,
    title: string,
    content: string,
    type: 'loyalty_earned' | 'loyalty_redeemed' | 'loyalty_tier'
): Promise<void> {
    try {
        await prisma.notifications.create({
            data: {
                id: crypto.randomUUID(),
                user_id: userId,
                title,
                content,
                type,
                is_read: false,
            },
        });
    } catch {
        // Non-blocking, points/redeem must succeed even if notification fails
    }
}
