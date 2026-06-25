import { FastifyInstance } from 'fastify';
import type { jobs as JobRow } from '@prisma/client';
import { prisma } from '../db/prisma';
import { resolveOptionalUserId } from '../auth/requestUser';

export async function jobsRoutes(fastify: FastifyInstance) {
    const getUserId = (request: any): Promise<string | null> => resolveOptionalUserId(request);

    /** Batch-enrich jobs with employer name/image (eliminates N+1) */
    async function enrichJobsWithEmployer(jobs: JobRow[]) {
        if (jobs.length === 0) return [];

        const shopIds = [...new Set(jobs.filter(j => j.employer_type === 'shop' && j.shop_id).map(j => j.shop_id!))];
        const companyIds = [...new Set(jobs.filter(j => j.employer_type === 'company' && j.company_id).map(j => j.company_id!))];

        const shopMap = new Map<string, { name: string; image_url: string | null }>();
        const companyMap = new Map<string, { name: string; logo_url: string | null }>();

        if (shopIds.length > 0) {
            const shops = await prisma.shops.findMany({ where: { id: { in: shopIds } }, select: { id: true, name: true, image_url: true } });
            for (const s of shops) shopMap.set(s.id, s);
        }
        if (companyIds.length > 0) {
            const companies = await prisma.companies.findMany({ where: { id: { in: companyIds } }, select: { id: true, name: true, logo_url: true } });
            for (const c of companies) companyMap.set(c.id, c);
        }

        return jobs.map(job => {
            let employer_name: string | null = null;
            let employer_image: string | null = null;
            if (job.employer_type === 'shop' && job.shop_id) {
                const s = shopMap.get(job.shop_id);
                if (s) { employer_name = s.name; employer_image = s.image_url; }
            } else if (job.employer_type === 'company' && job.company_id) {
                const c = companyMap.get(job.company_id);
                if (c) { employer_name = c.name; employer_image = c.logo_url; }
            }
            return { ...job, employer_name, employer_image };
        });
    }

    /** GET /api/jobs — list published jobs (optional filters) */
    fastify.get<{ Querystring: { category?: string; employment_type?: string; location_type?: string; featured?: string } }>(
        '/api/jobs',
        async (request, reply) => {
            const q = request.query || {};
            try {
                const rows = await prisma.jobs.findMany({
                    where: { status: 'published' },
                    orderBy: { created_at: 'desc' },
                });

                let list = rows;
                if (q.category) list = list.filter((j) => j.category === q.category);
                if (q.employment_type) list = list.filter((j) => j.employment_type === q.employment_type);
                if (q.location_type) list = list.filter((j) => j.location_type === q.location_type);
                if (q.featured === 'true') list = list.filter((j) => j.featured === true);

                return enrichJobsWithEmployer(list);
            } catch (e: any) {
                fastify.log.error(e);
                return reply.status(500).send({ error: e.message });
            }
        }
    );

    /** GET /api/jobs/featured — featured published jobs */
    fastify.get('/api/jobs/featured', async (request, reply) => {
        try {
            const rows = await prisma.jobs.findMany({
                where: { status: 'published', featured: true },
                orderBy: { created_at: 'desc' },
                take: 10,
            });
            return enrichJobsWithEmployer(rows);
        } catch (e: any) {
            fastify.log.error(e);
            return reply.status(500).send({ error: e.message });
        }
    });

    /** GET /api/jobs/:id — single job with employer info */
    fastify.get<{ Params: { id: string } }>('/api/jobs/:id', async (request, reply) => {
        const { id } = request.params;
        try {
            const job = await prisma.jobs.findUnique({ where: { id } });
            if (!job) return reply.status(404).send({ error: 'Job not found' });
            const [enriched] = await enrichJobsWithEmployer([job]);
            return enriched;
        } catch (e: any) {
            fastify.log.error(e);
            return reply.status(500).send({ error: e.message });
        }
    });

    /** GET /api/jobs/my — my jobs as employer */
    fastify.get('/api/jobs/my', async (request, reply) => {
        const userId = await getUserId(request);
        if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
        try {
            const rows = await prisma.jobs.findMany({ where: { created_by: userId }, orderBy: { created_at: 'desc' } });
            return enrichJobsWithEmployer(rows);
        } catch (e: any) {
            fastify.log.error(e);
            return reply.status(500).send({ error: e.message });
        }
    });

    const canEditJob = async (userId: string, job: JobRow): Promise<boolean> => {
        if (job.created_by === userId) return true;
        if (job.employer_type === 'shop' && job.shop_id) {
            const shop = await prisma.shops.findUnique({ where: { id: job.shop_id }, select: { owner_id: true } });
            return !!shop && shop.owner_id === userId;
        }
        return false;
    };

    /** POST /api/jobs — create job (auth required) */
    fastify.post('/api/jobs', async (request, reply) => {
        const userId = await getUserId(request);
        if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
        const body = request.body as any;
        if (!body.title || !body.category || !body.employer_type || !body.employment_type || !body.location_type) {
            return reply.status(400).send({ error: 'Missing required fields: title, category, employer_type, employment_type, location_type' });
        }
        if (body.employer_type === 'shop' && !body.shop_id) return reply.status(400).send({ error: 'shop_id required for employer_type shop' });
        if (body.employer_type === 'company' && !body.company_id) return reply.status(400).send({ error: 'company_id required for employer_type company' });
        try {
            const inserted = await prisma.jobs.create({
                data: {
                    title: body.title,
                    category: body.category,
                    employer_type: body.employer_type,
                    shop_id: body.shop_id ?? null,
                    company_id: body.company_id ?? null,
                    employment_type: body.employment_type,
                    location_type: body.location_type,
                    location_text: body.location_text ?? null,
                    description: body.description ?? null,
                    responsibilities: body.responsibilities ?? null,
                    required_experience_skills: body.required_experience_skills ?? null,
                    salary_min: body.salary_min ?? null,
                    salary_max: body.salary_max ?? null,
                    salary_currency: body.salary_currency ?? 'USD',
                    application_deadline: body.application_deadline ?? null,
                    status: (body.status as 'draft' | 'published' | 'closed') || 'draft',
                    featured: body.featured ?? false,
                    image_url: body.image_url ?? null,
                    created_by: userId,
                },
            });
            return inserted;
        } catch (e: any) {
            fastify.log.error(e);
            return reply.status(500).send({ error: e.message });
        }
    });

    /** PATCH /api/jobs/:id */
    fastify.patch<{ Params: { id: string }; Body: any }>('/api/jobs/:id', async (request, reply) => {
        const userId = await getUserId(request);
        if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
        const { id } = request.params;
        const body = request.body as any;
        try {
            const job = await prisma.jobs.findUnique({ where: { id } });
            if (!job) return reply.status(404).send({ error: 'Job not found' });
            const allowed = await canEditJob(userId, job);
            if (!allowed) return reply.status(403).send({ error: 'Not allowed to edit this job' });
            const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
            const fields = ['title', 'category', 'employment_type', 'location_type', 'location_text', 'description', 'responsibilities', 'required_experience_skills', 'salary_min', 'salary_max', 'salary_currency', 'application_deadline', 'status', 'featured', 'image_url'];
            for (const f of fields) if (body[f] !== undefined) updates[f] = body[f];
            const updated = await prisma.jobs.update({ where: { id }, data: updates as any });
            return updated;
        } catch (e: any) {
            fastify.log.error(e);
            return reply.status(500).send({ error: e.message });
        }
    });

    /** GET /api/companies — list companies (for employer dropdown) */
    fastify.get('/api/companies', async (_request, reply) => {
        try {
            return prisma.companies.findMany({ orderBy: { name: 'asc' } });
        } catch (e: any) {
            fastify.log.error(e);
            return reply.status(500).send({ error: e.message });
        }
    });

    // GET /api/shops is already registered by generic entity routes in index.ts — do not duplicate.
}
