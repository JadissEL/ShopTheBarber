/**
 * RS2 — Validate QA journey personas: Clerk + DB + profiles + dashboard path.
 *
 * Usage: npx tsx src/db/verifyQaProfiles.ts
 */
import '../loadEnv';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClerkClient } from '@clerk/backend';
import { prisma } from './prisma';
import { dashboardPathForAccountType } from '../auth/accountType';
import { resolveCompanyCommerceEnabled } from '../auth/companyCommerce';
import { hasCapability, type CapabilityContext } from '../auth/capabilities';

const here = dirname(fileURLToPath(import.meta.url));
const profilesPath = resolve(here, '../../../scripts/qa-profiles.json');

type QaRow = {
    id: string;
    email: string;
    role: string;
    account_type?: string;
    label?: string;
};

const JOURNEY_IDS = [
    'qa-c1',
    'qa-b1',
    'qa-o1',
    'qa-seller',
    'qa-company',
    'qa-blogger',
    'qa-admin',
] as const;

function resolveAccountType(p: QaRow): string | null {
    if (p.account_type) return p.account_type;
    switch (p.role) {
        case 'barber':
            return 'solo_barber';
        case 'shop_owner':
            return 'shop';
        case 'client':
            return 'client';
        case 'seller':
            return 'seller';
        case 'company':
            return 'company';
        case 'blogger':
            return 'blogger';
        default:
            return null;
    }
}

function capabilityContext(user: {
    id: string;
    role: string | null;
    account_type: string | null;
}): CapabilityContext {
    return {
        userId: user.id,
        role: user.role,
        accountType: user.account_type,
        isAdmin: user.role === 'admin',
    };
}

async function verifyProfile(p: QaRow, clerk: ReturnType<typeof createClerkClient>): Promise<string[]> {
    const errors: string[] = [];
    const expectedAccountType = resolveAccountType(p);

    console.log(`\n✓ ${p.email}`);

    const clerkList = await clerk.users.getUserList({ emailAddress: [p.email], limit: 1 });
    const clerkUser = clerkList.data[0];
    if (!clerkUser) {
        errors.push('Clerk user missing');
        console.log('  ✗ Clerk user exists');
    } else {
        console.log('  ✓ Clerk user exists');
        if (clerkUser.id) console.log(`    clerk_id: ${clerkUser.id}`);
    }

    const dbUser = await prisma.users.findUnique({ where: { id: p.id } });
    if (!dbUser) {
        errors.push('Database user missing');
        console.log('  ✗ Database user exists');
        return errors;
    }
    console.log('  ✓ Database user exists');
    console.log(`    role: ${dbUser.role}`);

    if (expectedAccountType && dbUser.account_type !== expectedAccountType) {
        errors.push(`account_type expected ${expectedAccountType}, got ${dbUser.account_type}`);
        console.log(`  ✗ account_type = ${expectedAccountType} (got ${dbUser.account_type})`);
    } else if (expectedAccountType) {
        console.log(`  ✓ account_type = ${expectedAccountType}`);
    }

    if (clerkUser && dbUser.clerk_user_id !== clerkUser.id) {
        errors.push('clerk_user_id mismatch');
        console.log('  ✗ clerk_user_id synced');
    } else if (clerkUser) {
        console.log('  ✓ clerk_user_id synced');
    }

    if (p.role === 'seller') {
        const sp = await prisma.seller_profiles.findUnique({ where: { user_id: p.id } });
        if (!sp) {
            errors.push('seller_profiles missing');
            console.log('  ✗ seller profile');
        } else {
            console.log('  ✓ seller profile');
        }
    }

    if (p.role === 'company') {
        const ca = await prisma.company_accounts.findUnique({ where: { user_id: p.id } });
        if (!ca) {
            errors.push('company_accounts missing');
            console.log('  ✗ company account');
        } else {
            console.log('  ✓ company account');
        }
    }

    if (p.role === 'blogger') {
        const ap = await prisma.author_profiles.findUnique({ where: { user_id: p.id } });
        if (!ap) {
            errors.push('author_profiles missing');
            console.log('  ✗ author profile');
        } else {
            console.log('  ✓ author profile');
        }
    }

    if (p.role === 'barber' || p.role === 'shop_owner') {
        const barber = await prisma.barbers.findFirst({ where: { user_id: p.id } });
        if (!barber) {
            errors.push('barber profile missing');
            console.log('  ✗ barber profile');
        } else {
            console.log('  ✓ barber profile');
        }
    }

    if (p.role === 'shop_owner') {
        const shop = await prisma.shops.findFirst({ where: { owner_id: p.id } });
        if (!shop) {
            errors.push('shop ownership missing');
            console.log('  ✗ shop owner record');
        } else {
            console.log('  ✓ shop owner record');
        }
    }

    const ctx = capabilityContext(dbUser);
    const capKeys = ['product.write', 'job.write', 'article.write', 'booking.provider.tools'] as const;
    const loaded = capKeys.filter((k) => hasCapability(ctx, k));
    console.log(`  ✓ Capabilities loaded (${loaded.length} core keys checked)`);

    const dash =
        dbUser.role === 'admin'
            ? '/GlobalFinancials'
            : dashboardPathForAccountType(dbUser.account_type);
    console.log(`  ✓ Dashboard path: ${dash}`);

    if (dbUser.account_type === 'company') {
        const commerce = await resolveCompanyCommerceEnabled({
            id: dbUser.id,
            account_type: dbUser.account_type,
        });
        console.log(`    company commerce: ${commerce ? 'enabled' : 'disabled'}`);
    }

    if (errors.length) {
        console.log('  ✗ Validation failed');
    } else {
        console.log('  ✓ Dashboard accessible (provision chain OK)');
    }

    return errors;
}

async function main() {
    const secret = process.env.CLERK_SECRET_KEY;
    if (!secret) {
        console.error('Missing CLERK_SECRET_KEY');
        process.exit(1);
    }

    const all = JSON.parse(readFileSync(profilesPath, 'utf8')) as QaRow[];
    const journeyProfiles = JOURNEY_IDS.map((id) => all.find((r) => r.id === id)).filter(Boolean) as QaRow[];

    console.log('\n=== QA Profile Verification (journey personas) ===\n');

    const clerk = createClerkClient({ secretKey: secret });
    const allErrors: string[] = [];

    for (const p of journeyProfiles) {
        const errs = await verifyProfile(p, clerk);
        allErrors.push(...errs.map((e) => `${p.email}: ${e}`));
    }

    // Guest booking fixture
    const service = await prisma.services.findUnique({ where: { id: 'ser1' } });
    const barber = await prisma.barbers.findUnique({ where: { id: 'gb1' } });
    console.log('\n--- E2E guest booking fixture ---');
    if (service?.name === 'Signature Cut' && barber) {
        console.log('  ✓ Signature Cut service + gb1 barber');
    } else {
        allErrors.push('E2E guest booking fixture incomplete');
        console.log('  ✗ Signature Cut / gb1 missing — run npm run qa:provision');
    }

    console.log('\n========== SUMMARY ==========');
    if (allErrors.length) {
        console.log(`FAILED (${allErrors.length} issue(s)):`);
        for (const e of allErrors) console.log(`  - ${e}`);
        process.exit(1);
    }
    console.log('ALL JOURNEY PERSONAS VERIFIED');
}

main()
    .catch((err) => {
        console.error(err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
