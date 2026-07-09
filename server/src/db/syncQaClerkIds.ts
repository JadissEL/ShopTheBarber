/**
 * Sync Clerk user IDs to QA profile rows after provision-qa-profiles.mjs Clerk API calls.
 */
import '../loadEnv';
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { prisma } from './prisma';

const here = dirname(fileURLToPath(import.meta.url));
const profilesPath = resolve(here, '../../../scripts/qa-profiles.json');

type ClerkSyncRow = { email: string; clerkId: string };

async function main() {
    const fileArg = process.argv[2];
    if (!fileArg) {
        console.error('Usage: tsx src/db/syncQaClerkIds.ts <path-to-json>');
        process.exit(1);
    }

    const rows = JSON.parse(readFileSync(fileArg, 'utf8')) as ClerkSyncRow[];
    const profiles = JSON.parse(readFileSync(profilesPath, 'utf8')) as { id: string; email: string }[];
    const now = new Date().toISOString();

    for (const row of rows) {
        const p = profiles.find((x) => x.email === row.email);
        if (!p) continue;
        await prisma.users.update({
            where: { id: p.id },
            data: { clerk_user_id: row.clerkId, updated_at: now },
        });
    }

    console.log(`Synced clerk_user_id for ${rows.length} profile(s).`);
}

main()
    .catch((err) => {
        console.error(err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
