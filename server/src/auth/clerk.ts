/**
 * Clerk Authentication Middleware
 * 
 * Verifies Clerk JWT tokens and extracts user information
 */

import { createClerkClient } from '@clerk/backend';
import { FastifyRequest, FastifyReply } from 'fastify';

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

interface ClerkUser {
  id: string;
  email?: string;
  role?: string;
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

    return {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      role: (user.publicMetadata?.role as string) || 'client',
    };
  } catch (error) {
    console.error('Clerk token verification failed:', error);
    return null;
  }
}

/**
 * Fastify pre-handler to require Clerk authentication
 */
export async function requireClerkAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Unauthorized - No token provided' });
    }

    const token = authHeader.substring(7);
    const user = await verifyClerkToken(token);

    if (!user) {
      return reply.status(401).send({ error: 'Unauthorized - Invalid token' });
    }

    // Attach user to request
    (request as any).user = user;
  } catch (error) {
    console.error('Auth middleware error:', error);
    return reply.status(401).send({ error: 'Unauthorized' });
  }
}

/**
 * Fastify pre-handler to require admin role
 */
export async function requireAdminClerkAuth(request: FastifyRequest, reply: FastifyReply) {
  await requireClerkAuth(request, reply);
  
  const user = (request as any).user as ClerkUser;
  if (user?.role !== 'admin') {
    return reply.status(403).send({ error: 'Forbidden - Admin access required' });
  }
}
