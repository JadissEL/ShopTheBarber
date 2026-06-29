import { prisma } from '../../db/prisma';

export async function listLedgerEntries(params: {
    limit?: number;
    offset?: number;
    event_type?: string;
    entity_type?: string;
    search?: string;
}) {
    const limit = Math.min(Math.max(params.limit ?? 50, 1), 200);
    const offset = Math.max(params.offset ?? 0, 0);

    const filters: Array<Record<string, unknown>> = [];
    if (params.event_type?.trim()) {
        filters.push({ event_type: params.event_type.trim() });
    }
    if (params.entity_type?.trim()) {
        filters.push({ entity_type: params.entity_type.trim() });
    }
    if (params.search?.trim()) {
        const q = params.search.trim();
        filters.push({
            OR: [
                { entity_id: { contains: q, mode: 'insensitive' as const } },
                { event_type: { contains: q, mode: 'insensitive' as const } },
                { payload_json: { contains: q, mode: 'insensitive' as const } },
            ],
        });
    }

    const where = filters.length > 0 ? { AND: filters } : {};

    const [rows, total] = await Promise.all([
        prisma.ledger_entries.findMany({
            where,
            orderBy: { created_at: 'desc' },
            take: limit,
            skip: offset,
        }),
        prisma.ledger_entries.count({ where }),
    ]);

    return {
        entries: rows.map((row) => ({
            id: row.id,
            entity_type: row.entity_type,
            entity_id: row.entity_id,
            event_type: row.event_type,
            payload: row.payload_json ? safeParseJson(row.payload_json) : null,
            actor_id: row.actor_id,
            created_at: row.created_at,
        })),
        total,
        limit,
        offset,
    };
}

function safeParseJson(raw: string): unknown {
    try {
        return JSON.parse(raw);
    } catch {
        return raw;
    }
}
