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
