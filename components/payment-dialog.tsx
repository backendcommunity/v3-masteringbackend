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
import { initializePaddle, Paddle } from "@paddle/paddle-js";
import { useTheme } from "next-themes";
import countries from "@/lib/countries.json";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";
import Link from "next/link";
import { PaymentChannel, Plan } from "@/lib/data";

interface PaymentDialogProps {
  data: any;
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

const PADDLE_ENVIRONMENT = NODE_ENV === "dev" ? "sandbox" : "production";

export function PaymentDialog({
  data,
  open,
  disableMB,
  disableOnetime,
  disableSubscription,
  onHandlePreview,
  onHandlePurchase,
  onClose,
}: PaymentDialogProps) {
  const user = useUser();
  const store = useAppStore();
  const { theme } = useTheme();
  const [paddle, setPaddle] = useState<Paddle>();
  const [plan, setPlan] = useState<Plan>();
  const [channel, setChannel] = useState<PaymentChannel>();

  useEffect(() => {
    initializePaddle({
      token: PADDLE_TOKEN,
      // seller: SELLER_ID,
      eventCallback: function (data: any) {
        switch (data.name) {
          case "checkout.loaded":
            console.log("Checkout loaded", data);
            onClose();
            break;
          case "checkout.closed":
            console.log("Checkout closed");
            break;
          case "checkout.completed":
            const c_data = data?.custom_data;
            // Track payment (GA or Google)
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
    const load = async () => {
      const plan = await store.getPlan(data?.plan ?? "Pro");
      setPlan(plan);

      //TODO: Select channel based on user country
      const paymentChannel = plan?.paymentChannels?.find(
        (pp: any) => pp.channel === "PADDLE",
      );
      setChannel(paymentChannel);
    };
    load();
  }, [data?.plan]);

  // Callback to open a checkout
  const openCheckout = (priceId: string, customData: any) => {
    if (!priceId) {
      toast.error("Price ID is not available. Please refresh and try again.");
      return;
    }

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

    console.log("[Paddle Checkout]", {
      priceId,
      email: user?.email,
      country: user?.country,
      countryCode,
      customData,
    });

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
        toast.warning("Insufficient MB points to purchase");
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

  const handlePayment = async (id: string, type: string) => {
    if (type?.includes("subscription")) {
      if (NODE_ENV === "dev") {
        const priceId = "pri_01k049swct0nvgdsw8zwh6ys64";
        openCheckout(priceId, {});
        return;
      }

      if (!channel?.monthlyPlanId) {
        toast.error("Subscription plan is not available. Please try again.");
        return;
      }
      const priceId = channel.monthlyPlanId;
      openCheckout(priceId, {});
      return;
    }

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
        console.error("[Paddle Payment] Missing price ID for:", {
          type: data?.type,
          id: data?.id,
        });
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

  const handleAsyncpayPayment = async () => {
    try {
      const res = await store.initiateAsyncpayCheckout(
        data.bootcampId,
        data.id
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
            <Card
              className={`border ${
                disableSubscription
                  ? "bg-muted/10 opacity-50"
                  : "hover:border-primary hover:bg-muted/50 cursor-pointer"
              }`}
              onClick={() => {
                if (!disableSubscription)
                  handlePayment(data.id, "subscription");
              }}
            >
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center gap-3">
                  <Crown className="h-6 w-6 md:h-8 md:w-8 text-[#F2C94C] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm md:text-base">
                      Upgrade to {data?.plan ?? "Pro"}
                    </h3>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      {disableSubscription
                        ? "Not available for this bootcamp"
                        : "Get unlimited access to MB Platform"}
                    </p>
                  </div>
                  <div>
                    <div className="text-right">
                      <div className="font-bold text-sm md:text-base">
                        ${channel?.originalMonthlyPrice}/mo
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {disableSubscription ? "Disabled" : "Best value"}
                      </div>
                    </div>
                    {!disableSubscription && (
                      <Link
                        href={"/subscription/plans"}
                        className="text-xs text-primary z-10"
                      >
                        Choose another plan
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className={`border ${
                disableOnetime
                  ? "bg-muted/10"
                  : "hover:border-primary hover:bg-muted/50 cursor-pointer"
              }`}
              onClick={() => {
                if (!disableOnetime) handlePayment(data.id, "individual");
              }}
            >
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-6 w-6 md:h-8 md:w-8 text-[#13AECE] flex-shrink-0" />
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

            <Card
              className={`border ${
                disableMB
                  ? "bg-muted/10"
                  : "hover:border-primary hover:bg-muted/50 cursor-pointer"
              }`}
              onClick={() => {
                if (!disableMB) handlePayment(data.id, "mb");
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
                      Use your earned MB points
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
