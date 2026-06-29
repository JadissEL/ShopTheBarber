import type { FastifyInstance } from 'fastify';
import { getGeocodingConfig } from '../lib/geocoding';

export async function geocodingRoutes(fastify: FastifyInstance) {
    fastify.get('/api/geocoding/config', async () => {
        const geocoding = getGeocodingConfig();
        return {
            geocoding,
            country_bias: 'GR',
            default_center: { latitude: 37.9838, longitude: 23.7275 },
            endpoints: {
                suggest: '/api/at-home-service/suggest',
                geocode: '/api/at-home-service/geocode',
                reverse_geocode: '/api/at-home-service/reverse-geocode',
            },
        };
    });
}
