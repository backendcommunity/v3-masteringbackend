"use client";

import { useEffect, useState } from "react";
import { Library, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Loader } from "@/components/ui/loader";
import { PathSessionStep } from "@/lib/path-types";
import { useAppStore } from "@/lib/store";

interface Res {
  title?: string;
  name?: string;
  url: string;
}

export function PathResourceSheet({ step }: { step?: PathSessionStep }) {
  const store = useAppStore();
  const [open, setOpen] = useState(false);
  const [resources, setResources] = useState<Res[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!open || !step) return;
    let active = true;
    setLoaded(false);
    (async () => {
      try {
        const item = await store.getPathItem(step.payloadRef.endpoint);
        if (active) setResources(item?.resources ?? []);
      } catch {
        if (active) setResources([]);
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
          <Library className="w-4 h-4" />
          <span className="sr-only">Resources</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[340px] sm:w-[340px] p-0 flex flex-col"
      >
        <SheetHeader className="px-4 py-3 border-b border-border">
          <SheetTitle className="text-sm">Resources</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4">
          {!loaded ? (
            <Loader isFull={false} />
          ) : resources.length ? (
            <ul className="space-y-2">
              {resources.map((r, i) => (
                <li key={`${r.url}-${i}`}>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-[13px] text-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                    <span className="truncate">{r.title ?? r.name ?? r.url}</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              No links or resources for this lesson yet.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
