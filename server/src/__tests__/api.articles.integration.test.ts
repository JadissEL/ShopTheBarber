/**
 * Blog articles API: public list + auth guards on write endpoints.
 */
import { describe, it, expect, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { fastify as app } from '../index';

describe('integration: articles API', () => {
    afterAll(async () => {
        await (app as FastifyInstance).close();
    });

    it('GET /api/articles/public returns an array without auth', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/articles/public',
        });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.payload);
        expect(Array.isArray(body)).toBe(true);
        for (const row of body) {
            expect(row.status).toBe('published');
            expect(row.published).toBe(true);
        }
    });

    it('POST /api/articles requires auth', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/articles',
            payload: { title: 'Unauthorized draft' },
        });
        expect(res.statusCode).toBe(401);
    });

    it('GET /api/admin/articles requires auth', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/admin/articles',
        });
        expect(res.statusCode).toBe(401);
    });

    it('GET /api/articles/public/:id returns 404 for unknown id', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/articles/public/00000000-0000-0000-0000-000000000000',
        });
        expect(res.statusCode).toBe(404);
    });
});
