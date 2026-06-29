import { describe, it, expect } from 'vitest';
import { purchaseGiftCard } from '../logic';

describe('giftCards/logic', () => {
    it('purchaseGiftCard rejects amounts outside €10–€500', async () => {
        await expect(
            purchaseGiftCard({ purchaserId: 'user-1', amount: 5 }),
        ).rejects.toThrow(/between €10 and €500/);

        await expect(
            purchaseGiftCard({ purchaserId: 'user-1', amount: 600 }),
        ).rejects.toThrow(/between €10 and €500/);
    });
});
