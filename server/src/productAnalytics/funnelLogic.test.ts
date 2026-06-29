import { describe, it, expect } from 'vitest';
import {
    maxStrictStepsReached,
    maxStrictStepsReachedInWindow,
    computeStrictFunnelCounts,
    computeLooseFunnelCounts,
    eventNameToStepKey,
} from './funnelLogic';

describe('funnelLogic', () => {
    it('maps event names to funnel steps', () => {
        expect(eventNameToStepKey('view_home')).toBe('home');
        expect(eventNameToStepKey('view_barber_profile')).toBe('profile');
        expect(eventNameToStepKey('booking_paid')).toBe('paid_booking');
    });

    it('maxStrictStepsReached requires ordered steps without skipping', () => {
        expect(
            maxStrictStepsReached([
                'view_home',
                'view_explore',
                'view_barber_profile',
                'booking_started',
                'booking_created',
                'booking_paid',
            ])
        ).toBe(6);
        expect(
            maxStrictStepsReached(['view_explore', 'view_home', 'booking_paid'])
        ).toBe(0);
        expect(
            maxStrictStepsReached(['view_home', 'booking_paid'])
        ).toBe(1);
    });

    it('maxStrictStepsReachedInWindow enforces conversion window from first home', () => {
        const base = '2026-06-01T10:00:00.000Z';
        const withinWindow = [
            { event_name: 'view_home', created_at: base },
            { event_name: 'view_explore', created_at: '2026-06-02T10:00:00.000Z' },
            { event_name: 'booking_paid', created_at: '2026-06-05T10:00:00.000Z' },
        ];
        expect(maxStrictStepsReachedInWindow(withinWindow, 168)).toBeGreaterThanOrEqual(2);

        const outsideWindow = [
            { event_name: 'view_home', created_at: base },
            { event_name: 'booking_paid', created_at: '2026-06-15T10:00:00.000Z' },
        ];
        expect(maxStrictStepsReachedInWindow(outsideWindow, 168)).toBe(1);
    });

    it('prefers user_id as funnel actor when present', () => {
        const events = [
            {
                event_name: 'view_home',
                session_id: 's1',
                user_id: 'u1',
                created_at: '2026-06-01T10:00:00.000Z',
            },
            {
                event_name: 'view_explore',
                session_id: 's2',
                user_id: 'u1',
                created_at: '2026-06-01T10:01:00.000Z',
            },
        ];
        const { stepSessions } = computeLooseFunnelCounts(events);
        expect(stepSessions.explore?.size).toBe(1);
    });

    it('computeStrictFunnelCounts aggregates sessions', () => {
        const events = [
            {
                event_name: 'view_home',
                session_id: 's1',
                user_id: null,
                created_at: '2026-06-01T10:00:00.000Z',
            },
            {
                event_name: 'view_explore',
                session_id: 's1',
                user_id: null,
                created_at: '2026-06-01T10:01:00.000Z',
            },
            {
                event_name: 'view_home',
                session_id: 's2',
                user_id: null,
                created_at: '2026-06-01T11:00:00.000Z',
            },
        ];
        const counts = computeStrictFunnelCounts(events);
        expect(counts.home).toBe(2);
        expect(counts.explore).toBe(1);
    });

    it('computeLooseFunnelCounts counts any step hit', () => {
        const events = [
            {
                event_name: 'booking_paid',
                session_id: 's9',
                user_id: 'u1',
                created_at: '2026-06-01T12:00:00.000Z',
            },
        ];
        const { stepSessions, stepUsers } = computeLooseFunnelCounts(events);
        expect(stepSessions.paid_booking?.size).toBe(1);
        expect(stepUsers.paid_booking?.size).toBe(1);
    });
});
