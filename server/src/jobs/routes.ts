import { type FastifyInstance } from 'fastify';
import { prisma } from '../db/prisma';
import { authenticateRequest } from '../auth/requestUser';
import {
    JOB_STATUSES,
    type AuthUser,
    authorCanClose,
    authorCanDelete,
    authorCanEdit,
    authorCanSubmit,
    canPostJobs,
    enrichJobsWithEmployer,
    getEmployerProfiles,
    isAdmin,
    isPublicJob,
    resolveEmployerFields,
    stripPrivilegedFields,
    userCanManageJob,
    validateDraftPayload,
    validateSubmitReady,
    type JobStatus,
} from './logic';

async function requireAuth(request: any, reply: any): Promise<AuthUser | null> {
    const ok = await authenticateRequest(request, reply);
    if (!ok) return null;
    return request.user as AuthUser;
}

async function requireEmployer(request: any, reply: any): Promise<AuthUser | null> {
    const user = await requireAuth(request, reply);
    if (!user) return null;
    if (!canPostJobs(user.role, user.account_type)) {
        reply.status(403).send({ error: 'Employer access required to manage job postings' });
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

function parseStatusFilter(raw?: string): JobStatus | 'all' | undefined {
    if (!raw || raw === 'all') return 'all';
    if ((JOB_STATUSES as readonly string[]).includes(raw)) return raw as JobStatus;
    return undefined;
}

export async function jobsRoutes(fastify: FastifyInstance) {
    /** GET /api/jobs/public, published jobs for Career Hub (no auth) */
    fastify.get<{ Querystring: { category?: string; employment_type?: string; location_type?: string; featured?: string } }>(
        '/api/jobs/public',
        async (request, reply) => {
            const q = request.query || {};
            try {
                const rows = await prisma.jobs.findMany({
                    where: { status: 'published', published: true },
                    orderBy: { created_at: 'desc' },
                });
                let list = rows;
                if (q.category) list = list.filter((j) => j.category === q.category);
                if (q.employment_type) list = list.filter((j) => j.employment_type === q.employment_type);
                if (q.location_type) list = list.filter((j) => j.location_type === q.location_type);
                if (q.featured === 'true') list = list.filter((j) => j.featured === true);
                return enrichJobsWithEmployer(list);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Failed to list jobs';
                fastify.log.error(e);
                return reply.status(500).send({ error: msg });
            }
        }
    );

    /** GET /api/jobs/public/featured, featured published jobs */
    fastify.get('/api/jobs/public/featured', async (_request, reply) => {
        try {
            const rows = await prisma.jobs.findMany({
                where: { status: 'published', published: true, featured: true },
                orderBy: { created_at: 'desc' },
                take: 10,
            });
            return enrichJobsWithEmployer(rows);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to list featured jobs';
            fastify.log.error(e);
            return reply.status(500).send({ error: msg });
        }
    });

    /** GET /api/jobs/public/:id, single published job */
    fastify.get<{ Params: { id: string } }>('/api/jobs/public/:id', async (request, reply) => {
        const { id } = request.params;
        try {
            const job = await prisma.jobs.findFirst({
                where: { id, status: 'published', published: true },
            });
            if (!job) return reply.status(404).send({ error: 'Job not found' });
            const [enriched] = await enrichJobsWithEmployer([job]);
            return enriched;
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to fetch job';
            fastify.log.error(e);
            return reply.status(500).send({ error: msg });
        }
    });

    /** Legacy public list, alias for Career Hub */
    fastify.get<{ Querystring: { category?: string; employment_type?: string; location_type?: string; featured?: string } }>(
        '/api/jobs',
        async (request, reply) => {
            const q = request.query || {};
            try {
                const rows = await prisma.jobs.findMany({
                    where: { status: 'published', published: true },
                    orderBy: { created_at: 'desc' },
                });
                let list = rows;
                if (q.category) list = list.filter((j) => j.category === q.category);
                if (q.employment_type) list = list.filter((j) => j.employment_type === q.employment_type);
                if (q.location_type) list = list.filter((j) => j.location_type === q.location_type);
                if (q.featured === 'true') list = list.filter((j) => j.featured === true);
                return enrichJobsWithEmployer(list);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Failed to list jobs';
                fastify.log.error(e);
                return reply.status(500).send({ error: msg });
            }
        }
    );

    /** Legacy featured alias */
    fastify.get('/api/jobs/featured', async (_request, reply) => {
        try {
            const rows = await prisma.jobs.findMany({
                where: { status: 'published', published: true, featured: true },
                orderBy: { created_at: 'desc' },
                take: 10,
            });
            return enrichJobsWithEmployer(rows);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to list featured jobs';
            fastify.log.error(e);
            return reply.status(500).send({ error: msg });
        }
    });

    /** GET /api/jobs/employer-profiles, shops (and companies for admin) user may post as */
    fastify.get('/api/jobs/employer-profiles', async (request, reply) => {
        const user = await requireEmployer(request, reply);
        if (!user) return;
        try {
            const profiles = await getEmployerProfiles(user.id);
            const shops = profiles.shopIds.length
                ? await prisma.shops.findMany({
                      where: { id: { in: profiles.shopIds } },
                      select: { id: true, name: true, image_url: true },
                      orderBy: { name: 'asc' },
                  })
                : [];
            const companies = isAdmin(user.role)
                ? await prisma.companies.findMany({
                      select: { id: true, name: true, logo_url: true },
                      orderBy: { name: 'asc' },
                  })
                : [];
            return { shops, companies, canUseCompany: isAdmin(user.role) };
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to load employer profiles';
            fastify.log.error(e);
            return reply.status(500).send({ error: msg });
        }
    });

    /** GET /api/jobs/my, employer's job postings */
    fastify.get('/api/jobs/my', async (request, reply) => {
        const user = await requireEmployer(request, reply);
        if (!user) return;
        try {
            let rows;
            if (isAdmin(user.role)) {
                rows = await prisma.jobs.findMany({ orderBy: { updated_at: 'desc' } });
            } else {
                const ownedShops = await prisma.shops.findMany({
                    where: { owner_id: user.id },
                    select: { id: true },
                });
                const shopIds = ownedShops.map((s) => s.id);
                rows = await prisma.jobs.findMany({
                    where: {
                        OR: [{ created_by: user.id }, ...(shopIds.length ? [{ shop_id: { in: shopIds } }] : [])],
                    },
                    orderBy: { updated_at: 'desc' },
                });
            }
            return enrichJobsWithEmployer(rows);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to list your jobs';
            fastify.log.error(e);
            return reply.status(500).send({ error: msg });
        }
    });

    /** GET /api/jobs/:id, preview for employer/admin */
    fastify.get<{ Params: { id: string } }>('/api/jobs/:id', async (request, reply) => {
        const user = await requireAuth(request, reply);
        if (!user) return;
        const { id } = request.params;
        try {
            const job = await prisma.jobs.findUnique({ where: { id } });
            if (!job) return reply.status(404).send({ error: 'Job not found' });
            if (isPublicJob(job)) {
                const [enriched] = await enrichJobsWithEmployer([job]);
                return enriched;
            }
            const allowed = await userCanManageJob(user.id, job, user.role);
            if (!allowed) return reply.status(404).send({ error: 'Job not found' });
            const [enriched] = await enrichJobsWithEmployer([job]);
            return enriched;
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to fetch job';
            fastify.log.error(e);
            return reply.status(500).send({ error: msg });
        }
    });

    /** POST /api/jobs, create draft */
    fastify.post('/api/jobs', async (request, reply) => {
        const user = await requireEmployer(request, reply);
        if (!user) return;
        const body = request.body;
        if (!body || typeof body !== 'object' || Array.isArray(body)) {
            return reply.status(400).send({ error: 'Request body must be a JSON object' });
        }
        const raw = body as Record<string, unknown>;
        if (!raw.title || !raw.category || !raw.employment_type || !raw.location_type) {
            return reply.status(400).send({
                error: 'Missing required fields: title, category, employment_type, location_type',
            });
        }
        try {
            const employer = await resolveEmployerFields(user, {
                employer_type: raw.employer_type as string | undefined,
                shop_id: raw.shop_id as string | undefined,
                company_id: raw.company_id as string | undefined,
            });
            const payload = validateDraftPayload(raw);
            const row = await prisma.jobs.create({
                data: {
                    title: String(payload.title ?? raw.title),
                    category: String(payload.category ?? raw.category),
                    employer_type: employer.employer_type,
                    shop_id: employer.shop_id,
                    company_id: employer.company_id,
                    employment_type: String(payload.employment_type ?? raw.employment_type),
                    location_type: String(payload.location_type ?? raw.location_type),
                    location_text: (payload.location_text as string | null | undefined) ?? null,
                    description: (payload.description as string | null | undefined) ?? null,
                    responsibilities: (payload.responsibilities as string | null | undefined) ?? null,
                    required_experience_skills: (payload.required_experience_skills as string | null | undefined) ?? null,
                    salary_min: (payload.salary_min as number | null | undefined) ?? null,
                    salary_max: (payload.salary_max as number | null | undefined) ?? null,
                    salary_currency: (payload.salary_currency as string | undefined) ?? 'USD',
                    application_deadline: (payload.application_deadline as string | null | undefined) ?? null,
                    image_url: (payload.image_url as string | null | undefined) ?? null,
                    status: 'draft',
                    published: false,
                    featured: false,
                    created_by: user.id,
                },
            });
            const [enriched] = await enrichJobsWithEmployer([row]);
            return reply.status(201).send(enriched);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to create job';
            return reply.status(400).send({ error: msg });
        }
    });

    /** PATCH /api/jobs/:id */
    fastify.patch<{ Params: { id: string } }>('/api/jobs/:id', async (request, reply) => {
        const user = await requireEmployer(request, reply);
        if (!user) return;
        const { id } = request.params;
        const body = request.body;
        if (!body || typeof body !== 'object' || Array.isArray(body)) {
            return reply.status(400).send({ error: 'Request body must be a JSON object' });
        }
        try {
            const existing = await prisma.jobs.findUnique({ where: { id } });
            if (!existing) return reply.status(404).send({ error: 'Job not found' });

            const allowed = await userCanManageJob(user.id, existing, user.role);
            if (!allowed) return reply.status(404).send({ error: 'Job not found' });

            const raw = body as Record<string, unknown>;
            const now = new Date().toISOString();

            if (!isAdmin(user.role)) {
                if (raw.status === 'published' || raw.status === 'pending_review') {
                    return reply.status(403).send({ error: 'Jobs must be submitted for admin review before going live' });
                }
                if (raw.status === 'closed') {
                    if (!authorCanClose(existing.status)) {
                        return reply.status(403).send({ error: 'Only published jobs can be closed' });
                    }
                    const row = await prisma.jobs.update({
                        where: { id },
                        data: { status: 'closed', published: false, updated_at: now },
                    });
                    const [enriched] = await enrichJobsWithEmployer([row]);
                    return enriched;
                }
                if (!authorCanEdit(existing.status)) {
                    return reply.status(403).send({
                        error: 'This job cannot be edited while it is pending review or live',
                    });
                }
            }

            let data: Record<string, unknown>;
            if (isAdmin(user.role)) {
                data = stripPrivilegedFields(raw);
                if (raw.featured !== undefined) data.featured = Boolean(raw.featured);
            } else {
                data = validateDraftPayload(raw);
            }

            if (Object.keys(data).length === 0) {
                return reply.status(400).send({ error: 'No valid fields to update' });
            }

            data.updated_at = now;
            const row = await prisma.jobs.update({ where: { id }, data: data as never });
            const [enriched] = await enrichJobsWithEmployer([row]);
            return enriched;
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to update job';
            return reply.status(400).send({ error: msg });
        }
    });

    /** POST /api/jobs/:id/submit, submit for admin review */
    fastify.post<{ Params: { id: string } }>('/api/jobs/:id/submit', async (request, reply) => {
        const user = await requireEmployer(request, reply);
        if (!user) return;
        const { id } = request.params;
        try {
            const existing = await prisma.jobs.findUnique({ where: { id } });
            if (!existing) return reply.status(404).send({ error: 'Job not found' });
            const allowed = await userCanManageJob(user.id, existing, user.role);
            if (!allowed) return reply.status(404).send({ error: 'Job not found' });
            if (!authorCanSubmit(existing.status)) {
                return reply.status(403).send({ error: 'Only draft or rejected jobs can be submitted' });
            }
            validateSubmitReady(existing);

            const now = new Date().toISOString();
            const row = await prisma.jobs.update({
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
            const [enriched] = await enrichJobsWithEmployer([row]);
            return enriched;
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to submit job';
            return reply.status(400).send({ error: msg });
        }
    });

    /** POST /api/jobs/:id/close, employer closes a live posting */
    fastify.post<{ Params: { id: string } }>('/api/jobs/:id/close', async (request, reply) => {
        const user = await requireEmployer(request, reply);
        if (!user) return;
        const { id } = request.params;
        try {
            const existing = await prisma.jobs.findUnique({ where: { id } });
            if (!existing) return reply.status(404).send({ error: 'Job not found' });
            const allowed = await userCanManageJob(user.id, existing, user.role);
            if (!allowed) return reply.status(404).send({ error: 'Job not found' });
            if (!authorCanClose(existing.status)) {
                return reply.status(403).send({ error: 'Only published jobs can be closed' });
            }
            const now = new Date().toISOString();
            const row = await prisma.jobs.update({
                where: { id },
                data: { status: 'closed', published: false, updated_at: now },
            });
            const [enriched] = await enrichJobsWithEmployer([row]);
            return enriched;
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to close job';
            return reply.status(400).send({ error: msg });
        }
    });

    /** DELETE /api/jobs/:id */
    fastify.delete<{ Params: { id: string } }>('/api/jobs/:id', async (request, reply) => {
        const user = await requireEmployer(request, reply);
        if (!user) return;
        const { id } = request.params;
        try {
            const existing = await prisma.jobs.findUnique({ where: { id } });
            if (!existing) return reply.status(404).send({ error: 'Job not found' });
            const allowed = await userCanManageJob(user.id, existing, user.role);
            if (!allowed) return reply.status(404).send({ error: 'Job not found' });
            if (!isAdmin(user.role) && !authorCanDelete(existing.status)) {
                return reply.status(403).send({ error: 'Only draft or rejected jobs can be deleted' });
            }
            await prisma.jobs.delete({ where: { id } });
            return { success: true };
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to delete job';
            fastify.log.error(e);
            return reply.status(500).send({ error: msg });
        }
    });

    /** GET /api/admin/jobs, moderation queue */
    fastify.get<{ Querystring: { status?: string } }>('/api/admin/jobs', async (request, reply) => {
        const user = await requireAdmin(request, reply);
        if (!user) return;
        const statusFilter = parseStatusFilter(request.query?.status);
        if (request.query?.status && statusFilter === undefined) {
            return reply.status(400).send({ error: `Invalid status. Allowed: all, ${JOB_STATUSES.join(', ')}` });
        }
        try {
            const where = statusFilter && statusFilter !== 'all' ? { status: statusFilter } : {};
            const rows = await prisma.jobs.findMany({
                where,
                orderBy: [{ status: 'asc' }, { submitted_at: 'desc' }, { created_at: 'desc' }],
            });
            return enrichJobsWithEmployer(rows);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to list jobs';
            fastify.log.error(e);
            return reply.status(500).send({ error: msg });
        }
    });

    /** POST /api/admin/jobs/:id/approve */
    fastify.post<{ Params: { id: string } }>('/api/admin/jobs/:id/approve', async (request, reply) => {
        const user = await requireAdmin(request, reply);
        if (!user) return;
        const { id } = request.params;
        try {
            const existing = await prisma.jobs.findUnique({ where: { id } });
            if (!existing) return reply.status(404).send({ error: 'Job not found' });
            if (existing.status !== 'pending_review') {
                return reply.status(400).send({ error: 'Only pending jobs can be approved' });
            }
            validateSubmitReady(existing);
            const now = new Date().toISOString();
            const row = await prisma.jobs.update({
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
            const [enriched] = await enrichJobsWithEmployer([row]);
            return enriched;
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to approve job';
            return reply.status(400).send({ error: msg });
        }
    });

    /** POST /api/admin/jobs/:id/reject */
    fastify.post<{ Params: { id: string }; Body: { reason?: string } }>(
        '/api/admin/jobs/:id/reject',
        async (request, reply) => {
            const user = await requireAdmin(request, reply);
            if (!user) return;
            const { id } = request.params;
            const reason =
                typeof request.body?.reason === 'string' ? request.body.reason.trim().slice(0, 500) : null;
            try {
                const existing = await prisma.jobs.findUnique({ where: { id } });
                if (!existing) return reply.status(404).send({ error: 'Job not found' });
                if (existing.status !== 'pending_review') {
                    return reply.status(400).send({ error: 'Only pending jobs can be rejected' });
                }
                const now = new Date().toISOString();
                const row = await prisma.jobs.update({
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
                const [enriched] = await enrichJobsWithEmployer([row]);
                return enriched;
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Failed to reject job';
                return reply.status(400).send({ error: msg });
            }
        }
    );

    /** POST /api/admin/jobs/:id/unpublish */
    fastify.post<{ Params: { id: string }; Body: { reason?: string } }>(
        '/api/admin/jobs/:id/unpublish',
        async (request, reply) => {
            const user = await requireAdmin(request, reply);
            if (!user) return;
            const { id } = request.params;
            const reason =
                typeof request.body?.reason === 'string' ? request.body.reason.trim().slice(0, 500) : null;
            try {
                const existing = await prisma.jobs.findUnique({ where: { id } });
                if (!existing) return reply.status(404).send({ error: 'Job not found' });
                if (existing.status !== 'published') {
                    return reply.status(400).send({ error: 'Only published jobs can be unpublished' });
                }
                const now = new Date().toISOString();
                const row = await prisma.jobs.update({
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
                const [enriched] = await enrichJobsWithEmployer([row]);
                return enriched;
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Failed to unpublish job';
                return reply.status(400).send({ error: msg });
            }
        }
    );

    /** GET /api/companies, list companies (admin job form + legacy) */
    fastify.get('/api/companies', async (_request, reply) => {
        try {
            return prisma.companies.findMany({ orderBy: { name: 'asc' } });
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to list companies';
            fastify.log.error(e);
            return reply.status(500).send({ error: msg });
        }
    });
}
