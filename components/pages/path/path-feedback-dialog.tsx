"use client";

import { useState } from "react";
import { MessageSquareText, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAppStore } from "@/lib/store";

type FeedbackSource = "playground" | "tasks-page" | "path-lesson" | "error-boundary";

interface PathFeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: FeedbackSource;
  context?: { projectSlug?: string; lessonSlug?: string; url?: string };
  /**
   * For the error-boundary source: the caught error's message, shown as
   * read-only text above the textarea and joined into the submitted message.
   * Never editable — the user's own text is what's required and appended.
   */
  prefillMessage?: string;
  /**
   * Overrides the default icon-button trigger. ErrorBoundary uses this to
   * render its own "Report Issue" button instead of a second, redundant icon.
   */
  trigger?: React.ReactNode;
}

const JOIN_SEPARATOR = "\n\n";
const MAX_MESSAGE_LENGTH = 3000;

export function PathFeedbackDialog({
  open,
  onOpenChange,
  source,
  context,
  prefillMessage,
  trigger,
}: PathFeedbackDialogProps) {
  const store = useAppStore();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  // Budget the textarea by whatever prefillMessage will consume so the
  // combined string sent to the server can never exceed the server's own
  // 3000-char cap — the user sees the real remaining room while typing
  // instead of a confusing rejection after clicking Send.
  const prefixLength = prefillMessage ? prefillMessage.length + JOIN_SEPARATOR.length : 0;
  const maxLength = Math.max(0, MAX_MESSAGE_LENGTH - prefixLength);

  const submit = async () => {
    const message = prefillMessage ? `${prefillMessage}${JOIN_SEPARATOR}${text}` : text;
    setSending(true);
    try {
      await store.submitFeedback({ message, source, context });
      toast.success("Thanks for your feedback!");
      setText("");
      onOpenChange(false);
    } catch (err) {
      const isRateLimited =
        (err as { response?: { status?: number } })?.response?.status === 429;
      toast.error(
        isRateLimited
          ? "You've sent a lot of feedback — try again in a bit."
          : "Couldn't send feedback — please try again."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="icon" className="w-8 h-8">
            <MessageSquareText className="w-4 h-4" />
            <span className="sr-only">Feedback</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-[calc(100%-2rem)] max-w-[440px] sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Send feedback</DialogTitle>
          <DialogDescription>
            Tell us what&apos;s working or what could be better.
          </DialogDescription>
        </DialogHeader>
        {prefillMessage && (
          <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
            {prefillMessage}
          </p>
        )}
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Your feedback…"
          maxLength={maxLength}
          className="min-h-[120px] resize-none"
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={submit}
            disabled={!text.trim() || sending}
            className="btn-primary"
          >
            <Send className="w-4 h-4 mr-1.5" /> Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
