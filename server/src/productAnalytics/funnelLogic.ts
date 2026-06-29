import { BOOKING_FUNNEL_STEPS, FUNNEL_CONVERSION_WINDOW_HOURS } from './config';



export type FunnelEventRow = {

    event_name: string;

    session_id: string | null;

    user_id: string | null;

    created_at: string | null;

};



function parseTs(iso: string | null | undefined): number | null {

    if (!iso) return null;

    const t = new Date(iso).getTime();

    return Number.isNaN(t) ? null : t;

}



export function eventNameToStepKey(eventName: string): string | null {

    for (const step of BOOKING_FUNNEL_STEPS) {

        if ((step.events as readonly string[]).includes(eventName)) {

            return step.key;

        }

    }

    return null;

}



export function eventNameToStepIndex(eventName: string): number {

    return BOOKING_FUNNEL_STEPS.findIndex((s) =>

        (s.events as readonly string[]).includes(eventName)

    );

}



/** Max consecutive funnel steps reached in strict order (no skipping, no out-of-order steps). */

export function maxStrictStepsReached(orderedEventNames: string[]): number {

    let expected = 0;

    let broken = false;



    for (const name of orderedEventNames) {

        const stepIdx = eventNameToStepIndex(name);

        if (stepIdx === -1) continue;

        if (broken) continue;



        if (stepIdx > expected) {

            broken = true;

            continue;

        }

        if (stepIdx === expected) {

            expected += 1;

        }

    }



    return expected;

}



/**

 * Strict funnel with conversion window from first homepage hit (best practice: bounded funnel).

 */

export function maxStrictStepsReachedInWindow(

    orderedEvents: Array<{ event_name: string; created_at: string | null }>,

    windowHours = FUNNEL_CONVERSION_WINDOW_HOURS

): number {

    const windowMs = windowHours * 3600000;

    const steps: Array<{ stepIdx: number; ts: number }> = [];



    for (const ev of orderedEvents) {

        const stepIdx = eventNameToStepIndex(ev.event_name);

        const ts = parseTs(ev.created_at);

        if (stepIdx === -1 || ts === null) continue;

        steps.push({ stepIdx, ts });

    }



    steps.sort((a, b) => a.ts - b.ts);



    let expected = 0;

    let broken = false;

    let windowStart: number | null = null;



    for (const { stepIdx, ts } of steps) {

        if (broken) continue;



        if (expected === 0) {

            if (stepIdx !== 0) continue;

            windowStart = ts;

            expected = 1;

            continue;

        }



        if (windowStart === null || ts - windowStart > windowMs) {

            broken = true;

            continue;

        }



        if (stepIdx > expected) {

            broken = true;

            continue;

        }

        if (stepIdx === expected) {

            expected += 1;

        }

    }



    return expected;

}



/** Person-level actor: prefer user_id so logged-in funnels stitch correctly (Kissmetrics person-based pattern). */

export function resolveFunnelActor(ev: FunnelEventRow): string {

    return ev.user_id || ev.session_id || `anon-${ev.created_at ?? 'unknown'}`;

}



export function groupEventsByActor(events: FunnelEventRow[]): Map<string, FunnelEventRow[]> {

    const map = new Map<string, FunnelEventRow[]>();

    for (const ev of events) {

        const actor = resolveFunnelActor(ev);

        const list = map.get(actor) ?? [];

        list.push(ev);

        map.set(actor, list);

    }

    return map;

}



export function computeLooseFunnelCounts(events: FunnelEventRow[]) {

    const stepSessions: Record<string, Set<string>> = {};

    const stepUsers: Record<string, Set<string>> = {};

    for (const step of BOOKING_FUNNEL_STEPS) {

        stepSessions[step.key] = new Set();

        stepUsers[step.key] = new Set();

    }



    for (const ev of events) {

        const step = BOOKING_FUNNEL_STEPS.find((s) =>

            (s.events as readonly string[]).includes(ev.event_name)

        );

        if (!step) continue;

        const actor = resolveFunnelActor(ev);

        stepSessions[step.key].add(actor);

        if (ev.user_id) stepUsers[step.key].add(ev.user_id);

    }



    return { stepSessions, stepUsers };

}



function strictCountsFromReachFn(

    events: FunnelEventRow[],

    reachFn: (sorted: FunnelEventRow[]) => number

): Record<string, number> {

    const counts: Record<string, number> = Object.fromEntries(

        BOOKING_FUNNEL_STEPS.map((s) => [s.key, 0])

    );



    const byActor = groupEventsByActor(events);

    for (const [, rows] of byActor) {

        const sorted = [...rows].sort((a, b) =>

            (a.created_at ?? '').localeCompare(b.created_at ?? '')

        );

        const reached = reachFn(sorted);

        for (let i = 0; i < reached; i++) {

            const key = BOOKING_FUNNEL_STEPS[i].key;

            counts[key] = (counts[key] ?? 0) + 1;

        }

    }



    return counts;

}



export function computeStrictFunnelCounts(events: FunnelEventRow[]) {

    return strictCountsFromReachFn(events, (sorted) =>

        maxStrictStepsReached(sorted.map((r) => r.event_name))

    );

}



export function computeTimeWindowedStrictFunnelCounts(

    events: FunnelEventRow[],

    windowHours = FUNNEL_CONVERSION_WINDOW_HOURS

) {

    return strictCountsFromReachFn(events, (sorted) => maxStrictStepsReachedInWindow(sorted, windowHours));

}



function median(values: number[]): number | null {

    if (values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);

    const mid = Math.floor(sorted.length / 2);

    return sorted.length % 2 === 0

        ? Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 10) / 10

        : Math.round(sorted[mid] * 10) / 10;

}



/** Median hours between first hit of consecutive funnel steps (diagnostic for drop-off). */

export function computeStepMedianHours(events: FunnelEventRow[]) {

    const transitions: Record<string, number[]> = {};

    for (let i = 0; i < BOOKING_FUNNEL_STEPS.length - 1; i++) {

        const from = BOOKING_FUNNEL_STEPS[i].key;

        const to = BOOKING_FUNNEL_STEPS[i + 1].key;

        transitions[`${from}->${to}`] = [];

    }



    const byActor = groupEventsByActor(events);

    for (const [, rows] of byActor) {

        const sorted = [...rows].sort((a, b) =>

            (a.created_at ?? '').localeCompare(b.created_at ?? '')

        );



        const firstHit = new Map<number, number>();

        for (const row of sorted) {

            const idx = eventNameToStepIndex(row.event_name);

            const ts = parseTs(row.created_at);

            if (idx === -1 || ts === null || firstHit.has(idx)) continue;

            firstHit.set(idx, ts);

        }



        for (let i = 0; i < BOOKING_FUNNEL_STEPS.length - 1; i++) {

            const fromTs = firstHit.get(i);

            const toTs = firstHit.get(i + 1);

            if (fromTs === undefined || toTs === undefined || toTs < fromTs) continue;

            const key = `${BOOKING_FUNNEL_STEPS[i].key}->${BOOKING_FUNNEL_STEPS[i + 1].key}`;

            transitions[key].push((toTs - fromTs) / 3600000);

        }

    }



    return BOOKING_FUNNEL_STEPS.slice(0, -1).map((step, i) => {

        const next = BOOKING_FUNNEL_STEPS[i + 1];

        const key = `${step.key}->${next.key}`;

        return {

            from_step: step.key,

            from_label: step.label,

            to_step: next.key,

            to_label: next.label,

            median_hours: median(transitions[key] ?? []),

            sample_size: (transitions[key] ?? []).length,

        };

    });

}



export function computeDailyFunnelTrend(events: FunnelEventRow[]) {

    const byDay = new Map<string, Record<string, Set<string>>>();



    for (const ev of events) {

        const stepKey = eventNameToStepKey(ev.event_name);

        if (!stepKey || !ev.created_at) continue;

        const day = ev.created_at.slice(0, 10);

        if (!byDay.has(day)) {

            byDay.set(

                day,

                Object.fromEntries(BOOKING_FUNNEL_STEPS.map((s) => [s.key, new Set<string>()]))

            );

        }

        const actor = resolveFunnelActor(ev);

        byDay.get(day)![stepKey].add(actor);

    }



    return [...byDay.entries()]

        .sort(([a], [b]) => a.localeCompare(b))

        .map(([date, steps]) => {

            const row: Record<string, string | number> = { date };

            for (const step of BOOKING_FUNNEL_STEPS) {

                row[step.key] = steps[step.key]?.size ?? 0;

            }

            return row;

        });

}



export function buildFunnelStepRows(

    stepSessions: Record<string, Set<string>>,

    stepUsers: Record<string, Set<string>>,

    strictCounts?: Record<string, number>,

    windowedStrictCounts?: Record<string, number>

) {

    return BOOKING_FUNNEL_STEPS.map((step, idx) => {

        const sessions = stepSessions[step.key]?.size ?? 0;

        const users = stepUsers[step.key]?.size ?? 0;

        const strict_sessions = strictCounts?.[step.key] ?? 0;

        const windowed_strict_sessions = windowedStrictCounts?.[step.key] ?? 0;

        const prevSessions =

            idx > 0 ? (stepSessions[BOOKING_FUNNEL_STEPS[idx - 1].key]?.size ?? 0) : sessions;

        const prevStrict =

            idx > 0 ? (strictCounts?.[BOOKING_FUNNEL_STEPS[idx - 1].key] ?? 0) : strict_sessions;

        return {

            key: step.key,

            label: step.label,

            sessions,

            users,

            strict_sessions,

            windowed_strict_sessions,

            drop_off_from_previous_pct:

                idx === 0 || prevSessions === 0

                    ? 0

                    : Math.round((1 - sessions / prevSessions) * 1000) / 10,

            strict_drop_off_from_previous_pct:

                idx === 0 || prevStrict === 0

                    ? 0

                    : Math.round((1 - strict_sessions / prevStrict) * 1000) / 10,

            conversion_from_previous_pct:

                idx === 0 || prevSessions === 0 ? 100 : Math.round((sessions / prevSessions) * 1000) / 10,

            conversion_from_home_pct:

                (stepSessions.home?.size ?? 0) === 0

                    ? 0

                    : Math.round((sessions / (stepSessions.home?.size ?? 1)) * 1000) / 10,

            strict_conversion_from_home_pct:

                strictCounts && (strictCounts.home ?? 0) > 0

                    ? Math.round((strict_sessions / (strictCounts.home ?? 1)) * 1000) / 10

                    : 0,

            windowed_strict_conversion_from_home_pct:

                windowedStrictCounts && (windowedStrictCounts.home ?? 0) > 0

                    ? Math.round(

                          (windowed_strict_sessions / (windowedStrictCounts.home ?? 1)) * 1000

                      ) / 10

                    : 0,

        };

    });

}


