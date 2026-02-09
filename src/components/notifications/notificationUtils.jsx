import { sovereign } from '@/api/apiClient';

/**
 * Sends a notification to a user (In-App + Email)
 * @param {Object} params
 * @param {string} params.userId - Recipient User ID
 * @param {string} params.email - Recipient Email
 * @param {string} params.title - Notification Title
 * @param {string} params.message - Notification Body
 * @param {string} params.type - Type (booking_request, etc.)
 * @param {string} params.link - Redirect URL
 * @param {string} params.relatedEntityId - ID of related entity
 */
export const sendNotification = async ({ userId, email, title, message, type, link, relatedEntityId }) => {
    try {
        // 1. Create In-App Notification
        if (userId) {
            await sovereign.entities.Notification.create({
                user_id: userId,
                title,
                content: message,
                type,
                link,
                related_entity_id: relatedEntityId,
                is_read: false
            });
        }

        // 2. Send Email (if email is provided)
        if (email) {
            await sovereign.integrations.Core.SendEmail({
                to: email,
                subject: title,
                body: `
                    <h1>${title}</h1>
                    <p>${message}</p>
                    ${link ? `<a href="${window.location.origin}${link}">View Details</a>` : ''}
                `
            });

            // Log the email
            await sovereign.entities.NotificationLog.create({
                type: type,
                recipient_email: email,
                message: message,
                status: 'Sent',
                sent_at: new Date().toISOString()
            });
        }

        return true;
    } catch (error) {
        console.error("Failed to send notification:", error);
        return false;
    }
};
