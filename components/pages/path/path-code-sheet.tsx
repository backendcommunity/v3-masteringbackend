"use client";

import { useEffect, useState } from "react";
import { Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SimpleEditor } from "@/components/pages/SimpleEditor";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { PathSessionStep } from "@/lib/path-types";
import { useAppStore } from "@/lib/store";

export function PathCodeSheet({ step }: { step?: PathSessionStep }) {
  const store = useAppStore();
  const [open, setOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [playground, setPlayground] = useState<any>(undefined);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!open) return;
    // No step (standalone) → scratch editor with the default snippet.
    if (!step) {
      setPlayground(undefined);
      setLoaded(true);
      return;
    }
    let active = true;
    setLoaded(false);
    (async () => {
      try {
        const item = await store.getPathItem(step.payloadRef.endpoint);
        if (active) setPlayground(item?.playground);
      } catch {
        if (active) setPlayground(undefined);
      } finally {
        if (active) setLoaded(true);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, step?.id]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="w-8 h-8">
          <Code2 className="w-4 h-4" />
          <span className="sr-only">Code editor</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[680px] p-0 flex flex-col"
      >
        <SheetHeader className="px-4 py-3 border-b border-border">
          <SheetTitle className="text-sm">Code Editor</SheetTitle>
        </SheetHeader>
        <div className="flex-1 min-h-0 overflow-auto p-3">
          {loaded ? (
            <SimpleEditor playground={playground} />
          ) : (
            <PageSkeleton rows={2} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
