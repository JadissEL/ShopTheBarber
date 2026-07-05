import type { jobs } from '@prisma/client';
import { prisma } from '../db/prisma';
import { isProviderRole } from '../auth/platformRbac';

export const JOB_STATUSES = ['draft', 'pending_review', 'published', 'rejected', 'closed'] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const JOB_CATEGORIES = [
    'grooming',
    'management',
    'logistics',
    'branding',
    'accounting',
    'artistry',
] as const;

export const EMPLOYER_TYPES = ['shop', 'company'] as const;
export type EmployerType = (typeof EMPLOYER_TYPES)[number];

export const EMPLOYER_ROLES = ['barber', 'shop_owner', 'provider'] as const;

export type AuthUser = { id: string; email?: string; role?: string; full_name?: string | null };

export function canPostJobs(role?: string | null): boolean {
    return isProviderRole(role);
}

export function isAdmin(role?: string | null): boolean {
    return role === 'admin';
}

export function authorCanEdit(status?: string | null): boolean {
    return status === 'draft' || status === 'rejected';
}

export function authorCanDelete(status?: string | null): boolean {
    return status === 'draft' || status === 'rejected';
}

export function authorCanSubmit(status?: string | null): boolean {
    return status === 'draft' || status === 'rejected';
}

export function authorCanClose(status?: string | null): boolean {
    return status === 'published';
}

export function isPublicJob(job: Pick<jobs, 'status' | 'published'>): boolean {
    return job.status === 'published' && job.published === true;
}

export async function getEmployerProfiles(userId: string): Promise<{ shopIds: string[]; canUseCompany: boolean }> {
    const [ownedShops, memberRows] = await Promise.all([
        prisma.shops.findMany({ where: { owner_id: userId }, select: { id: true } }),
        prisma.shop_members.findMany({
            where: { user_id: userId, role: { in: ['owner', 'manager'] } },
            select: { shop_id: true },
        }),
    ]);
    const shopIds = [...new Set([...ownedShops.map((s) => s.id), ...memberRows.map((m) => m.shop_id)])];
    return { shopIds, canUseCompany: false };
}

export type JobWriteInput = {
    title?: string;
    category?: string;
    employer_type?: string;
    shop_id?: string;
    company_id?: string;
    employment_type?: string;
    location_type?: string;
    location_text?: string;
    description?: string;
    responsibilities?: string;
    required_experience_skills?: string;
    salary_min?: number;
    salary_max?: number;
    salary_currency?: string;
    application_deadline?: string;
    image_url?: string;
};

const TITLE_MIN = 3;
const TITLE_MAX = 120;
const DESC_MIN_SUBMIT = 30;
const DESC_MAX = 10000;

export function validateCategory(category?: string | null): string | null {
    if (category == null || category === '') return null;
    if (!(JOB_CATEGORIES as readonly string[]).includes(category)) {
        throw new Error(`Invalid category. Allowed: ${JOB_CATEGORIES.join(', ')}`);
    }
    return category;
}

export function validateDraftPayload(input: JobWriteInput): Record<string, unknown> {
    const data: Record<string, unknown> = {};
    if (input.title !== undefined) {
        const t = String(input.title).trim();
        if (t.length < TITLE_MIN || t.length > TITLE_MAX) {
            throw new Error(`Title must be between ${TITLE_MIN} and ${TITLE_MAX} characters`);
        }
        data.title = t;
    }
    if (input.category !== undefined) data.category = validateCategory(input.category);
    if (input.employment_type !== undefined) data.employment_type = String(input.employment_type).trim();
    if (input.location_type !== undefined) data.location_type = String(input.location_type).trim();
    if (input.location_text !== undefined) {
        data.location_text = String(input.location_text).trim() || null;
    }
    if (input.description !== undefined) {
        const d = String(input.description).trim();
        if (d.length > DESC_MAX) throw new Error(`Description must be at most ${DESC_MAX} characters`);
        data.description = d || null;
    }
    if (input.responsibilities !== undefined) {
        data.responsibilities = String(input.responsibilities).trim() || null;
    }
    if (input.required_experience_skills !== undefined) {
        data.required_experience_skills = String(input.required_experience_skills).trim() || null;
    }
    if (input.salary_min !== undefined) {
        data.salary_min = input.salary_min == null ? null : Number(input.salary_min);
    }
    if (input.salary_max !== undefined) {
        data.salary_max = input.salary_max == null ? null : Number(input.salary_max);
    }
    if (input.salary_currency !== undefined) {
        data.salary_currency = String(input.salary_currency).trim() || 'USD';
    }
    if (input.application_deadline !== undefined) {
        data.application_deadline = String(input.application_deadline).trim() || null;
    }
    if (input.image_url !== undefined) {
        data.image_url = String(input.image_url).trim() || null;
    }
    return data;
}

export function validateSubmitReady(
    job: Pick<
        jobs,
        | 'title'
        | 'category'
        | 'description'
        | 'employer_type'
        | 'shop_id'
        | 'company_id'
        | 'employment_type'
        | 'location_type'
    >
): void {
    const title = (job.title || '').trim();
    const description = (job.description || '').trim();
    if (title.length < TITLE_MIN) throw new Error('Title is required before submitting for review');
    if (description.length < DESC_MIN_SUBMIT) {
        throw new Error(`Description must be at least ${DESC_MIN_SUBMIT} characters before submitting`);
    }
    validateCategory(job.category);
    if (!job.category) throw new Error('Category is required before submitting for review');
    if (!job.employment_type || !job.location_type) {
        throw new Error('Employment type and location type are required before submitting');
    }
    if (job.employer_type === 'shop' && !job.shop_id) {
        throw new Error('Shop employer is required before submitting');
    }
    if (job.employer_type === 'company' && !job.company_id) {
        throw new Error('Company employer is required before submitting');
    }
}

export async function resolveEmployerFields(
    user: AuthUser,
    input: Pick<JobWriteInput, 'employer_type' | 'shop_id' | 'company_id'>
): Promise<{ employer_type: EmployerType; shop_id: string | null; company_id: string | null }> {
    const employerType = (input.employer_type || 'shop') as EmployerType;
    if (!(EMPLOYER_TYPES as readonly string[]).includes(employerType)) {
        throw new Error(`Invalid employer_type. Allowed: ${EMPLOYER_TYPES.join(', ')}`);
    }

    if (isAdmin(user.role)) {
        if (employerType === 'shop') {
            if (!input.shop_id) throw new Error('shop_id is required for shop listings');
            const shop = await prisma.shops.findUnique({ where: { id: input.shop_id }, select: { id: true } });
            if (!shop) throw new Error('Shop not found');
            return { employer_type: 'shop', shop_id: input.shop_id, company_id: null };
        }
        if (!input.company_id) throw new Error('company_id is required for company listings');
        const company = await prisma.companies.findUnique({ where: { id: input.company_id }, select: { id: true } });
        if (!company) throw new Error('Company not found');
        return { employer_type: 'company', shop_id: null, company_id: input.company_id };
    }

    if (employerType === 'company') {
        throw new Error('Only admins can post jobs on behalf of a company');
    }

    const profiles = await getEmployerProfiles(user.id);
    const shopId = input.shop_id || profiles.shopIds[0];
    if (!shopId || !profiles.shopIds.includes(shopId)) {
        throw new Error('You must post jobs for a shop you own or manage');
    }
    return { employer_type: 'shop', shop_id: shopId, company_id: null };
}

export async function userCanManageJob(userId: string, job: jobs, role?: string | null): Promise<boolean> {
    if (isAdmin(role)) return true;
    if (job.created_by === userId) return true;
    if (job.employer_type === 'shop' && job.shop_id) {
        const shop = await prisma.shops.findUnique({ where: { id: job.shop_id }, select: { owner_id: true } });
        if (shop?.owner_id === userId) return true;
        const member = await prisma.shop_members.findFirst({
            where: { shop_id: job.shop_id, user_id: userId, role: { in: ['owner', 'manager'] } },
        });
        return !!member;
    }
    return false;
}

export async function enrichJobsWithEmployer<T extends jobs>(jobsList: T[]) {
    if (jobsList.length === 0) return [];

    const shopIds = [...new Set(jobsList.filter((j) => j.employer_type === 'shop' && j.shop_id).map((j) => j.shop_id!))];
    const companyIds = [
        ...new Set(jobsList.filter((j) => j.employer_type === 'company' && j.company_id).map((j) => j.company_id!)),
    ];

    const shopMap = new Map<string, { name: string; image_url: string | null }>();
    const companyMap = new Map<string, { name: string; logo_url: string | null }>();

    if (shopIds.length > 0) {
        const shops = await prisma.shops.findMany({
            where: { id: { in: shopIds } },
            select: { id: true, name: true, image_url: true },
        });
        for (const s of shops) shopMap.set(s.id, s);
    }
    if (companyIds.length > 0) {
        const companies = await prisma.companies.findMany({
            where: { id: { in: companyIds } },
            select: { id: true, name: true, logo_url: true },
        });
        for (const c of companies) companyMap.set(c.id, c);
    }

    return jobsList.map((job) => {
        let employer_name: string | null = null;
        let employer_image: string | null = null;
        if (job.employer_type === 'shop' && job.shop_id) {
            const s = shopMap.get(job.shop_id);
            if (s) {
                employer_name = s.name;
                employer_image = s.image_url;
            }
        } else if (job.employer_type === 'company' && job.company_id) {
            const c = companyMap.get(job.company_id);
            if (c) {
                employer_name = c.name;
                employer_image = c.logo_url;
            }
        }
        return { ...job, employer_name, employer_image };
    });
}

export function stripPrivilegedFields(data: Record<string, unknown>): Record<string, unknown> {
    const blocked = new Set([
        'id',
        'created_by',
        'status',
        'published',
        'featured',
        'rejection_reason',
        'submitted_at',
        'reviewed_at',
        'reviewed_by',
        'created_at',
        'updated_at',
        'employer_type',
        'shop_id',
        'company_id',
    ]);
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) {
        if (!blocked.has(k)) out[k] = v;
    }
    return out;
}
