"use client";

import { useState } from "react";
import { PaymentGateOverlay } from "@/components/payment-gate-overlay";
import { PathSession } from "@/lib/path-types";
import { usePricing } from "@/hooks/use-pricing";
import { routes } from "@/lib/routes";

interface StepPaywallProps {
  payment: PathSession["path"]["payment"];
  pathTitle: string;
  /** Where the sheet's single exit sends the learner. */
  pathSlug?: string;
  /**
   * The workspace is shared between paths and courses, so the exit cannot be
   * hardcoded: a learner inside a course was being offered "Back to path" and
   * sent to /paths/<slug>, which is the wrong noun AND the wrong page.
   */
  entityKind?: "path" | "course";
  onUnlock: () => void;
}

/**
 * The path step paywall IS the bottom sheet.
 *
 * This component renders <PaymentGateOverlay variant="sheet"> as its entire
 * output, open from the first frame. There is deliberately NO card, scrim or
 * button in front of it: it only ever mounts on a step the learner cannot
 * open, so the gate is unavoidable by definition, and anything whose only job
 * is to reveal the real gate is a second paywall stacked on the first. It had
 * one — a frosted scrim plus a glass "Unlock the full {path}" card — and both
 * are gone. Do not reintroduce them.
 *
 * What this component still owns, and why it is not a pass-through: the
 * path-specific wiring. The pricing fetch, the `purchasable` shape built from
 * the path's payment row, MB-rail eligibility, the exit destination derived
 * from `pathSlug`, and the purchase → `onUnlock` handoff all live here.
 *
 * What it must NOT own is the sheet's markup. That stays in
 * components/payment-gate-overlay.tsx as the single implementation shared by
 * every in-lesson surface — four hand-copied paywalls would diverge inside a
 * week.
 *
 * What shows above the sheet is the workspace exactly as the learner left it —
 * the lesson they were already on, still mounted and still real. PathWorkspace
 * never routes into a gated step; it holds position and raises this instead. So
 * nothing premium is rendered behind the wall, and the scrim has to block
 * interaction precisely because that page is live rather than a placeholder.
 */
export function StepPaywall({
  payment,
  pathTitle,
  pathSlug,
  entityKind = "path",
  onUnlock,
}: StepPaywallProps) {
  // Open from the first render. The state exists only so a completed purchase
  // can take the sheet down before onUnlock() refetches the session.
  const [open, setOpen] = useState(true);
  // This is the highest-intent surface in the product — a learner who is
  // already invested hits this wall. `pricing` is null while the client-side
  // fetch is in flight (see hooks/use-pricing.ts); the sheet renders WITHOUT
  // a price in that state rather than flash a wrong one.
  const pricing = usePricing();


  const purchasable = {
    id: payment.id,
    type: payment.kind === "course" ? "course" : "roadmap",
    title: pathTitle,
    amount: payment.amount,
    paddle_price_id: payment.paddlePriceId,
    plan: "Pro",
  };

  return (
    <PaymentGateOverlay
      open={open}
      onClose={() => setOpen(false)}
      itemTitle={pathTitle}
      stage="learn"
      variant="sheet"
      exitLabel={entityKind === "course" ? "Back to course" : "Back to path"}
      exitHref={
        pathSlug
          ? entityKind === "course"
            ? routes.courseDetail(pathSlug)
            : routes.pathDetail(pathSlug)
          : routes.dashboard
      }
      pricing={pricing ?? undefined}
      purchasable={purchasable}
      allowOneTime={false}
      onPurchased={(_id, _method, success) => {
        // Only a SUCCESSFUL purchase takes the wall down. Closing on failure
        // would strand the learner on a locked step with nothing to act on.
        if (!success) return;
        setOpen(false);
        onUnlock();
      }}
    />
  );
}
