import { describe, it, expect } from 'vitest';
import { ACCOUNT_TYPES } from '@/lib/accountType';
import { ACCOUNT_TYPE_SECTIONS, ACCOUNT_TYPE_VISUALS } from '@/lib/accountTypeVisuals';

describe('accountTypeVisuals', () => {
  it('defines visuals for every account type', () => {
    for (const type of ACCOUNT_TYPES) {
      expect(ACCOUNT_TYPE_VISUALS[type]).toBeDefined();
      expect(ACCOUNT_TYPE_VISUALS[type].image).toMatch(/^https:\/\//);
      expect(ACCOUNT_TYPE_VISUALS[type].imageAlt).toBeTruthy();
    }
  });

  it('sections cover all account types exactly once', () => {
    const fromSections = ACCOUNT_TYPE_SECTIONS.flatMap((s) => s.types);
    expect(fromSections.sort()).toEqual([...ACCOUNT_TYPES].sort());
  });
});
