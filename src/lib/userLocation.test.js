import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
    loadPreferredLocation,
    savePreferredLocation,
    clearPreferredLocation,
} from './userLocation';

describe('userLocation', () => {
    beforeEach(() => {
        clearPreferredLocation();
    });

    afterEach(() => {
        clearPreferredLocation();
    });

    it('returns null when empty', () => {
        expect(loadPreferredLocation()).toBeNull();
    });

    it('round-trips address and coordinates', () => {
        savePreferredLocation({
            address: 'Syntagma, Athens',
            latitude: 37.9755,
            longitude: 23.7348,
        });
        expect(loadPreferredLocation()).toEqual({
            address: 'Syntagma, Athens',
            latitude: 37.9755,
            longitude: 23.7348,
        });
    });
});
