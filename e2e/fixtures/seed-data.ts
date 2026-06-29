/**
 * Stable IDs from `server/src/db/seed.ts` — run `cd server && npm run seed` before local E2E.
 */
export const SEED = {
    shop: {
        downtown: { id: 's1', name: 'Downtown Cuts' },
    },
    barber: {
        nikos: { id: 'gb1', name: 'Nikos Papadopoulos' },
        james: { id: 'b1', name: 'James St. Patrick' },
    },
    service: {
        signatureCut: { id: 'ser1', name: 'Signature Cut', price: 35 },
    },
    shopMember: {
        gb1: 'sm-gb1',
    },
    promo: {
        downtown10: 'DOWNTOWN10',
        welcome5: 'WELCOME5',
    },
} as const;

export function uniquePromoCode(prefix: string): string {
    const suffix = Date.now().toString().slice(-6);
    return `${prefix}${suffix}`.toUpperCase().slice(0, 20);
}
