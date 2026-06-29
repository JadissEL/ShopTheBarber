import { prisma } from '../db/prisma';
import { ANALYTICS_EVENTS, ANALYTICS_SCHEMA_VERSION, type AnalyticsEventName } from './config';

export type TrackEventInput = {
    event_name: AnalyticsEventName | string;
    user_id?: string | null;
    session_id?: string | null;
    properties?: Record<string, unknown> | null;
    page_path?: string | null;
};

function sanitizeProperties(props: Record<string, unknown> | null | undefined): string | null {
    if (!props || typeof props !== 'object') return null;
    const safe: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(props)) {
        if (v === undefined) continue;
        if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' || v === null) {
            safe[k] = v;
        } else if (Array.isArray(v)) {
            safe[k] = v.slice(0, 20).map((x) => (typeof x === 'object' ? String(x) : x));
        } else {
            safe[k] = String(v);
        }
    }
    return JSON.stringify(safe);
}

function mergeGlobalProperties(props: Record<string, unknown> | null | undefined): Record<string, unknown> {
    const base = props && typeof props === 'object' ? { ...props } : {};
    if (base.schema_version === undefined) {
        base.schema_version = ANALYTICS_SCHEMA_VERSION;
    }
    return base;
}

export async function trackProductEvent(input: TrackEventInput): Promise<{ id: string }> {
    const event_name = String(input.event_name || '').trim().slice(0, 120);
    if (!event_name) throw new Error('event_name required');

    const row = await prisma.product_analytics_events.create({
        data: {
            event_name,
            user_id: input.user_id ?? null,
            session_id: input.session_id?.slice(0, 64) ?? null,
            properties: sanitizeProperties(mergeGlobalProperties(input.properties)),
            page_path: input.page_path?.slice(0, 512) ?? null,
        },
        select: { id: true },
    });
    return row;
}

export async function trackProductEventsBatch(events: TrackEventInput[]): Promise<{ inserted: number }> {
    if (events.length === 0) return { inserted: 0 };
    const capped = events.slice(0, 50);
    await prisma.product_analytics_events.createMany({
        data: capped.map((e) => ({
            event_name: String(e.event_name || '').trim().slice(0, 120),
            user_id: e.user_id ?? null,
            session_id: e.session_id?.slice(0, 64) ?? null,
            properties: sanitizeProperties(mergeGlobalProperties(e.properties)),
            page_path: e.page_path?.slice(0, 512) ?? null,
        })),
    });
    return { inserted: capped.length };
}

/** Stitch anonymous pre-login events to authenticated user (Amplitude identify pattern). */
export async function identifyProductUser(input: {
    user_id: string;
    anonymous_id?: string | null;
    session_id?: string | null;
}): Promise<{ updated: number }> {
    let updated = 0;

    if (input.session_id) {
        const bySession = await prisma.product_analytics_events.updateMany({
            where: { user_id: null, session_id: input.session_id },
            data: { user_id: input.user_id },
        });
        updated += bySession.count;
    }

    if (input.anonymous_id) {
        const recent = await prisma.product_analytics_events.findMany({
            where: { user_id: null },
            select: { id: true, properties: true },
            orderBy: { created_at: 'desc' },
            take: 1000,
        });
        const matchIds = recent
            .filter((row) => {
                if (!row.properties) return false;
                try {
                    const parsed = JSON.parse(row.properties) as Record<string, unknown>;
                    return parsed.anonymous_id === input.anonymous_id;
                } catch {
                    return false;
                }
            })
            .map((row) => row.id);
        if (matchIds.length > 0) {
            const byAnon = await prisma.product_analytics_events.updateMany({
                where: { id: { in: matchIds } },
                data: { user_id: input.user_id },
            });
            updated += byAnon.count;
        }
    }

    await trackProductEvent({
        event_name: ANALYTICS_EVENTS.USER_IDENTIFIED,
        user_id: input.user_id,
        session_id: input.session_id ?? null,
        properties: { anonymous_id: input.anonymous_id ?? null, stitched_events: updated },
    });

    return { updated };
}

/** Fire-and-forget from booking/webhook paths */
export function trackProductEventInternal(input: TrackEventInput): void {
    trackProductEvent(input).catch((err) => {
        console.warn('[productAnalytics] track failed', err instanceof Error ? err.message : err);
    });
}
