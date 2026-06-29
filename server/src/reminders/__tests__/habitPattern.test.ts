import { describe, it, expect } from 'vitest';
import {
    analyzeClientHabit,
    alreadyNudgedSinceLastVisit,
    computeVisitIntervalsDays,
    isDueForRebookNudge,
    type HabitBookingRow,
} from '../habitPattern';
import { buildRebookFlowUrl } from '../rebookUrl';
import { buildRebookNudgeSms } from '../../logic/sms';

function booking(id: string, startIso: string, overrides: Partial<HabitBookingRow> = {}): HabitBookingRow {
    return {
        id,
        start_time: startIso,
        barber_id: 'barber-1',
        barber_name: 'Alex',
        service_name: 'Haircut',
        shop_id: null,
        visit_type: 'shop',
        booking_type: 'individual',
        service_snapshot: null,
        ...overrides,
    };
}

describe('habitPattern', () => {
    it('needs at least 2 completed visits', () => {
        expect(analyzeClientHabit('u1', [booking('b1', '2026-01-01T10:00:00.000Z')])).toBeNull();
    });

    it('computes median interval from visit history', () => {
        const rows = [
            booking('b3', '2026-03-15T10:00:00.000Z'),
            booking('b2', '2026-02-15T10:00:00.000Z'),
            booking('b1', '2026-01-15T10:00:00.000Z'),
        ];
        const intervals = computeVisitIntervalsDays(rows);
        expect(intervals.length).toBe(2);
        expect(intervals.every((d) => d >= 28 && d <= 31)).toBe(true);

        const pattern = analyzeClientHabit('u1', rows);
        expect(pattern?.median_interval_days).toBeGreaterThanOrEqual(28);
        expect(pattern?.usual_service_name).toBe('Haircut');
    });

    it('detects nudge window around predicted due date', () => {
        const rows = [
            booking('b2', '2026-01-01T10:00:00.000Z'),
            booking('b1', '2025-12-01T10:00:00.000Z'),
        ];
        const pattern = analyzeClientHabit('u1', rows, { defaultIntervalDays: 21 });
        expect(pattern).not.toBeNull();
        if (!pattern) return;

        const dueDay = new Date(pattern.predicted_next_due_at);
        expect(
            isDueForRebookNudge(pattern, dueDay, { leadDays: 2, graceDays: 3 })
        ).toBe(true);
        expect(
            isDueForRebookNudge(pattern, new Date(dueDay.getTime() - 5 * 86_400_000), {
                leadDays: 2,
                graceDays: 3,
            })
        ).toBe(false);
    });

    it('skips when already nudged since last visit', () => {
        const lastVisit = new Date('2026-01-01T10:00:00.000Z');
        expect(alreadyNudgedSinceLastVisit('2026-01-15T10:00:00.000Z', lastVisit)).toBe(true);
        expect(alreadyNudgedSinceLastVisit('2025-12-15T10:00:00.000Z', lastVisit)).toBe(false);
    });
});

describe('rebookUrl + SMS copy', () => {
    it('builds one-tap rebook URL', () => {
        const url = buildRebookFlowUrl(
            booking('b1', '2026-01-01T10:00:00.000Z', {
                service_snapshot: JSON.stringify({ services: [{ service_id: 'svc-1' }] }),
            }),
            'https://app.example.com'
        );
        expect(url).toContain('https://app.example.com/BookingFlow?');
        expect(url).toContain('rebook=1');
        expect(url).toContain('serviceId=svc-1');
    });

    it('builds personalized rebook nudge SMS', () => {
        const text = buildRebookNudgeSms({
            clientName: 'Jordan Lee',
            barberName: 'Alex',
            serviceName: 'Beard trim',
            preferredDay: 'Saturday',
            bookUrl: 'https://app.example.com/BookingFlow?rebook=1',
        });
        expect(text).toContain('Jordan');
        expect(text).toContain('Beard trim');
        expect(text).toContain('Saturday');
    });
});
