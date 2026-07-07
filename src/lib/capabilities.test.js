import { describe, it, expect } from 'vitest';
import { CAPABILITY_KEYS, hasCapability, capabilityContextFromUser } from './capabilities';

describe('capabilities.js (frontend mirror)', () => {
  it('exports the same key count as backend', () => {
    expect(CAPABILITY_KEYS.length).toBe(20);
  });

  it('denies client service.write', () => {
    expect(
      hasCapability(capabilityContextFromUser({ accountType: 'client', role: 'client' }), 'service.write'),
    ).toBe(false);
  });

  it('allows blogger product.write', () => {
    expect(
      hasCapability(capabilityContextFromUser({ accountType: 'blogger', role: 'blogger' }), 'product.write'),
    ).toBe(true);
  });
});
