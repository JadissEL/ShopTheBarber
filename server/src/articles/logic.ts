import type { articles } from '@prisma/client';
import { prisma } from '../db/prisma';

export const ARTICLE_STATUSES = ['draft', 'pending_review', 'published', 'rejected'] as const;
export type ArticleStatus = (typeof ARTICLE_STATUSES)[number];

export const ARTICLE_CATEGORIES = ['tips', 'trends', 'products', 'techniques', 'lifestyle'] as const;

export const ARTICLE_AUTHOR_ROLES = ['barber', 'shop_owner', 'admin'] as const;

export type AuthUser = { id: string; email?: string; role?: string; full_name?: string | null };

export function canAuthorArticles(role?: string | null): boolean {
    return role === 'barber' || role === 'shop_owner' || role === 'admin';
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

export function serializeArticle(row: articles) {
    return {
        ...row,
        created_date: row.created_at,
    };
}

export function slugify(title: string): string {
    return title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80) || 'article';
}

export async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
    const slug = slugify(base);
    let candidate = slug;
    let n = 0;
    while (true) {
        const existing = await prisma.articles.findUnique({ where: { slug: candidate }, select: { id: true } });
        if (!existing || existing.id === excludeId) return candidate;
        n += 1;
        candidate = `${slug}-${n}`;
    }
}

export type ArticleWriteInput = {
    title?: string;
    excerpt?: string;
    content?: string;
    category?: string;
    image_url?: string;
    featured?: boolean;
};

const TITLE_MIN = 3;
const TITLE_MAX = 200;
const EXCERPT_MAX = 500;
const CONTENT_MIN_SUBMIT = 100;
const CONTENT_MAX = 50000;

export function validateCategory(category?: string | null): string | null {
    if (category == null || category === '') return null;
    if (!(ARTICLE_CATEGORIES as readonly string[]).includes(category)) {
        throw new Error(`Invalid category. Allowed: ${ARTICLE_CATEGORIES.join(', ')}`);
    }
    return category;
}

export function validateDraftPayload(input: ArticleWriteInput): Record<string, unknown> {
    const data: Record<string, unknown> = {};
    if (input.title !== undefined) {
        const t = String(input.title).trim();
        if (t.length < TITLE_MIN || t.length > TITLE_MAX) {
            throw new Error(`Title must be between ${TITLE_MIN} and ${TITLE_MAX} characters`);
        }
        data.title = t;
    }
    if (input.excerpt !== undefined) {
        const e = String(input.excerpt).trim();
        if (e.length > EXCERPT_MAX) throw new Error(`Excerpt must be at most ${EXCERPT_MAX} characters`);
        data.excerpt = e || null;
    }
    if (input.content !== undefined) {
        const c = String(input.content).trim();
        if (c.length > CONTENT_MAX) throw new Error(`Content must be at most ${CONTENT_MAX} characters`);
        data.content = c || null;
    }
    if (input.category !== undefined) {
        data.category = validateCategory(input.category);
    }
    if (input.image_url !== undefined) {
        const url = String(input.image_url).trim();
        data.image_url = url || null;
    }
    return data;
}

export function validateSubmitReady(article: Pick<articles, 'title' | 'content' | 'excerpt' | 'category'>): void {
    const title = (article.title || '').trim();
    const content = (article.content || '').trim();
    const excerpt = (article.excerpt || '').trim();
    if (title.length < TITLE_MIN) throw new Error('Title is required before submitting for review');
    if (content.length < CONTENT_MIN_SUBMIT) {
        throw new Error(`Article body must be at least ${CONTENT_MIN_SUBMIT} characters before submitting`);
    }
    if (!excerpt) throw new Error('Excerpt is required before submitting for review');
    validateCategory(article.category);
    if (!article.category) throw new Error('Category is required before submitting for review');
}

export async function getArticleForUser(id: string, user: AuthUser | null): Promise<articles | null> {
    const row = await prisma.articles.findUnique({ where: { id } });
    if (!row) return null;
    if (row.status === 'published' || row.published === true) return row;
    if (!user) return null;
    if (isAdmin(user.role)) return row;
    if (row.author_id === user.id) return row;
    return null;
}

export function stripPrivilegedFields(data: Record<string, unknown>): Record<string, unknown> {
    const blocked = new Set([
        'id',
        'author_id',
        'author_name',
        'published',
        'status',
        'views',
        'rejection_reason',
        'submitted_at',
        'reviewed_at',
        'reviewed_by',
        'created_at',
        'updated_at',
        'slug',
    ]);
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) {
        if (!blocked.has(k)) out[k] = v;
    }
    return out;
}
