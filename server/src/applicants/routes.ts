import { FastifyInstance } from 'fastify';
import { prisma } from '../db/prisma';
import { resolveOptionalUserId } from '../auth/requestUser';

export async function applicantsRoutes(fastify: FastifyInstance) {
    const getUserId = (request: any): Promise<string | null> => resolveOptionalUserId(request);

    /** GET /api/applicant/profile — my applicant profile */
    fastify.get('/api/applicant/profile', async (request, reply) => {
        const userId = await getUserId(request);
        if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
        try {
            const profile = await prisma.applicant_profiles.findUnique({ where: { user_id: userId } });
            return profile || null;
        } catch (e: any) {
            fastify.log.error(e);
            return reply.status(500).send({ error: e.message });
        }
    });

    /** PUT /api/applicant/profile — create or update my profile */
    fastify.put('/api/applicant/profile', async (request, reply) => {
        const userId = await getUserId(request);
        if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
        const body = request.body as any;
        try {
            const existing = await prisma.applicant_profiles.findUnique({ where: { user_id: userId } });
            const data = {
                professional_summary: body.professional_summary ?? existing?.professional_summary ?? null,
                work_experience: typeof body.work_experience === 'string' ? body.work_experience : (body.work_experience ? JSON.stringify(body.work_experience) : existing?.work_experience ?? null),
                skills: typeof body.skills === 'string' ? body.skills : (body.skills ? JSON.stringify(body.skills) : existing?.skills ?? null),
                certifications: typeof body.certifications === 'string' ? body.certifications : (body.certifications ? JSON.stringify(body.certifications) : existing?.certifications ?? null),
                portfolio_links: typeof body.portfolio_links === 'string' ? body.portfolio_links : (body.portfolio_links ? JSON.stringify(body.portfolio_links) : existing?.portfolio_links ?? null),
                availability: body.availability ?? existing?.availability ?? null,
                preferred_job_types: typeof body.preferred_job_types === 'string' ? body.preferred_job_types : (body.preferred_job_types ? JSON.stringify(body.preferred_job_types) : existing?.preferred_job_types ?? null),
                years_experience: body.years_experience ?? existing?.years_experience ?? null,
                updated_at: new Date().toISOString(),
            };
            if (existing) {
                const updated = await prisma.applicant_profiles.update({ where: { id: existing.id }, data });
                return updated;
            }
            const created = await prisma.applicant_profiles.create({ data: { user_id: userId, ...data } });
            return created;
        } catch (e: any) {
            fastify.log.error(e);
            return reply.status(500).send({ error: e.message });
        }
    });

    /** GET /api/applicant/credentials — my credentials */
    fastify.get('/api/applicant/credentials', async (request, reply) => {
        const userId = await getUserId(request);
        if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
        try {
            return prisma.applicant_credentials.findMany({ where: { user_id: userId }, orderBy: { created_at: 'desc' } });
        } catch (e: any) {
            fastify.log.error(e);
            return reply.status(500).send({ error: e.message });
        }
    });

    /** POST /api/applicant/credentials — add credential (file_path from client; no multipart for MVP) */
    fastify.post('/api/applicant/credentials', async (request, reply) => {
        const userId = await getUserId(request);
        if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
        const body = request.body as { type: string; file_name: string; file_path: string; file_size?: number; mime_type?: string };
        if (!body.type || !body.file_name || !body.file_path) return reply.status(400).send({ error: 'type, file_name, file_path required' });
        if (!['cv', 'certificate', 'portfolio'].includes(body.type)) return reply.status(400).send({ error: 'Invalid type' });
        try {
            const row = await prisma.applicant_credentials.create({
                data: {
                    user_id: userId,
                    type: body.type as 'cv' | 'certificate' | 'portfolio',
                    file_name: body.file_name,
                    file_path: body.file_path,
                    file_size: body.file_size ?? null,
                    mime_type: body.mime_type ?? null,
                },
            });
            return row;
        } catch (e: any) {
            fastify.log.error(e);
            return reply.status(500).send({ error: e.message });
        }
    });

    /** GET /api/applicant/applications — my applications (batch-enriched) */
    fastify.get('/api/applicant/applications', async (request, reply) => {
        const userId = await getUserId(request);
        if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
        try {
            const list = await prisma.job_applications.findMany({ where: { user_id: userId }, orderBy: { created_at: 'desc' } });
            if (list.length === 0) return [];

            const jobIds = [...new Set(list.map(a => a.job_id))];
            const jobs = await prisma.jobs.findMany({ where: { id: { in: jobIds } } });
            const jobMap = new Map(jobs.map(j => [j.id, j]));

            const shopIds = [...new Set(jobs.filter(j => j.employer_type === 'shop' && j.shop_id).map(j => j.shop_id!))];
            const companyIds = [...new Set(jobs.filter(j => j.employer_type === 'company' && j.company_id).map(j => j.company_id!))];
            const shopMap = new Map<string, string>();
            const companyMap = new Map<string, string>();
            if (shopIds.length > 0) {
                const shops = await prisma.shops.findMany({ where: { id: { in: shopIds } }, select: { id: true, name: true } });
                for (const s of shops) shopMap.set(s.id, s.name);
            }
            if (companyIds.length > 0) {
                const cos = await prisma.companies.findMany({ where: { id: { in: companyIds } }, select: { id: true, name: true } });
                for (const c of cos) companyMap.set(c.id, c.name);
            }

            return list.map(app => {
                const job = jobMap.get(app.job_id);
                let employer_name: string | null = null;
                if (job?.employer_type === 'shop' && job.shop_id) employer_name = shopMap.get(job.shop_id) ?? null;
                if (job?.employer_type === 'company' && job.company_id) employer_name = companyMap.get(job.company_id) ?? null;
                return { ...app, job_title: job?.title, employer_name };
            });
        } catch (e: any) {
            fastify.log.error(e);
            return reply.status(500).send({ error: e.message });
        }
    });

    /** POST /api/applicant/applications — create application */
    fastify.post('/api/applicant/applications', async (request, reply) => {
        const userId = await getUserId(request);
        if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
        const body = request.body as { job_id: string; cover_letter?: string; custom_data?: any; credential_ids?: string[] };
        if (!body.job_id) return reply.status(400).send({ error: 'job_id required' });
        try {
            const job = await prisma.jobs.findUnique({ where: { id: body.job_id } });
            if (!job) return reply.status(404).send({ error: 'Job not found' });
            if (job.status !== 'published') return reply.status(400).send({ error: 'Job is not open for applications' });
            const existing = await prisma.job_applications.findMany({ where: { job_id: body.job_id, user_id: userId } });
            if (existing.length > 0) return reply.status(400).send({ error: 'Already applied' });
            const app = await prisma.job_applications.create({
                data: {
                    job_id: body.job_id,
                    user_id: userId,
                    cover_letter: body.cover_letter ?? null,
                    custom_data: body.custom_data ? JSON.stringify(body.custom_data) : null,
                },
            });
            if (body.credential_ids?.length) {
                const creds = await prisma.applicant_credentials.findMany({ where: { user_id: userId } });
                for (const cid of body.credential_ids) {
                    const c = creds.find((x) => x.id === cid);
                    if (c) await prisma.application_documents.create({ data: { application_id: app.id, type: c.type, file_name: c.file_name, file_path: c.file_path, file_size: c.file_size, mime_type: c.mime_type } });
                }
            }
            return app;
        } catch (e: any) {
            fastify.log.error(e);
            return reply.status(500).send({ error: e.message });
        }
    });

    /** GET /api/jobs/:jobId/applications — list applicants (employer) */
    fastify.get<{ Params: { jobId: string } }>('/api/jobs/:jobId/applications', async (request, reply) => {
        const userId = await getUserId(request);
        if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
        const { jobId } = request.params;
        try {
            const job = await prisma.jobs.findUnique({ where: { id: jobId } });
            if (!job) return reply.status(404).send({ error: 'Job not found' });
            if (job.created_by !== userId) {
                const shop = job.shop_id ? await prisma.shops.findUnique({ where: { id: job.shop_id }, select: { owner_id: true } }) : null;
                if (!shop || shop.owner_id !== userId) return reply.status(403).send({ error: 'Not allowed' });
            }
            const list = await prisma.job_applications.findMany({ where: { job_id: jobId }, orderBy: { created_at: 'desc' } });
            const withUser = await Promise.all(list.map(async (app) => {
                const u = await prisma.users.findUnique({ where: { id: app.user_id }, select: { full_name: true, email: true, avatar_url: true } });
                const profile = await prisma.applicant_profiles.findUnique({ where: { user_id: app.user_id } });
                const creds = await prisma.applicant_credentials.findMany({ where: { user_id: app.user_id } });
                const docs = await prisma.application_documents.findMany({ where: { application_id: app.id } });
                return { ...app, applicant_name: u?.full_name, applicant_email: u?.email, applicant_avatar: u?.avatar_url, profile, credentials: creds, documents: docs };
            }));
            return withUser;
        } catch (e: any) {
            fastify.log.error(e);
            return reply.status(500).send({ error: e.message });
        }
    });

    /** PATCH /api/applications/:id — update status (employer) */
    fastify.patch<{ Params: { id: string }; Body: { status: string } }>('/api/applications/:id', async (request, reply) => {
        const userId = await getUserId(request);
        if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
        const { id } = request.params;
        const body = request.body as { status: string };
        const valid = ['received', 'under_review', 'shortlisted', 'rejected', 'hired'];
        if (!body.status || !valid.includes(body.status)) return reply.status(400).send({ error: 'Valid status required' });
        try {
            const app = await prisma.job_applications.findUnique({ where: { id } });
            if (!app) return reply.status(404).send({ error: 'Application not found' });
            const job = await prisma.jobs.findUnique({ where: { id: app.job_id } });
            if (!job || job.created_by !== userId) return reply.status(403).send({ error: 'Not allowed' });
            const updated = await prisma.job_applications.update({ where: { id }, data: { status: body.status as any, updated_at: new Date().toISOString() } });
            return updated;
        } catch (e: any) {
            fastify.log.error(e);
            return reply.status(500).send({ error: e.message });
        }
    });

    /** GET /api/applicant/saved — my saved jobs */
    fastify.get('/api/applicant/saved', async (request, reply) => {
        const userId = await getUserId(request);
        if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
        try {
            const rows = await prisma.saved_jobs.findMany({ where: { user_id: userId }, orderBy: { created_at: 'desc' } });
            const withJob = await Promise.all(rows.map(async (s) => {
                const job = await prisma.jobs.findUnique({ where: { id: s.job_id } });
                if (!job) return null;
                let employer_name: string | null = null;
                if (job.employer_type === 'shop' && job.shop_id) {
                    const shop = await prisma.shops.findUnique({ where: { id: job.shop_id }, select: { name: true } });
                    if (shop) employer_name = shop.name;
                }
                if (job.employer_type === 'company' && job.company_id) {
                    const co = await prisma.companies.findUnique({ where: { id: job.company_id }, select: { name: true } });
                    if (co) employer_name = co.name;
                }
                return { ...job, employer_name, saved_at: s.created_at };
            }));
            return withJob.filter(Boolean);
        } catch (e: any) {
            fastify.log.error(e);
            return reply.status(500).send({ error: e.message });
        }
    });

    /** POST /api/applicant/saved — save job */
    fastify.post<{ Body: { job_id: string } }>('/api/applicant/saved', async (request, reply) => {
        const userId = await getUserId(request);
        if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
        const body = request.body as { job_id: string };
        if (!body.job_id) return reply.status(400).send({ error: 'job_id required' });
        try {
            const existing = await prisma.saved_jobs.findMany({ where: { user_id: userId, job_id: body.job_id } });
            if (existing.length > 0) return existing[0];
            const row = await prisma.saved_jobs.create({ data: { user_id: userId, job_id: body.job_id } });
            return row;
        } catch (e: any) {
            fastify.log.error(e);
            return reply.status(500).send({ error: e.message });
        }
    });

    /** DELETE /api/applicant/saved/:jobId — unsave job */
    fastify.delete<{ Params: { jobId: string } }>('/api/applicant/saved/:jobId', async (request, reply) => {
        const userId = await getUserId(request);
        if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
        const { jobId } = request.params;
        try {
            await prisma.saved_jobs.deleteMany({ where: { user_id: userId, job_id: jobId } });
            return { ok: true };
        } catch (e: any) {
            fastify.log.error(e);
            return reply.status(500).send({ error: e.message });
        }
    });

    /** POST /api/applications/:id/interview — schedule interview */
    fastify.post<{ Params: { id: string }; Body: { scheduled_at: string; format: string; notes?: string } }>('/api/applications/:id/interview', async (request, reply) => {
        const userId = await getUserId(request);
        if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
        const { id } = request.params;
        const body = request.body as { scheduled_at: string; format: string; notes?: string };
        if (!body.scheduled_at || !body.format) return reply.status(400).send({ error: 'scheduled_at and format required' });
        if (!['in_person', 'video', 'phone'].includes(body.format)) return reply.status(400).send({ error: 'Invalid format' });
        try {
            const app = await prisma.job_applications.findUnique({ where: { id } });
            if (!app) return reply.status(404).send({ error: 'Application not found' });
            const job = await prisma.jobs.findUnique({ where: { id: app.job_id } });
            if (!job || job.created_by !== userId) return reply.status(403).send({ error: 'Not allowed' });
            const row = await prisma.interview_schedules.create({
                data: {
                    application_id: id,
                    scheduled_at: body.scheduled_at,
                    format: body.format as 'in_person' | 'video' | 'phone',
                    notes: body.notes ?? null,
                    created_by: userId,
                },
            });
            return row;
        } catch (e: any) {
            fastify.log.error(e);
            return reply.status(500).send({ error: e.message });
        }
    });

    /** GET /api/applications/:id/interviews — list interviews for application */
    fastify.get<{ Params: { id: string } }>('/api/applications/:id/interviews', async (request, reply) => {
        const userId = await getUserId(request);
        if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
        const { id } = request.params;
        try {
            const app = await prisma.job_applications.findUnique({ where: { id } });
            if (!app) return reply.status(404).send({ error: 'Application not found' });
            const job = await prisma.jobs.findUnique({ where: { id: app.job_id } });
            const allowed = job?.created_by === userId || app.user_id === userId;
            if (!allowed) return reply.status(403).send({ error: 'Not allowed' });
            return prisma.interview_schedules.findMany({ where: { application_id: id }, orderBy: { scheduled_at: 'desc' } });
        } catch (e: any) {
            fastify.log.error(e);
            return reply.status(500).send({ error: e.message });
        }
    });
}
