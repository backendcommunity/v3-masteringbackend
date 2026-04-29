"use client";

import { useEffect } from "react";
import { toast } from "sonner";

const CHUNK_RELOAD_TOAST_KEY = "mb_chunk_reload_toast";

export function ChunkReloadToast() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const shouldToast = sessionStorage.getItem(CHUNK_RELOAD_TOAST_KEY);
    if (!shouldToast) return;

    sessionStorage.removeItem(CHUNK_RELOAD_TOAST_KEY);
    toast.info("We refreshed the app to load the latest assets.");
  }, []);

  return null;
}
