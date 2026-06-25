/**
 * Clerk Authentication Middleware
 * 
 * Verifies Clerk JWT tokens and extracts user information
 */

import { createClerkClient } from '@clerk/backend';
const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

export interface ClerkUser {
  id: string;
  email?: string;
  role?: string;
  full_name?: string;
  avatar_url?: string | null;
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

    // Verify the token with Clerk
    const decoded = await clerkClient.verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    if (!decoded || !decoded.sub) {
      return null;
    }

    // Get full user details from Clerk
    const user = await clerkClient.users.getUser(decoded.sub);

    const name =
      user.fullName ||
      [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
      undefined;
    return {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      role: (user.publicMetadata?.role as string) || 'client',
      full_name: name,
      avatar_url: user.imageUrl,
    };
  } catch (error) {
    console.error('Clerk token verification failed:', error);
    return null;
  }
}
