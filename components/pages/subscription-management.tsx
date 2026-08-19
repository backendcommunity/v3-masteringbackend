"use client";

import React, { useEffect, useState } from "react";
import {
  CreditCard,
  Calendar,
  ChevronRight,
  Download,
  Crown,
  AlertTriangle,
  Check,
  ArrowRight,
  X,
  Loader2,
} from "lucide-react";
import { PageSkeleton } from "@/components/ui/page-skeleton";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { routes } from "@/lib/routes";
import { useUser } from "@/hooks/use-user";
import { dataStore } from "@/lib/data";
import { useAppStore } from "@/lib/store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { formatPrice } from "@/lib/pricing";

interface SubscriptionManagementPageProps {
  onNavigate: (path: string) => void;
}

export function SubscriptionManagementPage({
  onNavigate,
}: SubscriptionManagementPageProps) {
  const user = useUser();
  const fmt = (date?: string | Date | null): string =>
    formatDate(String(date ?? ""), user?.settings?.dateFormat);
  const store = useAppStore();
  const plans = dataStore.plans;
  const [activeTab, setActiveTab] = useState("subscription");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false);
  const [months, setMonths] = useState<string>("");
  const [enterprisePlan, setEnterprisePlan] = useState<any>();
  const [billingHistory, setBillingHistory] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    if (user) {
      setSubscription(
        user.isPremium
          ? user.subscription
          : {
              plan: { name: "Free", monthlyPrice: 0 },
              expiry: "Free forever",
              status: "active",
              paymentMethod: "No card added",
              startDate: user.createdAt,
            },
      );
    }
  }, [user]);

  const [stats, setStats] = useState<{
    amount: number;
    total: number;
    netTotal: number;
  }>();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const transactions = await store.getTransactions({ size: 6 });
      if (!cancelled) {
        setBillingHistory(transactions?.transactions);
        setStats(transactions.meta);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [store]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const plan = await store.getPlan("enterprise");
      if (!cancelled) {
        setEnterprisePlan(plan);
      }
    }
    load();

    return () => {
      cancelled = true;
    };
  }, [store]);

  /**
   * The currency this subscription is actually billed in.
   *
   * Nigerian subscriptions bill in naira, so a hardcoded "$" on this page
   * understated a \u20a69,999 charge as "$9999". Falls back to USD, which is
   * correct for every pre-regional-pricing subscription (they had no currency
   * column) and for the Free placeholder.
   */
  const billingCurrency: "NGN" | "USD" =
    (subscription as any)?.currency === "NGN" ||
    (subscription as any)?.paymentChannel?.currency === "NGN"
      ? "NGN"
      : "USD";

  /**
   * Payment processor backing this subscription, when known.
   *
   * Comes from PaymentChannel (authoritative) and falls back to the channel the
   * webhooks wrote onto the card blob. Undefined for the Free placeholder and
   * for legacy rows with neither.
   */
  const provider: string | undefined =
    (subscription as any)?.paymentChannel?.channel ??
    (typeof (subscription as any)?.card?.channel === "string"
      ? (subscription as any).card.channel
      : undefined);

  /**
   * Pause/resume is Paddle-only. AsyncPay exposes no such endpoint, so the
   * control is hidden rather than shown and left to fail. Unknown providers are
   * treated as unsupported: hiding an action is recoverable, offering one that
   * errors is not.
   */
  const supportsPause = provider === "PADDLE";

  /** Format an amount in the subscription's own currency. */
  const money = (amount?: number | null): string =>
    typeof amount === "number" && Number.isFinite(amount)
      ? formatPrice(amount, billingCurrency)
      : formatPrice(0, billingCurrency);

  /**
   * Render a JSON-column value only when it is safely renderable.
   *
   * React throws on an object child and takes the whole page down with it, so
   * anything coming out of the free-form `card` JSON is passed through here.
   */
  const asText = (v: unknown): string | null =>
    typeof v === "string" || typeof v === "number" ? String(v) : null;

  /**
   * Payment processor name for the heading, only when it is actually a string.
   *
   * `subscription.card` is a free-form JSON column written by the payment
   * webhooks, so a backend defect can put anything in it — a bug that stored an
   * un-awaited Promise landed `{ channel: {} }` here, and rendering that object
   * threw "Objects are not valid as a React child", white-screening this entire
   * page for affected subscribers. The backend no longer writes that, but this
   * page must never be one malformed record away from rendering nothing.
   */
  const rawCardChannel = (subscription as any)?.card?.channel;
  const cardChannel =
    typeof rawCardChannel === "string" && rawCardChannel.trim()
      ? rawCardChannel.trim()
      : null;

  const activePlan = plans.find((p) =>
    p.name.includes(
      subscription?.name! ?? subscription?.plan?.name! ?? subscription?.plan,
    ),
  );

  const handleCancelSubscription = async () => {
    try {
      setLoading(true);
      const id = subscription?.id;
      const canceled = await store.cancelSubscription(id);
      // Merge, never replace. These endpoints return the bare updated
      // Subscription row — no `plan`, no `paymentChannel` — so assigning it
      // wholesale wiped the plan name, billing currency and provider from the
      // page the moment the action succeeded, changing the currency symbol and
      // hiding provider-gated controls until a reload.
      setSubscription((prev: any) => ({ ...prev, ...canceled }));
      setCancelDialogOpen(canceled?.success ?? false);
    } catch (error: any) {
      toast.error(error?.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePauseSubscription = async () => {
    try {
      setLoading(true);
      const id = subscription?.id;
      const paused = await store.puaseSubscription(id, {
        months: parseInt(months),
      });
      // Merge, never replace. These endpoints return the bare updated
      // Subscription row — no `plan`, no `paymentChannel` — so assigning it
      // wholesale wiped the plan name, billing currency and provider from the
      // page the moment the action succeeded, changing the currency symbol and
      // hiding provider-gated controls until a reload.
      setSubscription((prev: any) => ({ ...prev, ...paused }));
      setPauseDialogOpen(paused?.success ?? false);
    } catch (error: any) {
      toast.error(error?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResumeSubscription = async () => {
    try {
      setLoading(true);
      const id = subscription?.id;
      const resume = await store.resumeSubscription(id);
      // Merge, never replace. These endpoints return the bare updated
      // Subscription row — no `plan`, no `paymentChannel` — so assigning it
      // wholesale wiped the plan name, billing currency and provider from the
      // page the moment the action succeeded, changing the currency symbol and
      // hiding provider-gated controls until a reload.
      setSubscription((prev: any) => ({ ...prev, ...resume }));
    } catch (error: any) {
      toast.error(error?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    // In a real app, this would download the invoice PDF
    // TODO: Add Download PDF
  };

  const handleDeleteCard = async () => {
    try {
      setLoading(true);

      const shouldDelete = confirm(
        "Are you sure you want to delete your payment method?",
      );
      if (!shouldDelete) return;

      const id = subscription?.id;
      const sub = await store.deletCard(id);
      setSubscription(sub);
    } catch (error: any) {
      toast.error(error?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAllHistory = async () => {
    try {
      const transactions = await store.getTransactions({});
      setBillingHistory(transactions?.transactions);
      setStats(transactions.meta);
    } catch (error: any) {
      toast.error(error?.message);
    }
  };

  return (
    <div className="container px-4 py-6 md:py-8 lg:py-10 max-w-5xl mx-auto space-y-8">
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold">
          Subscription & Billing
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your subscription and billing information
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="billing">Billing History</TabsTrigger>
        </TabsList>

        {/* Subscription Tab */}
        <TabsContent value="subscription" className="space-y-6">
          {!subscription ? (
            <PageSkeleton rows={3} />
          ) : <>
          {/* Current Plan */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-[#F2C94C]" />
                Current Plan
              </CardTitle>
              <CardDescription>
                Your current subscription plan and details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold flex items-center">
                    {subscription?.name ?? subscription?.plan?.name} Plan
                    <Badge className="ml-2 bg-green-100 text-green-700 border-green-200 capitalize">
                      {subscription?.plan?.name === "Free"
                        ? "Active"
                        : subscription?.status?.trim()}
                    </Badge>
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    {money(
                      subscription?.amount ?? subscription?.plan?.monthlyPrice,
                    )}
                    /month •{" "}
                    {subscription?.status?.trim() !== "active" ? (
                      <span>
                        <span className="capitalize">
                          {subscription?.status?.trim()}
                        </span>{" "}
                        on{" "}
                        {fmt(
                          subscription?.status?.trim()?.includes("resuming")
                            ? subscription?.expiry
                            : subscription?.switchToBasicDate,
                        ) ?? "N/A"}
                      </span>
                    ) : (
                      `Renews on ${fmt(subscription?.expiry)}`
                    )}
                  </p>
                </div>
                <Button
                  // Both paths go to /pricing. It is the only page showing
                  // region-correct amounts, and it is now where downgrades are
                  // chosen too — so "Change Plan" and "Upgrade to Pro" land in
                  // the same place rather than splitting across two pages.
                  onClick={() => onNavigate(routes.pricing())}
                >
                  {subscription?.plan?.name?.includes("Free")
                    ? "Upgrade to Pro"
                    : "Change Plan"}
                </Button>
              </div>

              <Separator className="my-4" />

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-3">Subscription Details</h4>
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Status:</dt>
                      <dd className="font-medium capitalize">
                        {subscription?.plan?.name === "Free"
                          ? "Active"
                          : subscription?.status?.trim()}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Start Date:</dt>
                      <dd className="font-medium">
                        {subscription?.plan?.name === "Free"
                          ? fmt(user?.createdAt)
                          : fmt(subscription?.startedAt)}
                      </dd>
                    </div>

                    {[
                      "canceling",
                      "canceled",
                      "paused",
                      "pausing",
                      "resuming",
                    ].includes(subscription?.status?.trim()) ? (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground capitalize">
                          {subscription?.status?.trim()} on:
                        </dt>
                        <dd className="font-medium">
                          {fmt(
                            subscription?.status?.trim()?.includes("resuming")
                              ? subscription?.expiry
                              : subscription?.switchToBasicDate,
                          ) ?? "N/A"}
                        </dd>
                      </div>
                    ) : (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Next Billing:</dt>
                        <dd className="font-medium">
                          {fmt(subscription?.expiry)}
                        </dd>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Amount:</dt>
                      <dd className="font-medium">
                        {money(
                          subscription?.amount ??
                            subscription?.plan?.monthlyPrice,
                        )}
                        /month
                      </dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h4 className="font-medium mb-3">
                    Payment Method{cardChannel ? ` (${cardChannel})` : ""}
                  </h4>
                  <div className="flex items-center justify-between gap-3 p-4 border rounded-lg">
                    <span className="flex items-center gap-3 p-4">
                      <CreditCard className="h-8 w-8 text-muted-foreground" />
                      <div>
                        {subscription?.card && (
                          <p className="font-medium">
                            {asText(subscription?.card?.card?.type)} (****
                            {asText(subscription?.card?.card?.last4)})
                          </p>
                        )}
                        {subscription?.card ? (
                          subscription?.card?.type?.includes("card") ? (
                            <p className="text-sm text-muted-foreground">
                              Expires {subscription?.card?.card?.expiryMonth}/
                              {subscription?.card?.card?.expiryYear}
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              {asText(subscription?.card?.type)}
                            </p>
                          )
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No card added
                          </p>
                        )}
                      </div>
                    </span>
                    {!subscription?.paymentMethod?.includes(
                      "No card added",
                    ) && (
                      <Button
                        onClick={handleDeleteCard}
                        disabled={["active", "resuming"].includes(
                          subscription?.status?.trim(),
                        )}
                        variant="outline"
                        size="sm"
                        className="mt-3 w-ful"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Loading...</span>
                          </>
                        ) : (
                          <>Delete</>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <Button
                variant="outline"
                onClick={() => onNavigate(routes.pricing())}
              >
                View Available Plans
              </Button>
              <div className="flex gap-4">
                {!subscription?.plan?.name?.includes("Free") &&
                  // AsyncPay has no pause/resume API at all, so offering the
                  // control to Nigerian subscribers would present an action
                  // that can only fail. Paddle supports it; AsyncPay does not.
                  supportsPause &&
                  !["canceling", "canceled"].includes(
                    subscription?.status?.trim(),
                  ) && (
                    <Dialog
                      open={pauseDialogOpen}
                      onOpenChange={(e) => {
                        ["paused", "pausing"].includes(
                          subscription?.status?.trim(),
                        )
                          ? handleResumeSubscription()
                          : setPauseDialogOpen(e);
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant={
                            ["paused", "pausing"].includes(
                              subscription?.status?.trim(),
                            )
                              ? "default"
                              : "secondary"
                          }
                        >
                          {["paused", "pausing"].includes(
                            subscription?.status?.trim(),
                          ) ? (
                            loading ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Resuming...</span>
                              </>
                            ) : (
                              <>Resume Subscription</>
                            )
                          ) : (
                            "Pause Subscription"
                          )}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Pause Your Subscription?</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to pause your{" "}
                            {subscription?.name} subscription? You'll lose
                            access to all premium features when your current
                            billing period ends on {fmt(subscription?.expiry)}{" "}
                            until you resume back.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Warning</AlertTitle>
                            <AlertDescription>
                              Pausing will remove access to premium courses,
                              bootcamps, and features when your current billing
                              period ends until you resume back.
                            </AlertDescription>
                          </Alert>
                          <div className="space-y-2">
                            <h4 className="font-medium">
                              You'll lose access to:
                            </h4>
                            <ul className="space-y-2 text-sm mt-3">
                              {activePlan?.features
                                ?.filter((f) => f?.included)
                                ?.map((f, i) => (
                                  <li
                                    key={i}
                                    className="flex items-center gap-2"
                                  >
                                    <div className="h-1.5 w-1.5 rounded-full bg-destructive" />
                                    <span>{f?.name}</span>
                                  </li>
                                ))}
                            </ul>
                          </div>
                        </div>

                        <div className="py-4">
                          <Select
                            required={true}
                            value={months}
                            onValueChange={setMonths}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Number of months to pause" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1</SelectItem>
                              <SelectItem value="2">2</SelectItem>
                              <SelectItem value="3">3</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setPauseDialogOpen(false)}
                          >
                            Keep Subscription
                          </Button>
                          <Button
                            disabled={!months}
                            variant="destructive"
                            onClick={handlePauseSubscription}
                          >
                            {loading ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Pausing...</span>
                              </>
                            ) : (
                              <>Pause Confirmation</>
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}

                {!subscription?.plan?.name?.includes("Free") &&
                  !["canceling", "canceled", "paused", "pausing"].includes(
                    subscription?.status?.trim(),
                  ) && (
                    <Dialog
                      open={cancelDialogOpen}
                      onOpenChange={setCancelDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button variant="destructive">
                          Cancel Subscription
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Cancel Your Subscription?</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to cancel your{" "}
                            {subscription?.name} subscription? You'll lose
                            access to all premium features when your current
                            billing period ends on {fmt(subscription?.expiry)}.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Warning</AlertTitle>
                            <AlertDescription>
                              Cancelling will remove access to premium courses,
                              bootcamps, and features when your current billing
                              period ends.
                            </AlertDescription>
                          </Alert>
                          <div className="space-y-2">
                            <h4 className="font-medium">
                              You'll lose access to:
                            </h4>
                            <ul className="space-y-2 text-sm mt-3">
                              {activePlan?.features
                                ?.filter((f) => f?.included)
                                ?.map((f, i) => (
                                  <li
                                    key={i}
                                    className="flex items-center gap-2"
                                  >
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
                            {loading ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Canceling...</span>
                              </>
                            ) : (
                              <>Confirm Cancellation</>
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
              </div>
            </CardFooter>
          </Card>

          {/* Plan Benefits */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>
                Your {subscription?.name ?? subscription?.plan?.name} Plan
                Benefits
              </CardTitle>
              <CardDescription>
                Enjoy these premium features with your current subscription
              </CardDescription>
            </CardHeader>
            {/* HERE */}
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {activePlan?.features?.map((f, i) => (
                  <React.Fragment key={i}>
                    {i % 2 === 0 ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          {f.included ? (
                            <Check className="h-5 w-5 text-green-500" />
                          ) : (
                            <X className="h-5 w-5 text-muted-foreground mr-2 shrink-0" />
                          )}

                          <span>{f.name}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          {f.included ? (
                            <Check className="h-5 w-5 text-green-500" />
                          ) : (
                            <X className="h-5 w-5 text-muted-foreground mr-2 shrink-0" />
                          )}
                          <span>{f.name}</span>
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </CardContent>
          </Card>
          </>}
        </TabsContent>

        {/* Billing History Tab */}
        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Billing History
              </CardTitle>
              <CardDescription>
                View and download your past invoices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {billingHistory?.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">
                          {invoice?.description ?? invoice?.title}
                        </h4>
                        <Badge
                          variant={
                            invoice.status?.trim()?.toLowerCase() === "paid"
                              ? "default"
                              : "secondary"
                          }
                          className={
                            invoice.status?.trim()?.toLowerCase() === "paid"
                              ? "bg-green-100 text-green-700 border-green-200 capitalize"
                              : ""
                          }
                        >
                          {invoice.status?.trim()}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          Invoice #{invoice.invoice?.substring(0, 10)}
                        </span>
                        <span>{fmt(invoice?.createdAt)}</span>
                        <span>{money(invoice?.amount)}</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadInvoice(invoice.invoice)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="pt-4">
              <Button
                onClick={handleViewAllHistory}
                variant="outline"
                className="w-full"
              >
                View All Invoices
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>

          {/* Payment Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Payment Summary</CardTitle>
              <CardDescription>
                Your payment history at a glance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {money(stats?.amount)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Total Paid
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#F2C94C]">
                    {stats?.netTotal}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Invoices</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {
                      billingHistory?.filter(
                        (i) => i.status?.trim()?.toLowerCase() === "paid",
                      ).length
                    }
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Successful Payments
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upgrade Suggestion */}
      {subscription?.name?.trim()?.toLowerCase() === "pro" && (
        <Card className="bg-[#EB5757]/10 border-[#EB5757]/20 mt-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <Crown className="h-10 w-10 text-[#EB5757]" />
                <div>
                  <h3 className="text-xl font-semibold">
                    Upgrade to Enterprise
                  </h3>
                  <p className="text-muted-foreground">
                    Get access to teams, 1-on-1 mentorship, career services, and
                    priority support
                  </p>
                  <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                    <span>✓ Teams (up to 5 members)</span>
                    <span>✓ 1-on-1 mentorship sessions</span>
                    <span>✓ Career placement assistance</span>
                    <span>✓ Priority support</span>
                  </div>
                </div>
              </div>
              <div className="text-center md:text-right">
                <Button
                  size="lg"
                  onClick={() => onNavigate(routes.pricing())}
                >
                  <Crown className="mr-2 h-4 w-4" />
                  Upgrade Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  Starting at {money(enterprisePlan?.monthlyPrice)}
                  /month
                </p>
                <span className="text-xs text-gray-400 italic">
                  Split with up to 5 friends
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
