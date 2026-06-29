import { type FastifyInstance } from 'fastify';
import { prisma } from '../db/prisma';
import { authenticateRequest } from '../auth/requestUser';
import {
    PRODUCT_STATUSES,
    authorCanDelete,
    authorCanEdit,
    authorCanSubmit,
    type AuthUser,
    canListProducts,
    enrichProducts,
    getProductForUser,
    getSellerProfiles,
    isAdmin,
    resolveSellerFields,
    stripPrivilegedFields,
    userOwnsProduct,
    validateDraftPayload,
    validateSubmitReady,
    type ProductStatus,
} from './logic';
import {
    MARKETPLACE_SELLER_TERMS_VERSION,
    marketplaceLegalConfig,
    requireSellerTermsAccepted,
} from './legalConfig';

async function requireAuth(request: any, reply: any): Promise<AuthUser | null> {
    const ok = await authenticateRequest(request, reply);
    if (!ok) return null;
    return request.user as AuthUser;
}

async function requireSeller(request: any, reply: any): Promise<AuthUser | null> {
    const user = await requireAuth(request, reply);
    if (!user) return null;
    if (!canListProducts(user.role)) {
        reply.status(403).send({ error: 'Only barbers, shop owners, and admins can list marketplace products' });
        return null;
    }
    return user;
}

async function requireAdmin(request: any, reply: any): Promise<AuthUser | null> {
    const user = await requireAuth(request, reply);
    if (!user) return null;
    if (!isAdmin(user.role)) {
        reply.status(403).send({ error: 'Admin access required' });
        return null;
    }
    return user;
}

function parseStatusFilter(raw?: string): ProductStatus | 'all' | undefined {
    if (!raw || raw === 'all') return 'all';
    if ((PRODUCT_STATUSES as readonly string[]).includes(raw)) return raw as ProductStatus;
    return undefined;
}

export async function marketplaceRoutes(fastify: FastifyInstance) {
    /** Public legal/VAT config when marketplace module is in use */
    fastify.get('/api/marketplace/legal-config', async () => marketplaceLegalConfig());

    /** GET /api/products/public */
    fastify.get<{ Querystring: { category?: string; featured?: string; brand_id?: string; limit?: string } }>(
        '/api/products/public',
        async (request, reply) => {
            const q = request.query || {};
            const take = Math.min(Math.max(parseInt(q.limit || '200', 10) || 200, 1), 500);
            try {
                const where: Record<string, unknown> = { status: 'published', published: true };
                if (q.category) where.category = q.category.toLowerCase();
                if (q.featured === 'true') where.featured = true;
                if (q.brand_id) where.brand_id = q.brand_id;
                const rows = await prisma.products.findMany({
                    where,
                    orderBy: [{ featured: 'desc' }, { created_at: 'desc' }],
                    take,
                });
                return await enrichProducts(rows);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Failed to list products';
                fastify.log.error(e);
                return reply.status(500).send({ error: msg });
            }
        }
    );

    /** GET /api/products/public/:id */
    fastify.get<{ Params: { id: string } }>('/api/products/public/:id', async (request, reply) => {
        const { id } = request.params;
        try {
            const row = await prisma.products.findFirst({
                where: { id, status: 'published', published: true },
            });
            if (!row) return reply.status(404).send({ error: 'Product not found' });
            const [enriched] = await enrichProducts([row]);
            return enriched;
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to fetch product';
            fastify.log.error(e);
            return reply.status(500).send({ error: msg });
        }
    });

    /** GET /api/products/seller-profiles, barber/shop ids for listing form */
    fastify.get('/api/products/seller-profiles', async (request, reply) => {
        const user = await requireSeller(request, reply);
        if (!user) return;
        try {
            const profiles = await getSellerProfiles(user.id);
            const [barbers, shops, brands] = await Promise.all([
                profiles.barberIds.length
                    ? prisma.barbers.findMany({ where: { id: { in: profiles.barberIds } }, select: { id: true, name: true } })
                    : [],
                profiles.shopIds.length
                    ? prisma.shops.findMany({ where: { id: { in: profiles.shopIds } }, select: { id: true, name: true } })
                    : [],
                isAdmin(user.role) ? prisma.brands.findMany({ select: { id: true, name: true }, take: 100 }) : [],
            ]);
            return {
                role: user.role,
                barbers,
                shops,
                brands: isAdmin(user.role) ? brands : [],
            };
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to load seller profiles';
            return reply.status(500).send({ error: msg });
        }
    });

    /** GET /api/products/mine */
    fastify.get('/api/products/mine', async (request, reply) => {
        const user = await requireSeller(request, reply);
        if (!user) return;
        try {
            if (isAdmin(user.role)) {
                const rows = await prisma.products.findMany({ orderBy: { updated_at: 'desc' } });
                return await enrichProducts(rows);
            }
            const profiles = await getSellerProfiles(user.id);
            const or: Record<string, unknown>[] = [{ created_by: user.id }];
            if (profiles.barberIds.length) or.push({ barber_id: { in: profiles.barberIds } });
            if (profiles.shopIds.length) or.push({ shop_id: { in: profiles.shopIds } });
            const rows = await prisma.products.findMany({
                where: { OR: or },
                orderBy: { updated_at: 'desc' },
            });
            return await enrichProducts(rows);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to list your products';
            fastify.log.error(e);
            return reply.status(500).send({ error: msg });
        }
    });

    /** GET /api/products/:id, seller/admin preview */
    fastify.get<{ Params: { id: string } }>('/api/products/:id', async (request, reply) => {
        const user = await requireAuth(request, reply);
        if (!user) return;
        const { id } = request.params;
        try {
            const row = await getProductForUser(id, user);
            if (!row) return reply.status(404).send({ error: 'Product not found' });
            const [enriched] = await enrichProducts([row]);
            return enriched;
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to fetch product';
            return reply.status(500).send({ error: msg });
        }
    });

    /** POST /api/products */
    fastify.post('/api/products', async (request, reply) => {
        const user = await requireSeller(request, reply);
        if (!user) return;
        const body = request.body;
        if (!body || typeof body !== 'object' || Array.isArray(body)) {
            return reply.status(400).send({ error: 'Request body must be a JSON object' });
        }
        try {
            const payload = validateDraftPayload(body);
            if (!payload.name) return reply.status(400).send({ error: 'Name is required' });
            if (payload.price === undefined) return reply.status(400).send({ error: 'Price is required' });

            const seller = await resolveSellerFields(user, body);
            const row = await prisma.products.create({
                data: {
                    name: String(payload.name),
                    description: (payload.description as string | null | undefined) ?? null,
                    price: payload.price as number,
                    category: (payload.category as string | null | undefined) ?? null,
                    image_url: (payload.image_url as string | null | undefined) ?? null,
                    stock: (payload.stock as number | undefined) ?? 0,
                    seller_type: seller.seller_type,
                    barber_id: seller.barber_id,
                    shop_id: seller.shop_id,
                    vendor_name: seller.vendor_name,
                    brand_id: seller.brand_id,
                    created_by: user.id,
                    status: 'draft',
                    published: false,
                    featured: false,
                },
            });
            const [enriched] = await enrichProducts([row]);
            return reply.status(201).send(enriched);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to create product';
            return reply.status(400).send({ error: msg });
        }
    });

    /** PATCH /api/products/:id */
    fastify.patch<{ Params: { id: string } }>('/api/products/:id', async (request, reply) => {
        const user = await requireSeller(request, reply);
        if (!user) return;
        const { id } = request.params;
        const body = request.body;
        if (!body || typeof body !== 'object' || Array.isArray(body)) {
            return reply.status(400).send({ error: 'Request body must be a JSON object' });
        }
        try {
            const existing = await prisma.products.findUnique({ where: { id } });
            if (!existing || !(await userOwnsProduct(user, existing))) {
                return reply.status(404).send({ error: 'Product not found' });
            }
            if (!isAdmin(user.role) && !authorCanEdit(existing.status)) {
                return reply.status(403).send({ error: 'Product cannot be edited while pending or live' });
            }

            let raw: Record<string, unknown>;
            if (isAdmin(user.role)) {
                raw = stripPrivilegedFields(body as Record<string, unknown>);
                if ((body as Record<string, unknown>).featured !== undefined) {
                    raw.featured = Boolean((body as Record<string, unknown>).featured);
                }
            } else {
                raw = validateDraftPayload(body);
            }
            if (Object.keys(raw).length === 0) {
                return reply.status(400).send({ error: 'No valid fields to update' });
            }

            const row = await prisma.products.update({
                where: { id },
                data: { ...raw, updated_at: new Date().toISOString() } as never,
            });
            const [enriched] = await enrichProducts([row]);
            return enriched;
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to update product';
            return reply.status(400).send({ error: msg });
        }
    });

    /** POST /api/products/:id/submit */
    fastify.post<{
        Params: { id: string };
        Body: { seller_terms_accepted?: boolean; seller_terms_version?: string };
    }>('/api/products/:id/submit', async (request, reply) => {
        const user = await requireSeller(request, reply);
        if (!user) return;
        const { id } = request.params;
        try {
            requireSellerTermsAccepted(request.body ?? {});
            const existing = await prisma.products.findUnique({ where: { id } });
            if (!existing || !(await userOwnsProduct(user, existing))) {
                return reply.status(404).send({ error: 'Product not found' });
            }
            if (!authorCanSubmit(existing.status)) {
                return reply.status(403).send({ error: 'Only draft or rejected products can be submitted' });
            }
            validateSubmitReady(existing);
            const now = new Date().toISOString();
            const row = await prisma.products.update({
                where: { id },
                data: {
                    status: 'pending_review',
                    published: false,
                    submitted_at: now,
                    rejection_reason: null,
                    reviewed_at: null,
                    reviewed_by: null,
                    updated_at: now,
                },
            });
            const [enriched] = await enrichProducts([row]);
            return enriched;
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to submit product';
            return reply.status(400).send({ error: msg });
        }
    });

    /** DELETE /api/products/:id */
    fastify.delete<{ Params: { id: string } }>('/api/products/:id', async (request, reply) => {
        const user = await requireSeller(request, reply);
        if (!user) return;
        const { id } = request.params;
        try {
            const existing = await prisma.products.findUnique({ where: { id } });
            if (!existing || !(await userOwnsProduct(user, existing))) {
                return reply.status(404).send({ error: 'Product not found' });
            }
            if (!isAdmin(user.role) && !authorCanDelete(existing.status)) {
                return reply.status(403).send({ error: 'Only draft or rejected products can be deleted' });
            }
            await prisma.products.delete({ where: { id } });
            return { success: true };
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to delete product';
            return reply.status(500).send({ error: msg });
        }
    });

    /** GET /api/admin/products */
    fastify.get<{ Querystring: { status?: string } }>('/api/admin/products', async (request, reply) => {
        const user = await requireAdmin(request, reply);
        if (!user) return;
        const statusFilter = parseStatusFilter(request.query?.status);
        if (request.query?.status && statusFilter === undefined) {
            return reply.status(400).send({ error: `Invalid status. Allowed: all, ${PRODUCT_STATUSES.join(', ')}` });
        }
        try {
            const where = statusFilter && statusFilter !== 'all' ? { status: statusFilter } : {};
            const rows = await prisma.products.findMany({
                where,
                orderBy: [{ status: 'asc' }, { submitted_at: 'desc' }, { created_at: 'desc' }],
            });
            return await enrichProducts(rows);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to list products';
            return reply.status(500).send({ error: msg });
        }
    });

    /** POST /api/admin/products/:id/approve */
    fastify.post<{ Params: { id: string } }>('/api/admin/products/:id/approve', async (request, reply) => {
        const user = await requireAdmin(request, reply);
        if (!user) return;
        const { id } = request.params;
        try {
            const existing = await prisma.products.findUnique({ where: { id } });
            if (!existing) return reply.status(404).send({ error: 'Product not found' });
            if (existing.status !== 'pending_review') {
                return reply.status(400).send({ error: 'Only pending products can be approved' });
            }
            validateSubmitReady(existing);
            const now = new Date().toISOString();
            const row = await prisma.products.update({
                where: { id },
                data: {
                    status: 'published',
                    published: true,
                    rejection_reason: null,
                    reviewed_at: now,
                    reviewed_by: user.id,
                    updated_at: now,
                },
            });
            const [enriched] = await enrichProducts([row]);
            return enriched;
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to approve product';
            return reply.status(400).send({ error: msg });
        }
    });

    /** POST /api/admin/products/:id/reject */
    fastify.post<{ Params: { id: string }; Body: { reason?: string } }>(
        '/api/admin/products/:id/reject',
        async (request, reply) => {
            const user = await requireAdmin(request, reply);
            if (!user) return;
            const { id } = request.params;
            const reason = typeof request.body?.reason === 'string' ? request.body.reason.trim().slice(0, 500) : null;
            try {
                const existing = await prisma.products.findUnique({ where: { id } });
                if (!existing) return reply.status(404).send({ error: 'Product not found' });
                if (existing.status !== 'pending_review') {
                    return reply.status(400).send({ error: 'Only pending products can be rejected' });
                }
                const now = new Date().toISOString();
                const row = await prisma.products.update({
                    where: { id },
                    data: {
                        status: 'rejected',
                        published: false,
                        rejection_reason: reason || 'Changes requested by moderator',
                        reviewed_at: now,
                        reviewed_by: user.id,
                        updated_at: now,
                    },
                });
                const [enriched] = await enrichProducts([row]);
                return enriched;
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Failed to reject product';
                return reply.status(400).send({ error: msg });
            }
        }
    );

    /** POST /api/admin/products/:id/unpublish */
    fastify.post<{ Params: { id: string }; Body: { reason?: string } }>(
        '/api/admin/products/:id/unpublish',
        async (request, reply) => {
            const user = await requireAdmin(request, reply);
            if (!user) return;
            const { id } = request.params;
            const reason = typeof request.body?.reason === 'string' ? request.body.reason.trim().slice(0, 500) : null;
            try {
                const existing = await prisma.products.findUnique({ where: { id } });
                if (!existing) return reply.status(404).send({ error: 'Product not found' });
                if (existing.status !== 'published') {
                    return reply.status(400).send({ error: 'Only published products can be unpublished' });
                }
                const now = new Date().toISOString();
                const row = await prisma.products.update({
                    where: { id },
                    data: {
                        status: 'rejected',
                        published: false,
                        rejection_reason: reason || 'Unpublished by admin',
                        reviewed_at: now,
                        reviewed_by: user.id,
                        updated_at: now,
                    },
                });
                const [enriched] = await enrichProducts([row]);
                return enriched;
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Failed to unpublish product';
                return reply.status(400).send({ error: msg });
            }
        }
    );
}
