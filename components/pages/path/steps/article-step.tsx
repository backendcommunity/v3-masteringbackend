"use client";
import { useEffect, useState } from "react";
import DOMPurify from "isomorphic-dompurify";
import { PathSessionStep } from "@/lib/path-types";
import { StepFrame } from "../step-frame";
import { useAppStore } from "@/lib/store";
import { Loader } from "@/components/ui/loader";

export function ArticleStep({
  step,
  onComplete,
}: {
  step: PathSessionStep;
  onComplete: (stepId: string, payload?: Record<string, unknown>) => void;
}) {
  const store = useAppStore();
  const [html, setHtml] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const item = await store.getPathItem(step.payloadRef.endpoint);
        const raw = item?.content ?? item?.body ?? item?.summary ?? "";
        setHtml(DOMPurify.sanitize(raw));
      } catch {
        setHtml("");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.id]);

  return (
    <StepFrame
      step={step}
      onComplete={() => onComplete(step.id)}
      completeLabel="Mark as read & continue"
    >
      <div className="p-6 max-w-3xl mx-auto">
        {loading ? (
          <Loader isFull={false} />
        ) : html ? (
          <article
            className="text-sm leading-relaxed [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:font-semibold [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1 [&_a]:text-primary [&_a]:underline [&_code]:bg-muted [&_code]:px-1 [&_code]:rounded [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:rounded [&_pre]:overflow-x-auto"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <p className="text-muted-foreground">
            Article content will appear here. You can mark it as read to
            continue.
          </p>
        )}
      </div>
    </StepFrame>
  );
}
