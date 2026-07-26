"use client";

import { useEffect, useState } from "react";
import { Check, Crown, X, CreditCard, ChevronRight, Info } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { routes } from "@/lib/routes";
import { dataStore } from "@/lib/data";
import { useAppStore } from "@/lib/store";
import { useUser } from "@/hooks/use-user";
import { PageSkeleton } from "@/components/ui/page-skeleton";

interface SubscriptionPlansPageProps {
  onNavigate: (path: string) => void;
}

export function SubscriptionPlansPage({
  onNavigate,
}: SubscriptionPlansPageProps) {
  const store = useAppStore();
  const [loading, setLoading] = useState(false);
  const user = useUser();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "monthly",
  );

  const [plans, setPlans] = useState(dataStore.plans);

  function mergePlans(plans: any[]) {
    const mergedMap = new Map<string, any>();

    for (const plan of plans) {
      const key = plan.name.toLowerCase();

      const cta =
        user?.subscription?.name === plan.name
          ? "Current Plan"
          : "Choose " + plan.name;

      const disabled = user?.subscription?.name === plan.name ? true : false;

      if (mergedMap.has(key)) {
        const existing = mergedMap.get(key);
        // Merge: newer values will override older ones if available

        mergedMap.set(key, { ...existing, ...plan, cta, disabled });
      } else {
        mergedMap.set(key, { ...plan, cta, disabled });
      }
    }

    return Array.from(mergedMap.values());
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const plans = await store.getPlans();
      const merged = mergePlans([...plans, ...dataStore.plans]);
      if (!cancelled) {
        setPlans(merged);
        setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [store]);

  if (loading) return <PageSkeleton />;

  const handleSelectPlan = (planId: string, cycle: string) => {
    onNavigate(routes.checkout("subscription", planId, cycle));
  };

  return (
    <div className="container px-4 py-6 md:py-8 lg:py-10 max-w-5xl mx-auto space-y-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">
          Choose Your Subscription Plan
        </h1>
        <p className="text-muted-foreground mt-1 max-w-2xl mx-auto">
          Invest in your backend engineering career with our flexible
          subscription plans. Cancel anytime.
        </p>
      </div>

      {/* Billing Cycle Toggle */}
      <div className="flex justify-center mb-6">
        <Tabs
          defaultValue="annual"
          value={billingCycle}
          onValueChange={(value) =>
            setBillingCycle(value as "monthly" | "annual")
          }
          className="w-full max-w-md"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="annual">
              Annual
              <Badge
                variant="outline"
                className="ml-2 bg-green-100 text-green-700 border-green-200"
              >
                Save 20%
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Pricing Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan?.id}
            className={`relative ${
              plan?.popular
                ? "border-primary shadow-lg shadow-primary/10"
                : ""
            } flex flex-col`}
          >
            {plan?.popular && (
              <div className="absolute -top-4 left-0 right-0 flex justify-center">
                <Badge className="bg-primary">Most Popular</Badge>
              </div>
            )}
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{plan?.name}</CardTitle>
                {plan?.name !== "Free" && (
                  <Crown
                    className={`h-5 w-5 ${
                      plan?.name === "Pro" ? "text-[#F2C94C]" : "text-[#EB5757]"
                    }`}
                  />
                )}
              </div>
              <CardDescription>{plan?.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-4">
              <div className="mb-4">
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold">
                    $
                    {billingCycle === "monthly"
                      ? plan?.monthlyPrice
                      : plan?.annualPrice}
                  </span>
                  {plan?.monthlyPrice! > 0 && (
                    <span className="text-muted-foreground ml-2">
                      /{billingCycle === "monthly" ? "month" : "year"}
                    </span>
                  )}
                </div>
                {billingCycle === "annual" && plan?.monthlyPrice! > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Billed annually (save ~20% vs. monthly)
                  </p>
                )}
              </div>

              <ul className="space-y-2">
                {plan?.features?.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    {feature.included ? (
                      <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                    ) : (
                      <X className="h-5 w-5 text-muted-foreground mr-2 shrink-0" />
                    )}
                    <span
                      className={
                        feature.included ? "" : "text-muted-foreground"
                      }
                    >
                      {feature.name}
                    </span>
                    {feature.name === "1-on-1 mentorship" &&
                      plan?.name === "Enterprise" && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground ml-1 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="w-[200px]">
                                4 hours of 1-on-1 mentorship per month with
                                industry experts
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="pt-2 mt-auto">
              <Button
                className={`w-full ${
                  plan?.popular ? "bg-primary hover:bg-primary/90" : ""
                }`}
                disabled={plan?.disabled}
                onClick={() => handleSelectPlan(plan?.id, billingCycle)}
              >
                {plan?.name === "Free" ? (
                  plan?.cta
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    {plan?.cta}
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="mt-12 space-y-6">
        <h2 className="text-xl md:text-2xl font-bold text-center mb-6">
          Frequently Asked Questions
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                Can I cancel my subscription anytime?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Yes, you can cancel your subscription at any time. If you
                cancel, you'll still have access until the end of your billing
                period.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                What payment methods do you accept?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                We accept all major credit cards, PayPal, and bank transfers for
                annual plans.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                Can I switch between plans?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Yes, you can upgrade or downgrade your plan at any time. Changes
                will be prorated based on your remaining subscription period.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                Do you offer team or company plans?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Yes, we offer special pricing for teams and companies. Please
                contact our sales team for more information.
              </p>
              <Button variant="link" className="p-0 h-auto mt-2">
                Contact Sales <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Money Back Guarantee */}
      <div className="bg-muted/50 p-6 rounded-lg text-center mt-8">
        <h3 className="font-semibold text-lg mb-2">
          7-Day Money Back Guarantee
        </h3>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          If you're not satisfied with your subscription within the first 7
          days, we'll refund your payment. No questions asked.
        </p>
      </div>
    </div>
  );
}
