import { describe, it, expect, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { fastify as app } from '../index';

describe('integration: jobs API', () => {
    afterAll(async () => {
        await (app as FastifyInstance).close();
    });

    it('GET /api/jobs/public returns published jobs only', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/jobs/public',
        });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.payload);
        expect(Array.isArray(body)).toBe(true);
        for (const row of body) {
            expect(row.status).toBe('published');
            expect(row.published).toBe(true);
        }
    });

    it('POST /api/jobs requires auth', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/jobs',
            payload: { title: 'Test Job', category: 'grooming' },
        });
        expect(res.statusCode).toBe(401);
    });

    it('GET /api/admin/jobs requires auth', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/admin/jobs',
        });
        expect(res.statusCode).toBe(401);
    });
});
