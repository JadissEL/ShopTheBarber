import { type FastifyInstance } from 'fastify';
import { prisma } from '../db/prisma';
import { authenticateRequest } from '../auth/requestUser';

async function requireUser(request: any, reply: any) {
    const ok = await authenticateRequest(request, reply);
    if (!ok) return null;
    return request.user as { id: string; email?: string; role?: string };
}

export async function privacyRoutes(fastify: FastifyInstance) {
    /** GDPR data export, aggregates user-owned rows across core tables */
    fastify.get('/api/privacy/export', async (request, reply) => {
        const user = await requireUser(request, reply);
        if (!user) return;
        const userId = user.id;

        const [userRow, bookings, favorites, messages, notifications, loyaltyProfiles, wishlist, wallet, productAnalyticsEvents] = await Promise.all([
            prisma.users.findMany({ where: { id: userId } }),
            prisma.bookings.findMany({ where: { client_id: userId } }),
            prisma.favorites.findMany({ where: { user_id: userId } }),
            prisma.messages.findMany({ where: { sender_id: userId } }),
            prisma.notifications.findMany({ where: { user_id: userId } }),
            prisma.loyalty_profiles.findMany({ where: { user_id: userId } }),
            prisma.wishlist_items.findMany({ where: { user_id: userId } }),
            prisma.wallet_accounts.findMany({ where: { user_id: userId } }),
            prisma.product_analytics_events.findMany({ where: { user_id: userId } }),
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
            product_analytics_events: productAnalyticsEvents,
        };

        reply.header('Content-Type', 'application/json');
        reply.header('Content-Disposition', `attachment; filename="shopthebarber-export-${userId}.json"`);
        return exportData;
    });

    /** Account deletion, removes user-owned data and anonymizes profile */
    fastify.post('/api/privacy/delete-account', async (request, reply) => {
        const user = await requireUser(request, reply);
        if (!user) return;
        const userId = user.id;

        await prisma.wishlist_items.deleteMany({ where: { user_id: userId } });
        await prisma.favorites.deleteMany({ where: { user_id: userId } });
        await prisma.notifications.deleteMany({ where: { user_id: userId } });
        await prisma.wallet_transactions.deleteMany({ where: { user_id: userId } });
        await prisma.wallet_accounts.deleteMany({ where: { user_id: userId } });
        await prisma.referrals.deleteMany({ where: { referrer_id: userId } });
        await prisma.product_analytics_events.deleteMany({ where: { user_id: userId } });

        await prisma.users.update({
            where: { id: userId },
            data: {
                email: `deleted-${userId}@anonymous.local`,
                full_name: 'Deleted User',
                phone: null,
                avatar_url: null,
            },
        });

        return { success: true, message: 'Account scheduled for deletion. Contact support to complete Clerk account removal.' };
    });
}
