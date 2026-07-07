/**
 * Canonical account types — chosen at signup, immutable per email.
 */
export const ACCOUNT_TYPES = [
    'client',
    'solo_barber',
    'shop',
    'seller',
    'company',
    'blogger',
] as const;

export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const PLATFORM_ROLES = [
    'client',
    'barber',
    'shop_owner',
    'seller',
    'company',
    'blogger',
    'admin',
] as const;

export type PlatformRole = (typeof PLATFORM_ROLES)[number];

const ACCOUNT_TYPE_SET = new Set<string>(ACCOUNT_TYPES);

export function isAccountType(value: string | null | undefined): value is AccountType {
    return !!value && ACCOUNT_TYPE_SET.has(value);
}

/** Map immutable account type → platform role stored on users.role */
export function platformRoleForAccountType(accountType: AccountType): PlatformRole {
    switch (accountType) {
        case 'solo_barber':
            return 'barber';
        case 'shop':
            return 'shop_owner';
        case 'seller':
            return 'seller';
        case 'company':
            return 'company';
        case 'blogger':
            return 'blogger';
        case 'client':
        default:
            return 'client';
    }
}

export function isBookingProviderAccountType(accountType: string | null | undefined): boolean {
    return accountType === 'solo_barber' || accountType === 'shop';
}

export function isProviderShellAccountType(accountType: string | null | undefined): boolean {
    return accountType === 'solo_barber' || accountType === 'shop';
}

export function isMarketplaceSellerAccountType(accountType: string | null | undefined): boolean {
    return (
        accountType === 'seller' ||
        accountType === 'solo_barber' ||
        accountType === 'shop' ||
        accountType === 'blogger'
    );
}

/** Company may sell when commerce is activated on request (see companyCommerce.ts). */
export function isMarketplaceSellerAccountTypeWithCommerce(
    accountType: string | null | undefined,
    companyCommerceEnabled?: boolean,
): boolean {
    if (accountType === 'company') return companyCommerceEnabled === true;
    return isMarketplaceSellerAccountType(accountType);
}

export function canReceiveAppointments(accountType: string | null | undefined): boolean {
    return isBookingProviderAccountType(accountType);
}

export function dashboardPathForAccountType(accountType: string | null | undefined): string {
    switch (accountType) {
        case 'solo_barber':
        case 'shop':
            return '/ProviderDashboard';
        case 'seller':
            return '/SellerDashboard';
        case 'company':
            return '/CompanyDashboard';
        case 'blogger':
            return '/BloggerDashboard';
        case 'client':
        default:
            return '/Dashboard';
    }
}

export function inferAccountTypeFromLegacyRole(
    role: string | null | undefined,
    hints?: { hasBarber?: boolean; isShopOwner?: boolean },
): AccountType {
    if (role === 'shop_owner' || hints?.isShopOwner) return 'shop';
    if (role === 'barber' || hints?.hasBarber) return 'solo_barber';
    if (role === 'seller') return 'seller';
    if (role === 'company') return 'company';
    if (role === 'blogger') return 'blogger';
    return 'client';
}

export function accountTypeLabel(accountType: AccountType): string {
    const labels: Record<AccountType, string> = {
        client: 'Client',
        solo_barber: 'Solo Barber',
        shop: 'Shop',
        seller: 'Seller',
        company: 'Company',
        blogger: 'Blogger',
    };
    return labels[accountType];
}
