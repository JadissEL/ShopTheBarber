import { describe, expect, it } from 'vitest';
import { normalizePhoneE164, buildBookingReminderSms } from '../../logic/sms';
import { reminderWindowBounds, formatBookingDateTime } from '../logic';

describe('sms utilities', () => {
    it('normalizes US 10-digit numbers', () => {
        expect(normalizePhoneE164('5551234567')).toBe('+15551234567');
        expect(normalizePhoneE164('(555) 123-4567')).toBe('+15551234567');
    });

    it('preserves E.164 input', () => {
        expect(normalizePhoneE164('+33612345678')).toBe('+33612345678');
    });

    it('builds reminder copy', () => {
        const text = buildBookingReminderSms({
            barberName: 'Luc',
            startTime: new Date('2026-07-01T14:30:00.000Z'),
            serviceName: 'Skin fade',
            location: 'Paris, Le Marais',
        });
        expect(text).toContain('ShopTheBarber reminder');
        expect(text).toContain('Luc');
        expect(text).toContain('Skin fade');
    });
});

describe('reminderWindowBounds', () => {
    it('centers window on target reminder time', () => {
        const now = new Date('2026-06-26T12:00:00.000Z');
        const { windowStartIso, windowEndIso } = reminderWindowBounds(now, 24, 60);
        const start = new Date(windowStartIso).getTime();
        const end = new Date(windowEndIso).getTime();
        expect(end - start).toBe(60 * 60 * 1000);
    });
});

describe('formatBookingDateTime', () => {
    it('formats valid ISO timestamps', () => {
        const { date, time } = formatBookingDateTime('2026-07-01T14:30:00.000Z');
        expect(date).toMatch(/July/);
        expect(time).toBeTruthy();
    });

    it('returns TBD for invalid input', () => {
        expect(formatBookingDateTime('not-a-date')).toEqual({ date: 'TBD', time: '' });
    });
});
