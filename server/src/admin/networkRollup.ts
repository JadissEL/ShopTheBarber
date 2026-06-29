import { prisma } from '../db/prisma';

export async function getNetworkOwnerRollup(ownerId: string) {
    const shops = await prisma.shops.findMany({
        where: { owner_id: ownerId },
        select: { id: true, name: true, city: true },
    });

    if (shops.length === 0) {
        return { shops: [], totals: { bookings: 0, revenue: 0, staff: 0, low_wallets: 0 } };
    }

    const shopIds = shops.map((s) => s.id);
    const [bookings, staff, wallets] = await Promise.all([
        prisma.bookings.findMany({
            where: { shop_id: { in: shopIds }, status: 'completed' },
            select: { shop_id: true, price_at_booking: true },
        }),
        prisma.shop_members.count({ where: { shop_id: { in: shopIds }, status: 'active' } }),
        prisma.provider_fee_wallets.findMany({
            where: { shop_id: { in: shopIds } },
            select: { shop_id: true, balance: true, health_status: true },
        }),
    ]);

    const byShop = shops.map((shop) => {
        const shopBookings = bookings.filter((b) => b.shop_id === shop.id);
        const revenue = shopBookings.reduce((s, b) => s + (b.price_at_booking ?? 0), 0);
        const wallet = wallets.find((w) => w.shop_id === shop.id);
        return {
            ...shop,
            completed_bookings: shopBookings.length,
            revenue_eur: Math.round(revenue * 100) / 100,
            wallet_balance: wallet?.balance ?? 0,
            wallet_health: wallet?.health_status ?? 'good',
        };
    });

    const totalRevenue = byShop.reduce((s, sh) => s + sh.revenue_eur, 0);
    const lowWallets = wallets.filter((w) => (w.balance ?? 0) < 20).length;

    return {
        shops: byShop,
        totals: {
            bookings: bookings.length,
            revenue: Math.round(totalRevenue * 100) / 100,
            staff,
            low_wallets: lowWallets,
        },
    };
}
