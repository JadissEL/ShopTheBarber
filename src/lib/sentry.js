import * as Sentry from '@sentry/react';

const dsn = import.meta.env.VITE_SENTRY_DSN;
const environment =
  import.meta.env.VITE_SENTRY_ENVIRONMENT ||
  import.meta.env.MODE ||
  'development';

let initialized = false;

export function initSentry() {
  if (initialized || !dsn) {
    if (!dsn && import.meta.env.PROD) {
      console.warn('[sentry] VITE_SENTRY_DSN not set, client error tracking disabled');
    }
    return;
  }

  Sentry.init({
    dsn,
    environment,
    release: import.meta.env.VITE_SENTRY_RELEASE || undefined,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
    replaysSessionSampleRate: environment === 'production' ? 0.05 : 0,
    replaysOnErrorSampleRate: environment === 'production' ? 1.0 : 0,
    beforeSend(event) {
      if (event.request?.headers?.Authorization) {
        delete event.request.headers.Authorization;
      }
      return event;
    },
  });

  initialized = true;
}

export { Sentry };

export function captureException(error, context) {
  if (!initialized) return;
  Sentry.captureException(error, context ? { extra: context } : undefined);
}
