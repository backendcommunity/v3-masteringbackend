"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppStore } from "@/lib/store";

interface DowngradeButtonProps {
  /** Subscription row id (not the processor's id). */
  subscriptionId: string;
  /** Plan being moved TO. */
  target: "pro" | "free";
  label: string;
  /** Plan being moved FROM, for the confirmation copy. */
  currentPlanName: string;
  /** When the current term ends, if known. */
  renewsOn?: string | null;
  onDone?: () => void;
  className?: string;
}

/**
 * Downgrade control shown on the pricing page.
 *
 * A downgrade takes money-affecting action, so it always confirms first and
 * always states WHEN it takes effect — the two things a buyer needs before
 * agreeing. Dropping to Free schedules the end of the paid term rather than
 * cutting access immediately, so the copy says so explicitly instead of
 * leaving the buyer to wonder whether they just lost what they paid for.
 */
export function DowngradeButton({
  subscriptionId,
  target,
  label,
  currentPlanName,
  renewsOn,
  onDone,
  className,
}: DowngradeButtonProps) {
  const store = useAppStore();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const toFree = target === "free";

  const handle = async () => {
    try {
      setLoading(true);
      const res = await store.downgradeSubscription(subscriptionId, target);
      if (res?.success === false) {
        toast.error(res?.message ?? "We couldn't change your plan.");
        return;
      }
      toast.success(res?.message ?? "Your plan has been updated.");
      setOpen(false);
      onDone?.();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ??
          error?.message ??
          "We couldn't change your plan.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        className={className}
        onClick={() => setOpen(true)}
      >
        {label}
      </Button>

      <Dialog open={open} onOpenChange={(o) => !loading && setOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {toFree
                ? `Cancel ${currentPlanName} and move to Free?`
                : `Move from ${currentPlanName} to Pro?`}
            </DialogTitle>
            <DialogDescription>
              {toFree ? (
                <>
                  You keep everything on {currentPlanName} until
                  {renewsOn ? ` ${renewsOn}` : " the end of your billing period"}
                  . After that you move to the Free plan. You will not be
                  charged again, and there is no refund for the current period.
                </>
              ) : (
                <>
                  Your plan changes to Pro now, at the Pro price from your next
                  billing date. You are not charged today and no refund is
                  issued for the current period. Enterprise features and extra
                  seats end when the plan changes.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Keep {currentPlanName}
            </Button>
            <Button onClick={handle} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : toFree ? (
                "Move to Free"
              ) : (
                "Move to Pro"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
