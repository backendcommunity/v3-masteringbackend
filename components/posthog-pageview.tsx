"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import posthog from "posthog-js";

export function PostHogPageview() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname) {
      posthog.capture("$pageview", {
        $current_url: pathname,
      });
    }
  }, [pathname]);

  return null;
}
