import { useQuery } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';

export function useHomepage() {
  return useQuery({
    queryKey: ['homepage'],
    queryFn: () => sovereign.public.getHomepage(),
    staleTime: 1000 * 60 * 5,
  });
}
