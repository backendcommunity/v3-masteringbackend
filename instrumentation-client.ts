// This file configures the initialization of Sentry on the client.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const env = process.env.NEXT_PUBLIC_NODE_ENV ?? process.env.NODE_ENV;
const isProduction = env === "production";

if (isProduction) {
  Sentry.init({
    dsn: "https://b488564494f60a7e04e8cf95ea7b07e9@o4510933825159168.ingest.us.sentry.io/4510933826928640",

    environment: "production",

    integrations: [Sentry.replayIntegration()],

    tracesSampleRate: 0.1,
    enableLogs: false,
    sendDefaultPii: false,

    replaysSessionSampleRate: 0.05,
    replaysOnErrorSampleRate: 1.0,

    beforeSend(event, hint) {
      const error = hint.originalException;
      if (error instanceof Error) {
        // Vimeo SDK AbortError on player.destroy() — not actionable
        if (error.name === "AbortError") return null;
        // Vimeo SDK missing id/url — fixed at source, filter residual noise
        if (error.message?.includes("id or url must be passed")) return null;
        // Transient network errors — not actionable
        if (
          error.message?.includes("NetworkError") ||
          error.message?.includes("Network Error") ||
          error.message?.includes("Failed to fetch")
        ) {
          return null;
        }
      }
      return event;
    },
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
