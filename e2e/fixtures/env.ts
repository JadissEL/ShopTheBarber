/**
 * Playwright E2E environment guards. Specs skip gracefully when vars are unset.
 */
import { emailForProfile } from './qa-profiles';

function hasClerkBrowserBase(): boolean {
    return !!(process.env.CLERK_SECRET_KEY && process.env.E2E_FRONTEND_URL);
}

function emailOrProfile(envKey: string, profileId: string): string | undefined {
    return process.env[envKey] || emailForProfile(profileId);
}

export function hasApiBaseUrl(): boolean {
    return !!process.env.E2E_API_BASE_URL;
}

export function apiBaseUrl(): string {
    return process.env.E2E_API_BASE_URL || 'http://127.0.0.1:3001';
}

export function frontendBaseUrl(): string {
    return process.env.E2E_FRONTEND_URL || 'http://127.0.0.1:3000';
}

export function hasClerkJwt(): boolean {
    return !!(process.env.E2E_CLERK_JWT && process.env.E2E_API_BASE_URL);
}

export function hasClerkAdminJwt(): boolean {
    return !!(process.env.E2E_CLERK_ADMIN_JWT && process.env.E2E_API_BASE_URL);
}

export function hasClerkProviderJwt(): boolean {
    return !!(process.env.E2E_CLERK_PROVIDER_JWT && process.env.E2E_API_BASE_URL);
}

export function hasClerkBrowserE2e(): boolean {
    return !!(
        hasClerkBrowserBase() &&
        emailOrProfile('E2E_CLERK_USER_EMAIL', 'qa-c1') &&
        (process.env.CLERK_TESTING_TOKEN || process.env.CLERK_FAPI)
    );
}

export function hasClerkProviderBrowser(): boolean {
    return !!(hasClerkBrowserBase() && emailOrProfile('E2E_CLERK_PROVIDER_EMAIL', 'qa-b1'));
}

export function hasClerkShopOwnerBrowser(): boolean {
    return !!(hasClerkBrowserBase() && emailOrProfile('E2E_CLERK_SHOP_OWNER_EMAIL', 'qa-o1'));
}

export function hasClerkAdminBrowser(): boolean {
    return !!(hasClerkBrowserBase() && emailOrProfile('E2E_CLERK_ADMIN_EMAIL', 'qa-admin'));
}

export function hasClerkSellerBrowser(): boolean {
    return !!(hasClerkBrowserBase() && emailOrProfile('E2E_CLERK_SELLER_EMAIL', 'qa-seller'));
}

export function hasClerkCompanyBrowser(): boolean {
    return !!(hasClerkBrowserBase() && emailOrProfile('E2E_CLERK_COMPANY_EMAIL', 'qa-company'));
}

export function hasClerkBloggerBrowser(): boolean {
    return !!(hasClerkBrowserBase() && emailOrProfile('E2E_CLERK_BLOGGER_EMAIL', 'qa-blogger'));
}

/** Read-only audits (prod smoke / preview axe) skip auth — QA Clerk users need local dev servers. */
export function skipAuthenticatedJourneys(): boolean {
    if (process.env.QA_AUTH_JOURNEYS === '1') return false;
    if (process.env.E2E_START_SERVERS === '1') return false;
    if (process.env.QA_SKIP_AUTH_JOURNEYS === '1') return true;
    const url = (process.env.E2E_FRONTEND_URL ?? '').toLowerCase();
    return /vercel\.app|shop-the-barber\.vercel|shopthebarber\.onrender/i.test(url);
}

export function clerkAuthHeaders(token = process.env.E2E_CLERK_JWT): Record<string, string> {
    return {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
}
