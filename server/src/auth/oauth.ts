/**
 * OAuth Authentication (Google & Apple Sign-In)
 * 
 * Handles OAuth 2.0 flow for social login providers.
 * Requires OAuth credentials in .env:
 * - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
 * - APPLE_CLIENT_ID, APPLE_CLIENT_SECRET
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

interface OAuthCallbackQuery {
    code?: string;
    state?: string;
    error?: string;
}

interface GoogleTokenResponse {
    access_token: string;
    expires_in: number;
    token_type: string;
    scope: string;
    id_token?: string;
}

interface GoogleUserInfo {
    id: string;
    email: string;
    verified_email: boolean;
    name: string;
    given_name: string;
    family_name: string;
    picture: string;
}

interface AppleTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    id_token: string;
}

interface AppleUserInfo {
    sub: string;
    email: string;
    email_verified: boolean;
}

/**
 * Register OAuth routes as a Fastify plugin
 */
export async function oauthRoutes(fastify: FastifyInstance) {
    const isGoogleConfigured = !!(
        process.env.GOOGLE_CLIENT_ID &&
        process.env.GOOGLE_CLIENT_SECRET
    );

    const isAppleConfigured = !!(
        process.env.APPLE_CLIENT_ID &&
        process.env.APPLE_CLIENT_SECRET &&
        process.env.APPLE_TEAM_ID &&
        process.env.APPLE_KEY_ID
    );

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    // Google OAuth
    if (isGoogleConfigured) {
        await fastify.register(require('@fastify/oauth2'), {
            name: 'googleOAuth2',
            credentials: {
                client: {
                    id: process.env.GOOGLE_CLIENT_ID!,
                    secret: process.env.GOOGLE_CLIENT_SECRET!,
                },
                auth: require('@fastify/oauth2').GOOGLE_CONFIGURATION,
            },
            startRedirectPath: '/api/auth/google',
            callbackUri: `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/auth/google/callback`,
            scope: ['profile', 'email'],
        });

        fastify.get('/api/auth/google/callback', async (request: FastifyRequest<{ Querystring: OAuthCallbackQuery }>, reply: FastifyReply) => {
            try {
                if (request.query.error) {
                    return reply.redirect(`${frontendUrl}/signin?error=oauth_cancelled`);
                }

                const { token } = await fastify.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);
                const tokenData = token as GoogleTokenResponse;

                // Fetch user info from Google
                const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                    headers: {
                        Authorization: `Bearer ${tokenData.access_token}`,
                    },
                });

                if (!userInfoResponse.ok) {
                    throw new Error('Failed to fetch Google user info');
                }

                const googleUser: GoogleUserInfo = await userInfoResponse.json();

                // Find or create user
                let [existingUser] = await db
                    .select()
                    .from(users)
                    .where(eq(users.email, googleUser.email))
                    .limit(1);

                let userId: string;
                let userRole: string;

                if (existingUser) {
                    userId = existingUser.uid;
                    userRole = existingUser.role;
                } else {
                    // Create new user
                    const newUser = {
                        email: googleUser.email,
                        full_name: googleUser.name,
                        role: 'client',
                        password_hash: null, // OAuth users don't have passwords
                        avatar_url: googleUser.picture,
                        created_at: new Date().toISOString(),
                    };

                    const [inserted] = await db.insert(users).values(newUser).returning();
                    userId = inserted.uid;
                    userRole = inserted.role;
                }

                // Generate JWT token
                const jwtToken = fastify.jwt.sign({
                    id: userId,
                    email: googleUser.email,
                    role: userRole,
                });

                // Redirect to frontend with token
                return reply.redirect(`${frontendUrl}/auth/callback?token=${jwtToken}&provider=google`);
            } catch (err) {
                fastify.log.error('Google OAuth error:', err);
                return reply.redirect(`${frontendUrl}/signin?error=oauth_failed`);
            }
        });
    }

    // Apple OAuth
    if (isAppleConfigured) {
        await fastify.register(require('@fastify/oauth2'), {
            name: 'appleOAuth2',
            credentials: {
                client: {
                    id: process.env.APPLE_CLIENT_ID!,
                    secret: process.env.APPLE_CLIENT_SECRET!,
                },
                auth: {
                    authorizeHost: 'https://appleid.apple.com',
                    authorizePath: '/auth/authorize',
                    tokenHost: 'https://appleid.apple.com',
                    tokenPath: '/auth/token',
                },
            },
            startRedirectPath: '/api/auth/apple',
            callbackUri: `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/auth/apple/callback`,
            scope: ['name', 'email'],
        });

        fastify.get('/api/auth/apple/callback', async (request: FastifyRequest<{ Querystring: OAuthCallbackQuery }>, reply: FastifyReply) => {
            try {
                if (request.query.error) {
                    return reply.redirect(`${frontendUrl}/signin?error=oauth_cancelled`);
                }

                const { token } = await fastify.appleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);
                const tokenData = token as AppleTokenResponse;

                // Decode the id_token to get user info
                const idTokenPayload = JSON.parse(
                    Buffer.from(tokenData.id_token.split('.')[1], 'base64').toString()
                ) as AppleUserInfo;

                // Find or create user
                let [existingUser] = await db
                    .select()
                    .from(users)
                    .where(eq(users.email, idTokenPayload.email))
                    .limit(1);

                let userId: string;
                let userRole: string;

                if (existingUser) {
                    userId = existingUser.uid;
                    userRole = existingUser.role;
                } else {
                    // Create new user
                    const newUser = {
                        email: idTokenPayload.email,
                        full_name: idTokenPayload.email.split('@')[0], // Apple may not provide name on subsequent logins
                        role: 'client',
                        password_hash: null, // OAuth users don't have passwords
                        created_at: new Date().toISOString(),
                    };

                    const [inserted] = await db.insert(users).values(newUser).returning();
                    userId = inserted.uid;
                    userRole = inserted.role;
                }

                // Generate JWT token
                const jwtToken = fastify.jwt.sign({
                    id: userId,
                    email: idTokenPayload.email,
                    role: userRole,
                });

                // Redirect to frontend with token
                return reply.redirect(`${frontendUrl}/auth/callback?token=${jwtToken}&provider=apple`);
            } catch (err) {
                fastify.log.error('Apple OAuth error:', err);
                return reply.redirect(`${frontendUrl}/signin?error=oauth_failed`);
            }
        });
    }

    // Status endpoint to check which OAuth providers are configured
    fastify.get('/api/auth/oauth/status', async (request, reply) => {
        return reply.send({
            google: isGoogleConfigured,
            apple: isAppleConfigured,
        });
    });

    if (!isGoogleConfigured && !isAppleConfigured) {
        fastify.log.warn('⚠️  OAuth not configured. Set GOOGLE_CLIENT_ID/SECRET or APPLE_CLIENT_ID/SECRET in .env to enable social login.');
    } else {
        fastify.log.info(`✅ OAuth configured: ${isGoogleConfigured ? 'Google' : ''} ${isAppleConfigured ? 'Apple' : ''}`);
    }
}
