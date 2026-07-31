"use client";
import React, { useState } from "react";
import * as Sentry from "@sentry/nextjs";
import { PathFeedbackDialog } from "@/components/pages/path/path-feedback-dialog";

const CHUNK_RELOAD_KEY = "mb_chunk_reload";
const CHUNK_RELOAD_TOAST_KEY = "mb_chunk_reload_toast";

const isChunkLoadError = (error: Error | null) => {
  if (!error) return false;
  const message = error.message || "";
  return /Loading chunk|ChunkLoadError|failed to fetch dynamically imported module/i.test(
    message
  );
};

interface State {
  hasError: boolean;
  error: Error | null;
}

// Function component so it can own dialog-open state — ErrorBoundary itself
// is a class component (required for componentDidCatch) and can't use hooks.
// Deliberately takes no props beyond the error: it must render correctly with
// no AuthProvider/store context above it, since a crash inside AuthProvider
// is exactly when this renders.
function ReportIssueButton({ error }: { error: Error | null }) {
  const [open, setOpen] = useState(false);
  const prefillMessage = error?.message
    ? error.message.slice(0, 200)
    : "An unexpected error occurred.";

  return (
    <PathFeedbackDialog
      open={open}
      onOpenChange={setOpen}
      source="error-boundary"
      prefillMessage={prefillMessage}
      context={{ url: typeof window !== "undefined" ? window.location.href : undefined }}
      trigger={
        <button
          type="button"
          className="rounded-md border px-4 py-2 text-sm"
        >
          Report Issue
        </button>
      }
    />
  );
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info);
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: info.componentStack,
        },
      },
    });

    if (typeof window !== "undefined" && isChunkLoadError(error)) {
      const alreadyReloaded = sessionStorage.getItem(CHUNK_RELOAD_KEY);
      if (!alreadyReloaded) {
        sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
        sessionStorage.setItem(CHUNK_RELOAD_TOAST_KEY, "1");
        window.location.reload();
      }
    }
  }

  render() {
    if (this.state.hasError) {
      const isChunkError = isChunkLoadError(this.state.error);
      const hasReloaded =
        typeof window !== "undefined" &&
        sessionStorage.getItem(CHUNK_RELOAD_KEY) === "1";

      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
          <h1 className="text-3xl font-bold">Something went wrong</h1>
          <p className="text-muted-foreground max-w-md text-sm">
            {isChunkError
              ? "We had trouble loading the latest app assets. Please refresh to get the newest version."
              : this.state.error?.message ?? "An unexpected error occurred."}
          </p>
          {isChunkError && !hasReloaded && (
            <p className="text-xs text-muted-foreground">
              Refreshing now...
            </p>
          )}
          <div className="flex gap-3">
            <button
              className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </button>
            <ReportIssueButton error={this.state.error} />
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
