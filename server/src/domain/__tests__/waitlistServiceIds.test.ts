import { describe, expect, it } from 'vitest';
import { parseWaitlistServiceIds, serializeWaitlistServiceIds } from '../waitlist/serviceIds';

describe('waitlist service ids', () => {
    it('serializes unique service ids with primary service_id', () => {
        const result = serializeWaitlistServiceIds(['svc-b', 'svc-a', 'svc-b']);
        expect(result.service_id).toBe('svc-b');
        expect(JSON.parse(result.service_ids_json!)).toEqual(['svc-b', 'svc-a']);
    });

    it('parses service_ids_json when present', () => {
        expect(
            parseWaitlistServiceIds({
                service_id: 'legacy',
                service_ids_json: JSON.stringify(['a', 'b']),
            })
        ).toEqual(['a', 'b']);
    });

    it('falls back to service_id when json missing', () => {
        expect(parseWaitlistServiceIds({ service_id: 'legacy', service_ids_json: null })).toEqual([
            'legacy',
        ]);
    });
});
