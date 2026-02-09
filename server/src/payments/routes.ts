import { FastifyInstance } from 'fastify';
import Stripe from 'stripe';
import { db } from '../db';
import * as schema from '../db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import dotenv from 'dotenv';
import { getStripeApiKey, getStripePublishableKey } from '../config/stripeKeys';

dotenv.config();

/** Message shown when Stripe key is missing or invalid (avoids leaking key). */
const STRIPE_KEY_ERROR = 'Stripe is not configured. Get a valid test key from https://dashboard.stripe.com/apikeys and set STRIPE_API_KEY in server/.env (or .stripe-keys.json).';

function isStripeInvalidKeyError(e: any): boolean {
    const msg = (e?.message || e?.raw?.message || '').toLowerCase();
    return msg.includes('invalid api key') || msg.includes('invalid_api_key') || (e?.code === 'invalid_api_key');
}

const stripeApiKey = getStripeApiKey();
let stripe: Stripe | null = null;
if (stripeApiKey && stripeApiKey.startsWith('sk_')) {
    try {
        stripe = new Stripe(stripeApiKey, {
            apiVersion: '2025-01-27.acacia',
            typescript: true,
        });
    } catch (e) {
        console.warn('Failed to initialize Stripe client. Payment features will fail.', e);
    }
}

export async function paymentRoutes(fastify: FastifyInstance) {

    // Public config: publishable key for frontend (Stripe.js, test mode). Safe to expose.
    fastify.get('/api/payments/config', async (_request, reply) => {
        const publishableKey = getStripePublishableKey();
        return { publishableKey: publishableKey || null };
    });

    // Create Product Checkout Session (marketplace cart → Stripe)
    fastify.post('/api/functions/create-product-checkout-session', async (request, reply) => {
        try {
            await (request as any).jwtVerify();
            const payload = (request as any).user as { id: string };
            const userId = payload.id;

            const body = request.body as {
                shipping_full_name?: string;
                shipping_street?: string;
                shipping_city?: string;
                shipping_zip?: string;
                shipping_phone?: string;
            };

            if (!stripe) {
                return reply.status(503).send({ error: STRIPE_KEY_ERROR });
            }

            const cartRows = await db.select().from(schema.cart_items).where(eq(schema.cart_items.user_id, userId));
            if (cartRows.length === 0) {
                return reply.status(400).send({ error: 'Cart is empty' });
            }

            const productIds = [...new Set(cartRows.map((r) => r.product_id))];
            const products = await db.select().from(schema.products).where(inArray(schema.products.id, productIds));
            const productMap: Record<string, typeof products[0]> = {};
            for (const p of products) productMap[p.id] = p;

            let subtotal = 0;
            const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
            for (const row of cartRows) {
                const product = productMap[row.product_id];
                if (!product) continue;
                const price = Number(product.price);
                const amount = price * row.quantity;
                subtotal += amount;
                lineItems.push({
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: product.name,
                            description: product.description || undefined,
                            images: product.image_url ? [product.image_url] : undefined,
                        },
                        unit_amount: Math.round(price * 100),
                    },
                    quantity: row.quantity,
                });
            }

            const shippingAmount = subtotal >= 50 ? 0 : 0;
            const taxRate = 0.085;
            const taxAmount = Math.round((subtotal + shippingAmount) * taxRate * 100) / 100;
            const total = Math.round((subtotal + shippingAmount + taxAmount) * 100) / 100;
            const taxAndShippingCents = Math.round((shippingAmount + taxAmount) * 100);
            if (taxAndShippingCents > 0) {
                lineItems.push({
                    price_data: {
                        currency: 'usd',
                        product_data: { name: 'Tax & Shipping' },
                        unit_amount: taxAndShippingCents,
                    },
                    quantity: 1,
                });
            }

            const order = await db.insert(schema.orders).values({
                user_id: userId,
                status: 'pending',
                subtotal,
                shipping_amount: shippingAmount,
                tax_amount: taxAmount,
                total,
                shipping_full_name: body.shipping_full_name || null,
                shipping_street: body.shipping_street || null,
                shipping_city: body.shipping_city || null,
                shipping_zip: body.shipping_zip || null,
                shipping_phone: body.shipping_phone || null,
                payment_status: 'unpaid',
            }).returning().get();

            for (const row of cartRows) {
                const product = productMap[row.product_id];
                if (!product) continue;
                await db.insert(schema.order_items).values({
                    order_id: order.id,
                    product_id: product.id,
                    product_name: product.name,
                    product_image_url: product.image_url,
                    price: Number(product.price),
                    quantity: row.quantity,
                });
            }

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: lineItems,
                mode: 'payment',
                success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/Checkout?status=success&orderId=${order.id}`,
                cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/ShoppingBag`,
                client_reference_id: order.id,
                metadata: {
                    order_id: order.id,
                    type: 'product',
                },
            });

            await db.update(schema.orders).set({
                stripe_checkout_session_id: session.id,
            }).where(eq(schema.orders.id, order.id));

            return { url: session.url, orderId: order.id };
        } catch (error: any) {
            if (error.code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER' || error.message?.includes('Unauthorized')) {
                return reply.status(401).send({ error: 'Sign in to checkout' });
            }
            if (isStripeInvalidKeyError(error)) {
                return reply.status(503).send({ error: STRIPE_KEY_ERROR });
            }
            fastify.log.error(error);
            return reply.status(500).send({ error: error.message });
        }
    });

    // Create Checkout Session (booking)
    fastify.post('/api/functions/create-checkout-session', async (request, reply) => {
        try {
            const { bookingId } = request.body as { bookingId: string };

            if (!bookingId) {
                return reply.status(400).send({ error: 'bookingId is required' });
            }

            // Fetch booking
            const booking = await db.query.bookings.findFirst({
                where: eq(schema.bookings.id, bookingId)
            });

            if (!booking) {
                return reply.status(404).send({ error: 'Booking not found' });
            }

            if (!stripe) {
                return reply.status(503).send({ error: STRIPE_KEY_ERROR });
            }

            // Get client & barber info
            const client = await db.query.users.findFirst({ where: eq(schema.users.id, booking.client_id || '') });
            const barber = await db.query.barbers.findFirst({ where: eq(schema.barbers.id, booking.barber_id) });

            // Format date and time
            const bookingDate = new Date(booking.start_time);
            const date_text = bookingDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            const time_text = bookingDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

            // Create stripe session
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [
                    {
                        price_data: {
                            currency: 'eur',
                            product_data: {
                                name: booking.service_name || 'Barber Service',
                                description: `Appointment with ${barber?.name || 'Professional Barber'} on ${date_text} at ${time_text}`,
                            },
                            unit_amount: Math.round((booking.price_at_booking || 0) * 100),
                        },
                        quantity: 1,
                    },
                ],
                mode: 'payment',
                success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/Dashboard?status=success&bookingId=${bookingId}`,
                cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/BookingFlow?status=cancelled&bookingId=${bookingId}`,
                client_reference_id: bookingId,
                customer_email: client?.email || undefined,
                metadata: {
                    booking_id: bookingId,
                    barber_id: booking.barber_id,
                    shop_id: booking.shop_id || ''
                }
            });

            return { url: session.url };

        } catch (error: any) {
            fastify.log.error(error);
            if (isStripeInvalidKeyError(error)) {
                return reply.status(503).send({ error: STRIPE_KEY_ERROR });
            }
            return reply.status(500).send({ error: error.message });
        }
    });

    // Manual Payout Status Check (Example for Admin)
    fastify.get('/api/payments/balance', async (request, reply) => {
        if (!stripe) {
            return reply.status(503).send({ error: STRIPE_KEY_ERROR });
        }
        try {
            const balance = await stripe.balance.retrieve();
            return balance;
        } catch (error: any) {
            if (isStripeInvalidKeyError(error)) {
                return reply.status(503).send({ error: STRIPE_KEY_ERROR });
            }
            return reply.status(500).send({ error: error.message });
        }
    });
}
