/**
 * Playwright E2E environment guards. Specs skip gracefully when vars are unset.
 */

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
    return !!(process.env.CLERK_SECRET_KEY && process.env.E2E_CLERK_USER_EMAIL && process.env.E2E_FRONTEND_URL);
}

export function hasClerkProviderBrowser(): boolean {
    return !!(process.env.CLERK_SECRET_KEY && process.env.E2E_CLERK_PROVIDER_EMAIL && process.env.E2E_FRONTEND_URL);
}

export function hasClerkAdminBrowser(): boolean {
    return !!(process.env.CLERK_SECRET_KEY && process.env.E2E_CLERK_ADMIN_EMAIL && process.env.E2E_FRONTEND_URL);
}

export function clerkAuthHeaders(token = process.env.E2E_CLERK_JWT): Record<string, string> {
    return {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
}
