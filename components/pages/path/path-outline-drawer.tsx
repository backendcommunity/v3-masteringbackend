"use client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PathSession } from "@/lib/path-types";
import { PathOutline } from "./path-outline";
import { Award, Lock } from "lucide-react";

export function PathOutlineDrawer({
  open,
  onOpenChange,
  session,
  currentStepId,
  certEligible,
  onOpenCertificate,
  onSelectStep,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: PathSession;
  currentStepId?: string;
  /** Whether the certificate is unlocked (points-based mastery threshold met). */
  certEligible?: boolean;
  /** Opens the path-branded certificate landing (locked or unlocked). */
  onOpenCertificate?: () => void;
  onSelectStep: (id: string) => void;
}) {
  const unlocked = !!certEligible;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="flex w-[88vw] max-w-[360px] flex-col gap-0 bg-sidebar p-0 sm:w-[360px] sm:max-w-[360px]"
      >
        <SheetHeader className="border-b px-4 py-3 text-left">
          <SheetTitle className="text-gradient text-base font-bold tracking-tight">
            Path Outline
          </SheetTitle>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <PathOutline
            session={session}
            currentStepId={currentStepId}
            onSelectStep={onSelectStep}
          />

          {/* Certificate — always reachable (locked state is motivating). */}
          {onOpenCertificate && (
            <div className="px-4 pb-4 pt-1">
              <button
                type="button"
                onClick={onOpenCertificate}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left shadow-sm transition-colors ${
                  unlocked
                    ? "border-primary/40 bg-primary/5 hover:bg-primary/10"
                    : "bg-card text-muted-foreground hover:bg-muted/30"
                }`}
              >
                {unlocked ? (
                  <Award className="h-5 w-5 flex-shrink-0 text-primary" />
                ) : (
                  <Lock className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                )}
                <span className="flex-1">
                  <span
                    className={`block text-sm font-bold leading-snug ${
                      unlocked ? "text-primary" : "text-foreground"
                    }`}
                  >
                    Certificate
                  </span>
                  <span className="block text-[11px] text-muted-foreground">
                    {unlocked ? "Ready to claim" : "Locked"}
                  </span>
                </span>
              </button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
