"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { useUser } from "@/hooks/use-user";
import { formatPrice, type PublicPricing } from "@/lib/pricing";
import {
  classifyFreeCardCta,
  classifyGrandfathered,
  formatGrandfatheredSubLabel,
} from "@/lib/subscription-pricing";

interface SubscriptionPlansPageProps {
  pricing: PublicPricing;
}

type BillingCycle = "monthly" | "annual";

export function SubscriptionPlansPage({ pricing }: SubscriptionPlansPageProps) {
  const router = useRouter();
  const user = useUser();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");

  const subscription = user?.subscription;
  // See lib/subscription-pricing.ts for the full matrix + why this never
  // claims a billing period for a grandfathered amount.
  const { isProSubscriber, isGrandfathered, legacyAmount, legacyCurrency } =
    classifyGrandfathered(subscription, user?.isPremium, pricing);

  const proPrice = billingCycle === "monthly" ? pricing.monthly : pricing.annual;

  const handleSelectPlan = (planId: string, cycle: BillingCycle) => {
    router.push(routes.checkout("subscription", planId, cycle));
  };

  return (
    <div className="container px-4 py-6 md:py-8 lg:py-10 max-w-5xl mx-auto space-y-8">
      <div className="text-center mb-6">
        <h1 className="text-3xl md:text-4xl font-bold">
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
          value={billingCycle}
          onValueChange={(value) => setBillingCycle(value as BillingCycle)}
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
        {dataStore.plans.map((plan) => {
          const isFreePlan = plan.id === "free";
          const isProPlan = plan.id === "pro";

          let priceLabel: string;
          let priceSuffix: string | null = null;
          let subLabel: string | null = null;
          let ctaLabel: string;
          let ctaDisabled = false;
          let onSelect: (() => void) | undefined;
          let legacyNote: string | null = null;
          let tagLabel: string | null = null;

          if (isProPlan && isGrandfathered) {
            priceLabel = formatPrice(legacyAmount!, legacyCurrency);
            // Never "per month" here — we don't know the billing period of
            // a legacy amount (see classifyGrandfathered's doc comment).
            // The renewal date is the fact we actually have.
            subLabel = formatGrandfatheredSubLabel(
              subscription?.expiry,
              user?.settings?.dateFormat,
            );
            ctaLabel = "Manage subscription";
            ctaDisabled = false;
            onSelect = () => router.push(routes.subscriptionManagement);
            legacyNote =
              "You're on legacy pricing — your rate stays the same for as long as your subscription is active.";
            tagLabel = "Legacy rate";
          } else if (isProPlan && isProSubscriber) {
            priceLabel = formatPrice(proPrice, pricing.currency);
            priceSuffix = billingCycle === "monthly" ? "/month" : "/year";
            subLabel =
              billingCycle === "annual"
                ? "Billed annually (save ~20% vs. monthly)"
                : null;
            ctaLabel = "Current Plan";
            ctaDisabled = true;
            tagLabel = "Available to you";
          } else if (isProPlan) {
            priceLabel = formatPrice(proPrice, pricing.currency);
            priceSuffix = billingCycle === "monthly" ? "/month" : "/year";
            subLabel =
              billingCycle === "annual"
                ? "Billed annually (save ~20% vs. monthly)"
                : null;
            ctaLabel = "Choose Pro";
            onSelect = () => handleSelectPlan("pro", billingCycle);
          } else if (isFreePlan) {
            priceLabel = "Free";
            // Known gap this closes: a premium user used to see "Get
            // started" on the Free card, as if they were a new signup.
            // Routing through checkout reuses its existing cancellation
            // confirmation dialog (see components/pages/checkout.tsx), so
            // this never downgrades anyone with a single click.
            const freeCta = classifyFreeCardCta(user?.isPremium);
            ctaLabel = freeCta.ctaLabel;
            ctaDisabled = freeCta.ctaDisabled;
            if (!ctaDisabled) {
              onSelect = () => handleSelectPlan("free", billingCycle);
            }
          } else {
            // Enterprise — this card keeps its existing "talk to sales"
            // framing rather than a number. NOT because the tier is
            // unpriced or global-only: Enterprise is region-priced like Pro
            // and now sold PER USER (see lib/pricing.ts's enterprise block).
            // This surface simply hasn't been switched over to it.
            //
            // The CTA goes to /pricing rather than straight to /checkout,
            // and that is now load-bearing: a per-seat checkout needs a seat
            // count, and this card has no way to collect one. Sending it to
            // checkout without `seats` would land on the (correct, but dead)
            // unavailable state — so it goes to the surface that actually
            // has the seat selector, which then carries the count through.
            priceLabel = "Contact us";
            ctaLabel = plan.cta ?? "Choose Enterprise";
            onSelect = () => router.push(routes.pricing());
          }

          return (
            <Card
              key={plan.id}
              className={`relative ${
                plan.popular
                  ? "border-primary shadow-lg shadow-primary/10"
                  : ""
              } flex flex-col`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                  <Badge className="bg-primary">Most Popular</Badge>
                </div>
              )}
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  {plan.name !== "Free" && (
                    <Crown
                      className={`h-5 w-5 ${
                        plan.name === "Pro"
                          ? "text-[#F2C94C]"
                          : "text-[#EB5757]"
                      }`}
                    />
                  )}
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 pb-4">
                <div className="mb-4">
                  {tagLabel && (
                    <Badge
                      variant="outline"
                      className={
                        legacyNote
                          ? "mb-2 border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400"
                          : "mb-2 border-primary/30 bg-primary/5 text-primary"
                      }
                    >
                      {tagLabel}
                    </Badge>
                  )}
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold">{priceLabel}</span>
                    {priceSuffix && (
                      <span className="text-muted-foreground ml-2">
                        {priceSuffix}
                      </span>
                    )}
                  </div>
                  {subLabel && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {subLabel}
                    </p>
                  )}
                  {legacyNote && (
                    <p className="mt-3 border-l-2 border-amber-400 pl-3 text-sm leading-relaxed text-muted-foreground">
                      {legacyNote}
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
                  disabled={ctaDisabled}
                  onClick={onSelect}
                >
                  {plan?.name === "Free" ? (
                    ctaLabel
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      {ctaLabel}
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
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
