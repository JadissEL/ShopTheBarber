import { type FastifyInstance } from 'fastify';
import fs from 'node:fs';
import path from 'node:path';
import { prisma } from '../db/prisma';
import { authenticateRequest } from '../auth/requestUser';
import {
    ARTICLE_STATUSES,
    authorCanDelete,
    authorCanEdit,
    authorCanSubmit,
    type AuthUser,
    canAuthorArticles,
    getArticleForUser,
    isAdmin,
    resolveBlogImageAbsolutePath,
    saveBlogImage,
    serializeArticle,
    stripPrivilegedFields,
    uniqueSlug,
    validateDraftPayload,
    validateSubmitReady,
    type ArticleStatus,
} from './logic';

async function requireAuth(request: any, reply: any): Promise<AuthUser | null> {
    const ok = await authenticateRequest(request, reply);
    if (!ok) return null;
    return request.user as AuthUser;
}

async function requireAuthor(request: any, reply: any): Promise<AuthUser | null> {
    const user = await requireAuth(request, reply);
    if (!user) return null;
    if (!canAuthorArticles(user.role, user.account_type)) {
        reply.status(403).send({ error: 'Author access required to manage blog articles' });
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

function parseStatusFilter(raw?: string): ArticleStatus | 'all' | undefined {
    if (!raw || raw === 'all') return 'all';
    if ((ARTICLE_STATUSES as readonly string[]).includes(raw)) return raw as ArticleStatus;
    return undefined;
}

export async function articlesRoutes(fastify: FastifyInstance) {
    /** GET /api/articles/public, published articles for the blog (no auth) */
    fastify.get<{ Querystring: { category?: string; featured?: string; limit?: string } }>(
        '/api/articles/public',
        async (request, reply) => {
            const q = request.query || {};
            const take = Math.min(Math.max(parseInt(q.limit || '100', 10) || 100, 1), 200);
            try {
                const where: Record<string, unknown> = { status: 'published', published: true };
                if (q.category) where.category = q.category;
                if (q.featured === 'true') where.featured = true;
                const rows = await prisma.articles.findMany({
                    where,
                    orderBy: { created_at: 'desc' },
                    take,
                });
                return rows.map(serializeArticle);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Failed to list articles';
                fastify.log.error(e);
                return reply.status(500).send({ error: msg });
            }
        }
    );

    /** GET /api/articles/public/:id, single published article */
    fastify.get<{ Params: { id: string } }>('/api/articles/public/:id', async (request, reply) => {
        const { id } = request.params;
        try {
            const row = await prisma.articles.findFirst({
                where: {
                    id,
                    status: 'published',
                    published: true,
                },
            });
            if (!row) return reply.status(404).send({ error: 'Article not found' });
            return serializeArticle(row);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to fetch article';
            fastify.log.error(e);
            return reply.status(500).send({ error: msg });
        }
    });

    /** POST /api/articles/public/:id/view, increment view count (published only) */
    fastify.post<{ Params: { id: string } }>('/api/articles/public/:id/view', async (request, reply) => {
        const { id } = request.params;
        try {
            const updated = await prisma.articles.updateMany({
                where: { id, status: 'published', published: true },
                data: { views: { increment: 1 } },
            });
            if (updated.count === 0) return reply.status(404).send({ error: 'Article not found' });
            const row = await prisma.articles.findUnique({ where: { id } });
            return { views: row?.views ?? 0 };
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to record view';
            fastify.log.error(e);
            return reply.status(500).send({ error: msg });
        }
    });

    /** GET /api/articles/mine, author's articles */
    fastify.get('/api/articles/mine', async (request, reply) => {
        const user = await requireAuthor(request, reply);
        if (!user) return;
        try {
            const where = isAdmin(user.role) ? {} : { author_id: user.id };
            const rows = await prisma.articles.findMany({
                where,
                orderBy: { updated_at: 'desc' },
            });
            return rows.map(serializeArticle);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to list your articles';
            fastify.log.error(e);
            return reply.status(500).send({ error: msg });
        }
    });

    /** GET /api/articles/:id, author or admin preview */
    fastify.get<{ Params: { id: string } }>('/api/articles/:id', async (request, reply) => {
        const user = await requireAuth(request, reply);
        if (!user) return;
        const { id } = request.params;
        try {
            const row = await getArticleForUser(id, user);
            if (!row) return reply.status(404).send({ error: 'Article not found' });
            return serializeArticle(row);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to fetch article';
            fastify.log.error(e);
            return reply.status(500).send({ error: msg });
        }
    });

    /** POST /api/articles, create draft */
    fastify.post('/api/articles', async (request, reply) => {
        const user = await requireAuthor(request, reply);
        if (!user) return;
        const body = request.body;
        if (!body || typeof body !== 'object' || Array.isArray(body)) {
            return reply.status(400).send({ error: 'Request body must be a JSON object' });
        }
        try {
            const payload = validateDraftPayload(body);
            if (!payload.title) {
                return reply.status(400).send({ error: 'Title is required' });
            }
            const slug = await uniqueSlug(String(payload.title));
            const dbUser = await prisma.users.findUnique({
                where: { id: user.id },
                select: { full_name: true, email: true },
            });
            const row = await prisma.articles.create({
                data: {
                    title: String(payload.title),
                    slug,
                    excerpt: (payload.excerpt as string | null | undefined) ?? null,
                    content: (payload.content as string | null | undefined) ?? null,
                    category: (payload.category as string | null | undefined) ?? null,
                    image_url: (payload.image_url as string | null | undefined) ?? null,
                    author_id: user.id,
                    author_name: dbUser?.full_name ?? dbUser?.email ?? null,
                    status: 'draft',
                    published: false,
                    featured: false,
                    views: 0,
                },
            });
            return reply.status(201).send(serializeArticle(row));
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to create article';
            return reply.status(400).send({ error: msg });
        }
    });

    /** PATCH /api/articles/:id, update draft/rejected (author) or any (admin) */
    fastify.patch<{ Params: { id: string } }>('/api/articles/:id', async (request, reply) => {
        const user = await requireAuthor(request, reply);
        if (!user) return;
        const { id } = request.params;
        const body = request.body;
        if (!body || typeof body !== 'object' || Array.isArray(body)) {
            return reply.status(400).send({ error: 'Request body must be a JSON object' });
        }
        try {
            const existing = await prisma.articles.findUnique({ where: { id } });
            if (!existing) return reply.status(404).send({ error: 'Article not found' });

            const isOwner = existing.author_id === user.id;
            if (!isAdmin(user.role) && !isOwner) {
                return reply.status(404).send({ error: 'Article not found' });
            }
            if (!isAdmin(user.role) && !authorCanEdit(existing.status)) {
                return reply.status(403).send({
                    error: 'This article cannot be edited while it is pending review or published',
                });
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

            const data: Record<string, unknown> = { ...raw, updated_at: new Date().toISOString() };
            if (raw.title && typeof raw.title === 'string') {
                data.slug = await uniqueSlug(raw.title, id);
            }

            const row = await prisma.articles.update({ where: { id }, data: data as never });
            return serializeArticle(row);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to update article';
            return reply.status(400).send({ error: msg });
        }
    });

    /** POST /api/articles/:id/submit, submit for admin review */
    fastify.post<{ Params: { id: string } }>('/api/articles/:id/submit', async (request, reply) => {
        const user = await requireAuthor(request, reply);
        if (!user) return;
        const { id } = request.params;
        try {
            const existing = await prisma.articles.findUnique({ where: { id } });
            if (!existing) return reply.status(404).send({ error: 'Article not found' });
            if (existing.author_id !== user.id && !isAdmin(user.role)) {
                return reply.status(404).send({ error: 'Article not found' });
            }
            if (!authorCanSubmit(existing.status)) {
                return reply.status(403).send({ error: 'Only draft or rejected articles can be submitted' });
            }
            validateSubmitReady(existing);

            const now = new Date().toISOString();
            const row = await prisma.articles.update({
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
            return serializeArticle(row);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to submit article';
            return reply.status(400).send({ error: msg });
        }
    });

    /** DELETE /api/articles/:id */
    fastify.delete<{ Params: { id: string } }>('/api/articles/:id', async (request, reply) => {
        const user = await requireAuthor(request, reply);
        if (!user) return;
        const { id } = request.params;
        try {
            const existing = await prisma.articles.findUnique({ where: { id } });
            if (!existing) return reply.status(404).send({ error: 'Article not found' });
            const isOwner = existing.author_id === user.id;
            if (!isAdmin(user.role) && !isOwner) {
                return reply.status(404).send({ error: 'Article not found' });
            }
            if (!isAdmin(user.role) && !authorCanDelete(existing.status)) {
                return reply.status(403).send({ error: 'Only draft or rejected articles can be deleted' });
            }
            await prisma.articles.delete({ where: { id } });
            return { success: true };
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to delete article';
            fastify.log.error(e);
            return reply.status(500).send({ error: msg });
        }
    });

    /** POST /api/articles/upload-image, upload image for blog (author) */
    fastify.post('/api/articles/upload-image', async (request, reply) => {
        const user = await requireAuthor(request, reply);
        if (!user) return;
        const body = request.body as {
            file_name?: string;
            file_base64?: string;
            mime_type?: string;
        };
        if (!body?.file_name || !body?.file_base64 || !body?.mime_type) {
            return reply.status(400).send({ error: 'file_name, file_base64, mime_type required' });
        }
        try {
            const buffer = Buffer.from(body.file_base64, 'base64');
            const relativePath = saveBlogImage(user.id, body.file_name, body.mime_type, buffer);
            const url = `/api/articles/media/${relativePath.replace(/^blog-images\//, '')}`;
            return { url, path: relativePath };
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Upload failed';
            return reply.status(400).send({ error: msg });
        }
    });

    /** GET /api/articles/media/:userId/:file, serve uploaded blog image (public) */
    fastify.get<{ Params: { userId: string; file: string } }>(
        '/api/articles/media/:userId/:file',
        async (request, reply) => {
            const { userId, file } = request.params;
            if (!userId || !file || file.includes('..')) {
                return reply.status(400).send({ error: 'Invalid path' });
            }
            try {
                const relativePath = path.posix.join('blog-images', userId, file);
                const absolutePath = resolveBlogImageAbsolutePath(relativePath);
                if (!fs.existsSync(absolutePath)) {
                    return reply.status(404).send({ error: 'Image not found' });
                }
                const ext = path.extname(file).toLowerCase();
                const mime =
                    ext === '.png'
                        ? 'image/png'
                        : ext === '.webp'
                          ? 'image/webp'
                          : ext === '.gif'
                            ? 'image/gif'
                            : 'image/jpeg';
                reply.header('Cache-Control', 'public, max-age=31536000, immutable');
                return reply.type(mime).send(fs.createReadStream(absolutePath));
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Failed to load image';
                return reply.status(400).send({ error: msg });
            }
        }
    );

    /** GET /api/admin/articles, admin moderation queue */
    fastify.get<{ Querystring: { status?: string } }>('/api/admin/articles', async (request, reply) => {
        const user = await requireAdmin(request, reply);
        if (!user) return;
        const statusFilter = parseStatusFilter(request.query?.status);
        if (request.query?.status && statusFilter === undefined) {
            return reply.status(400).send({ error: `Invalid status. Allowed: all, ${ARTICLE_STATUSES.join(', ')}` });
        }
        try {
            const where = statusFilter && statusFilter !== 'all' ? { status: statusFilter } : {};
            const rows = await prisma.articles.findMany({
                where,
                orderBy: [{ status: 'asc' }, { submitted_at: 'desc' }, { created_at: 'desc' }],
            });
            return rows.map(serializeArticle);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to list articles';
            fastify.log.error(e);
            return reply.status(500).send({ error: msg });
        }
    });

    /** POST /api/admin/articles/:id/approve */
    fastify.post<{ Params: { id: string } }>('/api/admin/articles/:id/approve', async (request, reply) => {
        const user = await requireAdmin(request, reply);
        if (!user) return;
        const { id } = request.params;
        try {
            const existing = await prisma.articles.findUnique({ where: { id } });
            if (!existing) return reply.status(404).send({ error: 'Article not found' });
            if (existing.status !== 'pending_review') {
                return reply.status(400).send({ error: 'Only pending articles can be approved' });
            }
            validateSubmitReady(existing);
            const now = new Date().toISOString();
            const row = await prisma.articles.update({
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
            return serializeArticle(row);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to approve article';
            return reply.status(400).send({ error: msg });
        }
    });

    /** POST /api/admin/articles/:id/reject */
    fastify.post<{ Params: { id: string }; Body: { reason?: string } }>(
        '/api/admin/articles/:id/reject',
        async (request, reply) => {
            const user = await requireAdmin(request, reply);
            if (!user) return;
            const { id } = request.params;
            const reason = typeof request.body?.reason === 'string' ? request.body.reason.trim().slice(0, 500) : null;
            try {
                const existing = await prisma.articles.findUnique({ where: { id } });
                if (!existing) return reply.status(404).send({ error: 'Article not found' });
                if (existing.status !== 'pending_review') {
                    return reply.status(400).send({ error: 'Only pending articles can be rejected' });
                }
                const now = new Date().toISOString();
                const row = await prisma.articles.update({
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
                return serializeArticle(row);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Failed to reject article';
                return reply.status(400).send({ error: msg });
            }
        }
    );

    /** POST /api/admin/articles/:id/unpublish, take live article offline */
    fastify.post<{ Params: { id: string }; Body: { reason?: string } }>(
        '/api/admin/articles/:id/unpublish',
        async (request, reply) => {
            const user = await requireAdmin(request, reply);
            if (!user) return;
            const { id } = request.params;
            const reason = typeof request.body?.reason === 'string' ? request.body.reason.trim().slice(0, 500) : null;
            try {
                const existing = await prisma.articles.findUnique({ where: { id } });
                if (!existing) return reply.status(404).send({ error: 'Article not found' });
                if (existing.status !== 'published') {
                    return reply.status(400).send({ error: 'Only published articles can be unpublished' });
                }
                const now = new Date().toISOString();
                const row = await prisma.articles.update({
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
                return serializeArticle(row);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Failed to unpublish article';
                return reply.status(400).send({ error: msg });
            }
        }
    );
}
