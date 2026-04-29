"use client";

import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";
import { useEffect } from "react";

const CHUNK_RELOAD_KEY = "mb_chunk_reload";
const CHUNK_RELOAD_TOAST_KEY = "mb_chunk_reload_toast";

const isChunkLoadError = (error: Error | null) => {
  if (!error) return false;
  const message = error.message || "";
  return /Loading chunk|ChunkLoadError|failed to fetch dynamically imported module/i.test(
    message
  );
};

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);

    if (typeof window !== "undefined" && isChunkLoadError(error)) {
      const alreadyReloaded = sessionStorage.getItem(CHUNK_RELOAD_KEY);
      if (!alreadyReloaded) {
        sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
        sessionStorage.setItem(CHUNK_RELOAD_TOAST_KEY, "1");
        window.location.reload();
      }
    }
  }, [error]);

  return (
    <html lang="en">
      <body>
        {/* `NextError` is the default Next.js error page component. Its type
        definition requires a `statusCode` prop. However, since the App Router
        does not expose status codes for errors, we simply pass 0 to render a
        generic error message. */}
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
