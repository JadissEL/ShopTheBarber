import { prisma } from '../db/prisma';
import { getBarberShopIdsForUser } from '../entityScope';

const PRO_ROLES = new Set(['barber', 'shop_owner', 'provider', 'admin']);

export async function assertBookingParticipant(bookingId: string, userId: string): Promise<void> {
    const booking = await prisma.bookings.findUnique({
        where: { id: bookingId },
        select: { client_id: true, barber_id: true, shop_id: true },
    });
    if (!booking) throw new Error('Booking not found');

    if (booking.client_id === userId) return;

    const { barberIds, shopIds } = await getBarberShopIdsForUser(userId);
    if (barberIds.includes(booking.barber_id)) return;
    if (booking.shop_id && shopIds.includes(booking.shop_id)) return;

    const user = await prisma.users.findUnique({ where: { id: userId }, select: { role: true } });
    if (user?.role === 'admin') return;

    throw new Error('You do not have access to this booking');
}

export async function assertCanMessage(
    senderId: string,
    receiverId: string,
    bookingId?: string | null
): Promise<void> {
    if (senderId === receiverId) throw new Error('Cannot message yourself');

    const receiver = await prisma.users.findUnique({
        where: { id: receiverId },
        select: { id: true, role: true },
    });
    if (!receiver) throw new Error('Contact not found');

    if (bookingId) {
        await assertBookingParticipant(bookingId, senderId);
        await assertBookingParticipant(bookingId, receiverId);
        return;
    }

    const existing = await prisma.messages.findFirst({
        where: {
            OR: [
                { sender_id: senderId, receiver_id: receiverId },
                { sender_id: receiverId, receiver_id: senderId },
            ],
        },
        select: { id: true },
    });
    if (existing) return;

    const sender = await prisma.users.findUnique({
        where: { id: senderId },
        select: { role: true },
    });
    const senderRole = sender?.role ?? 'client';
    const receiverRole = receiver.role ?? 'client';

    if (PRO_ROLES.has(receiverRole)) return;
    if (PRO_ROLES.has(senderRole)) {
        const { barberIds, shopIds } = await getBarberShopIdsForUser(senderId);
        const shared = await prisma.bookings.findFirst({
            where: {
                client_id: receiverId,
                OR: [
                    ...(barberIds.length ? [{ barber_id: { in: barberIds } }] : []),
                    ...(shopIds.length ? [{ shop_id: { in: shopIds } }] : []),
                ],
            },
            select: { id: true },
        });
        if (shared) return;
    }

    throw new Error('You can message grooming professionals, or clients you have appointments with');
}
