"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppStore } from "@/lib/store";
import type { TeamMember } from "@/lib/data";

/**
 * Pick a group's members.
 *
 * Saves the WHOLE set in one call, matching the endpoint: the caller states
 * "these are the people in Platform" rather than issuing a sequence of adds
 * and removes that can half-fail.
 */
export function GroupMembersDialog({
  teamId, groupId, groupName, open, onOpenChange, onSaved,
}: {
  teamId: string;
  groupId: string | null;
  groupName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const store = useAppStore();
  const [members, setMembers] = useState<TeamMember[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !groupId) {
      setMembers(null);
      setSelected(new Set());
      return;
    }
    let cancelled = false;
    store
      .getTeamMembers(teamId)
      .then((roster) => {
        if (cancelled) return;
        setMembers(roster.members);
        setSelected(
          new Set(
            roster.members
              .filter((m) => m.groups?.some((g) => g.id === groupId))
              .map((m) => m.id),
          ),
        );
      })
      .catch(() => {
        if (!cancelled) onOpenChange(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, groupId, teamId, store, onOpenChange]);

  async function save() {
    if (!groupId) return;
    setSaving(true);
    try {
      await store.setTeamGroupMembers(teamId, groupId, [...selected]);
      toast.success("Group updated.");
      onSaved();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Couldn't update that group.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Who is in {groupName}?</DialogTitle>
          <DialogDescription>
            Tick everyone who belongs to this group. People can be in several
            groups, or none.
          </DialogDescription>
        </DialogHeader>

        {!members ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-1">
            {members.map((m) => (
              <label
                key={m.id}
                className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-muted"
              >
                <Checkbox
                  checked={selected.has(m.id)}
                  onCheckedChange={(on) => {
                    const next = new Set(selected);
                    if (on) next.add(m.id);
                    else next.delete(m.id);
                    setSelected(next);
                  }}
                />
                <span className="min-w-0 flex-1 truncate text-sm">
                  {m.user.name ?? m.user.email}
                </span>
              </label>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button onClick={save} disabled={saving || !members}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving
              </>
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
