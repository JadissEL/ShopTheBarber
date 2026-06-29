import { prisma } from '../db/prisma';
import { normalizePhoneE164 } from '../logic/sms';
import { logger } from '../lib/logger';

const STOP_KEYWORDS = new Set(['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT']);

/** Twilio inbound SMS, opt users out when they reply STOP (TCPA compliance). */
export async function handleTwilioInboundSms(from: string | undefined, body: string | undefined): Promise<number> {
    const keyword = (body || '').trim().toUpperCase();
    if (!STOP_KEYWORDS.has(keyword)) return 0;

    const normalizedFrom = normalizePhoneE164(from);
    if (!normalizedFrom) return 0;

    const candidates = await prisma.users.findMany({
        where: { phone: { not: null } },
        select: { id: true, phone: true },
        take: 5000,
    });

    let updated = 0;
    for (const user of candidates) {
        if (normalizePhoneE164(user.phone) === normalizedFrom) {
            await prisma.users.update({
                where: { id: user.id },
                data: {
                    sms_reminders_enabled: false,
                    sms_rebook_nudges_enabled: false,
                    updated_at: new Date().toISOString(),
                },
            });
            updated += 1;
        }
    }

    if (updated > 0) {
        logger.info('[twilio] SMS opt-out processed', { from: normalizedFrom, users: updated });
    }
    return updated;
}
