import { logger } from '../lib/logger';

export type SendSmsResult = { success: boolean; mocked?: boolean; sid?: string; error?: string };

export function isTwilioConfigured(): boolean {
    return !!(
        process.env.TWILIO_ACCOUNT_SID?.trim() &&
        process.env.TWILIO_AUTH_TOKEN?.trim() &&
        process.env.TWILIO_PHONE_NUMBER?.trim()
    );
}

function twilioConfigured(): boolean {
    return isTwilioConfigured();
}

/** Normalize to E.164 when possible (defaults US +1 for 10-digit numbers). */
export function normalizePhoneE164(raw: string | null | undefined): string | null {
    if (!raw?.trim()) return null;
    let digits = raw.replace(/[^\d+]/g, '');
    if (digits.startsWith('+')) return digits;
    digits = digits.replace(/\D/g, '');
    if (digits.length === 10) return `+1${digits}`;
    if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
    if (digits.length >= 8 && digits.length <= 15) return `+${digits}`;
    return null;
}

export async function sendSms(to: string, body: string): Promise<SendSmsResult> {
    const normalized = normalizePhoneE164(to);
    if (!normalized) {
        return { success: false, error: 'Invalid phone number' };
    }

    if (process.env.SMS_REMINDERS_ENABLED === 'false') {
        logger.info('[sms] SMS_REMINDERS_ENABLED=false, skipped', { to: normalized });
        return { success: true, mocked: true };
    }

    if (!twilioConfigured()) {
        logger.warn('[sms] Twilio not configured. Message not sent.');
        logger.info('[sms] payload', { to: normalized, body });
        return { success: true, mocked: true };
    }

    try {
        const twilio = await import('twilio');
        const client = twilio.default(
            process.env.TWILIO_ACCOUNT_SID!.trim(),
            process.env.TWILIO_AUTH_TOKEN!.trim()
        );
        const message = await client.messages.create({
            to: normalized,
            from: process.env.TWILIO_PHONE_NUMBER!.trim(),
            body: body.slice(0, 1600),
        });
        logger.info(`[sms] sent ${message.sid} ${normalized}`);
        return { success: true, sid: message.sid };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Twilio send failed';
        logger.error('[sms] send failed', { to: normalized, error: message });
        return { success: false, error: message };
    }
}

export function buildBookingReminderSms(params: {
    barberName: string;
    startTime: Date;
    serviceName: string;
    location?: string | null;
}): string {
    const when = params.startTime.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
    const loc = params.location?.trim() ? ` at ${params.location.trim()}` : '';
    const appUrl = (process.env.FRONTEND_URL || 'https://shop-the-barber.vercel.app').replace(/\/$/, '');
    return (
        `ShopTheBarber reminder: Appt with ${params.barberName} ${when}. ` +
        `${params.serviceName}${loc}. Manage: ${appUrl}/UserBookings`
    );
}

export function buildBookingConfirmationSms(params: {
    barberName: string;
    dateText?: string | null;
    timeText?: string | null;
    serviceName: string;
}): string {
    const when = [params.dateText, params.timeText].filter(Boolean).join(' at ') || 'soon';
    return (
        `ShopTheBarber: Booking confirmed with ${params.barberName}, ${when}. ` +
        `Service: ${params.serviceName}. See you there!`
    );
}

export function buildRebookNudgeSms(params: {
    clientName?: string | null;
    barberName: string;
    serviceName: string;
    preferredDay?: string | null;
    bookUrl: string;
}): string {
    const greeting = params.clientName?.trim() ? `Hi ${params.clientName.trim().split(/\s+/)[0]}! ` : '';
    const dayHint = params.preferredDay ? ` (you often book on ${params.preferredDay}s)` : '';
    return (
        `${greeting}ShopTheBarber: Time for your ${params.serviceName} with ${params.barberName}?` +
        `${dayHint} Book again: ${params.bookUrl}`
    );
}

export function buildReviewRequestSms(params: {
    barberName: string;
    reviewUrl: string;
    isNudge?: boolean;
}): string {
    if (params.isNudge) {
        return (
            `ShopTheBarber: Quick favor, rate your visit with ${params.barberName}? ` +
            `${params.reviewUrl}`
        );
    }
    return (
        `ShopTheBarber: How was ${params.barberName}? Leave a quick review: ${params.reviewUrl}`
    );
}
