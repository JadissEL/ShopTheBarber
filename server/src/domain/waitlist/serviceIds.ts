/** Parse persisted multi-service waitlist payload */

export function parseWaitlistServiceIds(entry: {
    service_id?: string | null;
    service_ids_json?: string | null;
}): string[] {
    if (entry.service_ids_json) {
        try {
            const parsed = JSON.parse(entry.service_ids_json) as unknown;
            if (Array.isArray(parsed)) {
                return parsed.filter((id): id is string => typeof id === 'string' && id.length > 0);
            }
        } catch {
            /* fall through */
        }
    }
    return entry.service_id ? [entry.service_id] : [];
}

export function serializeWaitlistServiceIds(serviceIds: string[]): {
    service_ids_json: string | null;
    service_id: string | null;
} {
    const unique = [...new Set(serviceIds.filter((id) => typeof id === 'string' && id.length > 0))];
    return {
        service_ids_json: unique.length > 0 ? JSON.stringify(unique) : null,
        service_id: unique[0] ?? null,
    };
}
