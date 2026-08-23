"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AssignmentItemBuilder } from "@/components/team/assignment-item-builder";
import { useAppStore } from "@/lib/store";
import type {
  AssignmentInput,
  AssignmentItemInput,
  AssignmentTargetType,
  TeamAssignment,
  TeamGroup,
  TeamMember,
} from "@/lib/data";

/**
 * Create or edit one assignment: name, optional due date, who it targets,
 * and the content/tasks it holds. The heaviest UI in the sub-project, so
 * responsibilities are split out: this file owns the assignment-level
 * fields and the save sequencing, `AssignmentItemBuilder` owns picking and
 * ordering the items.
 *
 * Save order matters and is NOT incidental: the assignment is created (or
 * updated) first, and only once that call returns its id do we call
 * `setTeamAssignmentItems` — the item endpoint has no meaning without an
 * assignment id to attach to.
 *
 * Editing loads the full item list — WITH each item's `id` — from
 * `getTeamAssignmentDetail` rather than trusting anything passed in via
 * props, because the `assignment` prop is the manager-list row shape
 * (`TeamAssignment`) which doesn't carry items at all. See the comment on
 * `setItems` below and in `assignment-item-builder.tsx` for why those ids
 * must survive every edit made in this dialog before being sent back.
 */
export function AssignmentFormDialog({
  teamId,
  assignment,
  open,
  onOpenChange,
  onSaved,
}: {
  teamId: string;
  assignment: TeamAssignment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const store = useAppStore();

  const [name, setName] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [targetType, setTargetType] = useState<AssignmentTargetType>("TEAM");
  const [targetGroupId, setTargetGroupId] = useState<string | null>(null);
  const [targetTeamMemberId, setTargetTeamMemberId] = useState<string | null>(null);
  // Whether the manager has touched the target picker THIS time the dialog
  // is open. When editing and left untouched, the target fields are omitted
  // from the update payload entirely (see handleSave) — the picker is
  // prefilled from `assignment.targetGroupId`/`targetTeamMemberId` below so
  // it reflects reality, but retargeting is still an explicit act, not
  // something a no-op save should trigger.
  const [targetTouched, setTargetTouched] = useState(false);

  const [items, setItems] = useState<AssignmentItemInput[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  // Which assignment `items` currently, successfully represents — "new" for
  // the create flow (no async load needed), an assignment id once its
  // detail fetch has resolved, or null while nothing loaded yet has landed.
  // A plain boolean is not enough here: closing the dialog on assignment A
  // and reopening it on assignment B (before B's slower fetch resolves)
  // would leave a `true` flag sitting on top of A's items with B's id
  // nowhere recorded, and Save would still send A's list — with A's item
  // ids — as if it were B's. Comparing against the CURRENT assignment's
  // identity is what closes that gap.
  const [itemsLoadedFor, setItemsLoadedFor] = useState<string | null>(null);
  // Only set in the create flow, to survive a failed item-save after a
  // successful create — see handleSave and IMPORTANT 4 in the review this
  // fixes.
  const [createdId, setCreatedId] = useState<string | null>(null);

  const [groups, setGroups] = useState<TeamGroup[] | null>(null);
  const [members, setMembers] = useState<TeamMember[] | null>(null);
  const [pickerFailed, setPickerFailed] = useState(false);

  const [saving, setSaving] = useState(false);

  // Reset the assignment-level fields whenever the dialog opens (or opens
  // on a different assignment). Touches no store call, so it's safe to key
  // on the plain values below.
  useEffect(() => {
    if (!open) return;
    setName(assignment?.name ?? "");
    setDueAt(assignment?.dueAt ? assignment.dueAt.slice(0, 10) : "");
    setTargetType(assignment?.targetType ?? "TEAM");
    setTargetGroupId(assignment?.targetGroupId ?? null);
    setTargetTeamMemberId(assignment?.targetTeamMemberId ?? null);
    setTargetTouched(false);
    // A fresh "new assignment" session must not remember an id orphaned by
    // a previous failed item-save (IMPORTANT 4) — only relevant when
    // `assignment` is still null; editing never touches `createdId`.
    setCreatedId(null);
  }, [
    open,
    assignment?.id,
    assignment?.name,
    assignment?.dueAt,
    assignment?.targetType,
    assignment?.targetGroupId,
    assignment?.targetTeamMemberId,
  ]);

  // Loads the group/member pickers. `store` is deliberately excluded from
  // the deps below — useAppStore() has no selector, so its identity changes
  // on any set() anywhere in the app (including a nav-bar poll every ten
  // seconds). Depending on it would refetch on unrelated churn and, worse,
  // could clobber in-progress edits. Same pattern as
  // components/pages/team.tsx:121/:145 and every other dialog in this
  // epic (GroupMembersDialog, AssignmentDetailDialog).
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setPickerFailed(false);
    Promise.all([store.getTeamGroups(teamId), store.getTeamMembers(teamId)])
      .then(([g, roster]) => {
        if (cancelled) return;
        setGroups(g ?? []);
        setMembers(roster?.members ?? []);
      })
      .catch(() => {
        if (cancelled) return;
        setPickerFailed(true);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, teamId]);

  // Loads the existing items when editing. Same `store`-omission reasoning
  // as above.
  useEffect(() => {
    if (!open) return;
    if (!assignment) {
      setItems([]);
      setItemsLoadedFor("new");
      return;
    }
    // Clear whatever the previous assignment (or nothing at all) left
    // behind BEFORE starting this fetch, and drop the "loaded" marker with
    // it. This is what closes the close-A/open-B race: even if this fetch
    // never resolves, or resolves late, `items` can never be mistaken for a
    // list that belongs to a DIFFERENT assignment than the one now open —
    // there is no window where a stale list sits around wearing a "loaded"
    // flag that isn't actually about this assignment.
    setItems([]);
    setItemsLoadedFor(null);
    let cancelled = false;
    setItemsLoading(true);
    store
      .getTeamAssignmentDetail(teamId, assignment.id)
      .then((detail) => {
        if (cancelled) return;
        setItems(
          detail.items.map((i) => ({
            // Every item already saved on the server carries an id, and it
            // MUST be carried through here. The backend's set-replace
            // matches TASK items by this id (content items match by (type,
            // refId) instead) to decide which learner completions survive a
            // save. Drop it — even just by rebuilding this object without
            // it — and a save that only reordered or added one item looks,
            // from the client's point of view, identical to a save that
            // deleted every existing task and recreated it: the server sees
            // no matching id, deletes the old AssignmentItem rows, and
            // AssignmentTaskCompletion cascades away with them. Every
            // learner's ticks on this assignment, gone, silently — the
            // request still succeeds.
            id: i.id,
            type: i.type,
            refId: i.refId,
            text: i.text,
            // Display-only — resolved from the catalogue by the backend,
            // stripped before this list is ever sent back (see handleSave).
            title: i.title,
          })),
        );
        // Marks `items` as belonging to THIS assignment. `canSave` checks
        // this against `assignment.id`, not a bare boolean — see the field
        // declaration above for why the distinction matters.
        setItemsLoadedFor(assignment.id);
      })
      .catch(() => {
        if (cancelled) return;
        toast.error("Couldn't load this assignment's items.");
        // `itemsLoadedFor` stays null: Save must stay disabled rather than
        // risk sending the `[]` this effect seeded above as if it were a
        // deliberate edit.
      })
      .finally(() => {
        if (!cancelled) setItemsLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, teamId, assignment?.id]);

  function handleTargetTypeChange(value: string) {
    setTargetType(value as AssignmentTargetType);
    setTargetTouched(true);
    setTargetGroupId(null);
    setTargetTeamMemberId(null);
  }

  const targetValid =
    targetType === "TEAM" ||
    (targetType === "GROUP" && !!targetGroupId) ||
    (targetType === "MEMBER" && !!targetTeamMemberId);

  // Creating always resolves a target from scratch. Editing only requires a
  // fresh resolution if the manager actually touched the picker — otherwise
  // the existing target is left alone (see targetTouched above).
  const targetRequiresValidation = !assignment || targetTouched;

  // True only once `items` has successfully loaded FOR THE ASSIGNMENT THIS
  // DIALOG IS CURRENTLY OPEN ON — "new" for create, or a matching id for
  // edit. See the `itemsLoadedFor` declaration above: a bare
  // `!itemsLoading` boolean cannot tell "loaded" apart from "loaded for the
  // wrong assignment", which is exactly what let Save through on a
  // rejected, still-in-flight, or superseded item fetch.
  const itemsReady = itemsLoadedFor === (assignment ? assignment.id : "new");

  const canSave =
    name.trim().length > 0 &&
    !saving &&
    !itemsLoading &&
    itemsReady &&
    (!targetRequiresValidation || targetValid);

  function handleOpenChange(next: boolean) {
    if (!next && saving) return;
    onOpenChange(next);
  }

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    try {
      const input: Partial<AssignmentInput> = {
        name: name.trim(),
        dueAt: dueAt ? new Date(`${dueAt}T00:00:00.000Z`).toISOString() : null,
      };
      if (targetRequiresValidation) {
        input.targetType = targetType;
        input.targetGroupId = targetType === "GROUP" ? targetGroupId : null;
        input.targetTeamMemberId = targetType === "MEMBER" ? targetTeamMemberId : null;
      }

      // The assignment is saved FIRST — setTeamAssignmentItems needs the id
      // it returns. This is a real ordering requirement, not just tidiness:
      // there is no assignment id to attach items to until this resolves.
      //
      // `createdId` covers the retry after a failed item-save: the create
      // call above already succeeded once, but `assignment` (the prop) is
      // still null because the caller never learned it — this dialog is
      // still "new assignment" from its point of view. Without remembering
      // the id, a retry would call createTeamAssignment again and leave the
      // first attempt behind as an orphan with no items.
      const targetId = assignment?.id ?? createdId;
      const saved = targetId
        ? await store.updateTeamAssignment(teamId, targetId, input)
        : await store.createTeamAssignment(teamId, input as AssignmentInput);

      // Recorded as soon as the id exists — BEFORE the item-save below,
      // which is exactly the call that can still fail (409 duplicate, 422
      // on over-long task text, a network blip) and send the user back
      // through this function again.
      if (!assignment) setCreatedId(saved.id);

      // `title` is a client-only display field (see AssignmentItemInput) —
      // the backend's item schema rejects unknown keys, so it must not ride
      // along on the wire.
      const itemsForApi = items.map(({ title: _title, ...rest }) => rest);
      await store.setTeamAssignmentItems(teamId, saved.id, itemsForApi);

      toast.success(assignment ? "Assignment updated." : "Assignment created.");
      onSaved();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Couldn't save that assignment.");
    } finally {
      setSaving(false);
    }
  }

  const pickersReady = groups !== null && members !== null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{assignment ? `Edit ${assignment.name}` : "New assignment"}</DialogTitle>
          <DialogDescription>
            Name it, decide who it&apos;s for, and add the courses, paths,
            projects, mock interviews or free-text tasks it should contain.
          </DialogDescription>
        </DialogHeader>

        {pickerFailed ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Couldn&apos;t load the team&apos;s groups and members.
            </p>
            <Button size="sm" variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        ) : !pickersReady ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="assignment-name">Name</Label>
              <Input
                id="assignment-name"
                value={name}
                maxLength={120}
                onChange={(e) => setName(e.target.value)}
                disabled={saving}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="assignment-due">Due date (optional)</Label>
              <Input
                id="assignment-due"
                type="date"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label>Who is this for?</Label>
              <RadioGroup value={targetType} onValueChange={handleTargetTypeChange}>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="TEAM" id="target-team" disabled={saving} />
                  <Label htmlFor="target-team" className="font-normal">
                    Everyone
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="GROUP" id="target-group" disabled={saving} />
                  <Label htmlFor="target-group" className="font-normal">
                    A group
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="MEMBER" id="target-member" disabled={saving} />
                  <Label htmlFor="target-member" className="font-normal">
                    A person
                  </Label>
                </div>
              </RadioGroup>

              {targetType === "GROUP" && (
                <Select
                  value={targetGroupId ?? undefined}
                  onValueChange={(v) => {
                    setTargetGroupId(v);
                    setTargetTouched(true);
                  }}
                >
                  <SelectTrigger aria-label="Select group">
                    <SelectValue placeholder="Choose a group" />
                  </SelectTrigger>
                  <SelectContent>
                    {(groups ?? []).map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {targetType === "MEMBER" && (
                <Select
                  value={targetTeamMemberId ?? undefined}
                  onValueChange={(v) => {
                    setTargetTeamMemberId(v);
                    setTargetTouched(true);
                  }}
                >
                  <SelectTrigger aria-label="Select person">
                    <SelectValue placeholder="Choose a person" />
                  </SelectTrigger>
                  <SelectContent>
                    {(members ?? []).map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.user.name ?? m.user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {itemsLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <AssignmentItemBuilder items={items} onChange={setItems} />
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={!canSave}>
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
