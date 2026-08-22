"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { useAppStore } from "@/lib/store";
import type { TeamSummary } from "@/lib/data";

/**
 * Team settings.
 *
 * Rename shipped in sub-project 1 with no screen to live on. This is that
 * screen. It is the only setting for now — seats and billing stay on the
 * subscription page, which is where a team owner already goes for money.
 */
export function TeamSettingsPage() {
  const store = useAppStore();
  const [team, setTeam] = useState<TeamSummary | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    store
      .getMyTeams()
      .then((mine) => {
        const t = mine?.[0];
        if (!t || cancelled) return;
        setTeam(t);
        setName(t.name);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [store]);

  async function save() {
    if (!team) return;
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Give your team a name.");
      return;
    }
    if (trimmed === team.name) return;

    setSaving(true);
    try {
      const updated = await store.renameTeam(team.id, trimmed);
      setTeam({ ...team, name: updated.name });
      toast.success("Team name updated.");
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Couldn't save that name.");
    } finally {
      setSaving(false);
    }
  }

  if (!team) return <PageSkeleton rows={2} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your team&apos;s details.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team name</CardTitle>
          <CardDescription>
            Everyone you invite sees this name.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Label htmlFor="team-name">Name</Label>
          <Input
            id="team-name"
            value={name}
            maxLength={120}
            onChange={(e) => setName(e.target.value)}
            className="mt-1.5 max-w-sm"
          />
        </CardContent>
        <CardFooter>
          <Button onClick={save} disabled={saving || name.trim() === team.name}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
