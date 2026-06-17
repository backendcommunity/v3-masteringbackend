// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
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
  });
}
