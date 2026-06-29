import { useCallback, useState } from 'react';
import {
    clearPreferredLocation,
    loadPreferredLocation,
    savePreferredLocation,
} from '@/lib/userLocation';

/**
 * Client-side preferred location (address + coords) shared across explore, booking, and account.
 */
export function usePreferredLocation() {
    const [preferredLocation, setPreferredLocationState] = useState(() => loadPreferredLocation());

    const setPreferredLocation = useCallback((next) => {
        if (next?.address && next.latitude != null && next.longitude != null) {
            savePreferredLocation(next);
            setPreferredLocationState(next);
        } else {
            clearPreferredLocation();
            setPreferredLocationState(null);
        }
    }, []);

    const clearPreferredLocationState = useCallback(() => {
        clearPreferredLocation();
        setPreferredLocationState(null);
    }, []);

    return { preferredLocation, setPreferredLocation, clearPreferredLocation: clearPreferredLocationState };
}
