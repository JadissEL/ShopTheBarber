/**
 * Applicant profile, credentials upload, and job applications.
 */
import { describe, it, expect, afterAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';

const APPLICANT_CLERK = `clerk_applicant_${Date.now()}`;
const APPLICANT_EMAIL = `applicant-${Date.now()}@example.com`;

vi.mock('../auth/clerk', () => ({
    verifyClerkToken: vi.fn(async () => ({
        id: APPLICANT_CLERK,
        email: APPLICANT_EMAIL,
        role: 'client',
        full_name: 'Test Applicant',
        avatar_url: null,
    })),
}));

import { prisma } from '../db/prisma';
import { fastify as app } from '../index';
import { computeMatchScore, computeProfileCompleteness, serializeApplicantProfile } from '../applicants/logic';

describe('applicants logic', () => {
    it('computeProfileCompleteness requires summary, skills, and cv or experience', () => {
        const weak = computeProfileCompleteness({ professional_summary: 'Hi', skills: [] });
        expect(weak.ready_to_apply).toBe(false);
        const strong = computeProfileCompleteness({
            professional_summary: 'Barber with 5 years',
            skills: ['Fades', 'Styling'],
            has_cv: true,
        });
        expect(strong.ready_to_apply).toBe(true);
    });

    it('serializeApplicantProfile parses JSON fields', () => {
        const row = {
            id: 'p1',
            user_id: 'u1',
            professional_summary: 'Pro barber',
            work_experience: JSON.stringify([{ role: 'Barber', company: 'Shop A' }]),
            skills: JSON.stringify(['Fades']),
            certifications: null,
            portfolio_links: null,
            availability: 'immediate',
            preferred_job_types: JSON.stringify(['full_time']),
            years_experience: 3,
            created_at: null,
            updated_at: null,
        };
        const parsed = serializeApplicantProfile(row);
        expect(parsed.skills).toEqual(['Fades']);
        expect(parsed.work_experience[0]?.company).toBe('Shop A');
        expect(parsed.completeness.percent).toBeGreaterThan(0);
    });
});

describe('integration: applicant API', () => {
    let userId: string;
    let jobId: string;
    let credentialId: string;
    let applicationId: string;
    const authHeaders = { authorization: 'Bearer test-token' };

    afterAll(async () => {
        if (applicationId) {
            await prisma.application_documents.deleteMany({ where: { application_id: applicationId } });
            await prisma.job_applications.deleteMany({ where: { id: applicationId } });
        }
        if (credentialId) {
            await prisma.applicant_credentials.deleteMany({ where: { id: credentialId } });
        }
        if (jobId) {
            await prisma.jobs.deleteMany({ where: { id: jobId } });
        }
        if (userId) {
            await prisma.applicant_profiles.deleteMany({ where: { user_id: userId } });
            await prisma.applicant_credentials.deleteMany({ where: { user_id: userId } });
            await prisma.users.deleteMany({ where: { id: userId } });
        }
        await (app as FastifyInstance).close();
    });

    it('GET /api/applicant/profile requires auth', async () => {
        const res = await (app as FastifyInstance).inject({ method: 'GET', url: '/api/applicant/profile' });
        expect(res.statusCode).toBe(401);
    });

    it('PUT profile, upload credential, apply to job with match score', async () => {
        const meRes = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/auth/me',
            headers: authHeaders,
        });
        expect(meRes.statusCode).toBe(200);
        userId = JSON.parse(meRes.payload).id;

        const profileRes = await (app as FastifyInstance).inject({
            method: 'PUT',
            url: '/api/applicant/profile',
            headers: { ...authHeaders, 'content-type': 'application/json' },
            payload: {
                professional_summary: 'Experienced barber specializing in fades and beard work.',
                years_experience: 4,
                skills: ['Fades', 'Beard grooming', 'Styling'],
                availability: 'immediate',
                preferred_job_types: ['full_time'],
                work_experience: [{ role: 'Senior Barber', company: 'Elite Cuts', period: '2020–2024' }],
            },
        });
        expect(profileRes.statusCode).toBe(200);
        const profile = JSON.parse(profileRes.payload);
        expect(profile.professional_summary).toContain('barber');
        expect(Array.isArray(profile.skills)).toBe(true);
        expect(profile.completeness).toBeDefined();

        const tinyPdf = Buffer.from('%PDF-1.4 test').toString('base64');
        const uploadRes = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/applicant/credentials/upload',
            headers: { ...authHeaders, 'content-type': 'application/json' },
            payload: {
                type: 'cv',
                file_name: 'cv-test.pdf',
                file_base64: tinyPdf,
                mime_type: 'application/pdf',
            },
        });
        expect(uploadRes.statusCode).toBe(200);
        const cred = JSON.parse(uploadRes.payload);
        credentialId = cred.id;
        expect(cred.file_path).toContain('applicant-credentials');

        const job = await prisma.jobs.create({
            data: {
                title: 'Senior Barber – Fades',
                category: 'grooming',
                description: 'Looking for fade and beard grooming specialists.',
                employment_type: 'full_time',
                location_type: 'on_site',
                status: 'published',
                published: true,
                created_by: userId,
                employer_type: 'company',
            },
        });
        jobId = job.id;

        const applyRes = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/applicant/applications',
            headers: { ...authHeaders, 'content-type': 'application/json' },
            payload: {
                job_id: jobId,
                cover_letter: 'I would love to join your team.',
                credential_ids: [credentialId],
            },
        });
        expect(applyRes.statusCode).toBe(200);
        const application = JSON.parse(applyRes.payload);
        applicationId = application.id;
        expect(application.match_score).toBeGreaterThan(0);
        expect(computeMatchScore(profile, job, 1)).toBe(application.match_score);

        const fileRes = await (app as FastifyInstance).inject({
            method: 'GET',
            url: `/api/applicant/credentials/${credentialId}/file`,
            headers: authHeaders,
        });
        expect(fileRes.statusCode).toBe(200);

        const delRes = await (app as FastifyInstance).inject({
            method: 'DELETE',
            url: `/api/applicant/credentials/${credentialId}`,
            headers: authHeaders,
        });
        expect(delRes.statusCode).toBe(200);
        credentialId = '';
    });
});
