import * as Sentry from '@sentry/node';

let initialized = false;

export function initSentry(): boolean {
    const dsn = process.env.SENTRY_DSN?.trim();
    if (!dsn) return false;
    if (initialized) return true;

    Sentry.init({
        dsn,
        environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
        release: process.env.SENTRY_RELEASE || process.env.RENDER_GIT_COMMIT || undefined,
        tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
        profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0'),
        sendDefaultPii: false,
        beforeSend(event) {
            if (event.request?.headers) {
                delete event.request.headers.authorization;
                delete event.request.headers.cookie;
            }
            return event;
        },
    });
    initialized = true;
    return true;
}

export function captureException(error: unknown, context?: Record<string, unknown>): void {
    if (!initialized) return;
    Sentry.withScope((scope) => {
        if (context) scope.setContext('extra', context);
        Sentry.captureException(error);
    });
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info'): void {
    if (!initialized) return;
    Sentry.captureMessage(message, level);
}

export { Sentry };
