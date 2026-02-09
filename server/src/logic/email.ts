import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendEmail({
    to,
    subject,
    template,
    data
}: {
    to: string | string[],
    subject: string,
    template: 'confirmation' | 'cancellation' | 'welcome' | 'order_confirmation',
    data: any
}) {
    console.log(`[EMAIL] Preparing ${template} email for: ${to}`);

    if (!resend) {
        console.warn('[EMAIL-WARN] RESEND_API_KEY not configured. Logging email data instead:');
        console.log(JSON.stringify({ to, subject, template, data }, null, 2));
        return { success: true, mocked: true };
    }

    try {
        let html = '';

        // Simple HTML templates
        switch (template) {
            case 'confirmation':
                html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #10b981;">Booking Confirmed! 💈</h2>
            <p>Hi ${data.clientName || 'there'},</p>
            <p>Your appointment with <strong>${data.barberName}</strong> has been scheduled successfully.</p>
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Date:</strong> ${data.date}</p>
              <p style="margin: 5px 0;"><strong>Time:</strong> ${data.time}</p>
              <p style="margin: 5px 0;"><strong>Service:</strong> ${data.serviceName}</p>
              <p style="margin: 5px 0;"><strong>Location:</strong> ${data.location}</p>
              <p style="margin: 5px 0;"><strong>Price:</strong> ${data.price}</p>
            </div>
            <p>Need to manage your booking? Log in to your dashboard anytime.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #6b7280; text-align: center;">Sent by Shop The Barber Platform</p>
          </div>
        `;
                break;

            case 'cancellation':
                html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #ef4444;">Booking Cancelled</h2>
            <p>Hi ${data.clientName || 'there'},</p>
            <p>The appointment for ${data.serviceName} on ${data.date} at ${data.time} has been cancelled by ${data.cancelledBy === 'provider' ? 'the barber' : 'you'}.</p>
            ${data.refundAmount ? `<p style="color: #059669;"><strong>Refund Status:</strong> A refund of ${data.refundAmount} has been initiated.</p>` : ''}
            <p>We hope to see you again soon!</p>
            <div style="text-align: center; margin-top: 30px;">
               <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/Explore" style="background: #10b981; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Book Another Session</a>
            </div>
          </div>
        `;
                break;

            case 'welcome':
                html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #10b981;">Welcome to Shop The Barber!</h2>
            <p>We're excited to have you on board.</p>
            <p>Find the best professionals, track your style, and book appointments in seconds.</p>
            <div style="text-align: center; margin-top: 30px;">
               <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/Dashboard" style="background: #10b981; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Dashboard</a>
            </div>
          </div>
        `;
                break;

            case 'order_confirmation':
                const orderItems = (data.items || []).map((i: { name: string; quantity: number; price: number }) =>
                    `<tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${i.name} × ${i.quantity}</td><td style="text-align: right; padding: 8px 0; border-bottom: 1px solid #eee;">$${(Number(i.price) * (i.quantity || 1)).toFixed(2)}</td></tr>`
                ).join('');
                html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #10b981;">Order Confirmed</h2>
            <p>Hi ${data.customerName || 'there'},</p>
            <p>Thank you for your order. Your payment was successful.</p>
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Order:</strong> #${(data.orderId || '').slice(-8)}</p>
              <p style="margin: 5px 0;"><strong>Total:</strong> ${data.total}</p>
            </div>
            <table style="width: 100%; margin: 15px 0;">${orderItems}</table>
            <p>We'll notify you when your order ships. Complimentary 2-day shipping applies.</p>
            <div style="text-align: center; margin-top: 25px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/Marketplace" style="background: #10b981; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Continue Shopping</a>
            </div>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #6b7280; text-align: center;">Shop The Barber – Premium Grooming</p>
          </div>
        `;
                break;
        }

        const { data: resendData, error } = await resend.emails.send({
            from: process.env.EMAIL_FROM || 'Shop The Barber <onboarding@resend.dev>',
            to: Array.isArray(to) ? to : [to],
            subject: subject,
            html: html,
        });

        if (error) {
            console.error('[EMAIL-ERROR]', error);
            return { success: false, error: error.message };
        }

        console.log('[EMAIL-SUCCESS]', resendData?.id);
        return { success: true, id: resendData?.id };

    } catch (err: any) {
        console.error('[EMAIL-EXCEPTION]', err);
        return { success: false, error: err.message };
    }
}
