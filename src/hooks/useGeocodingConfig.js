import { useQuery } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';

/**
 * Public geocoding + map readiness from the API (provider, autocomplete, default center).
 */
export function useGeocodingConfig() {
    return useQuery({
        queryKey: ['geocoding-config'],
        queryFn: () => sovereign.geocoding.getConfig(),
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });
}
