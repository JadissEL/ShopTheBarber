/**
 * Public status page API.
 */
import { describe, it, expect, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { fastify as app } from '../index';

describe('integration: public status API', () => {
    afterAll(async () => {
        await (app as FastifyInstance).close();
    });

    it('GET /api/status/public returns components without auth', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/status/public',
        });
        expect([200, 503]).toContain(res.statusCode);
        const body = JSON.parse(res.payload) as {
            overall_status?: string;
            components?: Array<{ id: string; name: string; status: string }>;
        };
        expect(body.overall_status).toBeTruthy();
        expect(Array.isArray(body.components)).toBe(true);
        expect(body.components!.some((c) => c.id === 'api')).toBe(true);
    });
});
