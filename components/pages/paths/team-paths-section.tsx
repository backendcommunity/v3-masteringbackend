"use client";

import { PathCard, PathCardData } from "@/components/pages/paths/path-card";

/**
 * A team's own paths, shelved above the catalogue and headed with the team's
 * name — the same shape "Start for Free" has on the Courses page.
 *
 * These are kept out of the main grid on purpose: a path your company wrote
 * for you is a different kind of thing from the catalogue, and mixing the two
 * buries it among fifteen others.
 *
 * The caller decides membership by `ownerTeamId`, which already rides the
 * /roadmaps response. That response is already scoped by the backend to paths
 * the viewer's active teams own, so this component never decides who may see
 * what — it only decides where a path is drawn.
 */
export interface TeamShelf<T extends PathCardData> {
  teamId: string;
  /** The team's name, or null when the name lookup failed. */
  teamName: string | null;
  paths: T[];
}

interface TeamPathsSectionProps<T extends PathCardData> {
  shelves: TeamShelf<T>[];
  savedSlugs: Set<string>;
  savingSlug: string | null;
  onToggleSave: (path: T) => void;
  onSelect: (path: T) => void;
}

export function TeamPathsSection<T extends PathCardData & { slug: string }>({
  shelves,
  savedSlugs,
  savingSlug,
  onToggleSave,
  onSelect,
}: TeamPathsSectionProps<T>) {
  const populated = shelves.filter((s) => s.paths.length > 0);
  if (populated.length === 0) return null;

  return (
    <div className="space-y-6 mb-8">
      {populated.map((shelf) => (
        <section
          key={shelf.teamId}
          data-testid={`team-shelf-${shelf.teamId}`}
          className="space-y-3"
        >
          <div>
            <h3 className="font-semibold text-base">
              {shelf.teamName ?? "Team paths"}
            </h3>
            <p className="text-sm text-muted-foreground">
              Paths your team has put together.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {shelf.paths.map((p) => (
              <PathCard
                key={p.slug}
                path={p}
                isSaved={savedSlugs.has(p.slug)}
                isSaving={savingSlug === p.slug}
                onToggleSave={() => onToggleSave(p)}
                onSelect={() => onSelect(p)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
