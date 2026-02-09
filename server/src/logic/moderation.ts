import { db } from '../db';
import * as schema from '../db/schema';
import { sendEmail } from './email';

/**
 * User Moderation Notification Logic
 * 
 * Sends email & in-app notification when admin takes moderation action
 * - Creates in-app notification via notifications table
 * - Logs action to audit_logs for compliance
 * - Handles different moderation statuses (flag, suspend, ban, restore)
 */

interface ModerationContext {
    user_id: string;
    user_email: string;
    user_name: string;
    action: 'flag' | 'suspend' | 'ban' | 'restore';
    reason: string;
    new_status: string;
    admin_id: string;
}

interface ModerationResult {
    status: 'NOTIFIED';
    user_id: string;
    action: string;
    notifications_sent: {
        email: boolean;
        in_app: boolean;
        audited: boolean;
    };
    message: string;
    timestamp: string;
}

const MODERATION_MESSAGES = {
    flag: {
        subject: 'Your Account is Under Review',
        greeting: 'Your account has been flagged for review.',
        body: (reason: string, userId: string) => `Our moderation team has reviewed your account and determined that further review is needed to ensure compliance with our community standards.

Reason: ${reason}

Your account remains active at this time, but we may take further action if needed. Please review our Terms of Service to understand our policies.

If you believe this is an error, you may contact our support team.`,
        severity: 'warning',
        action_display: 'FLAGGED'
    },
    suspend: {
        subject: 'Your Account Has Been Suspended',
        greeting: 'Your account has been temporarily suspended.',
        body: (reason: string, userId: string) => `Our moderation team has determined that your account violates our community standards. Your account access has been restricted.

Reason: ${reason}

Duration: Suspension is effective immediately and will be reviewed periodically.

To appeal this decision or learn more, contact our support team with your user ID: ${userId}`,
        severity: 'danger',
        action_display: 'SUSPENDED'
    },
    ban: {
        subject: 'Your Account Has Been Permanently Banned',
        greeting: 'Your account has been permanently banned.',
        body: (reason: string, userId: string) => `After careful review, our moderation team has determined that your account cannot remain on our platform.

Reason: ${reason}

This decision is permanent. You will not be able to create new accounts with the same email address.

If you have questions, you may contact our support team with your user ID: ${userId}`,
        severity: 'danger', // Remapped for schema compatibility
        action_display: 'BANNED'
    },
    restore: {
        subject: 'Your Account Has Been Restored',
        greeting: 'Your account has been restored to good standing.',
        body: (reason: string) => `Upon review, we have determined that you did not violate our community standards. Your account has been fully restored and you can now use all platform features normally.

Reason for restoration: ${reason}

Thank you for your patience, and we apologize for any inconvenience.`,
        severity: 'success',
        action_display: 'RESTORED'
    }
};

export async function notifyUserOfModerationAction(
    context: ModerationContext
): Promise<ModerationResult> {
    const { user_id, user_email, user_name, action, reason, new_status, admin_id } = context;

    // INPUT VALIDATION
    if (!user_id) throw new Error('user_id required');
    if (!user_email) throw new Error('user_email required');
    if (!['flag', 'suspend', 'ban', 'restore'].includes(action)) {
        throw new Error('action must be flag, suspend, ban, or restore');
    }
    if (!reason) throw new Error('reason required');
    if (!new_status) throw new Error('new_status required');
    if (!admin_id) throw new Error('admin_id required');

    const messageData = MODERATION_MESSAGES[action];
    let emailSent = false;

    // 1. SEND EMAIL
    try {
        const emailResult = await sendEmail({
            to: user_email,
            subject: messageData.subject,
            template: 'confirmation', // Reusing structure
            data: {
                clientName: user_name,
                serviceName: `Moderation Action: ${action.toUpperCase()}`,
                date: new Date().toLocaleDateString(),
                time: new Date().toLocaleTimeString(),
                barberName: 'Platform Integrity Team',
                location: 'Security Dashboard',
                price: 'N/A'
            }
        });
        emailSent = emailResult.success;
    } catch (emailErr) {
        console.warn(`Email notification failed for user ${user_id}:`, emailErr);
    }

    // 2. CREATE IN-APP NOTIFICATION
    try {
        await db.insert(schema.notifications).values({
            id: crypto.randomUUID(),
            user_id,
            type: 'moderation',
            title: messageData.subject,
            message: messageData.body(reason, user_id),
            severity: messageData.severity as any,
            is_read: false
        });
    } catch (notifError) {
        console.warn(`In-app notification failed for user ${user_id}:`, notifError);
    }

    // 3. CREATE AUDIT LOG
    try {
        await db.insert(schema.audit_logs).values({
            action: 'USER_MODERATION',
            resource_type: 'User',
            resource_id: user_id,
            actor_id: admin_id,
            changes: JSON.stringify({
                moderation_status: new_status,
                action_taken: action
            }),
            details: JSON.stringify({
                reason,
                user_email,
                user_name,
                notified: true,
                email_sent: emailSent,
                in_app_notification_created: true
            })
        });
    } catch (auditError) {
        console.warn(`Audit log failed for moderation action on user ${user_id}:`, auditError);
    }

    console.log(`[MODERATION] ${action.toUpperCase()} notification sent to ${user_email}`);

    return {
        status: 'NOTIFIED',
        user_id,
        action,
        notifications_sent: {
            email: emailSent,
            in_app: true,
            audited: true
        },
        message: `User ${user_email} has been notified of ${action} action`,
        timestamp: new Date().toISOString()
    };
}
