import { type FastifyInstance } from 'fastify';
import fs from 'fs';
import path from 'path';
import { prisma } from '../db/prisma';
import { resolveOptionalUserId } from '../auth/requestUser';
import {
    buildProfilePayload,
    computeMatchScore,
    deleteCredentialFile,
    parseJsonField,
    resolveCredentialAbsolutePath,
    saveCredentialFile,
    serializeApplicantProfile,
    validateCredentialType,
} from './logic';

async function canManageJob(userId: string, job: { created_by: string; shop_id: string | null }) {
    if (job.created_by === userId) return true;
    if (job.shop_id) {
        const shop = await prisma.shops.findUnique({
            where: { id: job.shop_id },
            select: { owner_id: true },
        });
        if (shop?.owner_id === userId) return true;
    }
    return false;
}

export async function applicantsRoutes(fastify: FastifyInstance) {
    const getUserId = (request: { headers: Record<string, unknown> }): Promise<string | null> =>
        resolveOptionalUserId(request);

    /** GET /api/applicant/profile, my applicant profile (parsed + completeness) */
    fastify.get('/api/applicant/profile', async (request, reply) => {
        const userId = await getUserId(request);
        if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
        try {
            const profile = await prisma.applicant_profiles.findUnique({ where: { user_id: userId } });
            if (!profile) return null;
            const creds = await prisma.applicant_credentials.findMany({ where: { user_id: userId } });
            const hasCv = creds.some((c) => c.type === 'cv');
            const serialized = serializeApplicantProfile(profile);
            serialized.completeness = {
                ...serialized.completeness,
                checks: { ...serialized.completeness.checks, cv: hasCv },
                percent: Math.round(
                    (Object.values({ ...serialized.completeness.checks, cv: hasCv }).filter(Boolean).length /
                        8) *
                        100
                ),
                ready_to_apply:
                    serialized.completeness.checks.summary &&
                    serialized.completeness.checks.skills &&
                    (hasCv || serialized.completeness.checks.experience),
            };
            return serialized;
        } catch (e: unknown) {
            fastify.log.error(e);
            return reply.status(500).send({ error: e instanceof Error ? e.message : 'Server error' });
        }
    });

    /** PUT /api/applicant/profile, create or update my profile */
    fastify.put('/api/applicant/profile', async (request, reply) => {
        const userId = await getUserId(request);
        if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
        const body = request.body as Record<string, unknown>;
        try {
            const existing = await prisma.applicant_profiles.findUnique({ where: { user_id: userId } });
            const data = buildProfilePayload(body, existing ?? undefined);
            if (existing) {
                const updated = await prisma.applicant_profiles.update({ where: { id: existing.id }, data });
                return serializeApplicantProfile(updated);
            }
            const created = await prisma.applicant_profiles.create({
                data: { user_id: userId, ...data },
            });
            return serializeApplicantProfile(created);
        } catch (e: unknown) {
            fastify.log.error(e);
            return reply.status(500).send({ error: e instanceof Error ? e.message : 'Server error' });
        }
    });

    /** GET /api/applicant/credentials, my credentials */
    fastify.get('/api/applicant/credentials', async (request, reply) => {
        const userId = await getUserId(request);
        if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
        try {
            const rows = await prisma.applicant_credentials.findMany({
                where: { user_id: userId },
                orderBy: { created_at: 'desc' },
            });
            return rows.map((r) => ({
                ...r,
                download_url: `/api/applicant/credentials/${r.id}/file`,
            }));
        } catch (e: unknown) {
            fastify.log.error(e);
            return reply.status(500).send({ error: e instanceof Error ? e.message : 'Server error' });
        }
    });

    /** POST /api/applicant/credentials/upload, upload file (base64 JSON) */
    fastify.post('/api/applicant/credentials/upload', async (request, reply) => {
        const userId = await getUserId(request);
        if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
        const body = request.body as {
            type: string;
            file_name: string;
            file_base64: string;
            mime_type: string;
        };
        if (!body.type || !body.file_name || !body.file_base64 || !body.mime_type) {
            return reply.status(400).send({ error: 'type, file_name, file_base64, mime_type required' });
        }
        if (!validateCredentialType(body.type)) {
            return reply.status(400).send({ error: 'Invalid type' });
        }
        try {
            const buffer = Buffer.from(body.file_base64, 'base64');
            const relativePath = saveCredentialFile(userId, body.file_name, body.mime_type, buffer);
            const row = await prisma.applicant_credentials.create({
                data: {
                    user_id: userId,
                    type: body.type,
                    file_name: body.file_name,
                    file_path: relativePath,
                    file_size: buffer.length,
                    mime_type: body.mime_type,
                },
            });
            return { ...row, download_url: `/api/applicant/credentials/${row.id}/file` };
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Upload failed';
            return reply.status(400).send({ error: msg });
        }
    });

    /** POST /api/applicant/credentials, add credential metadata (legacy / external URL) */
    fastify.post('/api/applicant/credentials', async (request, reply) => {
        const userId = await getUserId(request);
        if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
        const body = request.body as {
            type: string;
            file_name: string;
            file_path: string;
            file_size?: number;
            mime_type?: string;
        };
        if (!body.type || !body.file_name || !body.file_path) {
            return reply.status(400).send({ error: 'type, file_name, file_path required' });
        }
        if (!validateCredentialType(body.type)) {
            return reply.status(400).send({ error: 'Invalid type' });
        }
        try {
            const row = await prisma.applicant_credentials.create({
                data: {
                    user_id: userId,
                    type: body.type,
                    file_name: body.file_name,
                    file_path: body.file_path,
                    file_size: body.file_size ?? null,
                    mime_type: body.mime_type ?? null,
                },
            });
            return { ...row, download_url: `/api/applicant/credentials/${row.id}/file` };
        } catch (e: unknown) {
            fastify.log.error(e);
            return reply.status(500).send({ error: e instanceof Error ? e.message : 'Server error' });
        }
    });

    /** DELETE /api/applicant/credentials/:id */
    fastify.delete<{ Params: { id: string } }>('/api/applicant/credentials/:id', async (request, reply) => {
        const userId = await getUserId(request);
        if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
        const { id } = request.params;
        try {
            const row = await prisma.applicant_credentials.findUnique({ where: { id } });
            if (!row || row.user_id !== userId) {
                return reply.status(404).send({ error: 'Credential not found' });
            }
            if (row.file_path.startsWith('applicant-credentials/')) {
                deleteCredentialFile(row.file_path);
            }
            await prisma.applicant_credentials.delete({ where: { id } });
            return { ok: true };
        } catch (e: unknown) {
            fastify.log.error(e);
            return reply.status(500).send({ error: e instanceof Error ? e.message : 'Server error' });
        }
    });

    /** GET /api/applicant/credentials/:id/file, download credential (owner or job employer) */
    fastify.get<{ Params: { id: string } }>('/api/applicant/credentials/:id/file', async (request, reply) => {
        const userId = await getUserId(request);
        if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
        const { id } = request.params;
        try {
            const row = await prisma.applicant_credentials.findUnique({ where: { id } });
            if (!row) return reply.status(404).send({ error: 'Not found' });

            let allowed = row.user_id === userId;
            if (!allowed) {
                const apps = await prisma.job_applications.findMany({
                    where: { user_id: row.user_id },
                    select: { job_id: true },
                });
                for (const app of apps) {
                    const job = await prisma.jobs.findUnique({ where: { id: app.job_id } });
                    if (job && (await canManageJob(userId, job))) {
                        allowed = true;
                        break;
                    }
                }
            }
            if (!allowed) return reply.status(403).send({ error: 'Not allowed' });

            const abs = resolveCredentialAbsolutePath(row.file_path);
            if (!fs.existsSync(abs)) {
                return reply.status(404).send({ error: 'File not found on server' });
            }
            const stream = fs.createReadStream(abs);
            reply.header('Content-Disposition', `inline; filename="${row.file_name}"`);
            if (row.mime_type) reply.type(row.mime_type);
            return reply.send(stream);
        } catch (e: unknown) {
            fastify.log.error(e);
            return reply.status(500).send({ error: e instanceof Error ? e.message : 'Server error' });
        }
    });

    /** GET /api/applicant/applications, my applications */
    fastify.get('/api/applicant/applications', async (request, reply) => {
        const userId = await getUserId(request);
        if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
        try {
            const list = await prisma.job_applications.findMany({
                where: { user_id: userId },
                orderBy: { created_at: 'desc' },
            });
            if (list.length === 0) return [];

            const jobIds = [...new Set(list.map((a) => a.job_id))];
            const jobs = await prisma.jobs.findMany({ where: { id: { in: jobIds } } });
            const jobMap = new Map(jobs.map((j) => [j.id, j]));

            const shopIds = [
                ...new Set(jobs.filter((j) => j.employer_type === 'shop' && j.shop_id).map((j) => j.shop_id!)),
            ];
            const companyIds = [
                ...new Set(
                    jobs.filter((j) => j.employer_type === 'company' && j.company_id).map((j) => j.company_id!)
                ),
            ];
            const shopMap = new Map<string, string>();
            const companyMap = new Map<string, string>();
            if (shopIds.length > 0) {
                const shops = await prisma.shops.findMany({
                    where: { id: { in: shopIds } },
                    select: { id: true, name: true },
                });
                for (const s of shops) shopMap.set(s.id, s.name);
            }
            if (companyIds.length > 0) {
                const cos = await prisma.companies.findMany({
                    where: { id: { in: companyIds } },
                    select: { id: true, name: true },
                });
                for (const c of cos) companyMap.set(c.id, c.name);
            }

            return list.map((app) => {
                const job = jobMap.get(app.job_id);
                let employer_name: string | null = null;
                if (job?.employer_type === 'shop' && job.shop_id) {
                    employer_name = shopMap.get(job.shop_id) ?? null;
                }
                if (job?.employer_type === 'company' && job.company_id) {
                    employer_name = companyMap.get(job.company_id) ?? null;
                }
                return { ...app, job_title: job?.title, employer_name };
            });
        } catch (e: unknown) {
            fastify.log.error(e);
            return reply.status(500).send({ error: e instanceof Error ? e.message : 'Server error' });
        }
    });

    /** POST /api/applicant/applications, create application with match score + profile snapshot */
    fastify.post('/api/applicant/applications', async (request, reply) => {
        const userId = await getUserId(request);
        if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
        const body = request.body as {
            job_id: string;
            cover_letter?: string;
            custom_data?: Record<string, unknown>;
            credential_ids?: string[];
            attach_all_credentials?: boolean;
        };
        if (!body.job_id) return reply.status(400).send({ error: 'job_id required' });
        try {
            const job = await prisma.jobs.findUnique({ where: { id: body.job_id } });
            if (!job) return reply.status(404).send({ error: 'Job not found' });
            if (!job.published || job.status !== 'published') {
                return reply.status(400).send({ error: 'Job is not open for applications' });
            }
            const existing = await prisma.job_applications.findFirst({
                where: { job_id: body.job_id, user_id: userId },
            });
            if (existing) return reply.status(400).send({ error: 'Already applied' });

            const profileRow = await prisma.applicant_profiles.findUnique({ where: { user_id: userId } });
            const creds = await prisma.applicant_credentials.findMany({ where: { user_id: userId } });
            const profile = profileRow ? serializeApplicantProfile(profileRow) : null;
            const hasCv = creds.some((c) => c.type === 'cv');
            const completeness = profile
                ? {
                      ...profile.completeness,
                      checks: { ...profile.completeness.checks, cv: hasCv },
                  }
                : { percent: 0, ready_to_apply: hasCv, checks: {} };

            let credentialIds = body.credential_ids ?? [];
            if (body.attach_all_credentials) {
                credentialIds = creds.map((c) => c.id);
            }
            if (credentialIds.length === 0 && hasCv) {
                const cv = creds.find((c) => c.type === 'cv');
                if (cv) credentialIds = [cv.id];
            }

            const matchScore = computeMatchScore(profile, job, credentialIds.length);

            const app = await prisma.job_applications.create({
                data: {
                    job_id: body.job_id,
                    user_id: userId,
                    cover_letter: body.cover_letter?.trim() || null,
                    match_score: matchScore,
                    custom_data: JSON.stringify({
                        ...(body.custom_data ?? {}),
                        profile_snapshot: profile
                            ? {
                                  professional_summary: profile.professional_summary,
                                  years_experience: profile.years_experience,
                                  skills: profile.skills,
                                  work_experience: profile.work_experience,
                                  certifications: profile.certifications,
                                  availability: profile.availability,
                              }
                            : null,
                        profile_completeness_percent: completeness.percent ?? 0,
                    }),
                },
            });

            const credMap = new Map(creds.map((c) => [c.id, c]));
            for (const cid of credentialIds) {
                const c = credMap.get(cid);
                if (c && c.user_id === userId) {
                    await prisma.application_documents.create({
                        data: {
                            application_id: app.id,
                            type: c.type,
                            file_name: c.file_name,
                            file_path: c.file_path,
                            file_size: c.file_size,
                            mime_type: c.mime_type,
                        },
                    });
                }
            }
            return { ...app, match_score: matchScore, profile_completeness: completeness };
        } catch (e: unknown) {
            fastify.log.error(e);
            return reply.status(500).send({ error: e instanceof Error ? e.message : 'Server error' });
        }
    });

    /** GET /api/jobs/:jobId/applications, list applicants (employer), sorted by match */
    fastify.get<{ Params: { jobId: string } }>('/api/jobs/:jobId/applications', async (request, reply) => {
        const userId = await getUserId(request);
        if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
        const { jobId } = request.params;
        try {
            const job = await prisma.jobs.findUnique({ where: { id: jobId } });
            if (!job) return reply.status(404).send({ error: 'Job not found' });
            if (!(await canManageJob(userId, job))) {
                return reply.status(403).send({ error: 'Not allowed' });
            }
            const list = await prisma.job_applications.findMany({
                where: { job_id: jobId },
                orderBy: [{ match_score: 'desc' }, { created_at: 'desc' }],
            });
            const withUser = await Promise.all(
                list.map(async (app) => {
                    const u = await prisma.users.findUnique({
                        where: { id: app.user_id },
                        select: { full_name: true, email: true, avatar_url: true },
                    });
                    const profileRow = await prisma.applicant_profiles.findUnique({
                        where: { user_id: app.user_id },
                    });
                    const profile = profileRow ? serializeApplicantProfile(profileRow) : null;
                    const creds = await prisma.applicant_credentials.findMany({
                        where: { user_id: app.user_id },
                    });
                    const docs = await prisma.application_documents.findMany({
                        where: { application_id: app.id },
                    });
                    const custom = parseJsonField<Record<string, unknown>>(app.custom_data, {});
                    return {
                        ...app,
                        applicant_name: u?.full_name,
                        applicant_email: u?.email,
                        applicant_avatar: u?.avatar_url,
                        profile,
                        credentials: creds.map((c) => ({
                            ...c,
                            download_url: `/api/applicant/credentials/${c.id}/file`,
                        })),
                        documents: docs,
                        profile_snapshot: custom.profile_snapshot ?? null,
                    };
                })
            );
            return withUser;
        } catch (e: unknown) {
            fastify.log.error(e);
            return reply.status(500).send({ error: e instanceof Error ? e.message : 'Server error' });
        }
    });

    /** PATCH /api/applications/:id, update status (employer) */
    fastify.patch<{ Params: { id: string }; Body: { status: string } }>(
        '/api/applications/:id',
        async (request, reply) => {
            const userId = await getUserId(request);
            if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
            const { id } = request.params;
            const body = request.body;
            const valid = ['received', 'under_review', 'shortlisted', 'rejected', 'hired'];
            if (!body.status || !valid.includes(body.status)) {
                return reply.status(400).send({ error: 'Valid status required' });
            }
            try {
                const app = await prisma.job_applications.findUnique({ where: { id } });
                if (!app) return reply.status(404).send({ error: 'Application not found' });
                const job = await prisma.jobs.findUnique({ where: { id: app.job_id } });
                if (!job || !(await canManageJob(userId, job))) {
                    return reply.status(403).send({ error: 'Not allowed' });
                }
                const updated = await prisma.job_applications.update({
                    where: { id },
                    data: { status: body.status as never, updated_at: new Date().toISOString() },
                });
                return updated;
            } catch (e: unknown) {
                fastify.log.error(e);
                return reply.status(500).send({ error: e instanceof Error ? e.message : 'Server error' });
            }
        }
    );

    /** GET /api/applicant/saved, my saved jobs */
    fastify.get('/api/applicant/saved', async (request, reply) => {
        const userId = await getUserId(request);
        if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
        try {
            const rows = await prisma.saved_jobs.findMany({
                where: { user_id: userId },
                orderBy: { created_at: 'desc' },
            });
            const withJob = await Promise.all(
                rows.map(async (s) => {
                    const job = await prisma.jobs.findUnique({ where: { id: s.job_id } });
                    if (!job) return null;
                    let employer_name: string | null = null;
                    if (job.employer_type === 'shop' && job.shop_id) {
                        const shop = await prisma.shops.findUnique({
                            where: { id: job.shop_id },
                            select: { name: true },
                        });
                        if (shop) employer_name = shop.name;
                    }
                    if (job.employer_type === 'company' && job.company_id) {
                        const co = await prisma.companies.findUnique({
                            where: { id: job.company_id },
                            select: { name: true },
                        });
                        if (co) employer_name = co.name;
                    }
                    return { ...job, employer_name, saved_at: s.created_at };
                })
            );
            return withJob.filter(Boolean);
        } catch (e: unknown) {
            fastify.log.error(e);
            return reply.status(500).send({ error: e instanceof Error ? e.message : 'Server error' });
        }
    });

    /** POST /api/applicant/saved, save job */
    fastify.post<{ Body: { job_id: string } }>('/api/applicant/saved', async (request, reply) => {
        const userId = await getUserId(request);
        if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
        const body = request.body;
        if (!body.job_id) return reply.status(400).send({ error: 'job_id required' });
        try {
            const job = await prisma.jobs.findUnique({ where: { id: body.job_id } });
            if (!job || !job.published || job.status !== 'published') {
                return reply.status(400).send({ error: 'Only published jobs can be saved' });
            }
            const existing = await prisma.saved_jobs.findFirst({
                where: { user_id: userId, job_id: body.job_id },
            });
            if (existing) return existing;
            const row = await prisma.saved_jobs.create({
                data: { user_id: userId, job_id: body.job_id },
            });
            return row;
        } catch (e: unknown) {
            fastify.log.error(e);
            return reply.status(500).send({ error: e instanceof Error ? e.message : 'Server error' });
        }
    });

    /** DELETE /api/applicant/saved/:jobId, unsave job */
    fastify.delete<{ Params: { jobId: string } }>('/api/applicant/saved/:jobId', async (request, reply) => {
        const userId = await getUserId(request);
        if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
        const { jobId } = request.params;
        try {
            await prisma.saved_jobs.deleteMany({ where: { user_id: userId, job_id: jobId } });
            return { ok: true };
        } catch (e: unknown) {
            fastify.log.error(e);
            return reply.status(500).send({ error: e instanceof Error ? e.message : 'Server error' });
        }
    });

    /** POST /api/applications/:id/interview, schedule interview */
    fastify.post<{ Params: { id: string }; Body: { scheduled_at: string; format: string; notes?: string } }>(
        '/api/applications/:id/interview',
        async (request, reply) => {
            const userId = await getUserId(request);
            if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
            const { id } = request.params;
            const body = request.body;
            if (!body.scheduled_at || !body.format) {
                return reply.status(400).send({ error: 'scheduled_at and format required' });
            }
            if (!['in_person', 'video', 'phone'].includes(body.format)) {
                return reply.status(400).send({ error: 'Invalid format' });
            }
            try {
                const app = await prisma.job_applications.findUnique({ where: { id } });
                if (!app) return reply.status(404).send({ error: 'Application not found' });
                const job = await prisma.jobs.findUnique({ where: { id: app.job_id } });
                if (!job || !(await canManageJob(userId, job))) {
                    return reply.status(403).send({ error: 'Not allowed' });
                }
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
            } catch (e: unknown) {
                fastify.log.error(e);
                return reply.status(500).send({ error: e instanceof Error ? e.message : 'Server error' });
            }
        }
    );

    /** GET /api/applications/:id/interviews */
    fastify.get<{ Params: { id: string } }>('/api/applications/:id/interviews', async (request, reply) => {
        const userId = await getUserId(request);
        if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
        const { id } = request.params;
        try {
            const app = await prisma.job_applications.findUnique({ where: { id } });
            if (!app) return reply.status(404).send({ error: 'Application not found' });
            const job = await prisma.jobs.findUnique({ where: { id: app.job_id } });
            const allowed =
                app.user_id === userId || (job ? await canManageJob(userId, job) : false);
            if (!allowed) return reply.status(403).send({ error: 'Not allowed' });
            return prisma.interview_schedules.findMany({
                where: { application_id: id },
                orderBy: { scheduled_at: 'desc' },
            });
        } catch (e: unknown) {
            fastify.log.error(e);
            return reply.status(500).send({ error: e instanceof Error ? e.message : 'Server error' });
        }
    });

    /** Ensure uploads directory exists */
    fs.mkdirSync(path.join(process.cwd(), 'uploads', 'applicant-credentials'), { recursive: true });
}
