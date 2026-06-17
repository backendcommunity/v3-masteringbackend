"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { ResultCard, ReportData } from "./chat/result-card";

type Status = "loading" | "pending" | "ready" | "skipped" | "failed";

// Renders an audio/video interview's results using the SAME ResultCard as the
// chat interview, fetched from the AV report endpoint (which returns a
// ReportData-shaped payload). Polls while the report is still generating.
// No header of its own — the surrounding path step owns the chrome.
export function AvResults({
  sessionId,
  embedded = false,
}: {
  sessionId: string;
  embedded?: boolean;
}) {
  const store = useAppStore();
  const [report, setReport] = useState<ReportData | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState<string>("");
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await store.getSessionReport(sessionId);
        if (cancelled) return;
        const st: string | undefined = data?.status;

        if (st === "PENDING" || st === "PROCESSING") {
          setStatus("pending");
          pollRef.current = setTimeout(load, 4000);
          return;
        }
        if (st === "SKIPPED") {
          setStatus("skipped");
          setMessage(
            data?.reason ||
              "There wasn't enough captured to score this interview.",
          );
          return;
        }
        if (st === "FAILED") {
          setStatus("failed");
          setMessage(
            data?.message ||
              "We had trouble generating your results — it's retrying automatically.",
          );
          return;
        }
        // COMPLETED — the payload is ReportData-shaped.
        setReport(data as ReportData);
        setStatus("ready");
      } catch (err: any) {
        if (cancelled) return;
        setStatus("failed");
        setMessage(err?.message || "We couldn't load your results.");
      }
    }

    load();
    return () => {
      cancelled = true;
      if (pollRef.current) clearTimeout(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const fill = embedded ? "h-full" : "h-screen";

  if (status === "loading" || status === "pending") {
    return (
      <div className={`flex ${fill} items-center justify-center`}>
        <div className="flex flex-col items-center gap-3 px-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-foreground">
            Preparing your results…
          </p>
          <p className="text-xs text-muted-foreground">
            Scoring your interview. This usually takes under a minute.
          </p>
        </div>
      </div>
    );
  }

  if (status === "skipped" || status === "failed") {
    return (
      <div className={`flex ${fill} items-center justify-center`}>
        <div className="flex max-w-sm flex-col items-center gap-3 px-6 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <AlertCircle className="h-6 w-6 text-muted-foreground" />
          </span>
          <p className="text-sm font-semibold text-foreground">
            {status === "skipped"
              ? "No results to show"
              : "Results unavailable"}
          </p>
          <p className="text-xs text-muted-foreground">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${fill} w-full overflow-y-auto bg-background`}>
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
        {report && <ResultCard data={report} />}
      </div>
    </div>
  );
}
