import { describe, it, expect } from 'vitest';
import { ACCOUNT_TYPES } from '@/lib/accountType';
import { ACCOUNT_TYPE_SECTIONS, ACCOUNT_TYPE_VISUALS, STB_SOLID_COLORS } from '@/lib/accountTypeVisuals';

describe('accountTypeVisuals', () => {
  it('defines visuals for every account type', () => {
    for (const type of ACCOUNT_TYPES) {
      expect(ACCOUNT_TYPE_VISUALS[type]).toBeDefined();
      expect(ACCOUNT_TYPE_VISUALS[type].image).toMatch(/^https:\/\//);
      expect(ACCOUNT_TYPE_VISUALS[type].imageAlt).toBeTruthy();
      expect(ACCOUNT_TYPE_VISUALS[type].cardBg).toBeTruthy();
      expect(ACCOUNT_TYPE_VISUALS[type].accentBar).toBeTruthy();
    }
  });

  it('uses platform solid palette for card surfaces', () => {
    const solids = Object.values(STB_SOLID_COLORS);
    for (const type of ACCOUNT_TYPES) {
      expect(solids).toContain(ACCOUNT_TYPE_VISUALS[type].cardBg);
    }
  });

  it('sections cover all account types exactly once', () => {
    const fromSections = ACCOUNT_TYPE_SECTIONS.flatMap((s) => s.types);
    expect(fromSections.sort()).toEqual([...ACCOUNT_TYPES].sort());
  });
});
