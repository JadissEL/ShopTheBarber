import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';

export function useTombolaStream(enabled = true) {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!enabled) return undefined;

        const url = sovereign.tombola.liveStreamUrl();
        if (!url) return undefined;

        let es;
        try {
            es = new EventSource(url);
        } catch {
            return undefined;
        }

        es.onmessage = () => {
            queryClient.invalidateQueries({ queryKey: ['tombola-current'] });
            queryClient.invalidateQueries({ queryKey: ['tombola-me'] });
        };

        es.onerror = () => es?.close();

        return () => es?.close();
    }, [enabled, queryClient]);
}
