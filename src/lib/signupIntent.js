/**
 * Session-scoped signup intent — never use localStorage (survives across sessions).
 */
import { isAccountType } from '@/lib/accountType';

const PENDING_TYPE_KEY = 'stb_pending_account_type';
const PENDING_TOKEN_KEY = 'stb_signup_intent_token';

/** @param {import('@/lib/accountType').AccountType} accountType */
export function setPendingAccountType(accountType) {
  sessionStorage.setItem(PENDING_TYPE_KEY, accountType);
}

export function getPendingAccountType() {
  try {
    const v = sessionStorage.getItem(PENDING_TYPE_KEY);
    return isAccountType(v) ? v : null;
  } catch {
    return null;
  }
}

export function setSignupIntentToken(token) {
  sessionStorage.setItem(PENDING_TOKEN_KEY, token);
}

export function getSignupIntentToken() {
  try {
    return sessionStorage.getItem(PENDING_TOKEN_KEY);
  } catch {
    return null;
  }
}

import { clearProviderIntent } from '@/lib/bootstrapProvider';

export function clearSignupSession() {
  try {
    sessionStorage.removeItem(PENDING_TYPE_KEY);
    sessionStorage.removeItem(PENDING_TOKEN_KEY);
    clearProviderIntent();
  } catch {
    /* ignore */
  }
}

/** @param {import('@/lib/accountType').AccountType} accountType */
export async function createServerSignupIntent(accountType) {
  const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/signup-intent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountType }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || 'Could not start signup');
  }
  setSignupIntentToken(body.token);
  setPendingAccountType(accountType);
  return body;
}
