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
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/lib/store";
import type { TeamPath } from "@/lib/data";

// ValidateCreateTeamPath / ValidateUpdateTeamPath: title is 1..100 chars,
// summary is free text and may be blank.
const MAX_TITLE_LENGTH = 100;

/**
 * Create a team path, or rename one and edit its summary.
 *
 * Ruling R24: without this the feature is unreachable — seven endpoints and
 * two screens existed and no path could be brought into existence from the
 * UI. Sections are a separate, much heavier concern and live in
 * `PathSectionEditor`; this dialog owns only the path's own two fields.
 *
 * The one asymmetry worth knowing: on CREATE a blank summary is omitted from
 * the wire entirely (there is nothing to clear yet, and the backend defaults
 * it to ""), while on UPDATE a blank summary is sent as an explicit `null`,
 * which is how the API says "clear it". Sending `undefined` on an update
 * would leave the old summary in place and read to the manager as the edit
 * having silently failed.
 *
 * Mounted only while open, like `PathSectionEditor`, so it takes `onClose`
 * rather than an `open`/`onOpenChange` pair — and so none of these
 * manager-only endpoints can be reached in a session that never opened it.
 */
export function PathFormDialog({
  teamId,
  path,
  onSaved,
  onClose,
}: {
  teamId: string;
  path: TeamPath | null;
  onSaved: () => void;
  onClose: () => void;
}) {
  const store = useAppStore();

  const [title, setTitle] = useState(path?.title ?? "");
  const [summary, setSummary] = useState(path?.summary ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reseeds the fields if the same mounted dialog is pointed at a different
  // path. Touches no store call, so it is safe to key on the plain values.
  useEffect(() => {
    setTitle(path?.title ?? "");
    setSummary(path?.summary ?? "");
    setError(null);
  }, [path?.id, path?.title, path?.summary]);

  const canSave = title.trim().length > 0 && !saving;

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      if (path) {
        await store.updateTeamPath(teamId, path.id, {
          title: title.trim(),
          // `null`, never `undefined`: this is the documented way to CLEAR
          // a summary, and `undefined` would quietly keep the old one.
          summary: summary.trim() ? summary.trim() : null,
        });
        toast.success("Path updated.");
      } else {
        // Omitted rather than sent blank — there is nothing to clear on a
        // path that does not exist yet, and the store fetcher leaves the
        // key off the wire when it is undefined.
        await store.createTeamPath(
          teamId,
          title.trim(),
          summary.trim() ? summary.trim() : undefined,
        );
        toast.success("Path created.");
      }
      onSaved();
      onClose();
    } catch (e: any) {
      // Kept open with the manager's text still in the fields — a 422 on
      // the title is something to correct, not something to retype.
      const message =
        e?.response?.data?.message ??
        (path ? "Couldn't save that path." : "Couldn't create that path.");
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(next) => !next && !saving && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{path ? `Edit ${path.title}` : "New path"}</DialogTitle>
          <DialogDescription>
            {path
              ? "Change what this path is called, or what it says it covers."
              : "Give the path a name. You can add its sections once it exists."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="path-title">Title</Label>
            <Input
              id="path-title"
              value={title}
              maxLength={MAX_TITLE_LENGTH}
              placeholder="e.g. Backend Fundamentals"
              disabled={saving}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="path-summary">Summary (optional)</Label>
            <Textarea
              id="path-summary"
              value={summary}
              rows={3}
              placeholder="What this path covers, and who it's for."
              disabled={saving}
              onChange={(e) => setSummary(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={!canSave}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving
              </>
            ) : path ? (
              "Save"
            ) : (
              "Create path"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
