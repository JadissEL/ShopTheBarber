import { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import * as schema from '../db/schema';
import { authenticateRequest } from '../auth/requestUser';

async function requireUser(request: any, reply: any) {
    const ok = await authenticateRequest(request, reply);
    if (!ok) return null;
    return request.user as { id: string; email?: string; role?: string };
}

export async function privacyRoutes(fastify: FastifyInstance) {
    /** GDPR data export — aggregates user-owned rows across core tables */
    fastify.get('/api/privacy/export', async (request, reply) => {
        const user = await requireUser(request, reply);
        if (!user) return;
        const userId = user.id;

        const [userRow, bookings, favorites, messages, notifications, loyaltyProfiles, wishlist, wallet] = await Promise.all([
            db.select().from(schema.users).where(eq(schema.users.id, userId)),
            db.select().from(schema.bookings).where(eq(schema.bookings.client_id, userId)),
            db.select().from(schema.favorites).where(eq(schema.favorites.user_id, userId)),
            db.select().from(schema.messages).where(eq(schema.messages.sender_id, userId)),
            db.select().from(schema.notifications).where(eq(schema.notifications.user_id, userId)),
            db.select().from(schema.loyalty_profiles).where(eq(schema.loyalty_profiles.user_id, userId)),
            db.select().from(schema.wishlist_items).where(eq(schema.wishlist_items.user_id, userId)),
            db.select().from(schema.wallet_accounts).where(eq(schema.wallet_accounts.user_id, userId)),
        ]);

        const exportData = {
            export_info: {
                user_id: userId,
                generated_at: new Date().toISOString(),
            },
            profile: userRow[0] ?? null,
            bookings,
            favorites,
            messages,
            notifications,
            loyalty_profiles: loyaltyProfiles,
            wishlist_items: wishlist,
            wallet_accounts: wallet,
        };

        reply.header('Content-Type', 'application/json');
        reply.header('Content-Disposition', `attachment; filename="shopthebarber-export-${userId}.json"`);
        return exportData;
    });

    /** Account deletion — removes user-owned data and anonymizes profile */
    fastify.post('/api/privacy/delete-account', async (request, reply) => {
        const user = await requireUser(request, reply);
        if (!user) return;
        const userId = user.id;

        await db.delete(schema.wishlist_items).where(eq(schema.wishlist_items.user_id, userId));
        await db.delete(schema.favorites).where(eq(schema.favorites.user_id, userId));
        await db.delete(schema.notifications).where(eq(schema.notifications.user_id, userId));
        await db.delete(schema.wallet_transactions).where(eq(schema.wallet_transactions.user_id, userId));
        await db.delete(schema.wallet_accounts).where(eq(schema.wallet_accounts.user_id, userId));
        await db.delete(schema.referrals).where(eq(schema.referrals.referrer_id, userId));

        await db.update(schema.users)
            .set({
                email: `deleted-${userId}@anonymous.local`,
                full_name: 'Deleted User',
                phone: null,
                avatar_url: null,
            })
            .where(eq(schema.users.id, userId));

        return { success: true, message: 'Account scheduled for deletion. Contact support to complete Clerk account removal.' };
    });
}
