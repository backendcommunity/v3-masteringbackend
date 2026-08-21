"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/lib/store";
import { formatPrice } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import type { TeamSeatPreview } from "@/lib/data";
import { Loader2 } from "lucide-react";

interface InviteDialogProps {
  teamId: string;
  /** Live seat headroom from the roster's `usage.available` (OWNER/ADMIN
   * only see this figure — this dialog is never rendered for a plain
   * MEMBER, since only an OWNER/ADMIN can open it in the first place). */
  seatsAvailable: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after a successful invite so the parent can refetch the roster. */
  onInvited: () => void;
  /** Optional trigger element. Omit when the parent drives `open` itself
   * (e.g. from its own "Invite member" button) without a built-in trigger. */
  trigger?: React.ReactNode;
}

// No dedicated /contact route exists in lib/routes.ts and no support page
// under app/ — same reasoning as CHECKOUT_SUPPORT_HREF in checkout.tsx and
// SALES_CONTACT_HREF in pricing.tsx: mail the address the site already
// publishes as its own rather than invent a route that would 404.
const SEATS_CONTACT_HREF = `mailto:hi@masteringbackend.com?subject=${encodeURIComponent(
  "Team seats — request more",
)}`;

/**
 * Convert a processor "minor units" amount (Paddle's `immediateChargeMinor`)
 * to the major-unit amount `formatPrice` expects, using the CORRECT exponent
 * for the given currency instead of assuming every currency has 2 decimal
 * places. Dividing by a fixed 100 is wrong for a real fraction of the
 * currencies Paddle's localization can return: JPY/KRW are zero-decimal
 * (100 minor units === 100 whole yen, not 1.00) and BHD/KWD are
 * three-decimal (1000 minor units === 1.000 dinar, not 10.00) — a fixed /100
 * would misprice those by 100x and 10x respectively. This is exactly the
 * reason `formatPrice`'s `currency` param was widened off "NGN" | "USD": we
 * cannot predict which currency a preview comes back in, so we cannot
 * hardcode how it's scaled either.
 *
 * Falls back to 2 (today's only observed cases: NGN/USD/INR) if Intl can't
 * resolve the currency — same fail-sane posture as formatPrice's own
 * try/catch, and for every currency currently in play this resolves to 2,
 * so behaviour is unchanged today.
 */
function minorToMajor(minorAmount: number, currency: string): number {
  let exponent = 2;
  try {
    // TS types `maximumFractionDigits` as `number | undefined` because the
    // same resolvedOptions() shape is shared across Intl.NumberFormat
    // styles that don't carry a fraction-digit count — for `style:
    // "currency"` specifically it is always defined at runtime, but the
    // `?? 2` keeps this honest against the type rather than asserting it away.
    const resolved = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).resolvedOptions().maximumFractionDigits;
    exponent = resolved ?? 2;
  } catch {
    // keep the fallback
  }
  return minorAmount / Math.pow(10, exponent);
}

type PreviewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; preview: TeamSeatPreview }
  // The processor has no seat-purchase concept for this team (AsyncPay) —
  // the only case previewSeatAddition answers with a 400.
  | { status: "unavailable" };

/**
 * Invite a teammate. When a seat is already available, this invites
 * directly — no purchase involved. When the team is at capacity, it first
 * fetches a live preview from `/seats/preview` and requires an explicit
 * confirm click before sending `buySeat: true`; a team whose processor
 * can't self-serve a seat purchase (AsyncPay) gets "Request more seats"
 * instead of a priced confirmation.
 *
 * The preview is ALWAYS fetched fresh from the server rather than computed
 * locally — `seatsAvailable` is a snapshot from whenever the roster last
 * loaded, and the currency/amount the buyer would actually be charged can
 * only come from Paddle's own response (currency localization means a
 * USD-priced plan can preview in INR or another currency entirely).
 */
export function InviteDialog({
  teamId,
  seatsAvailable,
  open,
  onOpenChange,
  onInvited,
  trigger,
}: InviteDialogProps) {
  const store = useAppStore();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const atCapacity = seatsAvailable <= 0;
  const [preview, setPreview] = useState<PreviewState>({ status: "idle" });

  useEffect(() => {
    if (!open) return;
    if (!atCapacity) {
      setPreview({ status: "idle" });
      return;
    }
    let cancelled = false;
    setPreview({ status: "loading" });
    store
      .previewSeat(teamId)
      .then((data) => {
        if (!cancelled) setPreview({ status: "ready", preview: data });
      })
      .catch((err: any) => {
        if (cancelled) return;
        // This 400 IS the "team can't self-serve a seat purchase" signal —
        // deliberately, not a fallback guess. No team payload anywhere in
        // this API (GET /teams/mine, GET /teams/:id/members) exposes the
        // payment channel to the frontend; it's read only server-side. And
        // academy's previewSeatAddition (src/modules/teams/controller.ts)
        // checks `paymentChannel?.channel === "ASYNCPAY"` FIRST, before it
        // even computes seat availability, and throws exactly this 400
        // unconditionally for that case ("Seats for this team are managed by
        // our team..."). Since AsyncPay has no quantity concept at the
        // processor at all, a 400 from THIS endpoint has no other cause —
        // so it's a safe, provably-correct proxy for "can't buy seats here",
        // not a workaround standing in for a missing field. Do not replace
        // this with a `canBuySeats` prop unless the API grows a real field
        // for it — a prop would just duplicate this same server truth and
        // could drift from it.
        if (err?.response?.status === 400) {
          setPreview({ status: "unavailable" });
        } else {
          setPreview({ status: "idle" });
          toast.error(
            err?.response?.data?.message ??
              "Couldn't check seat availability. Please try again.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, atCapacity, teamId]);

  const reset = () => {
    setEmail("");
    setSending(false);
    setPreview({ status: "idle" });
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || sending) return;
    if (atCapacity && (preview.status !== "ready" || previewErrored)) return;

    setSending(true);
    try {
      await store.inviteMember(teamId, {
        email: trimmed,
        ...(atCapacity ? { buySeat: true } : {}),
      });
      toast.success(`Invited ${trimmed}`);
      onInvited();
      handleOpenChange(false);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ??
          "Couldn't send that invite. Please try again.",
      );
    } finally {
      setSending(false);
    }
  };

  const readyPreview = preview.status === "ready" ? preview.preview : null;
  // A NONZERO charge with no currency can never be safely priced — that
  // combination must read as an error, never as "free". Only a charge that
  // is genuinely <= 0 is the free-to-fill case (a previously funded seat
  // just opened up). Getting this backwards is fail-unsafe in the wrong
  // direction on a money path: it would tell an owner "this won't charge
  // you" for a seat that in fact will.
  const previewErrored =
    !!readyPreview &&
    readyPreview.immediateChargeMinor > 0 &&
    !readyPreview.currency;
  const isFreeSeat =
    !!readyPreview && !previewErrored && readyPreview.immediateChargeMinor <= 0;
  const priceLabel =
    readyPreview && !isFreeSeat && !previewErrored && readyPreview.currency
      ? formatPrice(
          minorToMajor(readyPreview.immediateChargeMinor, readyPreview.currency),
          readyPreview.currency,
        )
      : null;

  const canSubmit =
    !!email.trim() &&
    !sending &&
    (!atCapacity || (preview.status === "ready" && !previewErrored));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Invite a team member</DialogTitle>
          <DialogDescription>
            They&apos;ll get an email with a link to join and start using
            their seat.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="invite-email">Email address</Label>
            <Input
              id="invite-email"
              type="email"
              autoComplete="email"
              placeholder="teammate@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={sending || preview.status === "unavailable"}
              required
            />
          </div>

          {atCapacity && preview.status === "loading" && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              Checking seat availability…
            </p>
          )}

          {atCapacity && preview.status === "unavailable" && (
            <div
              role="status"
              className="rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground"
            >
              <p>
                All seats on this team are in use, and seats for this plan
                are managed by our team rather than bought self-serve.
              </p>
              <Button variant="outline" size="sm" className="mt-2" asChild>
                <a href={SEATS_CONTACT_HREF}>Request more seats</a>
              </Button>
            </div>
          )}

          {atCapacity && readyPreview && (
            <div
              role={previewErrored ? "alert" : "status"}
              className={cn(
                "rounded-md border p-3 text-sm",
                previewErrored
                  ? "border-destructive/50 bg-destructive/10 text-destructive"
                  : "border-border bg-muted/40",
              )}
            >
              {previewErrored ? (
                // A nonzero charge with no currency to render it in — never
                // shown as free, never shown with a blank/undefined price.
                // Submission is blocked (see canSubmit) until a real preview
                // comes back; reopening the dialog retries the fetch.
                <p>
                  We couldn&apos;t confirm what this seat would cost. Close
                  and reopen this dialog to try again before inviting.
                </p>
              ) : isFreeSeat ? (
                <p>
                  A previously paid seat just opened up — inviting this
                  person won&apos;t charge you anything today.
                </p>
              ) : (
                <>
                  <p>
                    All seats are in use. Adding this teammate charges{" "}
                    <span className="font-semibold text-foreground">
                      {priceLabel}
                    </span>{" "}
                    today for an extra seat.
                  </p>
                  {readyPreview.nextBilledAt && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Next billed{" "}
                      {new Date(readyPreview.nextBilledAt).toLocaleDateString()}.
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={sending}
            >
              Cancel
            </Button>
            {preview.status !== "unavailable" && (
              <Button type="submit" disabled={!canSubmit} className="btn-primary">
                {sending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                )}
                {atCapacity ? "Confirm & invite" : "Send invite"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
