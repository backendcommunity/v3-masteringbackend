"use client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PathSession } from "@/lib/path-types";
import { PathRail } from "./path-rail";

export function PathOutlineDrawer({
  open,
  onOpenChange,
  session,
  currentStepId,
  onSelectStep,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: PathSession;
  currentStepId?: string;
  onSelectStep: (id: string) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="flex w-[360px] flex-col gap-0 bg-sidebar p-0 sm:max-w-[360px]"
      >
        <SheetHeader className="border-b px-4 py-3 text-left">
          <SheetTitle className="text-gradient text-base font-bold tracking-tight">
            Path Outline
          </SheetTitle>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 overflow-hidden [&>aside]:w-full [&>aside]:border-r-0">
          <PathRail
            session={session}
            currentStepId={currentStepId}
            onSelectStep={onSelectStep}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
