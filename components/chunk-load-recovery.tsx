"use client";

import { useEffect } from "react";

const CHUNK_RELOAD_KEY = "mb_chunk_reload";
const CHUNK_RELOAD_TOAST_KEY = "mb_chunk_reload_toast";

const isChunkLoadErrorMessage = (message: string) =>
  /Loading chunk|ChunkLoadError|failed to fetch dynamically imported module/i.test(
    message
  );

const getErrorMessage = (value: unknown) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value instanceof Error) return value.message || "";
  if (typeof value === "object" && "message" in value) {
    const message = (value as { message?: unknown }).message;
    return typeof message === "string" ? message : "";
  }
  return "";
};

const triggerChunkReload = () => {
  if (typeof window === "undefined") return;
  const alreadyReloaded = sessionStorage.getItem(CHUNK_RELOAD_KEY);
  if (alreadyReloaded) return;

  sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
  sessionStorage.setItem(CHUNK_RELOAD_TOAST_KEY, "1");
  window.location.reload();
};

export function ChunkLoadRecovery() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleError = (event: ErrorEvent) => {
      const message = event?.message || getErrorMessage(event?.error);
      if (isChunkLoadErrorMessage(message)) triggerChunkReload();
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const message = getErrorMessage(event?.reason);
      if (isChunkLoadErrorMessage(message)) triggerChunkReload();
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return null;
}
