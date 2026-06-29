import { prisma } from '../db/prisma';
import { publishToUsers } from '../messages/events';
import { SUPPORT_CATEGORIES, SUPPORT_STATUSES, type SupportStatus } from './config';

export type SupportMessageDto = {
    id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    support_ticket_id: string;
    message_type: string;
    metadata: Record<string, unknown> | null;
    is_read: boolean;
    created_at: string | null;
    sender_display_name?: string;
    is_from_support?: boolean;
};

export type SupportTicketDto = {
    id: string;
    user_id: string;
    subject: string;
    category: string;
    status: string;
    priority: string;
    assigned_to: string | null;
    last_message_at: string | null;
    created_at: string | null;
    updated_at: string | null;
    closed_at: string | null;
    unread_count?: number;
    user?: {
        id: string;
        full_name: string | null;
        email: string | null;
        role: string | null;
        avatar_url: string | null;
    };
    last_message_preview?: string | null;
};

function parseMetadata(raw: string | null | undefined): Record<string, unknown> | null {
    if (!raw) return null;
    try {
        return JSON.parse(raw) as Record<string, unknown>;
    } catch {
        return null;
    }
}

function nowIso(): string {
    return new Date().toISOString();
}

export async function getSupportDeskUserId(): Promise<string> {
    const envId = process.env.SUPPORT_DESK_USER_ID?.trim();
    if (envId) {
        const u = await prisma.users.findUnique({ where: { id: envId }, select: { id: true } });
        if (u) return u.id;
    }
    const admin = await prisma.users.findFirst({
        where: { role: 'admin' },
        orderBy: { created_at: 'asc' },
        select: { id: true },
    });
    if (admin) return admin.id;
    throw new Error('Support desk is not configured. Add an admin user or set SUPPORT_DESK_USER_ID.');
}

export async function getSupportDeskInfo() {
    const deskId = await getSupportDeskUserId();
    const desk = await prisma.users.findUnique({
        where: { id: deskId },
        select: { id: true, full_name: true, avatar_url: true, role: true },
    });
    return {
        user_id: deskId,
        display_name: 'ShopTheBarber Support',
        avatar_url: desk?.avatar_url ?? null,
        categories: SUPPORT_CATEGORIES,
        statuses: SUPPORT_STATUSES,
    };
}

async function assertTicketAccess(ticketId: string, userId: string, role?: string | null) {
    const ticket = await prisma.support_tickets.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new Error('Support ticket not found');
    if (ticket.user_id === userId) return ticket;
    if (role === 'admin') return ticket;
    throw new Error('You do not have access to this support ticket');
}

function serializeTicket(
    row: {
        id: string;
        user_id: string;
        subject: string;
        category: string | null;
        status: string | null;
        priority: string | null;
        assigned_to: string | null;
        last_message_at: string | null;
        created_at: string | null;
        updated_at: string | null;
        closed_at: string | null;
    },
    extras?: Partial<SupportTicketDto>
): SupportTicketDto {
    return {
        id: row.id,
        user_id: row.user_id,
        subject: row.subject,
        category: row.category ?? 'general',
        status: row.status ?? 'open',
        priority: row.priority ?? 'normal',
        assigned_to: row.assigned_to,
        last_message_at: row.last_message_at,
        created_at: row.created_at,
        updated_at: row.updated_at,
        closed_at: row.closed_at,
        ...extras,
    };
}

async function unreadCountForTicket(ticketId: string, readerId: string): Promise<number> {
    return prisma.messages.count({
        where: {
            support_ticket_id: ticketId,
            receiver_id: readerId,
            is_read: false,
        },
    });
}

export async function listMyTickets(userId: string): Promise<SupportTicketDto[]> {
    const rows = await prisma.support_tickets.findMany({
        where: { user_id: userId },
        orderBy: [{ last_message_at: 'desc' }, { created_at: 'desc' }],
        take: 100,
    });

    const result: SupportTicketDto[] = [];
    for (const row of rows) {
        const unread = await unreadCountForTicket(row.id, userId);
        const lastMsg = await prisma.messages.findFirst({
            where: { support_ticket_id: row.id },
            orderBy: { created_at: 'desc' },
            select: { content: true },
        });
        result.push(
            serializeTicket(row, {
                unread_count: unread,
                last_message_preview: lastMsg?.content?.slice(0, 120) ?? null,
            })
        );
    }
    return result;
}

export async function createSupportTicket(input: {
    user_id: string;
    subject: string;
    category?: string;
    content: string;
    context?: { order_id?: string; booking_id?: string };
}): Promise<{ ticket: SupportTicketDto; message: SupportMessageDto }> {
    const subject = input.subject?.trim();
    const content = input.content?.trim();
    if (!subject) throw new Error('Subject is required');
    if (!content) throw new Error('Message is required');

    const category = input.category?.trim() || 'general';
    if (!SUPPORT_CATEGORIES.some((c) => c.id === category)) {
        throw new Error('Invalid support category');
    }

    const deskId = await getSupportDeskUserId();
    const ticketId = crypto.randomUUID();
    const ts = nowIso();

    const ticket = await prisma.support_tickets.create({
        data: {
            id: ticketId,
            user_id: input.user_id,
            subject,
            category,
            status: 'open',
            priority: 'normal',
            last_message_at: ts,
            created_at: ts,
            updated_at: ts,
        },
    });

    const metadata: Record<string, unknown> = {
        ...(input.context?.order_id ? { order_id: input.context.order_id } : {}),
        ...(input.context?.booking_id ? { booking_id: input.context.booking_id } : {}),
    };

    const msg = await prisma.messages.create({
        data: {
            id: crypto.randomUUID(),
            sender_id: input.user_id,
            receiver_id: deskId,
            content,
            support_ticket_id: ticketId,
            message_type: 'support',
            metadata: Object.keys(metadata).length ? JSON.stringify(metadata) : null,
            is_read: false,
        },
    });

    const admins = await prisma.users.findMany({ where: { role: 'admin' }, select: { id: true } });
    for (const admin of admins) {
        await prisma.notifications.create({
            data: {
                id: crypto.randomUUID(),
                user_id: admin.id,
                title: 'New support ticket',
                content: `${subject}: ${content.slice(0, 100)}`,
                type: 'support_ticket',
                is_read: false,
            },
        });
    }
    publishToUsers(
        [input.user_id, deskId, ...admins.map((a) => a.id)],
        { type: 'support', ticket_id: ticketId }
    );

    return {
        ticket: serializeTicket(ticket, { unread_count: 0, last_message_preview: content }),
        message: await serializeSupportMessage(msg, input.user_id),
    };
}

async function serializeSupportMessage(
    row: {
        id: string;
        sender_id: string;
        receiver_id: string;
        content: string;
        support_ticket_id?: string | null;
        message_type?: string | null;
        metadata?: string | null;
        is_read?: boolean | null;
        created_at?: string | null;
    },
    viewerId: string
): Promise<SupportMessageDto> {
    const meta = parseMetadata(row.metadata);
    const deskId = await getSupportDeskUserId();
    const isFromSupport =
        row.sender_id === deskId || Boolean(meta?.replied_by_admin_id);

    let senderDisplayName: string | undefined;
    if (isFromSupport) {
        senderDisplayName = 'ShopTheBarber Support';
    } else {
        const sender = await prisma.users.findUnique({
            where: { id: row.sender_id },
            select: { full_name: true },
        });
        senderDisplayName = sender?.full_name ?? 'User';
    }

    return {
        id: row.id,
        sender_id: row.sender_id,
        receiver_id: row.receiver_id,
        content: row.content,
        support_ticket_id: row.support_ticket_id ?? '',
        message_type: row.message_type ?? 'support',
        metadata: meta,
        is_read: row.is_read ?? false,
        created_at: row.created_at ?? null,
        sender_display_name: senderDisplayName,
        is_from_support: isFromSupport && row.sender_id !== viewerId,
    };
}

export async function getTicketMessages(
    ticketId: string,
    userId: string,
    role?: string | null
): Promise<SupportMessageDto[]> {
    await assertTicketAccess(ticketId, userId, role);

    const rows = await prisma.messages.findMany({
        where: { support_ticket_id: ticketId },
        orderBy: { created_at: 'asc' },
        take: 300,
    });

    const deskId = await getSupportDeskUserId();
    const receiverIds =
        role === 'admin' ? [userId, deskId] : [userId];

    await prisma.messages.updateMany({
        where: {
            support_ticket_id: ticketId,
            receiver_id: { in: receiverIds },
            is_read: false,
        },
        data: { is_read: true },
    });

    publishToUsers([userId], { type: 'support', ticket_id: ticketId });

    const result: SupportMessageDto[] = [];
    for (const row of rows) {
        result.push(await serializeSupportMessage(row, userId));
    }
    return result;
}

export async function sendSupportTicketMessage(input: {
    ticket_id: string;
    sender_id: string;
    sender_role?: string | null;
    content: string;
}): Promise<SupportMessageDto> {
    const content = input.content?.trim();
    if (!content) throw new Error('Message content is required');

    const ticket = await assertTicketAccess(input.ticket_id, input.sender_id, input.sender_role);
    if (ticket.status === 'closed') throw new Error('This ticket is closed. Reopen it to continue.');

    const deskId = await getSupportDeskUserId();
    const isAdmin = input.sender_role === 'admin';
    const isRequester = ticket.user_id === input.sender_id;

    if (!isAdmin && !isRequester) throw new Error('Unauthorized');

    let senderId = input.sender_id;
    let receiverId: string;
    let metadata: Record<string, unknown> | null = null;

    if (isRequester && !isAdmin) {
        receiverId = deskId;
    } else {
        senderId = deskId;
        receiverId = ticket.user_id;
        metadata = { replied_by_admin_id: input.sender_id };
    }

    const ts = nowIso();
    const row = await prisma.messages.create({
        data: {
            id: crypto.randomUUID(),
            sender_id: senderId,
            receiver_id: receiverId,
            content,
            support_ticket_id: input.ticket_id,
            message_type: 'support',
            metadata: metadata ? JSON.stringify(metadata) : null,
            is_read: false,
        },
    });

    const nextStatus =
        isAdmin && ticket.status === 'open' ? 'in_progress' : ticket.status ?? 'open';

    await prisma.support_tickets.update({
        where: { id: input.ticket_id },
        data: {
            last_message_at: ts,
            updated_at: ts,
            status: nextStatus,
            ...(isAdmin && !ticket.assigned_to ? { assigned_to: input.sender_id } : {}),
        },
    });

    await prisma.notifications.create({
        data: {
            id: crypto.randomUUID(),
            user_id: receiverId,
            title: isAdmin ? 'Support replied' : 'New support message',
            content: content.slice(0, 120),
            type: 'support_message',
            is_read: false,
        },
    });

    const notifyIds = [ticket.user_id, deskId];
    if (isAdmin) notifyIds.push(input.sender_id);
    publishToUsers([...new Set(notifyIds)], { type: 'support', ticket_id: input.ticket_id });

    return serializeSupportMessage(row, input.sender_id);
}

export async function updateSupportTicketStatus(input: {
    ticket_id: string;
    user_id: string;
    role?: string | null;
    status: SupportStatus;
}): Promise<SupportTicketDto> {
    if (!SUPPORT_STATUSES.includes(input.status)) throw new Error('Invalid status');

    const ticket = await assertTicketAccess(input.ticket_id, input.user_id, input.role);
    const isAdmin = input.role === 'admin';
    const isOwner = ticket.user_id === input.user_id;

    if (!isAdmin && !isOwner) throw new Error('Unauthorized');
    if (!isAdmin && input.status !== 'closed') {
        throw new Error('Only support can change ticket status to that value');
    }

    const ts = nowIso();
    const updated = await prisma.support_tickets.update({
        where: { id: input.ticket_id },
        data: {
            status: input.status,
            updated_at: ts,
            closed_at: input.status === 'closed' || input.status === 'resolved' ? ts : null,
        },
    });

    publishToUsers([ticket.user_id], { type: 'support', ticket_id: input.ticket_id });

    return serializeTicket(updated);
}

export async function listAdminSupportTickets(filters?: {
    status?: string;
    assigned_to?: string;
}): Promise<SupportTicketDto[]> {
    const where: Record<string, unknown> = {};
    if (filters?.status && filters.status !== 'all') where.status = filters.status;
    if (filters?.assigned_to) where.assigned_to = filters.assigned_to;

    const rows = await prisma.support_tickets.findMany({
        where,
        orderBy: [{ status: 'asc' }, { last_message_at: 'desc' }],
        take: 200,
        include: {
            user: {
                select: { id: true, full_name: true, email: true, role: true, avatar_url: true },
            },
        },
    });

    const deskId = await getSupportDeskUserId();
    const result: SupportTicketDto[] = [];

    for (const row of rows) {
        const unread = await prisma.messages.count({
            where: {
                support_ticket_id: row.id,
                receiver_id: deskId,
                is_read: false,
                sender_id: row.user_id,
            },
        });
        const lastMsg = await prisma.messages.findFirst({
            where: { support_ticket_id: row.id },
            orderBy: { created_at: 'desc' },
            select: { content: true },
        });
        result.push(
            serializeTicket(row, {
                unread_count: unread,
                last_message_preview: lastMsg?.content?.slice(0, 120) ?? null,
                user: row.user
                    ? {
                          id: row.user.id,
                          full_name: row.user.full_name,
                          email: row.user.email,
                          role: row.user.role,
                          avatar_url: row.user.avatar_url,
                      }
                    : undefined,
            })
        );
    }
    return result;
}

export async function getAdminSupportStats() {
    const [open, inProgress, resolved, closed] = await Promise.all([
        prisma.support_tickets.count({ where: { status: 'open' } }),
        prisma.support_tickets.count({ where: { status: 'in_progress' } }),
        prisma.support_tickets.count({ where: { status: 'resolved' } }),
        prisma.support_tickets.count({ where: { status: 'closed' } }),
    ]);
    return { open, in_progress: inProgress, resolved, closed, total: open + inProgress + resolved + closed };
}

/** Unread support messages for in-app widget badge. */
export async function getSupportUnreadSummary(userId: string) {
    const tickets = await prisma.support_tickets.findMany({
        where: { user_id: userId, status: { not: 'closed' } },
        select: { id: true },
    });
    let unread = 0;
    for (const t of tickets) {
        unread += await unreadCountForTicket(t.id, userId);
    }
    return {
        unread_messages: unread,
        open_tickets: tickets.length,
    };
}
