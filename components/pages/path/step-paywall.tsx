"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PaymentDialog } from "@/components/payment-dialog";
import { PathSession } from "@/lib/path-types";
import { Lock, Crown, Check } from "lucide-react";

interface StepPaywallProps {
  payment: PathSession["path"]["payment"];
  pathTitle: string;
  premiumStepCount: number;
  freeDoneCount: number;
  onUnlock: () => void;
}

export function StepPaywall({
  payment,
  pathTitle,
  premiumStepCount,
  freeDoneCount,
  onUnlock,
}: StepPaywallProps) {
  const [open, setOpen] = useState(false);

  const canRedeemMB = !!payment.amount && payment.amount > 0;

  const dialogData = {
    id: payment.id,
    type: payment.kind === "course" ? "course" : "roadmap",
    title: pathTitle,
    amount: payment.amount,
    paddle_price_id: payment.paddlePriceId,
    plan: "Pro",
  };

  return (
    <>
      {/* Full-area frosted scrim — frosts the whole stage so the gated step
          stays faintly visible behind glass (not a hard wall). The teaser body
          underneath supplies the shapes; this unifies it into one glass panel. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-20 bg-background/40 backdrop-blur-[2px]"
      />
      {/* Glass card — sits above the frosted body */}
      <div className="absolute inset-0 z-30 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm border border-primary/20 bg-card/80 shadow-2xl backdrop-blur-xl">
          <CardContent className="flex flex-col items-center gap-5 p-6 text-center">
            {/* Icon glyph: Lock + Crown stacked */}
            <div className="relative">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <Lock className="h-7 w-7 text-primary" aria-hidden="true" />
              </span>
              {/* Crown badge inset bottom-right */}
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-background shadow-md">
                <Crown
                  className="h-3.5 w-3.5"
                  style={{ color: "#F2C94C" }}
                  aria-hidden="true"
                />
              </span>
            </div>

            {/* Headline */}
            <div className="space-y-1.5">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                Unlock the full{" "}
                <span className="text-primary">{pathTitle}</span>
              </h2>
              <p className="text-sm text-muted-foreground">
                You&rsquo;ve reached a Pro-only step. Keep your momentum going.
              </p>
            </div>

            {/* Value bullets */}
            <ul className="w-full space-y-2 text-left" role="list">
              <li className="flex items-center gap-2.5 text-sm text-foreground">
                <Check
                  className="h-4 w-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <span>
                  {premiumStepCount} premium step
                  {premiumStepCount !== 1 ? "s" : ""} unlocked instantly
                </span>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-foreground">
                <Check
                  className="h-4 w-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <span>Verified certificate on completion</span>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-foreground">
                <Check
                  className="h-4 w-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <span>Hands-on projects &amp; exercises included</span>
              </li>
            </ul>

            {/* CTA buttons */}
            <div className="flex w-full flex-col gap-2">
              <Button
                className="w-full font-semibold"
                onClick={() => setOpen(true)}
                aria-label={`Go Pro to unlock ${pathTitle}`}
              >
                <Crown
                  className="mr-2 h-4 w-4"
                  style={{ color: "#F2C94C" }}
                  aria-hidden="true"
                />
                Go Pro
              </Button>
              {canRedeemMB && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setOpen(true)}
                  aria-label={`Redeem MB to unlock ${pathTitle}`}
                >
                  Redeem with MB
                </Button>
              )}
            </div>

            {/* Reassurance micro-copy — only when there's real progress */}
            {freeDoneCount > 0 && (
              <p className="text-xs text-muted-foreground">
                You&rsquo;ve completed {freeDoneCount} free step
                {freeDoneCount !== 1 ? "s" : ""} — don&rsquo;t stop now.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <PaymentDialog
        data={dialogData}
        open={open}
        disableOnetime={true}
        disableMB={!canRedeemMB}
        onHandlePreview={() => {}}
        onClose={() => setOpen(false)}
        onHandlePurchase={(_id, _type, success) => {
          setOpen(false);
          if (success) onUnlock();
        }}
      />
    </>
  );
}
