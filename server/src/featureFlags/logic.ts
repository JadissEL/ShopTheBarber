import { prisma } from '../db/prisma';
import { ALWAYS_ON_FEATURE_KEYS, RUNTIME_FEATURE_MODULES, type RuntimeFeatureKey } from './registry';

export async function ensureFeatureFlagsSeeded(): Promise<void> {
    for (const mod of RUNTIME_FEATURE_MODULES) {
        await prisma.feature_flags.upsert({
            where: { key: mod.key },
            create: {
                key: mod.key,
                label: mod.label,
                description: mod.description,
                enabled: true,
            },
            update: {},
        });
    }
}

export async function getPublicFeatureFlags(): Promise<Record<string, boolean>> {
    await ensureFeatureFlagsSeeded();
    const rows = await prisma.feature_flags.findMany({
        where: { key: { in: RUNTIME_FEATURE_MODULES.map((m) => m.key) } },
    });
    const map: Record<string, boolean> = {};
    for (const key of ALWAYS_ON_FEATURE_KEYS) {
        map[key] = true;
    }
    for (const mod of RUNTIME_FEATURE_MODULES) {
        const row = rows.find((r) => r.key === mod.key);
        map[mod.key] = row?.enabled !== false;
    }
    return map;
}

export async function listAdminFeatureModules() {
    await ensureFeatureFlagsSeeded();
    const rows = await prisma.feature_flags.findMany({
        where: { key: { in: RUNTIME_FEATURE_MODULES.map((m) => m.key) } },
    });
    return RUNTIME_FEATURE_MODULES.map((mod) => {
        const row = rows.find((r) => r.key === mod.key);
        return {
            id: mod.key,
            label: mod.label,
            description: mod.description,
            enabled: row?.enabled !== false,
            alwaysOn: false,
            updatedAt: row?.updated_at ?? null,
        };
    });
}

export async function setFeatureFlagEnabled(key: string, enabled: boolean) {
    const valid = RUNTIME_FEATURE_MODULES.some((m) => m.key === key);
    if (!valid || ALWAYS_ON_FEATURE_KEYS.has(key)) {
        throw new Error('Invalid or non-toggleable feature key');
    }
    await ensureFeatureFlagsSeeded();
    const updated = await prisma.feature_flags.update({
        where: { key: key as RuntimeFeatureKey },
        data: { enabled, updated_at: new Date().toISOString() },
    });
    return updated;
}
