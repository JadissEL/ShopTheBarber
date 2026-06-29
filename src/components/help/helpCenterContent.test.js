import { describe, it, expect } from 'vitest';
import { filterHelpContent } from '@/components/help/helpCenterContent';

describe('filterHelpContent', () => {
  it('returns all content when query is empty', () => {
    const { categories, faqs } = filterHelpContent('');
    expect(categories.length).toBeGreaterThan(0);
    expect(faqs.length).toBeGreaterThan(0);
  });

  it('filters by keyword', () => {
    const { categories, faqs } = filterHelpContent('refund');
    expect(categories.some((c) => c.id === 'payments')).toBe(true);
    expect(faqs.some((f) => f.id === 'refund')).toBe(true);
  });
});
