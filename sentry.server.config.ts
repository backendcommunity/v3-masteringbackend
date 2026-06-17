// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// Only initialize Sentry in production to keep development clean
if ((process.env.NEXT_PUBLIC_NODE_ENV ?? process.env.NODE_ENV) === "production") {
  Sentry.init({
    dsn: "https://b488564494f60a7e04e8cf95ea7b07e9@o4510933825159168.ingest.us.sentry.io/4510933826928640",

    environment: "production",

    // Conservative sampling for free plan: capture 10% of traces to stay within quota
    tracesSampleRate: 0.1,

    // Disable PII by default - don't send user data without explicit consent
    sendDefaultPii: false,

    // Reduce noise - don't log every debug statement
    enableLogs: false,

    // Allow specific errors to be filtered out (reduces noise, stays within quota)
    beforeSend(event, hint) {
      // Ignore certain non-critical errors
      if (event.exception) {
        const error = hint.originalException;
        if (error instanceof Error) {
          // Filter out network errors that are user-caused
          if (error.message?.includes("NetworkError") || error.message?.includes("Failed to fetch")) {
            return null;
          }
        }
      }
      return event;
    },
  });
}
