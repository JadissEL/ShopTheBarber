/** Client reputation levels — docs/specs/REPUTATION_TRUST.md */

export const REPUTATION_LEVELS = [
    { key: 'new', label: 'New', minScore: 0 },
    { key: 'bronze', label: 'Bronze', minScore: 50 },
    { key: 'silver', label: 'Silver', minScore: 200 },
    { key: 'gold', label: 'Gold', minScore: 500 },
    { key: 'platinum', label: 'Platinum', minScore: 1000 },
    { key: 'diamond', label: 'Diamond', minScore: 2500 },
    { key: 'legend', label: 'Legend', minScore: 5000 },
] as const;

export type ReputationLevelKey = (typeof REPUTATION_LEVELS)[number]['key'];

export function levelFromScore(score: number): ReputationLevelKey {
    const s = Math.max(0, score);
    let level: ReputationLevelKey = 'new';
    for (const tier of REPUTATION_LEVELS) {
        if (s >= tier.minScore) level = tier.key;
    }
    return level;
}

export function levelLabel(key: string): string {
    return REPUTATION_LEVELS.find((l) => l.key === key)?.label ?? 'New';
}

export function nextLevelProgress(score: number): { current: ReputationLevelKey; next: ReputationLevelKey | null; progressPct: number } {
    const current = levelFromScore(score);
    const idx = REPUTATION_LEVELS.findIndex((l) => l.key === current);
    const next = REPUTATION_LEVELS[idx + 1] ?? null;
    if (!next) return { current, next: null, progressPct: 100 };
    const floor = REPUTATION_LEVELS[idx].minScore;
    const span = next.minScore - floor;
    const progressPct = span > 0 ? Math.min(100, Math.round(((score - floor) / span) * 100)) : 100;
    return { current, next: next.key, progressPct };
}
