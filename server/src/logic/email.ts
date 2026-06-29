import { Resend } from 'resend';
import dotenv from 'dotenv';
import { logger } from '../lib/logger';

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
    template: 'confirmation' | 'cancellation' | 'welcome' | 'order_confirmation' | 'reminder' | 'no_show' | 'review_request' | 'review_nudge' | 'waitlist_offer' | 'wallet_health' | 'gift_card_purchased' | 'gift_card_received',
    data: any
}) {
    logger.info(`Preparing ${template} email for: ${to}`);

    if (!resend) {
        logger.warn('RESEND_API_KEY not configured. Email not sent.');
        logger.info('Email data', { to, subject, template, data });
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
            ${data.feeNote ? `<p style="color: #b45309;"><strong>Note:</strong> ${data.feeNote}</p>` : ''}
            <p>We hope to see you again soon!</p>
            <div style="text-align: center; margin-top: 30px;">
               <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/Explore" style="background: #10b981; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Book Another Session</a>
            </div>
          </div>
        `;
                break;

            case 'no_show':
                html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #b45309;">Appointment marked as no-show</h2>
            <p>Hi ${data.clientName || 'there'},</p>
            <p>Your appointment with <strong>${data.barberName || 'your barber'}</strong> for ${data.serviceName} on ${data.date} at ${data.time} was marked as a no-show.</p>
            ${data.feeNote ? `<p style="color: #b45309;"><strong>Fee:</strong> ${data.feeNote}</p>` : ''}
            <p>If you believe this was a mistake, please contact the barber or support from your dashboard.</p>
            <div style="text-align: center; margin-top: 30px;">
               <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/UserBookings" style="background: #10b981; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Bookings</a>
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
            <p style="font-size: 12px; color: #6b7280; text-align: center;">Shop The Barber - Premium Grooming</p>
          </div>
        `;
                break;

            case 'reminder':
                html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #10b981;">Appointment Reminder 💈</h2>
            <p>Hi ${data.clientName || 'there'},</p>
            <p>This is a friendly reminder about your upcoming appointment with <strong>${data.barberName}</strong>.</p>
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>When:</strong> ${data.date}${data.time ? ` at ${data.time}` : ''}</p>
              <p style="margin: 5px 0;"><strong>Service:</strong> ${data.serviceName}</p>
              ${data.location ? `<p style="margin: 5px 0;"><strong>Location:</strong> ${data.location}</p>` : ''}
            </div>
            <div style="text-align: center; margin-top: 25px;">
              <a href="${data.manageUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/UserBookings`}" style="background: #10b981; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">View My Bookings</a>
            </div>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #6b7280; text-align: center;">Shop The Barber, you can turn off reminders in Notification Settings.</p>
          </div>
        `;
                break;

            case 'review_request':
                html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #f59e0b;">How was your visit? ⭐</h2>
            <p>Hi ${data.clientName || 'there'},</p>
            <p>Thanks for visiting <strong>${data.barberName}</strong>. A quick star rating helps other clients discover great barbers, and helps your barber grow.</p>
            <div style="background: #fffbeb; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #fde68a;">
              <p style="margin: 5px 0;"><strong>Service:</strong> ${data.serviceName}</p>
              <p style="margin: 5px 0;"><strong>When:</strong> ${data.date}${data.time ? ` at ${data.time}` : ''}</p>
            </div>
            <div style="text-align: center; margin-top: 25px;">
              <a href="${data.reviewUrl}" style="background: #f59e0b; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Leave a review (1 min)</a>
            </div>
            <p style="font-size: 13px; color: #6b7280; text-align: center; margin-top: 20px;">Takes less than a minute, your feedback matters.</p>
          </div>
        `;
                break;

            case 'review_nudge':
                html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #f59e0b;">Still time to rate ${data.barberName} ⭐</h2>
            <p>Hi ${data.clientName || 'there'},</p>
            <p>We noticed you haven't left a review yet for your recent ${data.serviceName} visit. Even a star rating without a long write-up helps a lot.</p>
            <div style="text-align: center; margin-top: 25px;">
              <a href="${data.reviewUrl}" style="background: #10b981; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Rate your visit</a>
            </div>
          </div>
        `;
                break;

            case 'waitlist_offer':
                html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #d97706;">Your waitlist slot is ready ⏱</h2>
            <p>Hi ${data.clientName || 'there'},</p>
            <p>A slot opened up with <strong>${data.barberName || 'your barber'}</strong>${data.serviceName ? ` for <strong>${data.serviceName}</strong>` : ''}.</p>
            <div style="background: #fffbeb; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #fcd34d;">
              <p style="margin: 5px 0;"><strong>When:</strong> ${data.slotLabel || 'See app for details'}</p>
              <p style="margin: 5px 0; color: #b45309;"><strong>Act fast:</strong> You have ${data.minutes || 15} minutes to accept before it goes to the next person.</p>
            </div>
            <div style="text-align: center; margin-top: 30px;">
               <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/UserBookings?tab=waitlist" style="background: #d97706; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Accept my slot</a>
            </div>
          </div>
        `;
                break;

            case 'wallet_health':
                html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: ${data.cashBlocked ? '#dc2626' : '#d97706'};">Platform fee wallet: ${data.healthLabel}</h2>
            <p>Hi ${data.providerName || 'there'},</p>
            <p>Your ShopTheBarber commission wallet balance is running low.</p>
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Balance:</strong> ${data.balance} ${data.currency || 'EUR'}</p>
              <p style="margin: 5px 0;"><strong>Status:</strong> ${data.healthLabel}</p>
              ${data.cashBlocked ? '<p style="margin: 5px 0; color: #dc2626;"><strong>Cash bookings are blocked</strong> until you top up.</p>' : '<p style="margin: 5px 0;">Top up soon to keep accepting pay-at-shop bookings without interruption.</p>'}
            </div>
            <div style="text-align: center; margin-top: 30px;">
               <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/ProviderDashboard" style="background: #10b981; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Top Up Wallet</a>
            </div>
          </div>
        `;
                break;

            case 'gift_card_purchased':
                html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #10b981;">Gift card purchase confirmed 🎁</h2>
            <p>Thank you for your purchase of <strong>${data.amount}</strong>.</p>
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 12px; color: #6b7280;">Your gift code</p>
              <p style="margin: 0; font-family: monospace; font-size: 22px; font-weight: bold;">${data.code}</p>
            </div>
            <p>Share this code with someone special, or redeem it to your wallet from the Gift Cards page.</p>
            <div style="text-align: center; margin-top: 25px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/GiftCards" style="background: #10b981; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Gift Cards</a>
            </div>
          </div>
        `;
                break;

            case 'gift_card_received':
                html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #10b981;">You received a grooming gift 🎁</h2>
            <p>${data.senderName || 'Someone special'} sent you a ShopTheBarber gift card worth <strong>${data.amount}</strong>.</p>
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 12px; color: #6b7280;">Redeem code</p>
              <p style="margin: 0; font-family: monospace; font-size: 22px; font-weight: bold;">${data.code}</p>
            </div>
            <p>Sign in and redeem on the Gift Cards page to add credit to your wallet.</p>
            <div style="text-align: center; margin-top: 25px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/GiftCards" style="background: #10b981; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Redeem gift card</a>
            </div>
          </div>
        `;
                break;
        }

        const { data: resendData, error } = await resend.emails.send({
            from: process.env.EMAIL_FROM || 'Shop The Barber <onboarding@resend.dev>',
            to: Array.isArray(to) ? to : [to],
            subject,
            html,
        });

        if (error) {
            logger.error('Email send failed', error);
            return { success: false, error: error.message };
        }

        logger.info(`Email sent: ${resendData?.id}`);
        return { success: true, id: resendData?.id };

    } catch (err: any) {
        logger.error('Email exception', err);
        return { success: false, error: err.message };
    }
}
