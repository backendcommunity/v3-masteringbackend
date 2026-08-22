"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Users, Check, Plus, X } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/lib/store";
import { routes } from "@/lib/routes";
import type { TeamSummary } from "@/lib/data";

interface TeamSetupPageProps {
  onNavigate: (path: string) => void;
}

/**
 * How long to keep looking for the team before giving up.
 *
 * The team is created by the payment webhook, not by checkout returning —
 * so at the moment the buyer lands here it may genuinely not exist yet.
 * Thirty seconds is far longer than the webhook normally takes and short
 * enough that a real failure does not strand someone on a spinner.
 */
const LOOKUP_TIMEOUT_MS = 30_000;
const LOOKUP_INTERVAL_MS = 1_500;

type Phase = "waiting" | "timeout" | "naming" | "inviting" | "done";

/**
 * Post-purchase team setup: name the team, then invite the first people.
 *
 * Both steps are skippable. The team already exists and already works by the
 * time anyone gets here — this flow only turns the two things the buyer
 * would otherwise have to go and find into the path they are already on.
 */
export function TeamSetupPage({ onNavigate }: TeamSetupPageProps) {
  const store = useAppStore();

  const [phase, setPhase] = useState<Phase>("waiting");
  const [team, setTeam] = useState<TeamSummary | null>(null);
  const [name, setName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [emails, setEmails] = useState<string[]>([""]);
  const [sending, setSending] = useState(false);

  // ── Find the team the webhook is creating ──────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const startedAt = Date.now();

    async function poll() {
      if (cancelled) return;

      try {
        const mine = await store.getMyTeams();
        // Only a team this person OWNS — an existing MEMBER of someone
        // else's team who lands here must not be walked through renaming it.
        const owned = mine?.filter((t) => t.role === "OWNER") ?? [];

        // Exactly one owned team is the overwhelmingly common case after an
        // Enterprise purchase, and the only one where "the team they just
        // bought" is unambiguous.
        if (owned.length === 1) {
          if (cancelled) return;
          setTeam(owned[0]);
          setName(owned[0].name);
          setPhase("naming");
          return;
        }

        // Two situations end the same way, at /team:
        //
        //   * They own SEVERAL teams. The spec makes multi-team ownership
        //     first-class, and nothing in this payload correlates a team back
        //     to the checkout that just completed — so picking one would be a
        //     guess, and the cost of guessing wrong is renaming somebody
        //     else's already-configured team or inviting against the wrong
        //     roster. Let them choose instead.
        //   * They own NONE but are a MEMBER of someone else's. No team is
        //     being created for them, so polling on and then claiming theirs
        //     is "still being created" would simply be false.
        if (mine && mine.length > 0) {
          if (cancelled) return;
          onNavigate(routes.team);
          return;
        }
      } catch {
        // Swallow and retry — a single failed poll during the window is not
        // a reason to give up on a team that is probably seconds away.
      }

      if (cancelled) return;
      if (Date.now() - startedAt >= LOOKUP_TIMEOUT_MS) {
        setPhase("timeout");
        return;
      }
      setTimeout(poll, LOOKUP_INTERVAL_MS);
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [store, onNavigate]);

  // ── Step 1: name ───────────────────────────────────────────────────────
  const saveName = useCallback(async () => {
    if (!team) return;
    const trimmed = name.trim();

    if (!trimmed) {
      toast.error("Give your team a name.");
      return;
    }

    // Unchanged from the name checkout derived — nothing to save, so don't
    // spend a request saying so.
    if (trimmed === team.name) {
      setPhase("inviting");
      return;
    }

    setSavingName(true);
    try {
      const updated = await store.renameTeam(team.id, trimmed);
      setTeam({ ...team, name: updated.name });
      setPhase("inviting");
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message ?? "Couldn't save that name. Try again.",
      );
    } finally {
      setSavingName(false);
    }
  }, [team, name, store]);

  // ── Step 2: invites ────────────────────────────────────────────────────
  const sendInvites = useCallback(async () => {
    if (!team) return;

    const addresses = emails.map((e) => e.trim()).filter(Boolean);
    if (addresses.length === 0) {
      setPhase("done");
      return;
    }

    setSending(true);

    // Sequential, not Promise.all: each invite consumes a seat, and the
    // server's seat check is per-request. Firing them together races that
    // check against itself.
    const failed: string[] = [];
    let sent = 0;

    for (const email of addresses) {
      try {
        await store.inviteMember(team.id, { email });
        sent += 1;
      } catch (e: any) {
        failed.push(
          `${email} — ${e?.response?.data?.message ?? "couldn't be invited"}`,
        );
      }
    }

    setSending(false);

    if (sent > 0) {
      toast.success(
        sent === 1 ? "Invitation sent." : `${sent} invitations sent.`,
      );
    }
    // Every failure is named. A partial send that silently drops three of
    // five addresses is worse than no send at all.
    for (const f of failed) toast.error(f);

    if (failed.length === 0) setPhase("done");
    else setEmails(failed.map((f) => f.split(" — ")[0]));
  }, [team, emails, store]);

  const nameInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (phase === "naming") nameInputRef.current?.focus();
  }, [phase]);

  // ── Render ─────────────────────────────────────────────────────────────

  if (phase === "waiting") {
    return (
      <Shell>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Setting up your team
            </CardTitle>
            <CardDescription>
              Your payment went through. We&apos;re finishing the last step —
              this usually takes a few seconds.
            </CardDescription>
          </CardHeader>
        </Card>
      </Shell>
    );
  }

  if (phase === "timeout") {
    return (
      <Shell>
        <Card>
          <CardHeader>
            <CardTitle>Your team is still being created</CardTitle>
            <CardDescription>
              Your payment went through and nothing is lost — your team just
              hasn&apos;t finished setting up yet. Open your team page in a
              moment and it will be there.
            </CardDescription>
          </CardHeader>
          <CardFooter className="gap-3">
            <Button onClick={() => onNavigate(routes.team)}>
              Go to my team
            </Button>
            <Button
              variant="outline"
              onClick={() => onNavigate(routes.dashboard)}
            >
              Back to dashboard
            </Button>
          </CardFooter>
        </Card>
      </Shell>
    );
  }

  if (phase === "naming") {
    return (
      <Shell>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Name your team
            </CardTitle>
            <CardDescription>
              We picked this from your email address. Everyone you invite will
              see it, so change it if it isn&apos;t right.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Label htmlFor="team-name">Team name</Label>
            <Input
              id="team-name"
              ref={nameInputRef}
              value={name}
              maxLength={120}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !savingName) saveName();
              }}
              className="mt-1.5"
            />
          </CardContent>
          <CardFooter className="gap-3">
            <Button onClick={saveName} disabled={savingName}>
              {savingName ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving
                </>
              ) : (
                "Continue"
              )}
            </Button>
            <Button
              variant="ghost"
              disabled={savingName}
              onClick={() => setPhase("inviting")}
            >
              Skip
            </Button>
          </CardFooter>
        </Card>
      </Shell>
    );
  }

  if (phase === "inviting") {
    return (
      <Shell>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Invite your team
            </CardTitle>
            <CardDescription>
              They&apos;ll get an email with a link to join {team?.name}. You
              can always do this later.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {emails.map((email, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  type="email"
                  placeholder="colleague@company.com"
                  value={email}
                  onChange={(e) => {
                    const next = [...emails];
                    next[i] = e.target.value;
                    setEmails(next);
                  }}
                />
                {emails.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${email || "this address"}`}
                    onClick={() =>
                      setEmails(emails.filter((_, idx) => idx !== i))
                    }
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEmails([...emails, ""])}
            >
              <Plus className="mr-1 h-4 w-4" />
              Add another
            </Button>
          </CardContent>
          <CardFooter className="gap-3">
            <Button onClick={sendInvites} disabled={sending}>
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending
                </>
              ) : (
                "Send invitations"
              )}
            </Button>
            <Button
              variant="ghost"
              disabled={sending}
              onClick={() => setPhase("done")}
            >
              Skip for now
            </Button>
          </CardFooter>
        </Card>
      </Shell>
    );
  }

  return (
    <Shell>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Check className="h-5 w-5 text-emerald-500" />
            {team?.name} is ready
          </CardTitle>
          <CardDescription>
            Manage members, seats and invitations from your team page.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={() => onNavigate(routes.team)}>Go to my team</Button>
        </CardFooter>
      </Card>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto max-w-xl px-4 py-10 md:py-16">
      {children}
    </div>
  );
}
