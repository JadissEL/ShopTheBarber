/** In-process pub/sub for SSE message delivery (single-instance; scale with Redis later). */

export type MessageStreamEvent =
    | { type: 'message'; contact_user_id: string; booking_id?: string | null }
    | { type: 'read'; contact_user_id: string }
    | { type: 'reschedule'; booking_id: string; message_id: string }
    | { type: 'support'; ticket_id: string };

type Listener = (event: MessageStreamEvent) => void;

const listenersByUser = new Map<string, Set<Listener>>();

export function subscribeUser(userId: string, listener: Listener): () => void {
    if (!listenersByUser.has(userId)) listenersByUser.set(userId, new Set());
    listenersByUser.get(userId)!.add(listener);
    return () => {
        listenersByUser.get(userId)?.delete(listener);
    };
}

export function publishToUser(userId: string, event: MessageStreamEvent): void {
    listenersByUser.get(userId)?.forEach((fn) => {
        try {
            fn(event);
        } catch {
            /* ignore listener errors */
        }
    });
}

export function publishToUsers(userIds: string[], event: MessageStreamEvent): void {
    for (const id of new Set(userIds)) {
        publishToUser(id, event);
    }
}
