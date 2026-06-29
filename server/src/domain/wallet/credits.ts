/** Promotional credits consumed before purchased — see specs/FINANCIAL_ECOSYSTEM.md */

function roundMoney(n: number): number {
    return Math.round(n * 100) / 100;
}

export type WalletCreditBuckets = {
    balance: number;
    promotional_balance: number;
    purchased_balance: number;
};

export function normalizeWalletBuckets(wallet: {
    balance?: number | null;
    promotional_balance?: number | null;
    purchased_balance?: number | null;
}): WalletCreditBuckets {
    const balance = wallet.balance ?? 0;
    let promo = wallet.promotional_balance ?? 0;
    let purchased = wallet.purchased_balance ?? 0;

    if (promo === 0 && purchased === 0 && balance > 0) {
        purchased = balance;
    }

    const sum = roundMoney(promo + purchased);
    if (Math.abs(sum - balance) > 0.02 && balance >= 0) {
        if (sum < balance) {
            purchased = roundMoney(balance - promo);
        } else if (sum > balance) {
            const ratio = balance / sum;
            promo = roundMoney(promo * ratio);
            purchased = roundMoney(balance - promo);
        }
    }

    return { balance, promotional_balance: promo, purchased_balance: purchased };
}

export function applyCreditDeduction(
    buckets: WalletCreditBuckets,
    amount: number
): { buckets: WalletCreditBuckets; from_promotional: number; from_purchased: number } {
    const fee = Math.max(0, amount);
    const fromPromo = roundMoney(Math.min(buckets.promotional_balance, fee));
    const fromPurchased = roundMoney(fee - fromPromo);
    const newPromo = roundMoney(buckets.promotional_balance - fromPromo);
    const newPurchased = roundMoney(buckets.purchased_balance - fromPurchased);
    const newBalance = roundMoney(newPromo + newPurchased);

    return {
        buckets: {
            balance: newBalance,
            promotional_balance: newPromo,
            purchased_balance: newPurchased,
        },
        from_promotional: fromPromo,
        from_purchased: fromPurchased,
    };
}

export function applyPurchasedTopUp(buckets: WalletCreditBuckets, amount: number): WalletCreditBuckets {
    const credit = Math.max(0, amount);
    const purchased = roundMoney(buckets.purchased_balance + credit);
    const promo = buckets.promotional_balance;
    return {
        balance: roundMoney(promo + purchased),
        promotional_balance: promo,
        purchased_balance: purchased,
    };
}

export function applyPromotionalCredit(buckets: WalletCreditBuckets, amount: number): WalletCreditBuckets {
    const credit = Math.max(0, amount);
    const promo = roundMoney(buckets.promotional_balance + credit);
    const purchased = buckets.purchased_balance;
    return {
        balance: roundMoney(promo + purchased),
        promotional_balance: promo,
        purchased_balance: purchased,
    };
}
