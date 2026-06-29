import crypto, { createHash, timingSafeEqual } from 'crypto';
import { prisma } from '../db/prisma';

type PartnerScopePayload = { scopes: string[]; shop_id?: string; barber_id?: string };

function encodeScopesPayload(scopes: string[], shopId?: string, barberId?: string): string {
    return JSON.stringify({ scopes, shop_id: shopId ?? null, barber_id: barberId ?? null });
}

export function parseScopesPayload(raw: string | null): PartnerScopePayload {
    if (!raw) return { scopes: [] };
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return { scopes: parsed };
        return {
            scopes: Array.isArray(parsed.scopes) ? parsed.scopes : [],
            shop_id: parsed.shop_id ?? undefined,
            barber_id: parsed.barber_id ?? undefined,
        };
    } catch {
        return { scopes: [] };
    }
}

const rateLimitWindows = new Map<string, { count: number; resetAt: number }>();

export function hashApiKey(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
}

export function generatePartnerApiKey(): string {
    return `stb_pk_${crypto.randomBytes(24).toString('hex')}`;
}

export async function createPartnerApiKey(
    name: string,
    scopes: string[] = ['bookings:read'],
    options?: { shop_id?: string; barber_id?: string }
) {
    const raw = generatePartnerApiKey();
    const record = await prisma.partner_api_keys.create({
        data: {
            id: crypto.randomUUID(),
            name,
            api_key_hash: hashApiKey(raw),
            scopes_json: encodeScopesPayload(scopes, options?.shop_id, options?.barber_id),
            is_active: true,
        },
    });
    return { id: record.id, api_key: raw, name, shop_id: options?.shop_id ?? null };
}

export async function verifyPartnerApiKey(rawKey: string) {
    const hash = hashApiKey(rawKey);
    const record = await prisma.partner_api_keys.findUnique({ where: { api_key_hash: hash } });
    if (!record || !record.is_active) return null;

    const stored = Buffer.from(record.api_key_hash);
    const incoming = Buffer.from(hash);
    if (stored.length !== incoming.length || !timingSafeEqual(stored, incoming)) return null;

    const limit = record.rate_limit ?? 1000;
    const now = Date.now();
    const window = rateLimitWindows.get(record.id);
    if (!window || now >= window.resetAt) {
        rateLimitWindows.set(record.id, { count: 1, resetAt: now + 3600_000 });
    } else {
        window.count += 1;
        if (window.count > limit) {
            return null;
        }
    }

    await prisma.partner_api_keys.update({
        where: { id: record.id },
        data: { last_used_at: new Date().toISOString() },
    }).catch(() => {});

    const payload = parseScopesPayload(record.scopes_json);
    return {
        id: record.id,
        name: record.name,
        scopes: payload.scopes,
        shop_id: payload.shop_id,
        barber_id: payload.barber_id,
        rate_limit: limit,
    };
}

export function partnerHasScope(scopes: string[], required: string): boolean {
    return scopes.includes('*') || scopes.includes(required);
}

export async function listPartnerApiKeys(limit = 50) {
    const rows = await prisma.partner_api_keys.findMany({
        orderBy: { created_at: 'desc' },
        take: limit,
        select: {
            id: true,
            name: true,
            scopes_json: true,
            is_active: true,
            rate_limit: true,
            created_at: true,
            last_used_at: true,
        },
    }).catch(() => []);
    return rows.map((row) => {
        const payload = parseScopesPayload(row.scopes_json);
        return {
            ...row,
            scopes: payload.scopes,
            shop_id: payload.shop_id ?? null,
            barber_id: payload.barber_id ?? null,
        };
    });
}

export async function revokePartnerApiKey(id: string) {
    return prisma.partner_api_keys.update({
        where: { id },
        data: { is_active: false },
    });
}
