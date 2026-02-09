/**
 * Stripe keys: read from process.env, or from server/.stripe-keys.json (MCP-friendly).
 * Use .stripe-keys.json when setting keys via MCP or a script; env vars override.
 */
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const SERVER_DIR = join(__dirname, '..', '..');
const KEYS_FILE = join(SERVER_DIR, '.stripe-keys.json');

type StripeKeys = { STRIPE_API_KEY?: string; STRIPE_PUBLISHABLE_KEY?: string; STRIPE_WEBHOOK_SECRET?: string };

function loadKeysFile(): StripeKeys | null {
    if (!existsSync(KEYS_FILE)) return null;
    try {
        const raw = readFileSync(KEYS_FILE, 'utf-8');
        const data = JSON.parse(raw) as StripeKeys;
        return data && typeof data === 'object' ? data : null;
    } catch {
        return null;
    }
}

let _fileCache: StripeKeys | null | undefined = undefined;

function getKeysFromFile(): StripeKeys | null {
    if (_fileCache === undefined) _fileCache = loadKeysFile();
    return _fileCache;
}

export function getStripeApiKey(): string {
    const fromEnv = (process.env.STRIPE_API_KEY || '').trim();
    if (fromEnv) return fromEnv;
    const fromFile = getKeysFromFile()?.STRIPE_API_KEY;
    return (fromFile && typeof fromFile === 'string' ? fromFile : '').trim();
}

/** Publishable (public) key for frontend / Stripe.js — safe to expose. Use pk_test_... in test mode. */
export function getStripePublishableKey(): string {
    const fromEnv = (process.env.STRIPE_PUBLISHABLE_KEY || '').trim();
    if (fromEnv) return fromEnv;
    const fromFile = getKeysFromFile()?.STRIPE_PUBLISHABLE_KEY;
    return (fromFile && typeof fromFile === 'string' ? fromFile : '').trim();
}

export function getStripeWebhookSecret(): string {
    const fromEnv = (process.env.STRIPE_WEBHOOK_SECRET || '').trim();
    if (fromEnv) return fromEnv;
    const fromFile = getKeysFromFile()?.STRIPE_WEBHOOK_SECRET;
    return (fromFile && typeof fromFile === 'string' ? fromFile : '').trim();
}
