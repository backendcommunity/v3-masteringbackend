"use client";

/**
 * The whole "Pay here" block: price, name/email fields, Pay button, and
 * the success/error states. No account is created before payment — the
 * only fields are the two AsyncPay's SDK requires to open at all
 * (customer.email is validated synchronously; see payment-environment.ts).
 *
 * What happens AFTER a successful payment — turning it into a working
 * account — is a backend webhook concern (academy's
 * subscriptionSuccessful), tracked separately. This component's job ends
 * at "the SDK reported success"; it does not and cannot know whether
 * provisioning succeeded, because that happens async via webhook.
 */
import { useEffect, useId, useState, type FormEvent } from "react";
import type { LpPath, UseLpCheckoutResult } from "@/hooks/use-lp-checkout";
import { analytics } from "@/lib/analytics";
import { LP_9999_EVENTS } from "@/lib/analytics-events";

/** How each path is named on buttons and in the path toggle. */
export const LP_PATH_LABELS: Record<LpPath, string> = {
  backend: "Backend",
  "ai-engineering": "AI Engineering",
};

const PATHS = Object.keys(LP_PATH_LABELS) as LpPath[];

export function InlineCheckout({
  checkout,
  path,
  onPathChange,
  variant = "card",
}: {
  /**
   * The page owns the single useLpCheckout() call and passes it down, so
   * the price in the copy and the price the SDK charges come from one
   * response, and the dialog and the bottom-of-page form share one state.
   */
  checkout: UseLpCheckoutResult;
  /**
   * The path this buyer is starting. Owned by the page so a path CTA can
   * preselect it and the dialog and bottom form always agree. Both paths
   * are the same subscription; this only records the choice.
   */
  path: LpPath;
  onPathChange: (path: LpPath) => void;
  /** "card" draws its own surface; "plain" is for use inside a dialog. */
  variant?: "card" | "plain";
}) {
  const { status, priceLabel, error, pay, reset } = checkout;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const nameId = useId();
  const emailId = useId();

  // Fires the one actual conversion event for this funnel once the SDK has
  // reported success — kept here (not in the click handler) so it only
  // ever fires for a real "succeeded" transition, never for an optimistic
  // click.
  useEffect(() => {
    if (status === "succeeded") {
      analytics.track(LP_9999_EVENTS.subscribed, { path });
    }
    // Only the transition into "succeeded" counts; a path change after
    // success must not fire a second conversion.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    analytics.track(LP_9999_EVENTS.checkoutStarted, { path });
    pay({ name: name.trim(), email: email.trim(), path });
  };

  if (status === "succeeded") {
    return (
      <div className="rounded bg-primary/10 p-6" role="status">
        <p className="mb-1.5 text-base font-bold">You&apos;re in.</p>
        <p className="text-sm text-muted-foreground">
          Check {email || "your email"} for your login details. They land the
          moment the payment clears.
        </p>
      </div>
    );
  }

  return (
    <div className={variant === "card" ? "rounded bg-card p-7" : ""}>
      <div className="flex items-baseline justify-between gap-3 border-b border-border pb-4">
        <div className="text-[38px] font-bold leading-none tracking-tight">
          {status === "loading" ? (
            <span className="inline-block h-9 w-32 animate-pulse rounded bg-muted" />
          ) : (
            priceLabel
          )}
        </div>
        <div className="text-xs text-muted-foreground">Billed monthly</div>
      </div>

      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-4">
        <div
          role="group"
          aria-label="Your path"
          className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-muted p-1"
        >
          {PATHS.map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={path === p}
              onClick={() => onPathChange(p)}
              className={`rounded-md py-2.5 text-sm font-bold transition-colors duration-150 ${
                path === p
                  ? "bg-primary text-[#05262F] shadow-sm"
                  : "text-muted-foreground hover:bg-card hover:text-foreground"
              }`}
            >
              {LP_PATH_LABELS[p]}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={nameId}
            className="text-xs font-bold text-foreground/80"
          >
            Full name
          </label>
          <input
            id={nameId}
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Chinedu Okafor"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded border border-input bg-background px-3.5 py-3.5 text-base outline-none transition-shadow duration-150 focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={emailId}
            className="text-xs font-bold text-foreground/80"
          >
            Email address
          </label>
          <input
            id={emailId}
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded border border-input bg-background px-3.5 py-3.5 text-base outline-none transition-shadow duration-150 focus:ring-2 focus:ring-primary"
          />
        </div>

        <button
          type="submit"
          disabled={status === "loading" || status === "processing"}
          className="mt-1 flex items-center justify-center gap-2.5 rounded-full bg-primary py-3.5 text-base font-bold text-[#05262F] shadow-[0_2px_6px_rgba(19,174,206,.3),0_12px_26px_-8px_rgba(19,174,206,.45)] transition duration-200 hover:bg-primary/90 hover:shadow-[0_4px_10px_rgba(19,174,206,.36),0_20px_38px_-10px_rgba(19,174,206,.55)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
        >
          {status === "loading"
            ? "Loading…"
            : status === "processing"
              ? "Opening secure checkout…"
              : `Start ${LP_PATH_LABELS[path]} · Pay ${priceLabel}`}
        </button>
      </form>

      {error ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}{" "}
          <button
            type="button"
            onClick={reset}
            className="font-bold underline underline-offset-2 transition-opacity duration-150 hover:opacity-70"
          >
            Try again
          </button>
        </p>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">
          Payment is processed securely in a window over this page. Your card
          details never touch Masteringbackend.
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-1.5 border-t border-border pt-3.5">
        {["Verve", "Mastercard", "Visa", "Bank transfer"].map((m) => (
          <span
            key={m}
            className="rounded-full border border-border px-2.5 py-1 text-[11.5px] text-muted-foreground"
          >
            {m}
          </span>
        ))}
      </div>
    </div>
  );
}
