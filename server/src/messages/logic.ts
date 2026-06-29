import { addMinutes, format, parseISO } from 'date-fns';
import { prisma } from '../db/prisma';
import { validateBooking } from '../logic/booking';
import { assertBookingParticipant, assertCanMessage } from './access';
import { publishToUsers } from './events';

export type MessageDto = {
    id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    booking_id: string | null;
    message_type: string;
    metadata: Record<string, unknown> | null;
    is_read: boolean;
    created_at: string | null;
};

function parseMetadata(raw: string | null | undefined): Record<string, unknown> | null {
    if (!raw) return null;
    try {
        return JSON.parse(raw) as Record<string, unknown>;
    } catch {
        return null;
    }
}

function serializeMessage(row: {
    id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    booking_id?: string | null;
    message_type?: string | null;
    metadata?: string | null;
    is_read?: boolean | null;
    created_at?: string | null;
}): MessageDto {
    return {
        id: row.id,
        sender_id: row.sender_id,
        receiver_id: row.receiver_id,
        content: row.content,
        booking_id: row.booking_id ?? null,
        message_type: row.message_type ?? 'text',
        metadata: parseMetadata(row.metadata),
        is_read: row.is_read ?? false,
        created_at: row.created_at ?? null,
    };
}

export async function resolveContactUserId(params: {
    user_id?: string;
    barber_id?: string;
    shop_id?: string;
}): Promise<{ user_id: string; display_name: string; role: string; avatar_url: string | null }> {
    if (params.user_id) {
        const u = await prisma.users.findUnique({
            where: { id: params.user_id },
            select: { id: true, full_name: true, role: true, avatar_url: true },
        });
        if (!u) throw new Error('User not found');
        return {
            user_id: u.id,
            display_name: u.full_name ?? 'User',
            role: u.role ?? 'client',
            avatar_url: u.avatar_url,
        };
    }

    if (params.barber_id) {
        const barber = await prisma.barbers.findUnique({
            where: { id: params.barber_id },
            select: { user_id: true, name: true, image_url: true },
        });
        if (!barber?.user_id) throw new Error('Barber is not linked to a user account');
        const u = await prisma.users.findUnique({
            where: { id: barber.user_id },
            select: { id: true, full_name: true, role: true, avatar_url: true },
        });
        if (!u) throw new Error('Barber user not found');
        return {
            user_id: u.id,
            display_name: barber.name || u.full_name || 'Barber',
            role: u.role ?? 'barber',
            avatar_url: u.avatar_url ?? barber.image_url,
        };
    }

    if (params.shop_id) {
        const shop = await prisma.shops.findUnique({
            where: { id: params.shop_id },
            select: { owner_id: true, name: true, logo_url: true },
        });
        if (!shop?.owner_id) throw new Error('Shop owner not found');
        const u = await prisma.users.findUnique({
            where: { id: shop.owner_id },
            select: { id: true, full_name: true, role: true, avatar_url: true },
        });
        if (!u) throw new Error('Shop owner user not found');
        return {
            user_id: u.id,
            display_name: shop.name || u.full_name || 'Shop',
            role: u.role ?? 'shop_owner',
            avatar_url: u.avatar_url ?? shop.logo_url ?? null,
        };
    }

    throw new Error('Provide user_id, barber_id, or shop_id');
}

export async function getMessageThreads(userId: string) {
    const rows = await prisma.messages.findMany({
        where: { OR: [{ sender_id: userId }, { receiver_id: userId }] },
        orderBy: { created_at: 'desc' },
        take: 500,
    });

    const threadMap = new Map<
        string,
        { contact_id: string; last_message: MessageDto; unread: number; booking_id: string | null }
    >();

    for (const row of rows) {
        if (row.message_type === 'support' || row.support_ticket_id) continue;
        const contactId = row.sender_id === userId ? row.receiver_id : row.sender_id;
        if (threadMap.has(contactId)) {
            const t = threadMap.get(contactId)!;
            if (row.receiver_id === userId && !row.is_read) t.unread += 1;
            continue;
        }
        threadMap.set(contactId, {
            contact_id: contactId,
            last_message: serializeMessage(row),
            unread: row.receiver_id === userId && !row.is_read ? 1 : 0,
            booking_id: row.booking_id ?? null,
        });
    }

    const contactIds = [...threadMap.keys()];
    if (contactIds.length === 0) return [];

    const users = await prisma.users.findMany({
        where: { id: { in: contactIds } },
        select: { id: true, full_name: true, role: true, avatar_url: true },
    });
    const userById = new Map(users.map((u) => [u.id, u]));

    return [...threadMap.values()]
        .map((t) => {
            const u = userById.get(t.contact_id);
            return {
                contact_user_id: t.contact_id,
                full_name: u?.full_name ?? 'User',
                role: u?.role ?? 'client',
                avatar_url: u?.avatar_url ?? null,
                last_message: t.last_message,
                unread_count: t.unread,
                booking_id: t.booking_id,
            };
        })
        .sort(
            (a, b) =>
                new Date(b.last_message.created_at ?? 0).getTime() -
                new Date(a.last_message.created_at ?? 0).getTime()
        );
}

export async function getThreadMessages(
    userId: string,
    contactUserId: string,
    bookingId?: string | null
): Promise<MessageDto[]> {
    await assertCanMessage(userId, contactUserId, bookingId);

    const where: Record<string, unknown> = {
        OR: [
            { sender_id: userId, receiver_id: contactUserId },
            { sender_id: contactUserId, receiver_id: userId },
        ],
    };
    if (bookingId) where.booking_id = bookingId;

    const rows = await prisma.messages.findMany({
        where,
        orderBy: { created_at: 'asc' },
        take: 200,
    });

    await prisma.messages.updateMany({
        where: { sender_id: contactUserId, receiver_id: userId, is_read: false },
        data: { is_read: true },
    });

    publishToUsers([userId], { type: 'read', contact_user_id: contactUserId });

    return rows.map(serializeMessage);
}

export async function sendMessage(input: {
    sender_id: string;
    receiver_id: string;
    content: string;
    booking_id?: string | null;
    message_type?: string;
    metadata?: Record<string, unknown> | null;
}): Promise<MessageDto> {
    const content = input.content?.trim();
    if (!content) throw new Error('Message content is required');

    await assertCanMessage(input.sender_id, input.receiver_id, input.booking_id ?? null);

    const row = await prisma.messages.create({
        data: {
            id: crypto.randomUUID(),
            sender_id: input.sender_id,
            receiver_id: input.receiver_id,
            content,
            booking_id: input.booking_id ?? null,
            message_type: input.message_type ?? 'text',
            metadata: input.metadata ? JSON.stringify(input.metadata) : null,
            is_read: false,
        },
    });

    const dto = serializeMessage(row);
    publishToUsers([input.sender_id, input.receiver_id], {
        type: 'message',
        contact_user_id: input.receiver_id,
        booking_id: input.booking_id ?? null,
    });
    publishToUsers([input.sender_id, input.receiver_id], {
        type: 'message',
        contact_user_id: input.sender_id,
        booking_id: input.booking_id ?? null,
    });

    await prisma.notifications.create({
        data: {
            id: crypto.randomUUID(),
            user_id: input.receiver_id,
            title: 'New message',
            content: content.slice(0, 120),
            type: 'chat_message',
            is_read: false,
        },
    });

    return dto;
}

export async function getBookingChatContext(bookingId: string, userId: string) {
    await assertBookingParticipant(bookingId, userId);

    const booking = await prisma.bookings.findUnique({
        where: { id: bookingId },
        include: {
            barber: { select: { id: true, name: true, user_id: true, image_url: true } },
            client: { select: { id: true, full_name: true, avatar_url: true } },
            shop: { select: { id: true, name: true } },
        },
    });
    if (!booking) throw new Error('Booking not found');

    const start = booking.start_time ? parseISO(booking.start_time) : null;
    return {
        booking_id: booking.id,
        status: booking.status,
        start_time: booking.start_time,
        end_time: booking.end_time,
        date_text: start ? format(start, 'PPP') : null,
        time_text: start ? format(start, 'h:mm a') : null,
        service_name: booking.service_name,
        barber_id: booking.barber_id,
        barber_name: booking.barber?.name,
        barber_user_id: booking.barber?.user_id,
        client_id: booking.client_id,
        client_name: booking.client?.full_name ?? booking.client_name,
        shop_id: booking.shop_id,
        shop_name: booking.shop?.name,
        can_reschedule: ['pending', 'confirmed'].includes(booking.status ?? ''),
    };
}

async function bookingDurationMinutes(bookingId: string): Promise<number> {
    const booking = await prisma.bookings.findUnique({
        where: { id: bookingId },
        select: { start_time: true, end_time: true },
    });
    if (!booking?.start_time || !booking.end_time) return 30;
    const start = parseISO(booking.start_time);
    const end = parseISO(booking.end_time);
    return Math.max(15, Math.round((end.getTime() - start.getTime()) / 60000));
}

export async function proposeReschedule(input: {
    booking_id: string;
    proposer_id: string;
    proposed_start_time: string;
    note?: string;
}): Promise<MessageDto> {
    await assertBookingParticipant(input.booking_id, input.proposer_id);

    const booking = await prisma.bookings.findUnique({
        where: { id: input.booking_id },
        select: {
            id: true,
            status: true,
            client_id: true,
            barber_id: true,
            shop_id: true,
            start_time: true,
        },
    });
    if (!booking) throw new Error('Booking not found');
    if (!['pending', 'confirmed'].includes(booking.status ?? '')) {
        throw new Error('This booking cannot be rescheduled');
    }

    const proposedStart = parseISO(input.proposed_start_time);
    if (Number.isNaN(proposedStart.getTime())) throw new Error('Invalid proposed time');

    const duration = await bookingDurationMinutes(input.booking_id);
    const validation = await validateBooking({
        barber_id: booking.barber_id,
        shop_id: booking.shop_id ?? undefined,
        start_datetime: proposedStart,
        duration_minutes: duration,
        exclude_booking_id: booking.id,
    });
    if (validation.status !== 'AVAILABLE') {
        throw new Error(validation.message ?? 'Proposed time is not available');
    }

    const proposedEnd = addMinutes(proposedStart, duration);
    const receiverId =
        input.proposer_id === booking.client_id
            ? (await prisma.barbers.findUnique({ where: { id: booking.barber_id }, select: { user_id: true } }))
                  ?.user_id
            : booking.client_id;

    if (!receiverId) throw new Error('Cannot determine message recipient');

    const content = `Proposed new time: ${format(proposedStart, 'PPP')} at ${format(proposedStart, 'h:mm a')}`;
    return sendMessage({
        sender_id: input.proposer_id,
        receiver_id: receiverId,
        content,
        booking_id: booking.id,
        message_type: 'reschedule_proposal',
        metadata: {
            proposed_start_time: proposedStart.toISOString(),
            proposed_end_time: proposedEnd.toISOString(),
            status: 'pending',
            note: input.note ?? null,
        },
    });
}

export async function respondToReschedule(input: {
    message_id: string;
    user_id: string;
    accept: boolean;
}): Promise<{ message: MessageDto; booking?: { id: string; start_time: string; end_time: string } }> {
    const msg = await prisma.messages.findUnique({ where: { id: input.message_id } });
    if (!msg || msg.message_type !== 'reschedule_proposal' || !msg.booking_id) {
        throw new Error('Reschedule proposal not found');
    }

    const meta = parseMetadata(msg.metadata);
    if (!meta || meta.status !== 'pending') throw new Error('This proposal is no longer active');

    await assertBookingParticipant(msg.booking_id, input.user_id);
    if (input.user_id === msg.sender_id) throw new Error('You cannot respond to your own proposal');

    const booking = await prisma.bookings.findUnique({ where: { id: msg.booking_id } });
    if (!booking) throw new Error('Booking not found');

    if (!input.accept) {
        const decline = await sendMessage({
            sender_id: input.user_id,
            receiver_id: msg.sender_id,
            content: 'Declined the reschedule proposal.',
            booking_id: msg.booking_id,
            message_type: 'reschedule_declined',
            metadata: { related_proposal_id: msg.id },
        });
        await prisma.messages.update({
            where: { id: msg.id },
            data: { metadata: JSON.stringify({ ...meta, status: 'declined' }) },
        });
        publishToUsers([msg.sender_id, input.user_id], {
            type: 'reschedule',
            booking_id: msg.booking_id,
            message_id: msg.id,
        });
        return { message: decline };
    }

    const proposedStart = parseISO(String(meta.proposed_start_time));
    const proposedEnd = parseISO(String(meta.proposed_end_time));
    const duration = await bookingDurationMinutes(booking.id);

    const validation = await validateBooking({
        barber_id: booking.barber_id,
        shop_id: booking.shop_id ?? undefined,
        start_datetime: proposedStart,
        duration_minutes: duration,
        exclude_booking_id: booking.id,
    });
    if (validation.status !== 'AVAILABLE') {
        throw new Error(validation.message ?? 'Proposed slot is no longer available');
    }

    const updatedBooking = await prisma.bookings.update({
        where: { id: booking.id },
        data: {
            start_time: proposedStart.toISOString(),
            end_time: proposedEnd.toISOString(),
            updated_at: new Date().toISOString(),
            status: booking.status === 'pending' ? 'confirmed' : booking.status,
        },
    });

    await prisma.messages.update({
        where: { id: msg.id },
        data: { metadata: JSON.stringify({ ...meta, status: 'accepted' }) },
    });

    const acceptMsg = await sendMessage({
        sender_id: input.user_id,
        receiver_id: msg.sender_id,
        content: `Reschedule confirmed: ${format(proposedStart, 'PPP')} at ${format(proposedStart, 'h:mm a')}`,
        booking_id: msg.booking_id,
        message_type: 'reschedule_accepted',
        metadata: { related_proposal_id: msg.id },
    });

    publishToUsers([msg.sender_id, input.user_id], {
        type: 'reschedule',
        booking_id: msg.booking_id,
        message_id: msg.id,
    });

    return {
        message: acceptMsg,
        booking: {
            id: updatedBooking.id,
            start_time: updatedBooking.start_time,
            end_time: updatedBooking.end_time,
        },
    };
}
