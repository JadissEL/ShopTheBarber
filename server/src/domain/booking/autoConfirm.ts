import crypto from 'crypto';

import { subHours } from 'date-fns';

import { prisma } from '../../db/prisma';

import { ensureBookingQrToken } from './qrCheckIn';

import { deductPlatformFeeForCashBooking } from '../../providerWallet/logic';

import { AUTO_CONFIRM_HOURS } from '../../lib/cronAuth';

import { canAutoConfirmBooking } from './autoConfirmPolicy';
import { isFinancialTrustSchemaError } from '../schemaGuard';

export async function autoConfirmStalePendingBookings(limit = 50) {
    try {
    const cutoff = subHours(new Date(), AUTO_CONFIRM_HOURS).toISOString();

    const pending = await prisma.bookings.findMany({

        where: {

            status: 'pending',

            created_at: { lt: cutoff },

        },

        take: limit,

        orderBy: { created_at: 'asc' },

        select: {

            id: true,

            client_id: true,

            payment_method: true,

            service_name: true,

            deposit_amount: true,

            deposit_payment_status: true,

            authorization_amount: true,

            authorization_status: true,

            payment_status: true,

        },

    });



    let confirmed = 0;

    let skipped = 0;

    const errors: Array<{ booking_id: string; error: string }> = [];

    const skipReasons: Array<{ booking_id: string; reason: string }> = [];



    for (const booking of pending) {

        try {

            const gate = canAutoConfirmBooking(booking);

            if (!gate.ok) {

                skipped += 1;

                skipReasons.push({ booking_id: booking.id, reason: gate.reason });

                continue;

            }



            if (booking.payment_method === 'cash_at_store') {

                try {

                    await deductPlatformFeeForCashBooking(booking.id);

                } catch {

                    skipped += 1;

                    skipReasons.push({ booking_id: booking.id, reason: 'cash_fee_unpaid' });

                    continue;

                }

            }



            await prisma.bookings.update({

                where: { id: booking.id },

                data: { status: 'confirmed', updated_at: new Date().toISOString() },

            });

            await ensureBookingQrToken(booking.id);



            if (booking.client_id) {

                await prisma.notifications.create({

                    data: {

                        id: crypto.randomUUID(),

                        user_id: booking.client_id,

                        title: 'Booking confirmed',

                        content: `Your appointment${booking.service_name ? ` for ${booking.service_name}` : ''} was automatically confirmed after ${AUTO_CONFIRM_HOURS} hours.`,

                        type: 'booking',

                    },

                });

            }



            confirmed += 1;

        } catch (e) {

            errors.push({

                booking_id: booking.id,

                error: e instanceof Error ? e.message : 'Unknown error',

            });

        }

    }



    return { scanned: pending.length, confirmed, skipped, skip_reasons: skipReasons, errors };
    } catch (err) {
        if (isFinancialTrustSchemaError(err)) {
            return { scanned: 0, confirmed: 0, skipped: 0, skip_reasons: [], errors: [], schema_pending: true };
        }
        throw err;
    }
}
