import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function QueryOptimizer() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Global SWR Strategy
    queryClient.setDefaultOptions({
      queries: {
        staleTime: 1000 * 60 * 3, // 3 minutes - Data remains fresh for navigation loops
        gcTime: 1000 * 60 * 10,   // 10 minutes - Keep unused data in memory longer
        refetchOnWindowFocus: true, // Revalidate when returning to app
        refetchOnReconnect: 'always',
        retry: 1,
        refetchOnMount: true,
      },
    });
  }, [queryClient]);

  return null;
}