"use client";

import { useEffect, useMemo, useRef } from "react";
import { sanitizeHtml } from "@/lib/sanitize";
import { marked } from "marked";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import type { RecapPayload, WelcomeBackPayload, RecapKeyPoint } from "@/lib/data";
import { recapShown, recapFeedback, recapCta, recapDismissed, welcomeBackShown } from "@/lib/journey-analytics";

marked.setOptions({ gfm: true, breaks: true });
const md = (raw: string) => sanitizeHtml(marked.parse(raw || "", { async: false }) as string);
const PROSE = "prose prose-invert max-w-none min-w-0 text-sm [&_pre]:bg-[#0d1019] [&_pre_code]:text-slate-200 [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:whitespace-pre-wrap [&_pre_code]:break-words";

function isItem(r: RecapPayload | WelcomeBackPayload): r is RecapPayload {
  return r.surface === "ITEM";
}
function pointsForTier(tier: string, pts: RecapKeyPoint[]): RecapKeyPoint[] {
  if (tier === "DAY") return [];
  if (tier === "WEEK") return pts.slice(0, 2);
  return pts;
}

export function ReturnRecapModal() {
  const { returnRecap, setReturnRecap, sendRecapFeedback } = useAppStore();
  const openedAt = useRef<number>(0);
  const open = !!returnRecap;

  useEffect(() => {
    if (!returnRecap) return;
    openedAt.current = Date.now();
    if (isItem(returnRecap)) {
      recapShown({ surface: "ITEM", tier: returnRecap.tier, itemType: returnRecap.itemType, source: returnRecap.recap.source });
    } else {
      welcomeBackShown({ tier: returnRecap.tier, itemCount: returnRecap.items.length });
    }
  }, [returnRecap]);

  const keyPoints = useMemo(
    () => (returnRecap && isItem(returnRecap) ? pointsForTier(returnRecap.tier, returnRecap.recap.keyPoints) : []),
    [returnRecap],
  );

  if (!returnRecap) return null;

  const close = (dismissed: boolean) => {
    if (dismissed && isItem(returnRecap)) {
      recapDismissed({ tier: returnRecap.tier, itemType: returnRecap.itemType, msOpen: Date.now() - openedAt.current });
    }
    setReturnRecap(null);
  };

  // Dashboard welcome-back variant
  if (!isItem(returnRecap)) {
    const wb = returnRecap;
    return (
      <Dialog open={open} onOpenChange={(o) => !o && close(true)}>
        <DialogContent className="max-w-lg bg-background p-0 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500" />
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">{wb.headline}</h2>
            <ul className="space-y-3">
              {wb.items.map((it) => (
                <li key={it.itemId} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{it.title}</p>
                    <p className="text-xs text-muted-foreground">{it.progressPct}% in · Up next: {it.nextStepTitle}</p>
                  </div>
                  <Button size="sm" onClick={() => { window.location.href = it.deeplink; }}>Resume →</Button>
                </li>
              ))}
            </ul>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Per-item recap variant
  const r = returnRecap;
  const onCta = () => { recapCta({ tier: r.tier, itemType: r.itemType }); setReturnRecap(null); };
  const onFeedback = (useful: boolean) => {
    recapFeedback({ useful, tier: r.tier, itemType: r.itemType });
    sendRecapFeedback(r.eventId, useful).catch(() => {});
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close(true)}>
      <DialogContent className="max-w-2xl bg-background p-0 overflow-hidden max-h-[85vh] overflow-y-auto">
        <div className="h-2 bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500" />
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Your recent learnings</h2>
            <span className="text-xs text-muted-foreground">Report an Issue</span>
          </div>

          <p className="text-sm">{r.awayText}</p>

          {r.tier !== "DAY" && (
            <>
              <p className="text-sm">{r.recap.intro}</p>
              <div className="space-y-3">
                {keyPoints.map((p, i) => (
                  <div key={i}>
                    <p className="font-semibold text-sm">{p.heading}</p>
                    <div className={PROSE} dangerouslySetInnerHTML={{ __html: md(p.body) }} />
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">{r.bridge}</p>
            </>
          )}

          <div className="rounded-lg border p-3">
            <p className="text-sm">Up next: <span className="font-semibold">{r.nextStep.title}</span> — {r.nextStep.goal}</p>
          </div>

          {r.stats.isStreakActive && r.stats.currentStreak > 0 && (
            <p className="text-sm">🔥 You&apos;re on a {r.stats.currentStreak}-day streak — nice.</p>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-muted-foreground flex items-center gap-3">
              <span>Was this helpful?</span>
              <button aria-label="helpful yes" onClick={() => onFeedback(true)} className="hover:text-foreground">✓</button>
              <button aria-label="helpful no" onClick={() => onFeedback(false)} className="hover:text-foreground">✗</button>
            </div>
            <Button onClick={onCta} autoFocus>Resume learning →</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
