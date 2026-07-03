import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const CLERK_ENV_PATH = resolve(process.cwd(), 'playwright/.auth/clerk-env.json');

export function persistClerkTestingEnv(): void {
  if (!process.env.CLERK_FAPI || !process.env.CLERK_TESTING_TOKEN) return;
  mkdirSync(resolve(process.cwd(), 'playwright/.auth'), { recursive: true });
  writeFileSync(
    CLERK_ENV_PATH,
    JSON.stringify({
      CLERK_FAPI: process.env.CLERK_FAPI,
      CLERK_TESTING_TOKEN: process.env.CLERK_TESTING_TOKEN,
    }),
  );
}

export function loadClerkTestingEnv(): void {
  if (!existsSync(CLERK_ENV_PATH)) return;
  try {
    const data = JSON.parse(readFileSync(CLERK_ENV_PATH, 'utf8'));
    if (data.CLERK_FAPI) process.env.CLERK_FAPI = data.CLERK_FAPI;
    if (data.CLERK_TESTING_TOKEN) process.env.CLERK_TESTING_TOKEN = data.CLERK_TESTING_TOKEN;
  } catch {
    /* ignore corrupt file */
  }
}

export { CLERK_ENV_PATH };
