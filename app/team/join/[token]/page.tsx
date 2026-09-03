"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useUser } from "@/hooks/use-user";
import { useAppStore } from "@/lib/store";
import { routes } from "@/lib/routes";
import type { TeamInvitePreview } from "@/lib/data";
import {
  Users,
  ShieldCheck,
  XCircle,
  Clock,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

type Status = "loading" | "ready" | "not-found" | "expired" | "error";

export default function TeamJoinPage() {
  const params = useParams();
  const token = String(params?.token ?? "");
  const router = useRouter();
  const user = useUser();
  const store = useAppStore();

  const [status, setStatus] = useState<Status>("loading");
  const [preview, setPreview] = useState<TeamInvitePreview | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!token) {
        if (!cancelled) setStatus("not-found");
        return;
      }
      try {
        setStatus("loading");
        const data = await store.previewTeamInvite(token);
        if (cancelled) return;
        setPreview(data);
        setStatus("ready");
      } catch (err: any) {
        if (cancelled) return;
        const code = err?.response?.status;
        if (code === 410) setStatus("expired");
        else if (code === 404) setStatus("not-found");
        else setStatus("error");
      }
    };
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const redirectTarget = routes.teamJoin(token);

  // Deliberately does NOT gate on `useUser()` to decide whether to redirect
  // to login: on a hard navigation straight to this link (the common case —
  // clicking the invite email), AuthProvider's background fetchUser for an
  // already-logged-in visitor may not have resolved yet, so `user` can still
  // read null for a moment even though a valid session exists. Gating on
  // that flag would misfire the login redirect for an authenticated person
  // who clicks quickly. Instead this always attempts the accept call — the
  // server is the actual source of truth — and only redirects to login on a
  // genuine 401 from POST /teams/invites/:token/accept (which requires
  // Auth). Everything else (403 wrong-email, 404/410 gone/expired, etc.)
  // surfaces via the server's own message.
  const handleAccept = async () => {
    setAccepting(true);
    try {
      await store.acceptTeamInvite(token);
      setAccepted(true);
      toast.success("Welcome to the team!");
    } catch (err: any) {
      if (err?.response?.status === 401) {
        router.push(`/auth/login?redirect=${encodeURIComponent(redirectTarget)}`);
        return;
      }
      toast.error(
        err?.response?.data?.message ??
          "Couldn't accept that invitation. Please try again.",
      );
    } finally {
      setAccepting(false);
    }
  };

  const handleCancelOwnSubscription = async () => {
    const subId = user?.subscription?.id;
    if (!subId) return;
    setCanceling(true);
    try {
      await store.cancelSubscription(subId);
      toast.success("Your subscription will end at the end of this period.");
      setCancelDialogOpen(false);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ?? "Couldn't cancel your subscription.",
      );
    } finally {
      setCanceling(false);
    }
  };

  const expiresLabel = preview?.expiresAt
    ? new Date(preview.expiresAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        {/* Branded hero, matching the certificate-verify page */}
        <div className="relative overflow-hidden rounded-2xl bg-[#0E1F33] p-6 text-center mb-4">
          <div className="hero-grid absolute inset-0" aria-hidden="true" />
          <div className="absolute -top-20 -left-20 w-44 h-44 bg-primary/15 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col items-center gap-3">
            <Link href="/" aria-label="MasteringBackend">
              <Image
                src="/logo-trimed.png"
                alt="Mastering Backend"
                width={180}
                height={36}
                priority
                className="h-8 w-auto object-contain"
              />
            </Link>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-white/60">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              Team Invitation
            </span>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-center">
              {status === "loading" && "Loading invitation…"}
              {status === "ready" && !accepted && "You've been invited"}
              {accepted && "You're in!"}
              {status === "not-found" && "Invitation Not Found"}
              {status === "expired" && "Invitation Expired"}
              {status === "error" && "Something Went Wrong"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {status === "loading" && (
              <div className="flex flex-col items-center gap-3 py-6 text-muted-foreground">
                <Loader2 className="h-7 w-7 animate-spin text-primary" aria-hidden="true" />
                <p className="text-sm">Checking your invitation…</p>
              </div>
            )}

            {status === "ready" && !accepted && preview && (
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-2 py-2 text-center">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-8 w-8 text-primary" aria-hidden="true" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {preview.invitedBy ? (
                      <>
                        <span className="font-medium text-foreground">
                          {preview.invitedBy}
                        </span>{" "}
                        invited you to join{" "}
                      </>
                    ) : (
                      "You've been invited to join "
                    )}
                    <span className="font-medium text-foreground">
                      {preview.teamName ?? "a team"}
                    </span>{" "}
                    on Masteringbackend.
                  </p>
                  {expiresLabel && (
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                      Expires {expiresLabel}
                    </p>
                  )}
                </div>

                {preview.hasOwnSubscription && (
                  <div className="flex gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                    <div className="space-y-2">
                      <p>
                        You already have your own Pro subscription. Joining
                        this team won&apos;t cancel it automatically — you may
                        end up paying for both.
                      </p>
                      {user?.subscription?.id ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCancelDialogOpen(true)}
                          className="border-amber-500/40"
                        >
                          Cancel my subscription
                        </Button>
                      ) : (
                        <Link
                          href={routes.subscriptionManagement}
                          className="underline underline-offset-2"
                        >
                          Manage my subscription
                        </Link>
                      )}
                    </div>
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={handleAccept}
                  disabled={accepting}
                >
                  {accepting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  )}
                  {user ? "Accept invitation" : "Log in to accept"}
                </Button>

                {!user && (
                  <p className="text-center text-xs text-muted-foreground">
                    New here?{" "}
                    <Link
                      href={`/auth/register?redirect=${encodeURIComponent(redirectTarget)}`}
                      className="underline underline-offset-2"
                    >
                      Create an account
                    </Link>{" "}
                    to accept this invite.
                  </p>
                )}
              </div>
            )}

            {accepted && (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <div className="h-14 w-14 rounded-full bg-[#27AE60]/15 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-[#27AE60]" aria-hidden="true" />
                </div>
                <p className="text-sm text-muted-foreground max-w-xs">
                  You&apos;ve joined {preview?.teamName ?? "the team"}. You
                  can start using your seat right away.
                </p>
                <Button className="w-full" onClick={() => router.push(routes.home)}>
                  Go to dashboard
                </Button>
              </div>
            )}

            {(status === "not-found" || status === "expired" || status === "error") && (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center">
                  <XCircle className="h-8 w-8 text-destructive" aria-hidden="true" />
                </div>
                <p className="text-sm text-muted-foreground max-w-xs">
                  {status === "expired" &&
                    "This invitation has expired. Ask the team owner to send you a new one."}
                  {status === "not-found" &&
                    "This invitation is no longer valid. It may have already been used or revoked."}
                  {status === "error" &&
                    "We couldn't load this invitation right now. Please try again shortly."}
                </p>
              </div>
            )}

            <Button asChild variant="outline" className="w-full">
              <Link href="/">Back to Masteringbackend</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel your subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              You&apos;ll keep access until the end of your current billing
              period, then it won&apos;t renew. Your team seat will cover you
              after that.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={canceling}>
              Keep subscription
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleCancelOwnSubscription();
              }}
              disabled={canceling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {canceling && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              )}
              Cancel subscription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
