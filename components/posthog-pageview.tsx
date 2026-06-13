"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import posthog from "posthog-js";

export function PostHogPageview() {
  const pathname = usePathname();

  useEffect(() => {
    // posthog is only initialized in production; skip when it isn't loaded.
    if (pathname && posthog.__loaded) {
      posthog.capture("$pageview", {
        $current_url: pathname,
      });
    }
  }, [pathname]);

  return null;
}
