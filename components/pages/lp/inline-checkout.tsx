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
import { useId, useState, type FormEvent } from "react";
import { useLpCheckout } from "@/hooks/use-lp-checkout";
import { analytics } from "@/lib/analytics";
import { LP_9999_EVENTS } from "@/lib/analytics-events";

export function InlineCheckout() {
  const { status, priceLabel, error, pay } = useLpCheckout();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const nameId = useId();
  const emailId = useId();

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    analytics.track(LP_9999_EVENTS.checkoutStarted, {});
    pay({ name: name.trim(), email: email.trim() });
  };

  if (status === "succeeded") {
    return (
      <div className="rounded bg-primary/10 p-6" role="status">
        <p className="mb-1.5 text-base font-bold">You&apos;re in.</p>
        <p className="text-sm text-muted-foreground">
          Check {email || "your email"} for your login details — they land
          the moment the payment clears.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded bg-card p-7">
      <div className="flex items-baseline justify-between gap-3 border-b border-border pb-4">
        <div className="text-[38px] font-bold leading-none tracking-tight">
          {status === "loading" ? (
            <span className="inline-block h-9 w-32 animate-pulse rounded bg-muted" />
          ) : (
            priceLabel
          )}
          <span className="ml-1.5 text-sm font-semibold text-muted-foreground">
            /month
          </span>
        </div>
        <div className="text-xs text-muted-foreground">Billed monthly</div>
      </div>

      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={nameId} className="text-xs font-bold text-foreground/80">
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
            className="rounded border border-input bg-background px-3.5 py-3.5 text-base outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={emailId} className="text-xs font-bold text-foreground/80">
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
            className="rounded border border-input bg-background px-3.5 py-3.5 text-base outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <button
          type="submit"
          disabled={status === "loading" || status === "processing"}
          className="mt-1 flex items-center justify-center gap-2.5 rounded-full bg-primary py-3.5 text-base font-bold text-[#05262F] shadow-[0_2px_6px_rgba(19,174,206,.3),0_12px_26px_-8px_rgba(19,174,206,.45)] transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "processing"
            ? "Opening secure checkout…"
            : `Pay ${priceLabel || "₦9,999"} and start learning`}
        </button>
      </form>

      {error ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">
          Payment is processed securely in a window over this page. Your
          card details never touch Masteringbackend.
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
        <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11.5px] text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-400">
          Methods to confirm
        </span>
      </div>
    </div>
  );
}
