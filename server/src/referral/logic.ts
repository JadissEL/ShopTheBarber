import { prisma } from '../db/prisma';
import { applyPointsDelta } from '../loyalty/logic';
import { appendLedgerEntry } from '../domain/ledger/append';
import { REFERRAL_PROGRAMS, resolveProgramType, type ReferralProgramType } from './config';

function generateCodeFromUserId(userId: string): string {
    const slice = userId.replace(/-/g, '').slice(0, 6).toUpperCase();
    return `STB-${slice}`;
}

export async function getOrCreateReferralCode(userId: string): Promise<string> {
    const user = await prisma.users.findUnique({ where: { id: userId }, select: { referral_code: true } });
    if (user?.referral_code) return user.referral_code;

    let code = generateCodeFromUserId(userId);
    let attempt = 0;
    while (attempt < 5) {
        const existing = await prisma.users.findFirst({ where: { referral_code: code } });
        if (!existing) break;
        code = `STB-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
        attempt++;
    }

    await prisma.users.update({
        where: { id: userId },
        data: { referral_code: code, updated_at: new Date().toISOString() },
    });
    return code;
}

function generateWelcomePromoCode(userId: string): string {
    const slice = userId.replace(/-/g, '').slice(0, 5).toUpperCase();
    const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
    return `REF-${slice}-${rand}`;
}

async function creditWallet(userId: string, amount: number, description: string, relatedId?: string) {
    if (amount <= 0) return;

    let wallet = await prisma.wallet_accounts.findUnique({ where: { user_id: userId } });
    if (!wallet) {
        wallet = await prisma.wallet_accounts.create({
            data: { id: crypto.randomUUID(), user_id: userId, balance: 0, currency: 'USD' },
        });
    }

    const newBalance = (wallet.balance ?? 0) + amount;
    await prisma.wallet_accounts.update({
        where: { id: wallet.id },
        data: { balance: newBalance, updated_at: new Date().toISOString() },
    });

    await prisma.wallet_transactions.create({
        data: {
            id: crypto.randomUUID(),
            wallet_id: wallet.id,
            user_id: userId,
            amount,
            type: 'referral_credit',
            description: relatedId ? `${description} (${relatedId})` : description,
        },
    });

    await appendLedgerEntry({
        entityType: 'wallet_account',
        entityId: wallet.id,
        eventType: 'referral_bonus',
        payload: { amount, description, related_id: relatedId },
        actorId: userId,
    }).catch(() => {});
}

async function createRefereeWelcomePromo(userId: string, discountFixed: number): Promise<string> {
    const code = generateWelcomePromoCode(userId);
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 90);
    await prisma.promo_codes.create({
        data: {
            code,
            discount_type: 'fixed',
            discount_value: discountFixed,
            shop_id: null,
            owner_user_id: userId,
            is_active: true,
            expiry_date: expiry.toISOString(),
        },
    });
    return code;
}

async function notifyUser(userId: string, title: string, message: string, type: string) {
    await prisma.notifications.create({
        data: {
            id: crypto.randomUUID(),
            user_id: userId,
            title,
            message,
            type,
            is_read: false,
        },
    });
}

export async function validateReferralCode(code: string) {
    const normalized = code.trim().toUpperCase();
    if (!normalized) throw new Error('Referral code is required');

    const referrer = await prisma.users.findFirst({
        where: { referral_code: normalized },
        select: { id: true, full_name: true, role: true, account_type: true, referral_code: true },
    });
    if (!referrer) throw new Error('Invalid referral code');

    return referrer;
}

export async function claimReferralCode(refereeUserId: string, code: string) {
    const referee = await prisma.users.findUnique({ where: { id: refereeUserId } });
    if (!referee) throw new Error('User not found');

    if (referee.referred_by_user_id) {
        throw new Error('You have already used a referral code');
    }

    const existingReferral = await prisma.referrals.findFirst({
        where: { referred_user_id: refereeUserId },
    });
    if (existingReferral) {
        throw new Error('You have already used a referral code');
    }

    const referrer = await validateReferralCode(code);
    if (referrer.id === refereeUserId) {
        throw new Error('You cannot use your own referral code');
    }

    const programType = resolveProgramType(
        referrer.role ?? 'client',
        referee.role ?? 'client',
        referrer.account_type,
        referee.account_type,
    );
    const program = REFERRAL_PROGRAMS[programType];

    let refereePromoCode: string | null = null;
    if (program.referee_promo_fixed) {
        refereePromoCode = await createRefereeWelcomePromo(refereeUserId, program.referee_promo_fixed);
    } else if (program.referee_wallet_credit) {
        // Pro B2B: small upfront credit on signup, rest on qualification
        await creditWallet(
            refereeUserId,
            Math.min(10, program.referee_wallet_credit),
            'Referral welcome credit'
        );
    }

    const referral = await prisma.referrals.create({
        data: {
            id: crypto.randomUUID(),
            referrer_id: referrer.id,
            referral_code: referrer.referral_code!,
            referred_user_id: refereeUserId,
            program_type: programType,
            referrer_reward_amount: program.referrer_wallet_credit ?? program.referrer_loyalty_points ?? 0,
            referee_reward_amount: program.referee_promo_fixed ?? program.referee_wallet_credit ?? 0,
            referee_promo_code: refereePromoCode,
            status: 'pending',
        },
    });

    await prisma.users.update({
        where: { id: refereeUserId },
        data: { referred_by_user_id: referrer.id, updated_at: new Date().toISOString() },
    });

    if (refereePromoCode) {
        await notifyUser(
            refereeUserId,
            'Welcome bonus unlocked!',
            `Use code ${refereePromoCode} for $${program.referee_promo_fixed} off your first booking.`,
            'referral_welcome'
        );
    }

    return {
        referral_id: referral.id,
        program_type: programType,
        referee_promo_code: refereePromoCode,
        message: refereePromoCode
            ? `$${program.referee_promo_fixed} off your first booking with code ${refereePromoCode}`
            : 'Referral linked, complete your first booking to unlock rewards',
    };
}

async function rewardReferral(referralId: string, bookingId?: string) {
    const referral = await prisma.referrals.findUnique({ where: { id: referralId } });
    if (!referral || referral.status !== 'pending' || !referral.referred_user_id) return;

    const programType = (referral.program_type ?? 'client_b2c') as ReferralProgramType;
    const program = REFERRAL_PROGRAMS[programType];
    const now = new Date().toISOString();

    // Referrer rewards
    if (program.referrer_loyalty_points) {
        await applyPointsDelta({
            user_id: referral.referrer_id,
            points: program.referrer_loyalty_points,
            type: 'referral_bonus',
            description: `Referral bonus, friend completed first visit`,
            related_entity_id: referral.id,
        });
        await notifyUser(
            referral.referrer_id,
            'Referral reward!',
            `You earned ${program.referrer_loyalty_points} loyalty points for your referral.`,
            'referral_reward'
        );
    }
    if (program.referrer_wallet_credit) {
        await creditWallet(
            referral.referrer_id,
            program.referrer_wallet_credit,
            'Referral reward, qualified referral',
            referral.id
        );
        await notifyUser(
            referral.referrer_id,
            'Referral reward!',
            `$${program.referrer_wallet_credit} has been added to your wallet.`,
            'referral_reward'
        );
    }

    // Referee extra wallet (pro B2B remainder)
    if (program.referee_wallet_credit && programType === 'pro_b2b') {
        const remainder = Math.max(0, program.referee_wallet_credit - 10);
        if (remainder > 0) {
            await creditWallet(referral.referred_user_id, remainder, 'Referral activation bonus', referral.id);
        }
    }

    await prisma.referrals.update({
        where: { id: referralId },
        data: {
            status: 'rewarded',
            qualified_at: now,
            rewarded_at: now,
            booking_id: bookingId ?? null,
        },
    });

    const { onReferralRewarded } = await import('../domain/hooks/lifecycle');
    await onReferralRewarded(referral.referrer_id, programType);
}

export async function processReferralOnCompletedBooking(bookingId: string) {
    const booking = await prisma.bookings.findUnique({ where: { id: bookingId } });
    if (!booking || booking.status !== 'completed') return;

    // Client-side qualification
    if (booking.client_id) {
        const priorCompleted = await prisma.bookings.count({
            where: {
                client_id: booking.client_id,
                status: 'completed',
                id: { not: bookingId },
            },
        });
        if (priorCompleted === 0) {
            const referral = await prisma.referrals.findFirst({
                where: {
                    referred_user_id: booking.client_id,
                    status: 'pending',
                    program_type: { in: ['client_b2c', 'provider_client'] },
                },
            });
            if (referral) {
                await rewardReferral(referral.id, bookingId);
            }
        }
    }

    // Pro B2B qualification, referred user is the barber on this completed booking
    if (booking.barber_id) {
        const barber = await prisma.barbers.findUnique({
            where: { id: booking.barber_id },
            select: { user_id: true },
        });
        if (barber?.user_id) {
            const referral = await prisma.referrals.findFirst({
                where: {
                    referred_user_id: barber.user_id,
                    status: 'pending',
                    program_type: 'pro_b2b',
                },
            });
            if (referral) {
                const priorBarberBookings = await prisma.bookings.count({
                    where: {
                        barber_id: booking.barber_id,
                        status: 'completed',
                        id: { not: bookingId },
                    },
                });
                if (priorBarberBookings === 0) {
                    await rewardReferral(referral.id, bookingId);
                }
            }
        }
    }
}

export async function getReferralDashboard(userId: string) {
    const user = await prisma.users.findUnique({
        where: { id: userId },
        select: { role: true, account_type: true, referral_code: true, referred_by_user_id: true },
    });
    if (!user) throw new Error('User not found');

    const code = user.referral_code ?? (await getOrCreateReferralCode(userId));

    const referralsMade = await prisma.referrals.findMany({
        where: { referrer_id: userId },
        orderBy: { created_at: 'desc' },
        take: 50,
    });

    const rewarded = referralsMade.filter((r) => r.status === 'rewarded');
    const pending = referralsMade.filter((r) => r.status === 'pending');

    let totalEarned = 0;
    for (const r of rewarded) {
        const pt = (r.program_type ?? 'client_b2c') as ReferralProgramType;
        const cfg = REFERRAL_PROGRAMS[pt];
        if (cfg.referrer_wallet_credit) totalEarned += cfg.referrer_wallet_credit;
        if (cfg.referrer_loyalty_points) totalEarned += cfg.referrer_loyalty_points * 0.02; // ~$ value
    }

    const myReferral = user.referred_by_user_id
        ? await prisma.referrals.findFirst({ where: { referred_user_id: userId } })
        : null;

    return {
        referral_code: code,
        share_url: `/signup?ref=${code}`,
        role: user.role ?? 'client',
        programs: (await import('./config')).programForRole(user.role ?? 'client', user.account_type),
        stats: {
            total_referrals: referralsMade.length,
            pending: pending.length,
            rewarded: rewarded.length,
            total_earned_estimate: Math.round(totalEarned * 100) / 100,
        },
        referrals: referralsMade.map((r) => ({
            id: r.id,
            program_type: r.program_type,
            status: r.status,
            created_at: r.created_at,
            rewarded_at: r.rewarded_at,
            referee_promo_code: r.referee_promo_code,
        })),
        my_referral: myReferral
            ? {
                  status: myReferral.status,
                  program_type: myReferral.program_type,
                  referee_promo_code: myReferral.referee_promo_code,
              }
            : null,
    };
}
