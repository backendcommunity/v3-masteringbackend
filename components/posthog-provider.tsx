"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

export function PostHogProviderComponent({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Production only — mirror the Sentry gate (instrumentation-client.ts).
    // NODE_ENV is "production" for every built deploy (incl. staging), so gate
    // on the app-level env instead. No key on local/develop/staging -> skip
    // init entirely (avoids the "initialized without a token" warning).
    const env = process.env.NEXT_PUBLIC_NODE_ENV ?? process.env.NODE_ENV;
    if (env !== "production") return;
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host:
        process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      capture_pageview: false,
      capture_pageleave: true,
    });
  }, []);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
