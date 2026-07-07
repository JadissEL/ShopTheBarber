import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

type QaProfile = { id?: string; email: string; password: string };

const profilesPath = resolve(dirname(fileURLToPath(import.meta.url)), '../../scripts/qa-profiles.json');

let cached: QaProfile[] | null = null;

function loadProfiles(): QaProfile[] {
  if (!cached) {
    cached = JSON.parse(readFileSync(profilesPath, 'utf8')) as QaProfile[];
  }
  return cached;
}

export function emailForProfile(id: string): string | undefined {
  return loadProfiles().find((p) => p.id === id)?.email;
}

export function passwordForEmail(email: string): string | undefined {
  const fromEnv =
    process.env[`E2E_CLERK_PASSWORD_${email.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`] ||
    (email === process.env.E2E_CLERK_USER_EMAIL ? process.env.E2E_CLERK_USER_PASSWORD : undefined) ||
    (email === process.env.E2E_CLERK_PROVIDER_EMAIL ? process.env.E2E_CLERK_PROVIDER_PASSWORD : undefined) ||
    (email === process.env.E2E_CLERK_ADMIN_EMAIL ? process.env.E2E_CLERK_ADMIN_PASSWORD : undefined) ||
    (email === process.env.E2E_CLERK_SELLER_EMAIL ? process.env.E2E_CLERK_SELLER_PASSWORD : undefined) ||
    (email === process.env.E2E_CLERK_COMPANY_EMAIL ? process.env.E2E_CLERK_COMPANY_PASSWORD : undefined) ||
    (email === process.env.E2E_CLERK_BLOGGER_EMAIL ? process.env.E2E_CLERK_BLOGGER_PASSWORD : undefined);

  if (fromEnv) return fromEnv;
  return loadProfiles().find((p) => p.email === email)?.password;
}
