import { FastifyInstance } from 'fastify';
import { db } from '../db';
import * as schema from '../db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';

export async function jobsRoutes(fastify: FastifyInstance) {
    const getUserId = async (request: any): Promise<string | null> => {
        try {
            await request.jwtVerify();
            return (request.user as { id: string }).id;
        } catch {
            return null;
        }
    };

    /** GET /api/jobs — list published jobs (optional filters) */
    fastify.get<{ Querystring: { category?: string; employment_type?: string; location_type?: string; featured?: string } }>(
        '/api/jobs',
        async (request, reply) => {
            const q = request.query || {};
            try {
                let query = db
                    .select()
                    .from(schema.jobs)
                    .where(eq(schema.jobs.status, 'published'))
                    .orderBy(desc(schema.jobs.created_at));

                const rows = await query;
                let list = rows;

                if (q.category) list = list.filter((j) => j.category === q.category);
                if (q.employment_type) list = list.filter((j) => j.employment_type === q.employment_type);
                if (q.location_type) list = list.filter((j) => j.location_type === q.location_type);
                if (q.featured === 'true') list = list.filter((j) => j.featured === true);

                const jobIds = list.map((j) => j.id);
                if (jobIds.length === 0) return list.map((j) => ({ ...j, employer_name: null, employer_image: null }));

                const withEmployer = await Promise.all(
                    list.map(async (job) => {
                        let employer_name: string | null = null;
                        let employer_image: string | null = null;
                        if (job.employer_type === 'shop' && job.shop_id) {
                            const [shop] = await db.select({ name: schema.shops.name, image_url: schema.shops.image_url }).from(schema.shops).where(eq(schema.shops.id, job.shop_id));
                            if (shop) {
                                employer_name = shop.name;
                                employer_image = shop.image_url ?? null;
                            }
                        }
                        if (job.employer_type === 'company' && job.company_id) {
                            const [co] = await db.select({ name: schema.companies.name, logo_url: schema.companies.logo_url }).from(schema.companies).where(eq(schema.companies.id, job.company_id));
                            if (co) {
                                employer_name = co.name;
                                employer_image = co.logo_url ?? null;
                            }
                        }
                        return { ...job, employer_name, employer_image };
                    })
                );
                return withEmployer;
            } catch (e: any) {
                fastify.log.error(e);
                return reply.status(500).send({ error: e.message });
            }
        }
    );

    /** GET /api/jobs/featured — featured published jobs */
    fastify.get('/api/jobs/featured', async (request, reply) => {
        try {
            const rows = await db
                .select()
                .from(schema.jobs)
                .where(and(eq(schema.jobs.status, 'published'), eq(schema.jobs.featured, true)))
                .orderBy(desc(schema.jobs.created_at))
                .limit(10);
            const withEmployer = await Promise.all(
                rows.map(async (job) => {
                    let employer_name: string | null = null;
                    let employer_image: string | null = null;
                    if (job.employer_type === 'shop' && job.shop_id) {
                        const [shop] = await db.select().from(schema.shops).where(eq(schema.shops.id, job.shop_id));
                        if (shop) { employer_name = shop.name; employer_image = shop.image_url ?? null; }
                    }
                    if (job.employer_type === 'company' && job.company_id) {
                        const [co] = await db.select().from(schema.companies).where(eq(schema.companies.id, job.company_id));
                        if (co) { employer_name = co.name; employer_image = co.logo_url ?? null; }
                    }
                    return { ...job, employer_name, employer_image };
                })
            );
            return withEmployer;
        } catch (e: any) {
            fastify.log.error(e);
            return reply.status(500).send({ error: e.message });
        }
    });

    /** GET /api/jobs/:id — single job with employer info */
    fastify.get<{ Params: { id: string } }>('/api/jobs/:id', async (request, reply) => {
        const { id } = request.params;
        try {
            const [job] = await db.select().from(schema.jobs).where(eq(schema.jobs.id, id));
            if (!job) return reply.status(404).send({ error: 'Job not found' });
            let employer_name: string | null = null;
            let employer_image: string | null = null;
            if (job.employer_type === 'shop' && job.shop_id) {
                const [shop] = await db.select().from(schema.shops).where(eq(schema.shops.id, job.shop_id));
                if (shop) { employer_name = shop.name; employer_image = shop.image_url ?? null; }
            }
            if (job.employer_type === 'company' && job.company_id) {
                const [co] = await db.select().from(schema.companies).where(eq(schema.companies.id, job.company_id));
                if (co) { employer_name = co.name; employer_image = co.logo_url ?? null; }
            }
            return { ...job, employer_name, employer_image };
        } catch (e: any) {
            fastify.log.error(e);
            return reply.status(500).send({ error: e.message });
        }
    });

    /** GET /api/jobs/my — my jobs as employer (created_by or shop owner) */
    fastify.get('/api/jobs/my', async (request, reply) => {
        const userId = await getUserId(request);
        if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
        try {
            const rows = await db.select().from(schema.jobs).where(eq(schema.jobs.created_by, userId)).orderBy(desc(schema.jobs.created_at));
            const withEmployer = await Promise.all(
                rows.map(async (job) => {
                    let employer_name: string | null = null;
                    if (job.employer_type === 'shop' && job.shop_id) {
                        const [shop] = await db.select({ name: schema.shops.name }).from(schema.shops).where(eq(schema.shops.id, job.shop_id));
                        if (shop) employer_name = shop.name;
                    }
                    if (job.employer_type === 'company' && job.company_id) {
                        const [co] = await db.select({ name: schema.companies.name }).from(schema.companies).where(eq(schema.companies.id, job.company_id));
                        if (co) employer_name = co.name;
                    }
                    return { ...job, employer_name };
                })
            );
            return withEmployer;
        } catch (e: any) {
            fastify.log.error(e);
            return reply.status(500).send({ error: e.message });
        }
    });

    const canEditJob = async (userId: string, job: typeof schema.jobs.$inferSelect): Promise<boolean> => {
        if (job.created_by === userId) return true;
        if (job.employer_type === 'shop' && job.shop_id) {
            const [shop] = await db.select({ owner_id: schema.shops.owner_id }).from(schema.shops).where(eq(schema.shops.id, job.shop_id));
            return shop?.owner_id === userId ?? false;
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
            const [inserted] = await db
                .insert(schema.jobs)
                .values({
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
                })
                .returning();
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
            const [job] = await db.select().from(schema.jobs).where(eq(schema.jobs.id, id));
            if (!job) return reply.status(404).send({ error: 'Job not found' });
            const allowed = await canEditJob(userId, job);
            if (!allowed) return reply.status(403).send({ error: 'Not allowed to edit this job' });
            const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
            const fields = ['title', 'category', 'employment_type', 'location_type', 'location_text', 'description', 'responsibilities', 'required_experience_skills', 'salary_min', 'salary_max', 'salary_currency', 'application_deadline', 'status', 'featured', 'image_url'];
            for (const f of fields) if (body[f] !== undefined) updates[f] = body[f];
            const [updated] = await db.update(schema.jobs).set(updates as any).where(eq(schema.jobs.id, id)).returning();
            return updated;
        } catch (e: any) {
            fastify.log.error(e);
            return reply.status(500).send({ error: e.message });
        }
    });

    /** GET /api/companies — list companies (for employer dropdown) */
    fastify.get('/api/companies', async (_request, reply) => {
        try {
            return db.select().from(schema.companies).orderBy(schema.companies.name);
        } catch (e: any) {
            fastify.log.error(e);
            return reply.status(500).send({ error: e.message });
        }
    });

    // GET /api/shops is already registered by generic entity routes in index.ts — do not duplicate.
}
