/**
 * Google Calendar sync: create/delete events for bookings using stored refresh tokens.
 * Requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in env.
 */
import { google } from 'googleapis';
import type { OAuth2Client } from 'google-auth-library';

const GOOGLE_CLIENT_ID = (process.env.GOOGLE_CLIENT_ID || '').trim();
const GOOGLE_CLIENT_SECRET = (process.env.GOOGLE_CLIENT_SECRET || '').trim();
const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
const BACKEND_URL = (process.env.BACKEND_URL || process.env.FRONTEND_URL?.replace('3000', '3001') || 'http://localhost:3001').replace(/\/$/, '');

export function isGoogleCalendarConfigured(): boolean {
    return Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
}

function getRedirectUri(): string {
    return `${BACKEND_URL}/api/integrations/google/callback`;
}

export function getGoogleAuthorizeUrl(state: string): string {
    const oauth2 = new google.auth.OAuth2(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        getRedirectUri()
    );
    const scopes = ['https://www.googleapis.com/auth/calendar.events', 'https://www.googleapis.com/auth/calendar'];
    return oauth2.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: scopes,
        state,
    });
}

/** Exchange authorization code for tokens. Returns refresh_token. */
export async function exchangeCodeForTokens(code: string): Promise<{ refresh_token: string }> {
    const oauth2 = new google.auth.OAuth2(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        getRedirectUri()
    );
    const { tokens } = await oauth2.getToken(code);
    if (!tokens.refresh_token) {
        throw new Error('Google did not return a refresh token. User may have already authorized; try revoking access and reconnecting.');
    }
    return { refresh_token: tokens.refresh_token };
}

function getOAuth2Client(refreshToken: string): OAuth2Client {
    const oauth2 = new google.auth.OAuth2(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        getRedirectUri()
    );
    oauth2.setCredentials({ refresh_token: refreshToken });
    return oauth2;
}

export type BookingForCalendar = {
    id: string;
    start_time: string; // ISO
    end_time: string;
    service_name: string | null;
    client_name: string | null;
    barber_name: string | null;
    barber_id: string;
    client_id: string | null;
};

/**
 * Create a calendar event for a booking. Returns the Google event id.
 */
export async function createCalendarEvent(
    booking: BookingForCalendar,
    refreshToken: string,
    role: 'client' | 'barber'
): Promise<string> {
    const auth = getOAuth2Client(refreshToken);
    const calendar = google.calendar({ version: 'v3', auth });

    const summary = role === 'client'
        ? `💈 ${booking.service_name || 'Barber'} with ${booking.barber_name || 'Barber'}`
        : `📅 ${booking.service_name || 'Booking'} – ${booking.client_name || 'Client'}`;
    const description = [
        booking.service_name && `Service: ${booking.service_name}`,
        booking.barber_name && role === 'client' && `Barber: ${booking.barber_name}`,
        booking.client_name && role === 'barber' && `Client: ${booking.client_name}`,
        `Booking ID: ${booking.id}`,
        `${FRONTEND_URL}/Dashboard`,
    ].filter(Boolean).join('\n');

    const res = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
            summary,
            description,
            start: { dateTime: booking.start_time, timeZone: 'UTC' },
            end: { dateTime: booking.end_time, timeZone: 'UTC' },
        },
    });

    const eventId = res.data.id;
    if (!eventId) throw new Error('Google Calendar did not return an event id');
    return eventId;
}

/**
 * Delete a calendar event by id using the user's refresh token.
 */
export async function deleteCalendarEvent(refreshToken: string, eventId: string): Promise<void> {
    const auth = getOAuth2Client(refreshToken);
    const calendar = google.calendar({ version: 'v3', auth });
    await calendar.events.delete({ calendarId: 'primary', eventId });
}

export type CalendarSyncResult = { clientEventId?: string; barberEventId?: string };

/**
 * Sync a booking to Google Calendar for client and barber if they have tokens.
 * Does not throw; returns partial result on partial failure.
 */
export async function syncBookingToCalendars(
    booking: BookingForCalendar,
    clientRefreshToken: string | null,
    barberRefreshToken: string | null
): Promise<CalendarSyncResult> {
    const result: CalendarSyncResult = {};
    if (clientRefreshToken) {
        try {
            result.clientEventId = await createCalendarEvent(booking, clientRefreshToken, 'client');
        } catch (e) {
            console.warn('[Calendar] Failed to create client event:', e);
        }
    }
    if (barberRefreshToken) {
        try {
            result.barberEventId = await createCalendarEvent(booking, barberRefreshToken, 'barber');
        } catch (e) {
            console.warn('[Calendar] Failed to create barber event:', e);
        }
    }
    return result;
}
