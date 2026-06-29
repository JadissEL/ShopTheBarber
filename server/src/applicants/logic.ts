import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import type { jobs } from '@prisma/client';
import {
    ALLOWED_MIME_TYPES,
    CREDENTIAL_TYPES,
    MAX_CREDENTIAL_BYTES,
} from './config';

export type WorkExperienceEntry = {
    role: string;
    company: string;
    period?: string;
    description?: string;
};

export type CertificationEntry = {
    name: string;
    issuer?: string;
    year?: string;
};

export type PortfolioLinkEntry = {
    label: string;
    url: string;
};

export function parseJsonField<T>(raw: string | null | undefined, fallback: T): T {
    if (!raw) return fallback;
    if (typeof raw !== 'string') return raw;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
}

export function stringifyJsonField(value: unknown): string | null {
    if (value == null) return null;
    if (typeof value === 'string') return value;
    return JSON.stringify(value);
}

export function serializeApplicantProfile(row: {
    id: string;
    user_id: string;
    professional_summary: string | null;
    work_experience: string | null;
    skills: string | null;
    certifications: string | null;
    portfolio_links: string | null;
    availability: string | null;
    preferred_job_types: string | null;
    years_experience: number | null;
    created_at: string | null;
    updated_at: string | null;
}) {
    const workExperience = parseJsonField<WorkExperienceEntry[]>(row.work_experience, []);
    const skills = parseJsonField<string[]>(row.skills, []);
    const certifications = parseJsonField<CertificationEntry[]>(row.certifications, []);
    const portfolioLinks = parseJsonField<PortfolioLinkEntry[]>(row.portfolio_links, []);
    const preferredJobTypes = parseJsonField<string[]>(row.preferred_job_types, []);

    const completeness = computeProfileCompleteness({
        professional_summary: row.professional_summary,
        work_experience: workExperience,
        skills,
        certifications,
        portfolio_links: portfolioLinks,
        years_experience: row.years_experience,
        availability: row.availability,
        preferred_job_types: preferredJobTypes,
    });

    return {
        ...row,
        work_experience: workExperience,
        skills,
        certifications,
        portfolio_links: portfolioLinks,
        preferred_job_types: preferredJobTypes,
        completeness,
    };
}

export function computeProfileCompleteness(input: {
    professional_summary?: string | null;
    work_experience?: WorkExperienceEntry[];
    skills?: string[];
    certifications?: CertificationEntry[];
    portfolio_links?: PortfolioLinkEntry[];
    years_experience?: number | null;
    availability?: string | null;
    preferred_job_types?: string[];
    has_cv?: boolean;
}) {
    const checks = {
        summary: !!input.professional_summary?.trim(),
        experience: (input.work_experience?.length ?? 0) > 0 || (input.years_experience ?? 0) > 0,
        skills: (input.skills?.length ?? 0) > 0,
        certifications: (input.certifications?.length ?? 0) > 0,
        cv: !!input.has_cv,
        availability: !!input.availability,
        preferred_job_types: (input.preferred_job_types?.length ?? 0) > 0,
        portfolio: (input.portfolio_links?.length ?? 0) > 0,
    };
    const total = Object.keys(checks).length;
    const done = Object.values(checks).filter(Boolean).length;
    const percent = Math.round((done / total) * 100);
    return {
        percent,
        checks,
        ready_to_apply: checks.summary && checks.skills && (checks.cv || checks.experience),
    };
}

export function computeMatchScore(
    profile: ReturnType<typeof serializeApplicantProfile> | null,
    job: jobs,
    credentialCount: number
): number {
    if (!profile) return credentialCount > 0 ? 25 : 10;

    let score = 0;
    const jobText = [
        job.title,
        job.category,
        job.description,
        job.required_experience_skills,
        job.responsibilities,
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

    if (profile.professional_summary) score += 15;
    if ((profile.skills?.length ?? 0) > 0) score += 15;
    if ((profile.work_experience?.length ?? 0) > 0 || (profile.years_experience ?? 0) >= 1) score += 15;
    if ((profile.certifications?.length ?? 0) > 0) score += 10;
    if (credentialCount > 0) score += 15;
    if (profile.availability) score += 5;

    const skills = profile.skills ?? [];
    let skillHits = 0;
    for (const skill of skills) {
        const token = skill.toLowerCase();
        if (token.length > 2 && jobText.includes(token)) skillHits += 1;
    }
    score += Math.min(25, skillHits * 8);

    if (profile.preferred_job_types?.includes(job.employment_type)) score += 5;

    return Math.min(100, Math.max(5, score));
}

function uploadsRoot(): string {
    return path.join(process.cwd(), 'uploads', 'applicant-credentials');
}

export function ensureUploadsDir(userId: string): string {
    const dir = path.join(uploadsRoot(), userId);
    fs.mkdirSync(dir, { recursive: true });
    return dir;
}

export function saveCredentialFile(
    userId: string,
    fileName: string,
    mimeType: string,
    buffer: Buffer
): string {
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
        throw new Error('File type not allowed. Use PDF, PNG, JPG, or WEBP.');
    }
    if (buffer.length > MAX_CREDENTIAL_BYTES) {
        throw new Error('File too large (max 5 MB)');
    }
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
    const stored = `${crypto.randomUUID()}-${safeName}`;
    const dir = ensureUploadsDir(userId);
    const fullPath = path.join(dir, stored);
    fs.writeFileSync(fullPath, buffer);
    return path.posix.join('applicant-credentials', userId, stored);
}

export function resolveCredentialAbsolutePath(relativePath: string): string {
    const normalized = relativePath.replace(/\\/g, '/');
    if (normalized.includes('..')) throw new Error('Invalid path');
    return path.join(process.cwd(), 'uploads', normalized);
}

export function deleteCredentialFile(relativePath: string): void {
    try {
        const abs = resolveCredentialAbsolutePath(relativePath);
        if (fs.existsSync(abs)) fs.unlinkSync(abs);
    } catch {
        /* ignore missing files */
    }
}

export function buildProfilePayload(
    body: Record<string, unknown>,
    existing?: {
        professional_summary: string | null;
        work_experience: string | null;
        skills: string | null;
        certifications: string | null;
        portfolio_links: string | null;
        availability: string | null;
        preferred_job_types: string | null;
        years_experience: number | null;
    }
) {
    return {
        professional_summary:
            body.professional_summary !== undefined
                ? String(body.professional_summary || '').trim() || null
                : (existing?.professional_summary ?? null),
        work_experience:
            body.work_experience !== undefined
                ? stringifyJsonField(body.work_experience)
                : (existing?.work_experience ?? null),
        skills:
            body.skills !== undefined ? stringifyJsonField(body.skills) : (existing?.skills ?? null),
        certifications:
            body.certifications !== undefined
                ? stringifyJsonField(body.certifications)
                : (existing?.certifications ?? null),
        portfolio_links:
            body.portfolio_links !== undefined
                ? stringifyJsonField(body.portfolio_links)
                : (existing?.portfolio_links ?? null),
        availability:
            body.availability !== undefined
                ? (body.availability as string | null)
                : (existing?.availability ?? null),
        preferred_job_types:
            body.preferred_job_types !== undefined
                ? stringifyJsonField(body.preferred_job_types)
                : (existing?.preferred_job_types ?? null),
        years_experience:
            body.years_experience !== undefined
                ? typeof body.years_experience === 'number'
                    ? body.years_experience
                    : parseInt(String(body.years_experience), 10) || null
                : (existing?.years_experience ?? null),
        updated_at: new Date().toISOString(),
    };
}

export function validateCredentialType(type: string): type is (typeof CREDENTIAL_TYPES)[number] {
    return (CREDENTIAL_TYPES as readonly string[]).includes(type);
}
