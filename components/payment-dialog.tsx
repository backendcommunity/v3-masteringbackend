import { CreditCard, Crown, Gift, Zap } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { useUser } from "@/hooks/use-user";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { initializePaddle, Paddle } from "@paddle/paddle-js";
import { useTheme } from "next-themes";
import countries from "@/lib/countries.json";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";
import { analytics } from "@/lib/analytics";
import Link from "next/link";
import { Plan } from "@/lib/data";
import { routes } from "@/lib/routes";
import { usePricing } from "@/hooks/use-pricing";
import { type PublicPricing } from "@/lib/pricing";
import { formatSubscriptionCardPrice } from "@/lib/pro-cta";

interface PaymentDialogProps {
  data: any;
  // Region-resolved Pro price for the subscription card below. Optional
  // because most callers don't have one already fetched — when omitted,
  // this dialog fetches its own copy (see the usePricing call below), so
  // every "Upgrade to Pro" surface stays region-aware regardless of caller.
  // Pass it through when a parent (e.g. StepPaywall) already has it, so the
  // gate CTA and this dialog never show two different numbers.
  pricing?: PublicPricing;
  disableMB?: boolean;
  disableOnetime?: boolean;
  disableSubscription?: boolean;
  onHandlePreview: (id?: string) => void;
  onHandlePurchase: (id: string, type: string, success: boolean) => void;
  onClose: () => void;
  open: boolean;
}

const SELLER_ID = Number(process.env.NEXT_PUBLIC_SELLER_ID);
const PADDLE_TOKEN = process.env.NEXT_PUBLIC_PADDLE_TOKEN as string;
const NODE_ENV = process.env.NEXT_PUBLIC_NODE_ENV;

const PADDLE_ENVIRONMENT = ["dev", "staging"].includes(NODE_ENV!)
  ? "sandbox"
  : "production";

export function PaymentDialog({
  data,
  pricing,
  open,
  disableMB,
  disableOnetime,
  disableSubscription,
  onHandlePreview,
  onHandlePurchase,
  onClose,
}: PaymentDialogProps) {
  const user = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const store = useAppStore();
  const { theme } = useTheme();
  const [paddle, setPaddle] = useState<Paddle>();
  const [plan, setPlan] = useState<Plan>();
  // Only fetch our own copy when the caller didn't already hand us one and
  // the subscription card (the only thing here that shows this price) is
  // actually going to render.
  const ownPricing = usePricing(!pricing && !disableSubscription);
  const resolvedPricing = pricing ?? ownPricing;

  useEffect(() => {
    initializePaddle({
      token: PADDLE_TOKEN,
      // seller: SELLER_ID,
      eventCallback: function (data: any) {
        switch (data.name) {
          case "checkout.loaded":
            onClose();
            break;
          case "checkout.closed":
            break;
          case "checkout.completed":
            const c_data = data?.custom_data;
            analytics.track("payment_completed", {
              contentId: c_data?.id,
              contentType: c_data?.type,
              method: c_data?.method,
            });
            onHandlePurchase(c_data.id, c_data.method, true);
            break;
        }
      },
      environment: PADDLE_ENVIRONMENT,
    }).then((paddleInstance: Paddle | undefined) => {
      if (paddleInstance) {
        setPaddle(paddleInstance);
      }
    });
  }, []);

  useEffect(() => {
    if (open) {
      analytics.track("payment_dialog_opened", {
        contentId: data?.id,
        contentType: data?.type,
        contentTitle: data?.title,
        plan: data?.plan ?? "Pro",
      });
    }
  }, [open]);

  useEffect(() => {
    const load = async () => {
      const plan = await store.getPlan(data?.plan ?? "Pro");
      setPlan(plan);
    };
    load();
  }, [data?.plan]);

  // Callback to open a checkout
  const openCheckout = (priceId: string, customData: any) => {
    if (!priceId) {
      toast.error("Price ID is not available. Please refresh and try again.");
      return;
    }

    analytics.track("checkout_initiated", {
      contentId: data?.id,
      contentType: data?.type,
      contentTitle: data?.title,
      priceId,
      ...customData,
    });

    if (!user?.email) {
      toast.error("Email is required to complete the purchase.");
      return;
    }

    // Find country code more robustly
    const countryCode =
      countries.find(
        (c) =>
          c.name.toLowerCase() === user?.country?.toLowerCase() ||
          c.code.toLowerCase() === user?.country?.toLowerCase(),
      )?.code ||
      user?.country ||
      "";

    paddle?.Checkout.open({
      settings: {
        allowedPaymentMethods: [
          "alipay",
          "apple_pay",
          "bancontact",
          "card",
          "google_pay",
          "ideal",
          "paypal",
        ],
        theme: theme?.includes("dark") ? "dark" : "light",
      },
      items: [{ priceId }],
      customData,
      customer: {
        email: user?.email,
        address: {
          countryCode,
        },
      },
    });
  };

  const getXPCost = (amount: number) => {
    return Math.round(amount * 100); // 1 dollar = 100 MB
  };

  const xpCost = getXPCost(data?.amount);

  const handleMBPayment = async () => {
    try {
      // get user MB balance
      const mb = user?.points ?? 0;
      if (mb < xpCost) {
        toast.warning("Insufficient MB to purchase");
        return;
      }

      const payload: any = {
        type: data.type,
        id: data.id,
        mb: xpCost,
      };

      // For bootcamps, include bootcampId
      if (data.type === "bootcamp" && data.bootcampId) {
        payload.bootcampId = data.bootcampId;
      }

      const purchased = await store.handleMBPayment(payload);
      return purchased;
    } catch (error: any) {
      const res = error?.response?.data ?? error;
      toast.error(res?.message ?? "An error occurred");
    }
  };

  // One-time purchases and MB redemption ONLY. Subscriptions deliberately do
  // NOT route through here any more — see startSubscriptionCheckout below.
  const handlePayment = async (id: string, type: string) => {
    if (type?.includes("individual")) {
      // Validate price ID first
      let priceId: string | undefined;

      if (NODE_ENV === "dev") {
        priceId = "pri_01k051ksx2kx847wq6y48kpfj5";
      } else {
        priceId = data?.paddle_price_id?.trim();
      }

      if (!priceId) {
        toast.error(
          `This ${data?.type ?? "item"} is not available for purchase right now. Please try again later.`,
        );
        return;
      }

      const customData = {
        method: "individual",
        id: data?.id,
        type: data?.type ?? "course",
      };

      openCheckout(priceId, customData);
      return;
    }

    if (type?.includes("mb")) {
      const purchased = await handleMBPayment();
      onHandlePurchase(id, type, purchased);
    }
  };

  /**
   * Subscription CTA. Hands the buyer to /checkout instead of opening Paddle
   * from here.
   *
   * Why not open a checkout inline: this dialog now DISPLAYS the
   * region-resolved Pro price (see formatSubscriptionCardPrice above), but the
   * only place that knows which processor and which price ID that price
   * actually corresponds to is the checkout page — its pricing is resolved
   * server-side from the visitor's country (app/checkout/page.tsx). Opening
   * Paddle here with the legacy `paymentChannel.monthlyPlanId` showed a
   * Nigerian "₦9,999/mo" and then charged them the legacy USD price. Rather
   * than duplicate processor selection in a dialog, route to the one surface
   * that already gets it right.
   *
   * Monthly is the cycle this card quotes ("/mo"), so that's what we ask for —
   * the checkout page still lets the buyer see the total before paying.
   */
  const startSubscriptionCheckout = () => {
    analytics.track("payment_plan_selected", {
      plan: "subscription",
      contentId: data.id,
    });
    router.push("/checkout?plan=pro&cycle=monthly");
    onClose();
  };

  const handleAsyncpayPayment = async () => {
    try {
      const res = await store.initiateAsyncpayCheckout(
        data.bootcampId,
        data.id,
      );
      const { AsyncpayCheckout } = await import("@asyncpay/checkout");
      AsyncpayCheckout({
        publicKey: process.env.NEXT_PUBLIC_ASYNCPAY_KEY,
        customer: {
          firstName: user?.name?.split(" ")[0],
          lastName: user?.name?.split(" ")[1],
          email: user?.email,
        },
        subscriptionPlanUUID: res.asyncpay_plan_id,
        onSuccess: () => {
          onHandlePurchase(data.id, "asyncpay", true);
        },
        onClose: () => {
          toast.info("Payment window closed");
        },
      });
    } catch (error: any) {
      const res = error?.response?.data ?? error;
      toast.error(res?.message ?? "An error occurred");
    }
  };

  const isNigerian =
    user?.country?.toLowerCase() === "nigeria" ||
    user?.country?.toLowerCase() === "ng";

  return (
    <div className="space-y-2">
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">
              Get Access to {data.title}
            </DialogTitle>
            <DialogDescription className="text-sm">
              Choose how you'd like to access this {data.type}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 md:space-y-4">
            {!disableSubscription && (
              <Card
                className="border hover:border-primary hover:bg-muted/50 cursor-pointer"
                onClick={startSubscriptionCheckout}
              >
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center gap-3">
                    <Crown className="h-6 w-6 md:h-8 md:w-8 text-[#F2C94C] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm md:text-base">
                        Upgrade to {data?.plan ?? "Pro"}
                      </h3>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        Get unlimited access to MB Platform
                      </p>
                    </div>
                    <div>
                      <div className="text-right">
                        <div className="font-bold text-sm md:text-base">
                          {formatSubscriptionCardPrice(resolvedPricing) || " "}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Best value
                        </div>
                      </div>
                      <Link
                        href={routes.pricing(pathname)}
                        className="text-xs text-primary z-10"
                        // Nested inside the card's own click target — without
                        // this, picking "another plan" ALSO fires the card and
                        // races a second navigation to /checkout.
                        onClick={(e) => e.stopPropagation()}
                      >
                        Choose another plan
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {!disableOnetime && (
            <Card
              className="border hover:border-primary hover:bg-muted/50 cursor-pointer"
              onClick={() => {
                analytics.track("payment_plan_selected", {
                  plan: "individual",
                  contentId: data.id,
                });
                handlePayment(data.id, "individual");
              }}
            >
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-6 w-6 md:h-8 md:w-8 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm md:text-base">
                      {data?.type === "bootcamp"
                        ? "Enroll in Bootcamp"
                        : "Buy This Course"}
                    </h3>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      {data?.type === "bootcamp"
                        ? "One-time payment for bootcamp access"
                        : "One-time purchase for lifetime access"}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm md:text-base">
                      ${data?.amount?.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      One-time
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            )}

            {!disableMB && (
            <Card
              className="border hover:border-primary hover:bg-muted/50 cursor-pointer"
              onClick={() => {
                analytics.track("payment_plan_selected", {
                  plan: "mb",
                  contentId: data.id,
                });
                handlePayment(data.id, "mb");
              }}
            >
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center gap-3">
                  <Gift className="h-6 w-6 md:h-8 md:w-8 text-[#EB5757] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm md:text-base">
                      Redeem with MB
                    </h3>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Use your earned MB
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm md:text-base">
                      {xpCost?.toLocaleString()} MB
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Balance: {user?.points?.toLocaleString()} MB
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            )}

            {isNigerian && data.asyncpay_plan_id && (
              <Card
                className="border hover:border-primary hover:bg-muted/50 cursor-pointer"
                onClick={handleAsyncpayPayment}
              >
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center gap-3">
                    <Zap className="h-6 w-6 md:h-8 md:w-8 text-[#FFA500] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm md:text-base">
                        Pay with Paystack
                      </h3>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        For Nigerian users — cards, bank transfer, USSD
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm md:text-base">
                        ₦{data?.amount?.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        One-time
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
