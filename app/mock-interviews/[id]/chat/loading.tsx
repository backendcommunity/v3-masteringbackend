import { Loader2 } from "lucide-react";

/**
 * Instant route skeleton shown the moment the user navigates to a chat
 * interview, while the (heavy) ChatInterviewRoom segment loads. Without this the
 * transition was a blank screen after "Start Now"; now feedback is continuous:
 * Start Now spinner -> this skeleton -> the room's own init state.
 */
export default function Loading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="h-14 flex-shrink-0 border-b border-border bg-background/95" />
      <div className="grid flex-1 place-items-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm font-medium">Starting your interview…</p>
        </div>
      </div>
    </div>
  );
}
