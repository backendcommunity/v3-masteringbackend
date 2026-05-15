"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CreditCard, ArrowLeft, AlertTriangle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { routes } from "@/lib/routes";
import { Badge } from "../ui/badge";
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
import { Loader } from "../ui/loader";

interface CheckoutPageProps {
  onNavigate: (path: string) => void;
}

export function CheckoutPage({ onNavigate }: CheckoutPageProps) {
  const searchParams = useSearchParams();
  const store = useAppStore();
  const user = useUser();
  const fmt = (date?: string | Date | null): string =>
    formatDate(String(date ?? ""), user?.settings?.dateFormat);
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("paddle");
  const [plan, setPlan] = useState<Plan>();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const paddleRef = useRef<HTMLInputElement>(null);
  const [celebration, setCelebration] = useState(false);
  const [paddle, setPaddle] = useState<Paddle>();

  // Extract checkout type and ID from the URL
  // const checkoutType = searchParams.get("type");
  const checkoutId = searchParams?.get("plan");
  const cycle = searchParams?.get("cycle");

  // const SELLER_ID = Number(process.env.NEXT_PUBLIC_SELLER_ID);
  const PADDLE_TOKEN = process.env.NEXT_PUBLIC_PADDLE_TOKEN as string;
  const NODE_ENV = process.env.NEXT_PUBLIC_NODE_ENV;
  const PADDLE_ENVIRONMENT = NODE_ENV === "dev" ? "sandbox" : "production";

  const subscription = user?.subscription;
  const plans = dataStore.plans;

  const getPriceId = (method: string | any) =>
    cycle?.includes("monthly")
      ? currentPaymentMethod(method).pc?.monthlyPlanId
      : currentPaymentMethod(method).pc?.yearlyPlanId;

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

  // Callback to open a checkout
  const openCheckout = (priceId: string | any) => {
    if (!paddleRef.current) return;

    paddle?.Checkout?.open({
      settings: {
        displayMode: "inline",
      },
      items: [{ priceId }],
      customer: {
        email: user?.email!,
        address: {
          countryCode:
            countries.find((c) => c.name.includes(user?.country ?? "Nigeria"))
              ?.code ?? "",
        },
      },
    });
  };

  useEffect(() => {
    if (!paddleRef.current) return;
    openCheckout(getPriceId(paymentMethod));
  }, [paddleRef.current, paymentMethod]);

  initializePaddle({
    token: PADDLE_TOKEN,
    checkout: {
      settings: {
        displayMode: "inline",
        frameTarget: "paddle",
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
        // theme: theme?.includes("dark") ? "dark" : "light",
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
          const c_data = data?.custom_data;
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
        openCheckout(getPriceId(paymentMethod));
      }
    })
    .catch((e) => console.log(e));

  const handleCheckout = async (e: React.FormEvent) => {
    if (typeof window !== "undefined") {
      e.preventDefault();
      setIsProcessing(true);

      const { AsyncpayCheckout } = await import("@asyncpay/checkout");

      AsyncpayCheckout({
        publicKey: process.env.NEXT_PUBLIC_ASYNCPAY_KEY,
        customer: {
          firstName: user?.name?.split(" ")?.[0],
          lastName: user?.name?.split(" ")?.[1],
          email: user?.email,
        },
        subscriptionPlanUUID: getPriceId(paymentMethod),
        onSuccess: () => {
          // Run a function to process the payment
          alert("Payment successful");
        },
        onClose: () => {
          // Run a function whenever the user closes the popup regardless of the payment status
        },
      });
    }
  };

  const handleCancelSubscription = () => {
    console.log("Cancelling subscription?...");
    setCancelDialogOpen(false);
    // In a real app, this would make an API call to cancel the subscription
  };

  const activePlan = plans.find((p) =>
    p.name.includes(
      subscription?.name! ?? subscription?.plan?.name! ?? subscription?.plan,
    ),
  );

  const handleBack = () => {
    onNavigate(routes.subscriptionPlans);
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
            <Button onClick={() => onNavigate(routes.dashboard)}>
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
  if (loading) return <Loader isLoader={false} />;
  // if (!plan) {
  //   return (
  //     <div className="container max-w-4xl py-12">
  //       <Card>
  //         <CardHeader>
  //           <CardTitle>Checkout Error</CardTitle>
  //           <CardDescription>The requested item was not found.</CardDescription>
  //         </CardHeader>
  //         <CardFooter>
  //           <Button onClick={() => onNavigate(routes.dashboard)}>
  //             Return to Dashboard
  //           </Button>
  //         </CardFooter>
  //       </Card>
  //     </div>
  //   );
  // }

  const formatAmount = (amount: number) => {
    if (typeof window === "undefined") return;
    const currency = paymentMethod.includes("paddle") ? "USD" : "NGN";

    return Intl.NumberFormat("en-US", {
      currency,
      style: "currency",
    }).format(amount);
  };

  const currentPaymentMethod = (method: string) => {
    const pc = plan?.paymentChannels?.find((pc) =>
      pc.channel.toString().toLowerCase().includes(method),
    );
    return {
      ...plan,
      pc,
    };
  };

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
            <CardHeader>
              <CardTitle>Payment platform</CardTitle>
              <CardDescription>
                Select your payment platform based on your country.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-4">
              <RadioGroup
                defaultValue="card"
                value={paymentMethod}
                onValueChange={setPaymentMethod}
                className=" gap-4"
              >
                <div className="">
                  <RadioGroupItem
                    value="paddle"
                    id="paddle"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="paddle"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <CreditCard className="mb-2 h-6 w-6" />
                    Paddle
                  </Label>
                </div>
                <Separator />
                <div className="relative">
                  <Badge
                    className="right-0 -top-2 absolute"
                    variant={"destructive"}
                  >
                    Nigerians only
                  </Badge>
                  <RadioGroupItem
                    value="paystack"
                    id="paystack"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="paystack"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <div className="mb-2 h-6 w-6 flex items-center justify-center font-bold text-blue-600">
                      A
                    </div>
                    AsyncPay
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

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

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>
                    {cycle === "monthly"
                      ? formatAmount(
                          Number(
                            currentPaymentMethod(paymentMethod).pc
                              ?.originalMonthlyPrice,
                          ),
                        )
                      : formatAmount(
                          Number(
                            currentPaymentMethod(paymentMethod).pc
                              ?.originalYearlyPrice,
                          ),
                        )}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground text-sm">
                  <span>Tax</span>
                  <span>
                    {paymentMethod.includes("paddle") ? "$" : "NGN"}0.00
                  </span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>
                  {cycle === "monthly"
                    ? formatAmount(
                        Number(
                          currentPaymentMethod(paymentMethod).pc
                            ?.originalMonthlyPrice,
                        ),
                      )
                    : formatAmount(
                        Number(
                          currentPaymentMethod(paymentMethod).pc
                            ?.originalYearlyPrice,
                        ),
                      )}
                </span>
              </div>

              <div className="text-sm text-muted-foreground pt-2">
                {cycle ? (
                  <p>
                    You will be charged{" "}
                    <span>
                      {cycle === "monthly"
                        ? formatAmount(
                            Number(
                              currentPaymentMethod(paymentMethod).pc
                                ?.originalMonthlyPrice,
                            ),
                          )
                        : formatAmount(
                            Number(
                              currentPaymentMethod(paymentMethod).pc
                                ?.originalYearlyPrice,
                            ),
                          )}
                    </span>{" "}
                    every {cycle === "monthly" ? "month" : "year"}.
                  </p>
                ) : (
                  <p>One-time payment. No recurring charges.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Payment Form */}
        <Card className="md:col-span-2 ">
          <CardHeader>
            <CardTitle>Complete your subscription</CardTitle>
            <CardDescription>
              Fill out your card details and complete your subscription.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-4">
            <form className="space-y-6">
              {paymentMethod === "paddle" && (
                <>
                  {openCheckout(getPriceId(paymentMethod))}

                  <div
                    ref={paddleRef}
                    className="space-y-5 paddle w-full"
                    id="paddle"
                  ></div>
                </>
              )}

              {paymentMethod === "paystack" && (
                <div className="text-center py-10">
                  <p className="text-muted-foreground mb-4">
                    You will be redirected to AsyncPay to complete your payment.
                  </p>
                  <div className="w-16 h-16 bg-blue-600 rounded-full mx-auto flex items-center justify-center text-white font-bold text-2xl">
                    A
                  </div>

                  <div className="py-6 w-full">
                    <Button className="w-full" onClick={handleCheckout}>
                      Pay{" "}
                      {cycle === "monthly"
                        ? formatAmount(
                            Number(
                              currentPaymentMethod(paymentMethod).pc
                                ?.originalMonthlyPrice,
                            ),
                          )
                        : formatAmount(
                            Number(
                              currentPaymentMethod(paymentMethod).pc
                                ?.originalYearlyPrice,
                            ),
                          )}
                    </Button>
                  </div>
                </div>
              )}
            </form>
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
