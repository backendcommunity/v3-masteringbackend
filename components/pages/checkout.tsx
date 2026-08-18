"use client";

import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { routes } from "@/lib/routes";
import { useAppStore } from "@/lib/store";
import countries from "@/lib/countries.json";
import { dataStore, Plan } from "@/lib/data";
import { initializePaddle, Paddle } from "@paddle/paddle-js";
import { useUser } from "@/hooks/use-user";
import ConfettiCelebration from "../confetti-celebration";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { formatDate } from "@/lib/utils";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { formatPrice } from "@/lib/pricing";
import type { CheckoutPricing } from "@/lib/pricing";

interface CheckoutPageProps {
  // Resolved server-side (see app/checkout/page.tsx) from the visitor's
  // region. The buyer never chooses a processor — it's implied by `provider`
  // and only ever used to pick which SDK call to make, never rendered.
  pricing: CheckoutPricing;
}

export function CheckoutPage({ pricing }: CheckoutPageProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const store = useAppStore();
  const user = useUser();
  const fmt = (date?: string | Date | null): string =>
    formatDate(String(date ?? ""), user?.settings?.dateFormat);
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [plan, setPlan] = useState<Plan>();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const paddleRef = useRef<HTMLInputElement>(null);
  const [celebration, setCelebration] = useState(false);
  const [paddle, setPaddle] = useState<Paddle>();

  // Extract checkout type and ID from the URL
  const checkoutId = searchParams?.get("plan") ?? "pro";
  const cycle = searchParams?.get("cycle") ?? "monthly";

  const PADDLE_TOKEN = process.env.NEXT_PUBLIC_PADDLE_TOKEN as string;
  const NODE_ENV = process.env.NEXT_PUBLIC_NODE_ENV;
  const PADDLE_ENVIRONMENT = ["dev", "staging"].includes(NODE_ENV!)
    ? "sandbox"
    : "production";

  const subscription = user?.subscription;
  const plans = dataStore.plans;

  // Both intervals are valid for every tier (NG annual ships too) — no
  // tier-conditional branch here.
  const priceId =
    cycle === "annual" ? pricing.annualPriceId : pricing.monthlyPriceId;
  const amount = cycle === "annual" ? pricing.annual : pricing.monthly;
  const countryName = countries.find((c) => c.code === pricing.country)?.name;

  useEffect(() => {
    let cancelled = false;

    async function load(name: string) {
      setLoading(true);
      const plan = await store.getPlan(name);
      if (!cancelled) {
        setPlan(plan);
        setLoading(false);
      }
    }
    load(checkoutId!);

    return () => {
      cancelled = true;
    };
  }, [checkoutId, store]);

  // Paddle renders an INLINE frame — safe to auto-open on mount, same as
  // today. AsyncPay opens a popup, and browsers block `window.open` calls
  // that aren't tied directly to a user gesture, so it must NOT be
  // auto-invoked — only the Subscribe button's onClick may call it (see
  // handleSubscribeClick below).
  const openPaddleCheckout = useCallback(() => {
    if (!priceId || !paddleRef.current) return;
    paddle?.Checkout?.open({
      settings: { displayMode: "inline" },
      items: [{ priceId }],
      customer: {
        email: user?.email!,
        address: {
          // Comes from the SAME country resolution that produced the price
          // on screen. Without this, Paddle geo-detects independently and
          // can bill a different tier than we just quoted.
          countryCode: pricing.country || "US",
        },
      },
    });
  }, [priceId, paddle, user, pricing.country]);

  const openAsyncpayCheckout = useCallback(() => {
    if (!priceId) return;
    import("@asyncpay/checkout").then(({ AsyncpayCheckout }) => {
      AsyncpayCheckout({
        publicKey: process.env.NEXT_PUBLIC_ASYNCPAY_KEY,
        customer: {
          firstName: user?.name?.split(" ")?.[0],
          lastName: user?.name?.split(" ")?.[1],
          email: user?.email,
        },
        subscriptionPlanUUID: priceId,
        onSuccess: () => {
          setIsProcessing(false);
          setCelebration(true);
          toast.success("You're on Pro. Welcome in.");
        },
        onClose: () => setIsProcessing(false),
      });
    });
  }, [priceId, user]);

  // Routes the Subscribe click to the correct processor SDK based on the
  // region-resolved provider. The buyer never chooses this — it's decided
  // upstream — but for AsyncPay, this click IS the user gesture the popup
  // needs to avoid being blocked.
  const handleSubscribeClick = useCallback(() => {
    if (!priceId) return;
    setIsProcessing(true);
    if (pricing.provider === "ASYNCPAY") {
      openAsyncpayCheckout();
    } else {
      openPaddleCheckout();
    }
  }, [priceId, pricing.provider, openAsyncpayCheckout, openPaddleCheckout]);

  useEffect(() => {
    if (pricing.provider === "ASYNCPAY") return;
    openPaddleCheckout();
  }, [openPaddleCheckout, pricing.provider]);

  initializePaddle({
    token: PADDLE_TOKEN,
    checkout: {
      settings: {
        displayMode: "inline",
        frameTarget: "checkout-frame",
        frameInitialHeight: 450,
        variant: "one-page",
        frameStyle:
          "width: 100%; min-width: 312px; background-color: transparent; border: none;",
        allowedPaymentMethods: [
          "alipay",
          "apple_pay",
          "bancontact",
          "card",
          "google_pay",
          "ideal",
          "paypal",
        ],
      },
    },
    eventCallback: function (data: any) {
      switch (data.name) {
        case "checkout.loaded":
          setIsProcessing(true);
          break;
        case "checkout.closed":
          setIsProcessing(false);
          break;
        case "checkout.completed":
          // Track payment (GA or Google)
          setIsProcessing(false);
          setCelebration(true);
          toast.success(
            "You have successfully subscribe to " + checkoutId + " plan",
          );
          break;
      }
    },
    environment: PADDLE_ENVIRONMENT,
  })
    .then((paddleInstance: Paddle | undefined) => {
      if (paddleInstance) {
        setPaddle(paddleInstance);
      }
    })
    .catch((e) => console.error(e));

  const handleCancelSubscription = () => {
    setCancelDialogOpen(false);
    // In a real app, this would make an API call to cancel the subscription
  };

  const activePlan = plans.find((p) =>
    p.name.includes(
      subscription?.name! ?? subscription?.plan?.name! ?? subscription?.plan,
    ),
  );

  const handleBack = () => {
    router.push(routes.subscriptionPlans);
  };

  if (checkoutId?.includes("free")) {
    return (
      <div className="container max-w-4xl py-12">
        <Card>
          <CardHeader>
            <CardTitle>Cancel Your Subscription?</CardTitle>
            <CardDescription>
              Are you sure you want to cancel your subscription? You'll lose
              access to all premium features when your current billing period
              ends on {fmt(subscription?.expiry)}.
            </CardDescription>
          </CardHeader>
          <CardFooter className="gap-4">
            <Button onClick={() => router.push(routes.dashboard)}>
              Return to Dashboard
            </Button>

            <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">Cancel Subscription</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cancel Your Subscription?</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to cancel your {subscription?.name}{" "}
                    subscription? You'll lose access to all premium features
                    when your current billing period ends on{" "}
                    {fmt(subscription?.expiry)}.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Warning</AlertTitle>
                    <AlertDescription>
                      Cancelling will remove access to premium courses,
                      bootcamps, and features when your current billing period
                      ends.
                    </AlertDescription>
                  </Alert>
                  <div className="space-y-2">
                    <h4 className="font-medium">You'll lose access to:</h4>
                    <ul className="space-y-2 text-sm mt-3">
                      {activePlan?.features
                        ?.filter((f) => f?.included)
                        ?.map((f) => (
                          <li className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-destructive" />
                            <span>{f?.name}</span>
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setCancelDialogOpen(false)}
                  >
                    Keep Subscription
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleCancelSubscription}
                  >
                    Confirm Cancellation
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardFooter>
        </Card>
      </div>
    );
  }
  if (loading) return <PageSkeleton />;

  return (
    <div className="container ">
      <Button variant="ghost" size="sm" className="mb-8" onClick={handleBack}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="gap-4 flex flex-col">
          {/* Order Summary */}
          <Card className="md:col-span-1 h-fit">
            <CardHeader className="pb-4">
              <CardTitle>Order Summary</CardTitle>
              <CardDescription>Review your order details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <h3 className="font-medium">{plan?.name} Subscription</h3>
                <p className="text-sm text-muted-foreground">
                  {`${
                    cycle === "monthly" ? "Monthly" : "Yearly"
                  } subscription to MasteringBackend ${plan?.name}`}
                </p>
              </div>

              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Billing in {pricing.currency}
                {countryName ? ` for ${countryName}` : ""}
              </p>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatPrice(amount, pricing.currency)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground text-sm">
                  <span>Tax</span>
                  <span>{formatPrice(0, pricing.currency)}</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>{formatPrice(amount, pricing.currency)}</span>
              </div>

              <div className="text-sm text-muted-foreground pt-2">
                <p>
                  You will be charged{" "}
                  <span>{formatPrice(amount, pricing.currency)}</span> every{" "}
                  {cycle === "monthly" ? "month" : "year"}.
                </p>
              </div>

              <Button
                className="w-full"
                disabled={isProcessing || !priceId}
                onClick={handleSubscribeClick}
              >
                {priceId ? "Subscribe" : "Loading..."}
              </Button>
            </CardContent>
          </Card>
        </div>
        {/* Payment Form */}
        <Card className="md:col-span-2 ">
          <CardHeader>
            <CardTitle>Complete your subscription</CardTitle>
            <CardDescription>
              Fill out your details and complete your subscription.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-4">
            <div
              ref={paddleRef}
              className="space-y-5 checkout-frame w-full"
              id="checkout-frame"
            />
          </CardContent>
        </Card>
      </div>

      {/* Terms and Conditions */}
      <div className="mt-10 text-center text-sm text-muted-foreground">
        <p>
          By completing this purchase, you agree to our{" "}
          <a
            href="https://masteringbackend.com/terms-and-conditions"
            className="h-auto p-0 text-primary"
          >
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            href="https://masteringbackend.com/privacy-policy"
            className="h-auto p-0 text-primary"
          >
            Privacy Policy
          </a>
          .
        </p>
      </div>

      <ConfettiCelebration
        onComplete={() => setCelebration(false)}
        isVisible={celebration}
        celebrationType="achievement"
        courseName={plan?.name! + " Subscription"}
      />
    </div>
  );
}
