import { runHealthCheck } from './health';

export type StatusComponent = {
    id: string;
    name: string;
    status: 'operational' | 'degraded' | 'outage' | 'unknown';
    description?: string;
};

export type PublicIncident = {
    title: string;
    status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
    message: string;
    updated_at: string;
};

function parseIncidentsFromEnv(): PublicIncident[] {
    const raw = process.env.STATUS_PAGE_INCIDENTS?.trim();
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw) as PublicIncident[];
        return Array.isArray(parsed)
            ? parsed.filter((i) => i.title && i.message).slice(0, 5)
            : [];
    } catch {
        return [];
    }
}

export async function getPublicStatusPage() {
    const [live, ready] = await Promise.all([runHealthCheck(false), runHealthCheck(true)]);

    const components: StatusComponent[] = [
        {
            id: 'api',
            name: 'Booking API',
            status: live.db === 'ok' ? 'operational' : 'outage',
            description: 'Core REST API and real-time subscriptions',
        },
        {
            id: 'database',
            name: 'Database',
            status:
                ready.db === 'ok' && ready.migrations === 'ok' && ready.schema === 'ok'
                    ? 'operational'
                    : ready.db === 'ok'
                      ? 'degraded'
                      : 'outage',
            description: 'Neon PostgreSQL via Prisma',
        },
        {
            id: 'geocoding',
            name: 'Address search',
            status: ready.geocoding?.production_ready ? 'operational' : 'degraded',
            description: ready.geocoding
                ? `Provider: ${ready.geocoding.provider}`
                : 'Geocoding configuration',
        },
        {
            id: 'payments',
            name: 'Payments (Stripe)',
            status: process.env.STRIPE_API_KEY ? 'operational' : 'degraded',
            description: 'Checkout, Connect payouts, webhooks',
        },
    ];

    const hasOutage = components.some((c) => c.status === 'outage');
    const hasDegraded = components.some((c) => c.status === 'degraded');
    const activeIncidents = parseIncidentsFromEnv().filter((i) => i.status !== 'resolved');

    let overall: 'operational' | 'degraded' | 'outage' = 'operational';
    if (hasOutage || activeIncidents.some((i) => i.status === 'investigating')) {
        overall = hasOutage ? 'outage' : 'degraded';
    } else if (hasDegraded || activeIncidents.length > 0) {
        overall = 'degraded';
    }

    return {
        generated_at: new Date().toISOString(),
        overall_status: overall,
        components,
        active_incidents: activeIncidents,
        recent_incidents: parseIncidentsFromEnv().filter((i) => i.status === 'resolved').slice(0, 3),
        uptime_seconds: ready.uptime_seconds,
        version: ready.version,
        monitors: {
            health_live: '/api/health/live',
            health_ready: '/api/health/ready',
            github_uptime_workflow: 'Uptime Monitor (every 5 min)',
        },
    };
}
