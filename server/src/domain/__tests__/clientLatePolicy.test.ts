import { describe, expect, it } from 'vitest';
import {
    CLIENT_LATE_GRACE_MINUTES,
    CLIENT_LATE_NO_SHOW_ELIGIBLE_MINUTES,
    canProviderMarkNoShow,
    classifyClientLateness,
} from '../booking/clientLatePolicy';

describe('clientLatePolicy', () => {
    it('classifies on-time and grace tiers', () => {
        expect(classifyClientLateness(0)).toBe('on_time');
        expect(classifyClientLateness(-5)).toBe('on_time');
        expect(classifyClientLateness(5)).toBe('grace');
        expect(classifyClientLateness(CLIENT_LATE_GRACE_MINUTES)).toBe('grace');
    });

    it('classifies 30+ min as no-show eligible', () => {
        expect(classifyClientLateness(CLIENT_LATE_NO_SHOW_ELIGIBLE_MINUTES)).toBe('no_show_eligible');
        expect(classifyClientLateness(45)).toBe('no_show_eligible');
    });

    it('allows provider no-show mark only after grace window', () => {
        expect(canProviderMarkNoShow(CLIENT_LATE_GRACE_MINUTES - 1)).toBe(false);
        expect(canProviderMarkNoShow(CLIENT_LATE_GRACE_MINUTES)).toBe(true);
    });
});
