/**
 * Clerk Authentication Middleware
 *
 * Verifies Clerk JWT tokens and extracts user information.
 */

import { createClerkClient, verifyToken } from '@clerk/backend';

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

export interface ClerkUser {
  id: string;
  email?: string;
  role?: string;
  account_type?: string | null;
  full_name?: string;
  avatar_url?: string | null;
}

function getVerifiedSubject(decoded: unknown): string | null {
  if (!decoded || typeof decoded !== 'object') return null;
  const sub = (decoded as { sub?: string }).sub;
  return typeof sub === 'string' && sub.length > 0 ? sub : null;
}

/**
 * Verify Clerk JWT token and extract user info
 */
export async function verifyClerkToken(token: string): Promise<ClerkUser | null> {
  try {
    if (!process.env.CLERK_SECRET_KEY) {
      console.warn('CLERK_SECRET_KEY not set - authentication disabled');
      return null;
    }

    const decoded = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    const clerkUserId = getVerifiedSubject(decoded);
    if (!clerkUserId) {
      return null;
    }

    const user = await clerkClient.users.getUser(clerkUserId);

    const name =
      user.fullName ||
      [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
      undefined;
    return {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      role: (user.publicMetadata?.role as string) || 'client',
      account_type: (user.publicMetadata?.accountType as string) || null,
      full_name: name,
      avatar_url: user.imageUrl,
    };
  } catch (error) {
    console.error('Clerk token verification failed:', error);
    return null;
  }
}
