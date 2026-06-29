import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';

/**
 * SSE subscription for live message updates (falls back silently if stream unavailable).
 */
export function useMessageStream(userId, enabled = true) {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!enabled || !userId) return undefined;

        const url = sovereign.messages.streamUrl();
        if (!url) return undefined;

        let es;
        try {
            es = new EventSource(url);
        } catch {
            return undefined;
        }

        es.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'message' || data.type === 'reschedule') {
                    queryClient.invalidateQueries({ queryKey: ['message-threads', userId] });
                    if (data.contact_user_id) {
                        queryClient.invalidateQueries({
                            queryKey: ['message-thread', userId, data.contact_user_id],
                        });
                    }
                    if (data.booking_id) {
                        queryClient.invalidateQueries({
                            queryKey: ['booking-chat-context', data.booking_id],
                        });
                    }
                }
                if (data.type === 'support' && data.ticket_id) {
                    queryClient.invalidateQueries({ queryKey: ['support-tickets', userId] });
                    queryClient.invalidateQueries({ queryKey: ['support-messages', data.ticket_id] });
                    queryClient.invalidateQueries({ queryKey: ['support-admin-tickets'] });
                    queryClient.invalidateQueries({ queryKey: ['support-admin-stats'] });
                }
            } catch {
                /* ignore malformed events */
            }
        };

        es.onerror = () => {
            es?.close();
        };

        return () => {
            es?.close();
        };
    }, [userId, enabled, queryClient]);
}
