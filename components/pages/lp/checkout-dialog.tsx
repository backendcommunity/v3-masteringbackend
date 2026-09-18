"use client";

/**
 * The checkout as a dialog, opened by every CTA on the page. Name and
 * email, then the payment SDK opens its own secure window over this one.
 *
 * Controlled open/onOpenChange on purpose: the submit button must NOT be
 * wrapped in <DialogClose>, or the dialog would close the moment it is
 * clicked regardless of what the payment SDK does next (see
 * path-feedback-dialog.tsx for the same lesson). The dialog stays open
 * through "processing" so a buyer whose payment window was blocked or
 * errored still sees the message and the "Try again" link.
 */
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InlineCheckout } from "@/components/pages/lp/inline-checkout";
import type { UseLpCheckoutResult } from "@/hooks/use-lp-checkout";

export function CheckoutDialog({
  open,
  onOpenChange,
  checkout,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checkout: UseLpCheckoutResult;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Secure your spot</DialogTitle>
          <DialogDescription>
            Your name and email, then a secure naira payment window. No
            account to create first.
          </DialogDescription>
        </DialogHeader>
        <InlineCheckout checkout={checkout} variant="plain" />
      </DialogContent>
    </Dialog>
  );
}
