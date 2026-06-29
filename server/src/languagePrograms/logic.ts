import crypto from 'crypto';
import Stripe from 'stripe';
import { prisma } from '../db/prisma';
import { getStripeApiKey } from '../config/stripeKeys';
import { parseSpokenLanguages, serializeLanguageOptions } from '../languages/logic';
import { SUPPORTED_LANGUAGE_CODES } from '../languages/config';
import {
    BARBER_ROLES,
    NON_REFUNDABLE_TERMS,
    PROGRAM_FORMATS,
    PROGRAM_STATUSES,
    TERMS_VERSION,
    WAITLIST_DEPOSIT_PERCENT,
    WAITLIST_STATUSES,
    type ProgramStatus,
} from './config';

export type AuthUser = { id: string; role?: string | null; full_name?: string | null; email?: string | null };

function nowIso(): string {
    return new Date().toISOString();
}

function roundMoney(n: number): number {
    return Math.round(n * 100) / 100;
}

export function computeDepositAmount(totalPrice: number): number {
    return roundMoney((totalPrice * WAITLIST_DEPOSIT_PERCENT) / 100);
}

export function isBarberRole(role?: string | null): boolean {
    return !!role && BARBER_ROLES.has(role);
}

function languageLabel(code: string): string {
    const opt = serializeLanguageOptions().find((l) => l.code === code);
    return opt?.label ?? code.toUpperCase();
}

async function getBarberForUser(userId: string) {
    return prisma.barbers.findFirst({ where: { user_id: userId } });
}

async function waitlistCounts(programId: string) {
    const waitlisted = await prisma.language_program_waitlist.count({
        where: { program_id: programId, status: { in: ['waitlisted', 'enrolled'] } },
    });
    const pending = await prisma.language_program_waitlist.count({
        where: { program_id: programId, status: 'pending_payment', payment_status: 'unpaid' },
    });
    return { waitlisted, pending };
}

function serializeProgram(
    row: {
        id: string;
        title: string;
        description: string | null;
        language_code: string;
        total_price: number;
        currency: string | null;
        max_waitlist: number | null;
        status: string | null;
        estimated_start_at: string | null;
        duration_weeks: number | null;
        format: string | null;
        image_url: string | null;
        created_at: string | null;
        updated_at: string | null;
    },
    extras?: Record<string, unknown>
) {
    const deposit_amount = computeDepositAmount(row.total_price);
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        language_code: row.language_code,
        language_label: languageLabel(row.language_code),
        total_price: row.total_price,
        currency: row.currency ?? 'EUR',
        deposit_percent: WAITLIST_DEPOSIT_PERCENT,
        deposit_amount,
        max_waitlist: row.max_waitlist,
        status: row.status ?? 'draft',
        estimated_start_at: row.estimated_start_at,
        duration_weeks: row.duration_weeks,
        format: row.format ?? 'online',
        image_url: row.image_url,
        created_at: row.created_at,
        updated_at: row.updated_at,
        ...extras,
    };
}

function serializeWaitlistEntry(row: {
    id: string;
    program_id: string;
    user_id: string;
    barber_id: string | null;
    target_language_code: string;
    status: string | null;
    deposit_percent: number | null;
    deposit_amount: number;
    total_program_price: number;
    payment_status: string | null;
    position: number | null;
    terms_accepted_at: string | null;
    enrolled_at: string | null;
    cancelled_at: string | null;
    created_at: string | null;
}) {
    return {
        id: row.id,
        program_id: row.program_id,
        user_id: row.user_id,
        barber_id: row.barber_id,
        target_language_code: row.target_language_code,
        target_language_label: languageLabel(row.target_language_code),
        status: row.status ?? 'pending_payment',
        deposit_percent: row.deposit_percent ?? WAITLIST_DEPOSIT_PERCENT,
        deposit_amount: row.deposit_amount,
        total_program_price: row.total_program_price,
        payment_status: row.payment_status ?? 'unpaid',
        position: row.position,
        terms_accepted_at: row.terms_accepted_at,
        enrolled_at: row.enrolled_at,
        cancelled_at: row.cancelled_at,
        created_at: row.created_at,
    };
}

export function getLanguageProgramsConfig() {
    return {
        deposit_percent: WAITLIST_DEPOSIT_PERCENT,
        terms_version: TERMS_VERSION,
        non_refundable_terms: NON_REFUNDABLE_TERMS,
        program_statuses: PROGRAM_STATUSES,
        program_formats: PROGRAM_FORMATS,
        waitlist_statuses: WAITLIST_STATUSES,
        languages: serializeLanguageOptions(),
    };
}

export async function listProviderLanguagePrograms(userId: string, role?: string | null) {
    if (!isBarberRole(role)) {
        throw new Error('Only barbers can browse language learning programs');
    }

    const barber = await getBarberForUser(userId);
    const spoken = parseSpokenLanguages(barber?.spoken_languages);

    const rows = await prisma.language_programs.findMany({
        where: { status: { in: ['open', 'closed', 'completed'] } },
        orderBy: [{ status: 'asc' }, { estimated_start_at: 'asc' }],
    });

    const myEntries = await prisma.language_program_waitlist.findMany({
        where: { user_id: userId },
    });
    const byProgram = new Map(myEntries.map((e) => [e.program_id, e]));

    const result = [];
    for (const row of rows) {
        const counts = await waitlistCounts(row.id);
        const mine = byProgram.get(row.id);
        const alreadySpeaks = spoken.includes(row.language_code);
        result.push(
            serializeProgram(row, {
                waitlist_count: counts.waitlisted,
                spots_left:
                    row.max_waitlist != null ? Math.max(0, row.max_waitlist - counts.waitlisted) : null,
                registration_open: row.status === 'open' && !alreadySpeaks,
                registration_reason: alreadySpeaks
                    ? `You already speak ${languageLabel(row.language_code)}.`
                    : row.status !== 'open'
                      ? 'This program is not accepting waitlist sign-ups.'
                      : row.max_waitlist != null && counts.waitlisted >= row.max_waitlist
                        ? 'Waitlist is full.'
                        : undefined,
                suggested: !alreadySpeaks && !spoken.includes(row.language_code),
                already_speaks_target: alreadySpeaks,
                my_waitlist: mine ? serializeWaitlistEntry(mine) : null,
            })
        );
    }

    return {
        spoken_languages: spoken,
        programs: result,
    };
}

export async function listMyLanguageProgramWaitlist(userId: string) {
    const rows = await prisma.language_program_waitlist.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
    });

    const programIds = [...new Set(rows.map((r) => r.program_id))];
    const programs = programIds.length
        ? await prisma.language_programs.findMany({ where: { id: { in: programIds } } })
        : [];
    const programMap = new Map(programs.map((p) => [p.id, p]));

    return rows.map((row) => {
        const program = programMap.get(row.program_id);
        return {
            ...serializeWaitlistEntry(row),
            program: program ? serializeProgram(program) : null,
        };
    });
}

export async function getProviderLanguageProgram(programId: string, userId: string, role?: string | null) {
    if (!isBarberRole(role)) throw new Error('Only barbers can view language programs');

    const row = await prisma.language_programs.findUnique({ where: { id: programId } });
    if (!row) throw new Error('Program not found');

    const barber = await getBarberForUser(userId);
    const spoken = parseSpokenLanguages(barber?.spoken_languages);
    const counts = await waitlistCounts(programId);
    const mine = await prisma.language_program_waitlist.findUnique({
        where: { program_id_user_id: { program_id: programId, user_id: userId } },
    });
    const alreadySpeaks = spoken.includes(row.language_code);

    return serializeProgram(row, {
        waitlist_count: counts.waitlisted,
        spots_left: row.max_waitlist != null ? Math.max(0, row.max_waitlist - counts.waitlisted) : null,
        registration_open: row.status === 'open' && !alreadySpeaks,
        registration_reason: alreadySpeaks
            ? `You already speak ${languageLabel(row.language_code)}.`
            : row.status !== 'open'
              ? 'This program is not accepting waitlist sign-ups.'
              : undefined,
        already_speaks_target: alreadySpeaks,
        my_waitlist: mine ? serializeWaitlistEntry(mine) : null,
    });
}

export async function createWaitlistCheckout(
    userId: string,
    role: string | null | undefined,
    programId: string,
    termsAccepted: boolean
) {
    if (!isBarberRole(role)) throw new Error('Only barbers can join language program waitlists');
    if (!termsAccepted) throw new Error('You must accept the non-refundable deposit terms');

    const program = await prisma.language_programs.findUnique({ where: { id: programId } });
    if (!program) throw new Error('Program not found');
    if (program.status !== 'open') throw new Error('This program is not open for waitlist sign-ups');

    const barber = await getBarberForUser(userId);
    if (!barber) throw new Error('Barber profile required to join a language program waitlist');

    const spoken = parseSpokenLanguages(barber.spoken_languages);
    if (spoken.includes(program.language_code)) {
        throw new Error(`You already speak ${languageLabel(program.language_code)}`);
    }

    const counts = await waitlistCounts(programId);
    if (program.max_waitlist != null && counts.waitlisted >= program.max_waitlist) {
        throw new Error('Waitlist is full');
    }

    const depositAmount = computeDepositAmount(program.total_price);
    const now = nowIso();

    let entry = await prisma.language_program_waitlist.findUnique({
        where: { program_id_user_id: { program_id: programId, user_id: userId } },
    });

    if (entry) {
        if (entry.status === 'waitlisted' || entry.status === 'enrolled') {
            throw new Error('You are already on this waitlist');
        }
        if (entry.status === 'cancelled' && entry.payment_status === 'paid') {
            throw new Error('Your previous waitlist spot was cancelled; deposit is non-refundable');
        }
        await prisma.language_program_waitlist.update({
            where: { id: entry.id },
            data: {
                status: 'pending_payment',
                payment_status: 'unpaid',
                deposit_amount: depositAmount,
                total_program_price: program.total_price,
                deposit_percent: WAITLIST_DEPOSIT_PERCENT,
                target_language_code: program.language_code,
                barber_id: barber.id,
                terms_accepted_at: now,
                terms_version: TERMS_VERSION,
                cancelled_at: null,
                updated_at: now,
            },
        });
        entry = await prisma.language_program_waitlist.findUnique({ where: { id: entry.id } });
    } else {
        entry = await prisma.language_program_waitlist.create({
            data: {
                id: crypto.randomUUID(),
                program_id: programId,
                user_id: userId,
                barber_id: barber.id,
                target_language_code: program.language_code,
                status: 'pending_payment',
                deposit_percent: WAITLIST_DEPOSIT_PERCENT,
                deposit_amount: depositAmount,
                total_program_price: program.total_price,
                payment_status: 'unpaid',
                terms_accepted_at: now,
                terms_version: TERMS_VERSION,
                created_at: now,
                updated_at: now,
            },
        });
    }

    if (!entry) throw new Error('Failed to create waitlist entry');

    const stripeKey = getStripeApiKey();
    if (!stripeKey?.startsWith('sk_')) {
        throw new Error('Stripe is not configured for waitlist deposits');
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2025-01-27.acacia' });
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const currency = (program.currency ?? 'EUR').toLowerCase();

    const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
            {
                price_data: {
                    currency,
                    product_data: {
                        name: `Language program waitlist, ${program.title}`,
                        description: `${WAITLIST_DEPOSIT_PERCENT}% non-refundable deposit (${depositAmount} ${program.currency ?? 'EUR'})`,
                    },
                    unit_amount: Math.round(depositAmount * 100),
                },
                quantity: 1,
            },
        ],
        success_url: `${frontendUrl}/ProviderLanguagePrograms?waitlist=success&program=${programId}`,
        cancel_url: `${frontendUrl}/ProviderLanguagePrograms?waitlist=cancelled&program=${programId}`,
        metadata: {
            type: 'language_program_waitlist_deposit',
            waitlist_id: entry.id,
            program_id: programId,
            user_id: userId,
            deposit_amount: String(depositAmount),
        },
    });

    await prisma.language_program_waitlist.update({
        where: { id: entry.id },
        data: {
            stripe_checkout_session_id: session.id,
            updated_at: nowIso(),
        },
    });

    return {
        checkout_url: session.url,
        session_id: session.id,
        waitlist: serializeWaitlistEntry(entry),
        deposit_amount: depositAmount,
        deposit_percent: WAITLIST_DEPOSIT_PERCENT,
    };
}

export async function confirmWaitlistDepositFromCheckout(session: Stripe.Checkout.Session) {
    const waitlistId = session.metadata?.waitlist_id;
    const userId = session.metadata?.user_id;
    const programId = session.metadata?.program_id;
    if (!waitlistId || !userId || !programId) {
        return { processed: false, reason: 'missing_metadata' };
    }

    const entry = await prisma.language_program_waitlist.findUnique({ where: { id: waitlistId } });
    if (!entry || entry.user_id !== userId || entry.program_id !== programId) {
        return { processed: false, reason: 'waitlist_mismatch' };
    }

    if (entry.payment_status === 'paid' && entry.status === 'waitlisted') {
        return { processed: true, reason: 'already_confirmed' };
    }

    const paidCount = await prisma.language_program_waitlist.count({
        where: { program_id: programId, status: { in: ['waitlisted', 'enrolled'] } },
    });
    const position = paidCount + 1;
    const now = nowIso();

    await prisma.language_program_waitlist.update({
        where: { id: waitlistId },
        data: {
            status: 'waitlisted',
            payment_status: 'paid',
            stripe_checkout_session_id: session.id,
            stripe_payment_intent_id:
                typeof session.payment_intent === 'string'
                    ? session.payment_intent
                    : session.payment_intent?.id ?? null,
            position,
            updated_at: now,
        },
    });

    await prisma.audit_logs.create({
        data: {
            action: 'LANGUAGE_PROGRAM_WAITLIST_PAID',
            resource_type: 'language_program_waitlist',
            resource_id: waitlistId,
            actor_id: userId,
            details: JSON.stringify({
                program_id: programId,
                deposit_amount: entry.deposit_amount,
                position,
                stripe_session_id: session.id,
            }),
        },
    });

    return { processed: true, waitlist_id: waitlistId, position };
}

export async function cancelLanguageProgramWaitlist(userId: string, programId: string) {
    const entry = await prisma.language_program_waitlist.findUnique({
        where: { program_id_user_id: { program_id: programId, user_id: userId } },
    });
    if (!entry) throw new Error('Waitlist entry not found');
    if (entry.status === 'enrolled') throw new Error('Cannot cancel after enrollment');
    if (entry.status === 'cancelled') throw new Error('Already cancelled');
    if (entry.status === 'pending_payment' && entry.payment_status !== 'paid') {
        await prisma.language_program_waitlist.update({
            where: { id: entry.id },
            data: { status: 'cancelled', cancelled_at: nowIso(), updated_at: nowIso() },
        });
        return { cancelled: true, deposit_refunded: false, message: NON_REFUNDABLE_TERMS };
    }

    await prisma.language_program_waitlist.update({
        where: { id: entry.id },
        data: { status: 'cancelled', cancelled_at: nowIso(), updated_at: nowIso() },
    });

    return {
        cancelled: true,
        deposit_refunded: false,
        message: 'Your waitlist spot was cancelled. The deposit remains non-refundable.',
    };
}

// --- Admin ---

function validateProgramInput(body: Record<string, unknown>, partial = false) {
    const title = body.title != null ? String(body.title).trim() : partial ? undefined : '';
    if (!partial && !title) throw new Error('Title is required');

    const language_code =
        body.language_code != null ? String(body.language_code).trim().toLowerCase() : partial ? undefined : '';
    if (!partial && (!language_code || !SUPPORTED_LANGUAGE_CODES.has(language_code))) {
        throw new Error('Valid target language is required');
    }
    if (language_code && !SUPPORTED_LANGUAGE_CODES.has(language_code)) {
        throw new Error('Unsupported language code');
    }

    const total_price =
        body.total_price != null ? Number(body.total_price) : partial ? undefined : NaN;
    if (!partial && (!Number.isFinite(total_price) || (total_price as number) <= 0)) {
        throw new Error('Total price must be greater than zero');
    }
    if (total_price != null && (!Number.isFinite(total_price) || total_price <= 0)) {
        throw new Error('Total price must be greater than zero');
    }

    const status = body.status != null ? String(body.status) : undefined;
    if (status && !PROGRAM_STATUSES.includes(status as ProgramStatus)) {
        throw new Error('Invalid program status');
    }

    return {
        title,
        description: body.description != null ? String(body.description) : undefined,
        language_code,
        total_price,
        currency: body.currency != null ? String(body.currency).toUpperCase() : undefined,
        max_waitlist: body.max_waitlist != null ? Number(body.max_waitlist) : undefined,
        status: status as ProgramStatus | undefined,
        estimated_start_at: body.estimated_start_at != null ? String(body.estimated_start_at) : undefined,
        duration_weeks: body.duration_weeks != null ? Number(body.duration_weeks) : undefined,
        format: body.format != null ? String(body.format) : undefined,
        image_url: body.image_url != null ? String(body.image_url) : undefined,
    };
}

export async function listAdminLanguagePrograms() {
    const rows = await prisma.language_programs.findMany({ orderBy: { created_at: 'desc' } });
    const result = [];
    for (const row of rows) {
        const counts = await waitlistCounts(row.id);
        result.push(serializeProgram(row, { waitlist_count: counts.waitlisted, pending_count: counts.pending }));
    }
    return result;
}

export async function createAdminLanguageProgram(adminId: string, body: Record<string, unknown>) {
    const input = validateProgramInput(body);
    const now = nowIso();
    const row = await prisma.language_programs.create({
        data: {
            id: crypto.randomUUID(),
            title: input.title!,
            description: input.description ?? null,
            language_code: input.language_code!,
            total_price: input.total_price!,
            currency: input.currency ?? 'EUR',
            max_waitlist: input.max_waitlist ?? null,
            status: input.status ?? 'draft',
            estimated_start_at: input.estimated_start_at ?? null,
            duration_weeks: input.duration_weeks ?? null,
            format: input.format ?? 'online',
            image_url: input.image_url ?? null,
            created_by: adminId,
            created_at: now,
            updated_at: now,
        },
    });
    return serializeProgram(row, { waitlist_count: 0, pending_count: 0 });
}

export async function updateAdminLanguageProgram(programId: string, body: Record<string, unknown>) {
    const existing = await prisma.language_programs.findUnique({ where: { id: programId } });
    if (!existing) throw new Error('Program not found');

    const input = validateProgramInput(body, true);
    const data: Record<string, unknown> = { updated_at: nowIso() };
    if (input.title !== undefined) data.title = input.title;
    if (input.description !== undefined) data.description = input.description;
    if (input.language_code !== undefined) data.language_code = input.language_code;
    if (input.total_price !== undefined) data.total_price = input.total_price;
    if (input.currency !== undefined) data.currency = input.currency;
    if (input.max_waitlist !== undefined) data.max_waitlist = input.max_waitlist;
    if (input.status !== undefined) data.status = input.status;
    if (input.estimated_start_at !== undefined) data.estimated_start_at = input.estimated_start_at;
    if (input.duration_weeks !== undefined) data.duration_weeks = input.duration_weeks;
    if (input.format !== undefined) data.format = input.format;
    if (input.image_url !== undefined) data.image_url = input.image_url;

    const row = await prisma.language_programs.update({ where: { id: programId }, data });
    const counts = await waitlistCounts(programId);
    return serializeProgram(row, { waitlist_count: counts.waitlisted, pending_count: counts.pending });
}

export async function listAdminProgramWaitlist(programId: string) {
    const program = await prisma.language_programs.findUnique({ where: { id: programId } });
    if (!program) throw new Error('Program not found');

    const rows = await prisma.language_program_waitlist.findMany({
        where: { program_id: programId },
        orderBy: [{ status: 'asc' }, { position: 'asc' }, { created_at: 'asc' }],
    });

    const userIds = [...new Set(rows.map((r) => r.user_id))];
    const users = userIds.length
        ? await prisma.users.findMany({
              where: { id: { in: userIds } },
              select: { id: true, full_name: true, email: true },
          })
        : [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    return rows.map((row) => ({
        ...serializeWaitlistEntry(row),
        user: userMap.get(row.user_id) ?? null,
    }));
}

export async function promoteWaitlistToEnrolled(waitlistId: string) {
    const entry = await prisma.language_program_waitlist.findUnique({ where: { id: waitlistId } });
    if (!entry) throw new Error('Waitlist entry not found');
    if (entry.status !== 'waitlisted') throw new Error('Only paid waitlisted barbers can be enrolled');
    if (entry.payment_status !== 'paid') throw new Error('Deposit must be paid before enrollment');

    const now = nowIso();
    await prisma.language_program_waitlist.update({
        where: { id: waitlistId },
        data: { status: 'enrolled', enrolled_at: now, updated_at: now },
    });

    return { enrolled: true, waitlist_id: waitlistId };
}
