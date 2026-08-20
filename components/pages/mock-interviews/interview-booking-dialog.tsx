"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Clock,
  Layout,
  MessageSquare,
  Video,
  Play,
  CalendarClock,
  ChevronRight,
  Calendar,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface BookingTemplate {
  id: string;
  name: string | null;
  company?: string | null;
  position?: string | null;
  seniority?: string | null;
  category?: string | null;
  difficulty: string;
  duration: number;
  topics?: string[] | null;
  style?: string | null;
  format?: string | null;
}

interface InterviewBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: BookingTemplate | null;
  onNavigate: (path: string) => void;
  onBooked?: () => void;
  /**
   * The server refused this booking on quota (402). The dialog closes itself
   * and hands the refusal up so the page can raise its paywall.
   *
   * Optional, and the toast stays as the fallback: a caller that has no gate
   * to open must still tell the learner why nothing happened.
   */
  onUpgradeRequired?: () => void;
}

function difficultyBadge(difficulty: string) {
  const map: Record<string, { pill: string }> = {
    Easy: { pill: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
    Medium: { pill: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
    Hard: { pill: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  };
  const style = map[difficulty] ?? { pill: "bg-muted text-muted-foreground" };
  return (
    <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full", style.pill)}>
      {difficulty}
    </span>
  );
}

export function InterviewBookingDialog({
  open,
  onOpenChange,
  template,
  onNavigate,
  onBooked,
  onUpgradeRequired,
}: InterviewBookingDialogProps) {
  const store = useAppStore();

  const [selectedMode, setSelectedMode] = useState<"chat" | "video" | "audio">("chat");
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [creating, setCreating] = useState(false);

  const reset = () => {
    setShowScheduleForm(false);
    setScheduledDate("");
    setScheduledTime("");
    setCreating(false);
  };

  const handleClose = (open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  };

  /**
   * Close and hand a quota refusal up to the page, which raises the paywall.
   *
   * Returns false for anything that is not a quota refusal so each caller can
   * fall through to its own error copy — "failed to start" and "failed to
   * schedule" are different failures and should not be collapsed here.
   *
   * Shared because only the Start Now path used to check for 402 at all;
   * scheduling reported the same refusal as "Failed to schedule interview",
   * which reads like a bug rather than a wall the learner can pay past.
   */
  const handledAsQuotaRefusal = (error: any): boolean => {
    const status = error?.response?.status;
    if (status !== 402 && status !== 403) return false;
    handleClose(false);
    if (onUpgradeRequired) {
      onUpgradeRequired();
    } else {
      toast.error("Session limit reached. Upgrade for more access.");
    }
    return true;
  };

  const handleStartChatNow = async () => {
    if (!template) return;
    setCreating(true);
    try {
      const result = await store.scheduleInterviewFromTemplate(template.id, {});
      if (!result?.interview?.id) {
        toast.error("Failed to start chat interview");
        setCreating(false);
        return;
      }
      // Hand the chat room the preview we just got from the create call so it
      // renders the welcome screen instantly, skipping its own preview fetch.
      if (result.preview) {
        store.primeChatPreview(result.interview.id, result.preview);
      }
      toast.success("Chat interview started!");
      // Keep the dialog open and the Start Now spinner running THROUGH the
      // navigation. The interview page takes a moment to load; closing the
      // dialog / resetting `creating` here (as before) dropped all feedback and
      // left the user on a blank screen. The dialog unmounts when the route
      // changes, so the spinner naturally ends when the new page takes over.
      onNavigate(`/mock-interviews/${result.interview.id}/chat`);
    } catch (error: any) {
      if (!handledAsQuotaRefusal(error)) {
        toast.error("Failed to start chat interview");
        setCreating(false);
      }
    }
  };

  const handleSchedule = async () => {
    if (!template || !scheduledDate || !scheduledTime) {
      toast.error("Select a date and time");
      return;
    }
    try {
      setCreating(true);
      const isoDate = new Date(`${scheduledDate}T${scheduledTime}:00`).toISOString();
      const result = await store.scheduleInterviewFromTemplate(template.id, {
        scheduledTime: isoDate,
      });
      if (result) {
        toast.success("Interview scheduled successfully!");
        handleClose(false);
        onBooked?.();
      }
    } catch (error: any) {
      if (!handledAsQuotaRefusal(error)) {
        toast.error("Failed to schedule interview");
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="w-[95vw] max-w-md p-0 overflow-y-auto max-h-[90vh] gap-0"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* Template overview */}
        <div className="px-6 pt-6 pb-5 border-b border-border">
          <div className="flex items-center gap-2 mb-2">
            {template?.category && (
              <span className="text-[11px] text-muted-foreground font-medium">
                {template.category}
              </span>
            )}
            {template?.difficulty && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full">
                {difficultyBadge(template.difficulty)}
              </span>
            )}
          </div>
          <DialogTitle>
            <span className="text-base font-bold text-foreground leading-tight">
              {template?.name || `${template?.position} Interview`}
            </span>
          </DialogTitle>
          {template?.company && (
            <p className="text-sm text-muted-foreground mt-0.5">{template.company}</p>
          )}
          <div className="flex items-center gap-4 mt-3 text-[13px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {template?.duration} min
            </span>
            {template?.topics && template.topics.length > 0 && (
              <span className="flex items-center gap-1.5">
                <Layout className="w-3.5 h-3.5" />
                {template.topics.length} topics
              </span>
            )}
          </div>
          {template?.topics && template.topics.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {template.topics.slice(0, 5).map((t, i) => (
                <span
                  key={i}
                  className="text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full"
                >
                  {t}
                </span>
              ))}
              {template.topics.length > 5 && (
                <span className="text-[11px] text-muted-foreground">
                  +{template.topics.length - 5} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Mode + action */}
        <div className="px-6 py-5 space-y-5">
          {/* Interview type selector */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Interview type
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { key: "chat", icon: MessageSquare, label: "Text", available: true },
                  { key: "video", icon: Video, label: "Video", available: false },
                  { key: "audio", icon: Play, label: "Audio", available: false },
                ] as const
              ).map(({ key, icon: Icon, label, available }) => (
                <button
                  key={key}
                  type="button"
                  disabled={!available}
                  onClick={() => setSelectedMode(key)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-medium",
                    !available && "opacity-40 cursor-not-allowed",
                    available && selectedMode === key
                      ? "border-primary bg-primary/8 text-primary"
                      : available
                        ? "border-border hover:border-primary/40 text-muted-foreground hover:text-foreground"
                        : "border-border/50 text-muted-foreground",
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                  {!available && (
                    <span className="text-[9px] font-semibold bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full -mt-1">
                      Soon
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              When
            </p>

            {/* Start now */}
            <button
              type="button"
              onClick={() => {
                setShowScheduleForm(false);
                handleStartChatNow();
              }}
              disabled={creating || selectedMode !== "chat"}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed",
                !showScheduleForm && selectedMode === "chat"
                  ? "border-primary bg-primary/5 hover:bg-primary/10"
                  : "border-border bg-muted/20 hover:border-primary/40",
              )}
            >
              <div
                className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                  !showScheduleForm && selectedMode === "chat" ? "bg-primary/15" : "bg-muted",
                )}
              >
                <Play
                  className={cn(
                    "w-4 h-4",
                    !showScheduleForm && selectedMode === "chat"
                      ? "text-primary"
                      : "text-muted-foreground",
                  )}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Start Now</p>
                <p className="text-xs text-muted-foreground">Jump in immediately</p>
              </div>
              {creating ? (
                <Loader2
                  className={cn(
                    "w-4 h-4 animate-spin flex-shrink-0",
                    !showScheduleForm && selectedMode === "chat"
                      ? "text-primary"
                      : "text-muted-foreground",
                  )}
                />
              ) : (
                <ArrowRight
                  className={cn(
                    "w-4 h-4 flex-shrink-0",
                    !showScheduleForm && selectedMode === "chat"
                      ? "text-primary"
                      : "text-muted-foreground",
                  )}
                />
              )}
            </button>

            {/* Book for later */}
            {selectedMode === "chat" ? (
              <div
                className={cn(
                  "rounded-xl border-2 transition-all overflow-hidden",
                  showScheduleForm ? "border-primary bg-primary/5" : "border-border",
                )}
              >
                <button
                  type="button"
                  onClick={() => setShowScheduleForm((v) => !v)}
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-primary/5 transition-colors"
                >
                  <div
                    className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                      showScheduleForm ? "bg-primary/15" : "bg-muted",
                    )}
                  >
                    <CalendarClock
                      className={cn(
                        "w-4 h-4",
                        showScheduleForm ? "text-primary" : "text-muted-foreground",
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">Book for Later</p>
                    <p className="text-xs text-muted-foreground">
                      Pick a date and time that works for you
                    </p>
                  </div>
                  <ChevronRight
                    className={cn(
                      "w-4 h-4 flex-shrink-0 transition-transform",
                      showScheduleForm ? "text-primary rotate-90" : "text-muted-foreground",
                    )}
                  />
                </button>

                {showScheduleForm && (
                  <div className="px-4 pb-4 space-y-3 border-t border-border/50">
                    <div className="grid grid-cols-2 gap-3 pt-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="schedule-date" className="text-xs font-medium">
                          Date
                        </Label>
                        <Input
                          id="schedule-date"
                          type="date"
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                          min={new Date().toISOString().split("T")[0]}
                          className="h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="schedule-time" className="text-xs font-medium">
                          Time
                        </Label>
                        <Input
                          id="schedule-time"
                          type="time"
                          value={scheduledTime}
                          onChange={(e) => setScheduledTime(e.target.value)}
                          className="h-9 text-sm"
                        />
                      </div>
                    </div>
                    <Button
                      className="w-full h-9 text-sm"
                      onClick={handleSchedule}
                      disabled={creating || !scheduledDate || !scheduledTime}
                    >
                      {creating ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                          Scheduling…
                        </>
                      ) : (
                        <>
                          <Calendar className="w-3.5 h-3.5 mr-2" />
                          Schedule Interview
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-border/60 bg-muted/20 opacity-40 cursor-not-allowed select-none">
                <div className="flex items-center gap-4 p-4">
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <CalendarClock className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">Schedule for Later</p>
                    <p className="text-xs text-muted-foreground">Select Text mode to schedule</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 pb-5" />
      </DialogContent>
    </Dialog>
  );
}
