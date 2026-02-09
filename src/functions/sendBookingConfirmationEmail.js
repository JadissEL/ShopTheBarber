/**
 * Email notification stubs for frontend
 * These call the sovereign backend email endpoints
 */

import { sovereign } from '@/api/apiClient';

export async function sendBookingConfirmationEmail(booking) {
    try {
        const result = await sovereign.functions.invoke('send-booking-email', {
            action: 'confirmation',
            booking
        });
        return result;
    } catch (error) {
        console.error('Error sending booking confirmation email:', error);
        return { success: false, error: error.message };
    }
}

export async function sendCancellationEmail(booking, cancelledBy = 'client') {
    try {
        const result = await sovereign.functions.invoke('send-booking-email', {
            action: 'cancellation',
            booking,
            cancelledBy
        });
        return result;
    } catch (error) {
        console.error('Error sending cancellation email:', error);
        return { success: false, error: error.message };
    }
}
