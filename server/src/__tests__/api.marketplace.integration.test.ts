import { describe, it, expect, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { fastify as app } from '../index';

describe('integration: marketplace products API', () => {
    afterAll(async () => {
        await (app as FastifyInstance).close();
    });

    it('GET /api/products/public returns published products only', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/products/public',
        });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.payload);
        expect(Array.isArray(body)).toBe(true);
        for (const row of body) {
            expect(row.status).toBe('published');
            expect(row.published).toBe(true);
        }
    });

    it('POST /api/products requires auth', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/products',
            payload: { name: 'Test', price: 10 },
        });
        expect(res.statusCode).toBe(401);
    });

    it('GET /api/admin/products requires auth', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/admin/products',
        });
        expect(res.statusCode).toBe(401);
    });
});
