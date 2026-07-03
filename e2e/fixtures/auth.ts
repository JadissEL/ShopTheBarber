import type { Page } from '@playwright/test';
import { clerk } from '@clerk/testing/playwright';

export async function signInClerkUser(page: Page, email: string): Promise<void> {
    await page.goto('/');
    await clerk.signIn({ page, emailAddress: email });
}

export async function signInClient(page: Page): Promise<void> {
    const email = process.env.E2E_CLERK_USER_EMAIL;
    if (!email) throw new Error('E2E_CLERK_USER_EMAIL is required');
    await signInClerkUser(page, email);
}

export async function signInProvider(page: Page): Promise<void> {
    const email = process.env.E2E_CLERK_PROVIDER_EMAIL;
    if (!email) throw new Error('E2E_CLERK_PROVIDER_EMAIL is required');
    await signInClerkUser(page, email);
}

export async function signInAdmin(page: Page): Promise<void> {
    const email = process.env.E2E_CLERK_ADMIN_EMAIL;
    if (!email) throw new Error('E2E_CLERK_ADMIN_EMAIL is required');
    await signInClerkUser(page, email);
}

export async function signInClerkAndSync(page: Page, email: string): Promise<void> {
    await signInClerkUser(page, email);
    await page.waitForFunction(
        () => typeof (window as unknown as { Clerk?: unknown }).Clerk !== 'undefined',
        { timeout: 30_000 },
    );
    await page.waitForFunction(
        async () => {
            const c = (window as unknown as {
                Clerk?: { loaded?: boolean; session?: { getToken: () => Promise<string | null> } };
            }).Clerk;
            if (!c?.loaded || !c.session) return false;
            const token = await c.session.getToken();
            return !!token;
        },
        { timeout: 60_000 },
    );
}
