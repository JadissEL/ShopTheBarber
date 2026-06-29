import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    geocodeAddress,
    reverseGeocode,
    suggestAddresses,
    resolveGeocodingProvider,
} from '../lib/geocoding';

describe('geocoding providers', () => {
    const envBackup = { ...process.env };

    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
        process.env = { ...envBackup };
        vi.unstubAllGlobals();
    });

    it('auto-selects mapbox when MAPBOX_ACCESS_TOKEN is set', () => {
        process.env.GEOCODING_PROVIDER = '';
        process.env.MAPBOX_ACCESS_TOKEN = 'pk.test';
        delete process.env.GOOGLE_MAPS_API_KEY;
        expect(resolveGeocodingProvider()).toBe('mapbox');
    });

    it('geocodes via Mapbox forward API', async () => {
        process.env.GEOCODING_PROVIDER = 'mapbox';
        process.env.MAPBOX_ACCESS_TOKEN = 'pk.test';

        vi.mocked(fetch).mockResolvedValue({
            ok: true,
            json: async () => ({
                features: [
                    {
                        place_name: 'Syntagma Square, Athens, Greece',
                        center: [23.7348, 37.9755],
                    },
                ],
            }),
        } as Response);

        const result = await geocodeAddress('Syntagma, Athens');
        expect(result.provider).toBe('mapbox');
        expect(result.latitude).toBeCloseTo(37.9755, 3);
        expect(result.longitude).toBeCloseTo(23.7348, 3);
        expect(result.formatted_address).toContain('Athens');
    });

    it('reverse geocodes via Google when configured', async () => {
        process.env.GEOCODING_PROVIDER = 'google';
        process.env.GOOGLE_MAPS_API_KEY = 'google-test-key';

        vi.mocked(fetch).mockResolvedValue({
            ok: true,
            json: async () => ({
                status: 'OK',
                results: [
                    {
                        formatted_address: 'Athens, Greece',
                        geometry: { location: { lat: 37.9838, lng: 23.7275 } },
                    },
                ],
            }),
        } as Response);

        const result = await reverseGeocode(37.9838, 23.7275);
        expect(result.provider).toBe('google');
        expect(result.formatted_address).toContain('Athens');
    });

    it('returns Mapbox autocomplete suggestions', async () => {
        process.env.GEOCODING_PROVIDER = 'mapbox';
        process.env.MAPBOX_ACCESS_TOKEN = 'pk.test';

        vi.mocked(fetch).mockResolvedValue({
            ok: true,
            json: async () => ({
                features: [
                    {
                        place_name: 'Ermou 1, Athens',
                        center: [23.73, 37.98],
                    },
                ],
            }),
        } as Response);

        const suggestions = await suggestAddresses('Ermou');
        expect(suggestions).toHaveLength(1);
        expect(suggestions[0]?.label).toContain('Ermou');
    });

    it('resolves static coords for Greece seed locations', async () => {
        const { coordsForLocationText } = await import('../lib/geocoding/locationCoords');
        const athens = coordsForLocationText('Athens, Syntagma', 'gb1');
        expect(athens).not.toBeNull();
        expect(athens!.latitude).toBeCloseTo(37.9755, 1);
        expect(athens!.longitude).toBeCloseTo(23.7348, 1);
    });
});
