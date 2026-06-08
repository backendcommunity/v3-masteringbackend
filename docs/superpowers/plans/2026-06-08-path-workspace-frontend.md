# Path Workspace Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Build a single session-driven "path workspace" watch page (DataCamp-style) at a NEW route `/paths/[pathId]/learn`, consuming the new backend `/paths/:slug/session` API. Persistent left rail (meters + course groups + ordered step rows) + right stage whose body swaps per step type — every type rendered INLINE. Existing granular path routes stay live, untouched.

**Architecture:** A `PathWorkspace` container fetches the session, owns the current-step cursor (URL-synced), and renders `PathRail` + `StepStage`. `StepStage` switches on `step.type` to inline renderers that REUSE existing components (`VimeoPlayer`, `CourseQuizPage`, `ExercisePage`, `CourseProjectPage`, mock-interview UI, article HTML). Completing a step POSTs to the complete facade, applies the returned `SessionDelta`, and auto-advances to `cursor.nextStepId`.

**Tech:** Next.js 15 App Router, React 19, Zustand (`useAppStore`, `lib/store.ts`), Axios (`api`, `lib/api.ts`), shadcn/Tailwind, lucide-react, sonner toasts, dark-navy theme. No unit-test runner (Playwright e2e only) — tasks are verified with `npx tsc --noEmit` + `npm run lint`, full `npm run build` at the end.

---

## Backend contract (already shipped)

- `GET /api/v3/paths/:slug/session` → `PathSession`:
  ```
  { path:{ slug,title,progressPct,masteryPct,earnedPoints,certThreshold,isCompleted,certEligible },
    cursor:{ currentStepId,nextStepId,resumeStepId },
    groups:[{ id,title,type:"COURSE",topicId,stepIds[] }],
    groupsState:[{ id,progressPct,status }],
    steps:[{ id,order,type,itemId,groupId,topicId,title,url?,maxPoints,optional,
             status:"DONE|IN_PROGRESS|NOT_STARTED",recommended,earnedPoints,score,passed,masteryMet,
             access:{allowed,reason},
             payloadRef:{ mode:"inline|playground|external", endpoint, route } }] }
  ```
- `POST /api/v3/paths/:slug/steps/:stepId/complete` body `{ payload? }` → `SessionDelta`:
  ```
  { step:{ id,status,score,earnedPoints,masteryMet },
    cursor:{ currentStepId,nextStepId },
    path:{ progressPct,masteryPct,earnedPoints,certEligible } }
  ```
- `PATCH /api/v3/paths/:slug/steps/:stepId/progress` body `{ duration }` → `{ stepId,currentDuration }`.

`StepType` = VIDEO | ARTICLE | QUIZ | EXERCISE | PROJECT | MOCK_INTERVIEW | BOOTCAMP | RESOURCE.

---

## Conventions (read once)

- All page/components are client components (`"use client"`).
- Store actions live in `lib/store.ts`: pattern `name: async (...args) => { const { data } = await api.get/post(url, body); return data?.data; }`. After mutations returning `user`, call `get().syncUserSnapshot(result.user)`.
- Components consume `const store = useAppStore();` then call `await store.action(...)` inside try/catch with `toast.error` and a `loading` state.
- Navigation: `useRouter().push(path)`; pages pass `onNavigate`.
- Verify each task: `npx tsc --noEmit` (zero NEW errors in your files) and `npm run lint` (no new errors). Commit per task.
- Theme: dark navy primary `#0E1F33`, teal `#347474`, accent yellow `#F2C94C`. Use existing shadcn primitives from `components/ui/` (Progress, Card, Badge, Button, Accordion, ScrollArea, Skeleton). Icons from `lucide-react`.
- Reference for prop shapes: `Video` etc. in `lib/data.ts`.

---

## Task 1: Path session types

**Files:**
- Create: `lib/path-types.ts`

- [ ] **Step 1: Create the types file**

```typescript
// lib/path-types.ts
export type PathStepType =
  | "VIDEO" | "ARTICLE" | "QUIZ" | "EXERCISE"
  | "PROJECT" | "MOCK_INTERVIEW" | "BOOTCAMP" | "RESOURCE";

export type PathStepStatus = "DONE" | "IN_PROGRESS" | "NOT_STARTED";
export type PathRenderMode = "inline" | "playground" | "external";

export interface PathPayloadRef {
  mode: PathRenderMode;
  endpoint: string;
  route: string | null;
}

export interface PathSessionStep {
  id: string;
  order: number;
  type: PathStepType;
  itemId: string;
  groupId: string | null;
  topicId: string;
  title: string;
  url?: string | null;
  maxPoints: number;
  optional: boolean;
  status: PathStepStatus;
  recommended: boolean;
  earnedPoints: number;
  score: number | null;
  passed: boolean | null;
  masteryMet: boolean;
  access: { allowed: boolean; reason: string };
  payloadRef: PathPayloadRef;
}

export interface PathGroup {
  id: string;
  title: string;
  type: "COURSE";
  topicId: string;
  stepIds: string[];
}

export interface PathGroupState {
  id: string;
  progressPct: number;
  status: PathStepStatus;
}

export interface PathSession {
  path: {
    slug: string;
    title: string;
    progressPct: number;
    masteryPct: number;
    earnedPoints: number;
    certThreshold: number;
    isCompleted: boolean;
    certEligible: boolean;
  };
  cursor: {
    currentStepId: string | null;
    nextStepId: string | null;
    resumeStepId: string | null;
  };
  groups: PathGroup[];
  groupsState: PathGroupState[];
  steps: PathSessionStep[];
}

export interface PathSessionDelta {
  step: {
    id: string;
    status: PathStepStatus;
    score: number | null;
    earnedPoints: number;
    masteryMet: boolean;
  };
  cursor: { currentStepId: string | null; nextStepId: string | null };
  path: {
    progressPct: number;
    masteryPct: number;
    earnedPoints: number;
    certEligible: boolean;
  };
}
```

- [ ] **Step 2: Typecheck** — `npx tsc --noEmit` → no errors from this file.
- [ ] **Step 3: Commit**
```bash
git add lib/path-types.ts
git commit -m "feat(path): add path session frontend types"
```

---

## Task 2: Store actions for the session API

**Files:**
- Modify: `lib/store.ts` (add 3 actions + their AppState signatures)

- [ ] **Step 1: Add the AppState method signatures**

In the `AppState` interface (around lines 144–398), add:
```typescript
  getPathSession: (slug: string) => Promise<import("./path-types").PathSession>;
  completePathStep: (
    slug: string,
    stepId: string,
    payload?: Record<string, any>,
  ) => Promise<import("./path-types").PathSessionDelta>;
  updatePathStepProgress: (
    slug: string,
    stepId: string,
    payload: { duration: number },
  ) => Promise<{ stepId: string; currentDuration?: number }>;
```

- [ ] **Step 2: Add the implementations** inside `create<AppState>((set, get) => ({ ... }))`, near the other roadmap actions (use `resolveRoadmapSlug` like the existing actions do):

```typescript
  getPathSession: async (slug) => {
    const resolvedSlug = await resolveRoadmapSlug(slug);
    const { data } = await api.get(`/paths/${resolvedSlug}/session`);
    return data?.data;
  },

  completePathStep: async (slug, stepId, payload = {}) => {
    const resolvedSlug = await resolveRoadmapSlug(slug);
    const { data } = await api.post(
      `/paths/${resolvedSlug}/steps/${encodeURIComponent(stepId)}/complete`,
      payload,
    );
    const result = data?.data;
    return result;
  },

  updatePathStepProgress: async (slug, stepId, payload) => {
    const resolvedSlug = await resolveRoadmapSlug(slug);
    const { data } = await api.patch(
      `/paths/${resolvedSlug}/steps/${encodeURIComponent(stepId)}/progress`,
      payload,
    );
    return data?.data;
  },
```

> Note: `resolveRoadmapSlug` is an existing helper used by other roadmap actions in this file. Confirm its name by reading the file; if it differs, match the existing actions exactly. Step ids contain colons (`t1:VIDEO:v1`) — `encodeURIComponent` is required.

- [ ] **Step 3: Typecheck** — `npx tsc --noEmit` → no new errors.
- [ ] **Step 4: Commit**
```bash
git add lib/store.ts
git commit -m "feat(path): add session/complete/progress store actions"
```

---

## Task 3: Route + page shell

**Files:**
- Create: `app/paths/[pathId]/learn/[[...stepId]]/page.tsx`

Optional catch-all segment `[[...stepId]]` lets `/paths/:id/learn` (resume) and `/paths/:id/learn/<encodedStepId>` (deep-link) both work.

- [ ] **Step 1: Create the page**

```tsx
"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { PathWorkspace } from "@/components/pages/path-workspace";
import { useParams, useRouter } from "next/navigation";

export default function PathLearnRoute() {
  const router = useRouter();
  const params = useParams() as { pathId: string; stepId?: string[] };
  const stepId = params.stepId?.[0]
    ? decodeURIComponent(params.stepId[0])
    : undefined;

  return (
    <DashboardLayout>
      <PathWorkspace
        pathId={params.pathId}
        initialStepId={stepId}
        onNavigate={(path) => router.push(path)}
      />
    </DashboardLayout>
  );
}
```

- [ ] **Step 2: Create a temporary stub** so the import resolves and typecheck passes (the real component is Task 4). Create `components/pages/path-workspace.tsx`:

```tsx
"use client";

export interface PathWorkspaceProps {
  pathId: string;
  initialStepId?: string;
  onNavigate: (path: string) => void;
}

export function PathWorkspace(_props: PathWorkspaceProps) {
  return null;
}
```

- [ ] **Step 3: Typecheck + lint** — `npx tsc --noEmit` and `npm run lint` → clean.
- [ ] **Step 4: Commit**
```bash
git add "app/paths/[pathId]/learn" components/pages/path-workspace.tsx
git commit -m "feat(path): add /paths/[pathId]/learn route and workspace stub"
```

---

## Task 4: PathWorkspace container

**Files:**
- Modify: `components/pages/path-workspace.tsx` (replace the stub)

Owns: session fetch, the current step, complete→delta→advance, cert banner. Renders `PathRail` + `StepStage` (created in Tasks 5–9; import them and build a minimal placeholder for StepStage now so this compiles, then Task 6 fills it in).

- [ ] **Step 1: Implement the container**

```tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";
import {
  PathSession,
  PathSessionStep,
  PathSessionDelta,
} from "@/lib/path-types";
import { Loader } from "@/components/ui/loader";
import { PathRail } from "@/components/pages/path/path-rail";
import { StepStage } from "@/components/pages/path/step-stage";

export interface PathWorkspaceProps {
  pathId: string;
  initialStepId?: string;
  onNavigate: (path: string) => void;
}

export function PathWorkspace({
  pathId,
  initialStepId,
  onNavigate,
}: PathWorkspaceProps) {
  const store = useAppStore();
  const [session, setSession] = useState<PathSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStepId, setCurrentStepId] = useState<string | undefined>(
    initialStepId,
  );

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await store.getPathSession(pathId);
      setSession(data);
      setCurrentStepId((prev) => prev ?? data?.cursor?.resumeStepId ?? data?.steps?.[0]?.id);
    } catch (e) {
      toast.error("Failed to load this path.");
    } finally {
      setLoading(false);
    }
  }, [pathId, store]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathId]);

  const currentStep: PathSessionStep | undefined = useMemo(
    () => session?.steps.find((s) => s.id === currentStepId),
    [session, currentStepId],
  );

  const selectStep = useCallback(
    (stepId: string) => {
      setCurrentStepId(stepId);
      onNavigate(`/paths/${pathId}/learn/${encodeURIComponent(stepId)}`);
    },
    [pathId, onNavigate],
  );

  const applyDelta = useCallback(
    (delta: PathSessionDelta) => {
      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          path: { ...prev.path, ...delta.path },
          cursor: { ...prev.cursor, ...delta.cursor },
          steps: prev.steps.map((s) =>
            s.id === delta.step.id ? { ...s, ...delta.step } : s,
          ),
        };
      });
    },
    [],
  );

  const completeStep = useCallback(
    async (stepId: string, payload?: Record<string, any>) => {
      try {
        const delta = await store.completePathStep(pathId, stepId, payload);
        applyDelta(delta);
        // refresh group/meter state that the delta doesn't carry
        const fresh = await store.getPathSession(pathId);
        setSession(fresh);
        const next = delta.cursor.nextStepId;
        if (next) setCurrentStepId(next);
        if (delta.path.certEligible) {
          toast.success("You've unlocked your certificate!");
        }
      } catch (e) {
        toast.error("Could not mark this step complete.");
      }
    },
    [pathId, store, applyDelta],
  );

  if (loading && !session) return <Loader />;
  if (!session) return null;

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      <PathRail
        session={session}
        currentStepId={currentStepId}
        onSelectStep={selectStep}
      />
      <div className="flex-1 overflow-y-auto">
        <StepStage
          pathId={pathId}
          step={currentStep}
          onComplete={completeStep}
          onSelectStep={selectStep}
          onNavigate={onNavigate}
        />
      </div>
    </div>
  );
}
```

> Note: this imports `PathRail` and `StepStage` which are created in Tasks 5 and 6. To keep each task independently compilable, create those two files as minimal stubs as part of THIS task (a `PathRail` that renders the step titles as buttons, and a `StepStage` that renders the step title) so `npx tsc --noEmit` passes; Tasks 5/6 replace them. Put both under `components/pages/path/`.

Minimal stubs to add in this task:
```tsx
// components/pages/path/path-rail.tsx
"use client";
import { PathSession } from "@/lib/path-types";
export function PathRail({
  session, currentStepId, onSelectStep,
}: { session: PathSession; currentStepId?: string; onSelectStep: (id: string) => void; }) {
  return (
    <aside className="w-80 shrink-0 border-r overflow-y-auto p-4 space-y-1">
      {session.steps.map((s) => (
        <button key={s.id} onClick={() => onSelectStep(s.id)}
          className={`block w-full text-left text-sm p-2 rounded ${s.id === currentStepId ? "bg-muted" : ""}`}>
          {s.title}
        </button>
      ))}
    </aside>
  );
}
```
```tsx
// components/pages/path/step-stage.tsx
"use client";
import { PathSessionStep } from "@/lib/path-types";
export function StepStage({
  step,
}: {
  pathId: string;
  step?: PathSessionStep;
  onComplete: (stepId: string, payload?: Record<string, any>) => void;
  onSelectStep: (id: string) => void;
  onNavigate: (path: string) => void;
}) {
  if (!step) return null;
  return <div className="p-6">{step.title}</div>;
}
```

- [ ] **Step 2: Typecheck + lint** — clean.
- [ ] **Step 3: Manual smoke (optional, needs backend + an enrolled path):** run `npm run dev`, open `/paths/<slug>/learn`, confirm the rail lists steps and clicking one updates the URL.
- [ ] **Step 4: Commit**
```bash
git add components/pages/path-workspace.tsx components/pages/path/path-rail.tsx components/pages/path/step-stage.tsx
git commit -m "feat(path): PathWorkspace container with session load, cursor, complete+advance"
```

---

## Task 5: PathRail (meters + course groups + step rows)

**Files:**
- Modify: `components/pages/path/path-rail.tsx` (replace stub)
- Create: `components/pages/path/path-meters.tsx`
- Create: `components/pages/path/step-row.tsx`

Rail = top meters block, then steps grouped: steps whose `groupId` matches a course render under a collapsible `CourseGroup` header (with `groupsState` badge); standalone steps (groupId null) render flat in `order`. Use the existing `Accordion` + `Progress` + `Badge` primitives and `lucide-react` icons.

- [ ] **Step 1: PathMeters**

```tsx
// components/pages/path/path-meters.tsx
"use client";
import { Progress } from "@/components/ui/progress";
import { PathSession } from "@/lib/path-types";

export function PathMeters({ session }: { session: PathSession }) {
  const { path } = session;
  return (
    <div className="p-4 border-b space-y-3">
      <h2 className="font-bold text-sm truncate">{path.title}</h2>
      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Progress</span>
          <span>{path.progressPct}%</span>
        </div>
        <Progress value={path.progressPct} className="h-2" />
      </div>
      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Mastery</span>
          <span>
            {path.earnedPoints}/{path.certThreshold} pts
          </span>
        </div>
        <Progress value={path.masteryPct} className="h-2" />
      </div>
      {path.certEligible && (
        <div className="text-xs font-semibold text-[#347474]">
          🎓 Certificate unlocked
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: StepRow** — icon by type, status indicator (DONE ✓ / IN_PROGRESS ▶ / locked when `!access.allowed`), recommended ring, click to select.

```tsx
// components/pages/path/step-row.tsx
"use client";
import {
  Play, FileText, Brain, Code2, FolderGit2, Mic, GraduationCap, Link2,
  CheckCircle2, Lock, Circle,
} from "lucide-react";
import { PathSessionStep, PathStepType } from "@/lib/path-types";

const ICONS: Record<PathStepType, any> = {
  VIDEO: Play, ARTICLE: FileText, QUIZ: Brain, EXERCISE: Code2,
  PROJECT: FolderGit2, MOCK_INTERVIEW: Mic, BOOTCAMP: GraduationCap, RESOURCE: Link2,
};

export function StepRow({
  step, active, onSelect,
}: { step: PathSessionStep; active: boolean; onSelect: () => void; }) {
  const Icon = ICONS[step.type] ?? Circle;
  const locked = !step.access.allowed;
  return (
    <button
      onClick={onSelect}
      className={`flex items-center gap-2 w-full text-left text-sm px-3 py-2 rounded-lg transition-colors
        ${active ? "bg-muted font-semibold" : "hover:bg-muted/40"}
        ${step.recommended && !active ? "ring-1 ring-[#13AECE]" : ""}`}
    >
      <span className="shrink-0">
        {step.status === "DONE" ? (
          <CheckCircle2 className="w-4 h-4 text-[#347474]" />
        ) : locked ? (
          <Lock className="w-4 h-4 text-muted-foreground" />
        ) : (
          <Icon className="w-4 h-4 text-muted-foreground" />
        )}
      </span>
      <span className="truncate flex-1">{step.title}</span>
      {step.score != null && step.type === "QUIZ" && (
        <span className="text-[10px] text-muted-foreground">{step.score}%</span>
      )}
    </button>
  );
}
```

- [ ] **Step 3: PathRail** — assemble meters + grouped steps.

```tsx
// components/pages/path/path-rail.tsx
"use client";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PathSession } from "@/lib/path-types";
import { PathMeters } from "./path-meters";
import { StepRow } from "./step-row";

export function PathRail({
  session, currentStepId, onSelectStep,
}: {
  session: PathSession;
  currentStepId?: string;
  onSelectStep: (id: string) => void;
}) {
  const stepById = new Map(session.steps.map((s) => [s.id, s]));
  const groupedIds = new Set(session.groups.flatMap((g) => g.stepIds));
  const standalone = session.steps.filter((s) => !groupedIds.has(s.id));
  const groupStateById = new Map(session.groupsState.map((g) => [g.id, g]));

  // active group should default-open
  const activeGroup = session.groups.find((g) =>
    g.stepIds.includes(currentStepId ?? ""),
  );

  return (
    <aside className="w-80 shrink-0 border-r flex flex-col">
      <PathMeters session={session} />
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          <Accordion
            type="multiple"
            defaultValue={activeGroup ? [activeGroup.id] : []}
          >
            {session.groups.map((g) => {
              const gs = groupStateById.get(g.id);
              return (
                <AccordionItem key={g.id} value={g.id} className="border-0">
                  <AccordionTrigger className="px-3 py-2 hover:no-underline rounded-lg hover:bg-muted/30">
                    <div className="flex items-center justify-between w-full pr-2">
                      <span className="text-xs font-bold uppercase tracking-wide truncate">
                        {g.title}
                      </span>
                      {gs && (
                        <Badge variant="outline" className="text-[10px]">
                          {gs.progressPct}%
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-1">
                    {g.stepIds
                      .map((id) => stepById.get(id))
                      .filter(Boolean)
                      .map((s) => (
                        <StepRow
                          key={s!.id}
                          step={s!}
                          active={s!.id === currentStepId}
                          onSelect={() => onSelectStep(s!.id)}
                        />
                      ))}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
          {standalone.map((s) => (
            <StepRow
              key={s.id}
              step={s}
              active={s.id === currentStepId}
              onSelect={() => onSelectStep(s.id)}
            />
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}
```

- [ ] **Step 4: Typecheck + lint** — clean. (Confirm `accordion`, `scroll-area`, `badge`, `progress` exist in `components/ui/`; they do per the codebase map.)
- [ ] **Step 5: Commit**
```bash
git add components/pages/path/path-rail.tsx components/pages/path/path-meters.tsx components/pages/path/step-row.tsx
git commit -m "feat(path): rail with meters, course groups, step rows"
```

---

## Task 6: StepStage + inline VIDEO / ARTICLE / RESOURCE renderers

**Files:**
- Modify: `components/pages/path/step-stage.tsx` (replace stub)
- Create: `components/pages/path/steps/video-step.tsx`
- Create: `components/pages/path/steps/article-step.tsx`
- Create: `components/pages/path/steps/resource-step.tsx`
- Create: `components/pages/path/step-frame.tsx` (shared header: title + back/next + a Complete button)

- [ ] **Step 1: StepFrame** — a consistent wrapper giving every stage a header with the step title, a Mark-Complete button (hidden when already DONE), and an optional Next control.

```tsx
// components/pages/path/step-frame.tsx
"use client";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { PathSessionStep } from "@/lib/path-types";

export function StepFrame({
  step, onComplete, children, completeLabel = "Mark complete & continue",
}: {
  step: PathSessionStep;
  onComplete: () => void;
  children: React.ReactNode;
  completeLabel?: string;
}) {
  return (
    <div className="flex flex-col min-h-full">
      <header className="flex items-center justify-between gap-4 px-6 py-4 border-b">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {step.type.replace("_", " ")}
          </p>
          <h1 className="font-bold text-lg">{step.title}</h1>
        </div>
        {step.status === "DONE" ? (
          <span className="flex items-center gap-1 text-sm text-[#347474] font-semibold">
            <CheckCircle2 className="w-4 h-4" /> Completed
          </span>
        ) : (
          <Button onClick={onComplete}>{completeLabel}</Button>
        )}
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: VideoStep** — reuse `VimeoPlayer`. Auto-mark complete on `onComplete` (90% watched) AND expose the manual button. Persist position via `updatePathStepProgress`.

```tsx
// components/pages/path/steps/video-step.tsx
"use client";
import { VimeoPlayer } from "@/components/ui/vimeo-player";
import { PathSessionStep } from "@/lib/path-types";
import { StepFrame } from "../step-frame";
import { useAppStore } from "@/lib/store";

export function VideoStep({
  pathId, step, onComplete,
}: {
  pathId: string;
  step: PathSessionStep;
  onComplete: (stepId: string, payload?: Record<string, any>) => void;
}) {
  const store = useAppStore();
  return (
    <StepFrame step={step} onComplete={() => onComplete(step.id)}>
      <div className="p-6">
        <VimeoPlayer
          video={{ id: step.itemId, video: Number(step.itemId) } as any}
          onComplete={() => onComplete(step.id)}
          onTimeUpdate={(secs) => {
            if (Math.floor(secs) % 15 === 0) {
              store
                .updatePathStepProgress(pathId, step.id, { duration: secs })
                .catch(() => {});
            }
          }}
        />
      </div>
    </StepFrame>
  );
}
```

> Note: `VimeoPlayer` expects a `video: Partial<Video>` whose numeric Vimeo id is on the `video` field. The session step only carries `itemId` (the DB video id), NOT the Vimeo numeric id. So the player needs the real video record. Two options — pick during implementation by checking what `payloadRef.endpoint` (`/api/v3/courses/videos/:id`) returns: (a) if that GET returns a `video` object with the Vimeo id, fetch it first via a small store action `getVideo(itemId)` and pass it to `VimeoPlayer`; (b) if the session can't render video without it, add a `getVideoById` store action calling `payloadRef.endpoint`. Implement option (a): add `getPathItem(endpoint)` store action `const { data } = await api.get(endpoint.replace("/api/v3","")); return data?.data;`, fetch on mount, pass the real object to `VimeoPlayer`. Show a `Loader` while fetching. Do NOT pass `Number(step.itemId)` as the Vimeo id — that was a placeholder.

- [ ] **Step 3: ArticleStep** — fetch the article HTML via `payloadRef.endpoint`, render with `dangerouslySetInnerHTML`, manual complete.

```tsx
// components/pages/path/steps/article-step.tsx
"use client";
import { useEffect, useState } from "react";
import { PathSessionStep } from "@/lib/path-types";
import { StepFrame } from "../step-frame";
import { useAppStore } from "@/lib/store";
import { Loader } from "@/components/ui/loader";

export function ArticleStep({
  step, onComplete,
}: {
  step: PathSessionStep;
  onComplete: (stepId: string) => void;
}) {
  const store = useAppStore();
  const [html, setHtml] = useState<string>("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const item = await store.getPathItem(step.payloadRef.endpoint);
        setHtml(item?.content ?? item?.body ?? item?.summary ?? "");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.id]);

  return (
    <StepFrame step={step} onComplete={() => onComplete(step.id)} completeLabel="Mark as read & continue">
      <div className="p-6 max-w-3xl mx-auto">
        {loading ? (
          <Loader isFull={false} />
        ) : (
          <article
            className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}
      </div>
    </StepFrame>
  );
}
```

> Note: add the generic `getPathItem(endpoint: string)` store action in this task (it's reused by video/article/exercise/project):
> ```typescript
> getPathItem: async (endpoint: string) => {
>   const path = endpoint.replace(/^\/api\/v3/, "");
>   const { data } = await api.get(path);
>   return data?.data;
> },
> ```
> Add its signature to `AppState`. Confirm the article GET shape (`content`/`body`/`summary`) by inspecting the backend `articles/:id` response — if no such route exists yet (the backend plan flagged this), render `step.title` + a notice and still allow Mark-as-read. Report this as DONE_WITH_CONCERNS if the endpoint 404s.

- [ ] **Step 4: ResourceStep** — external link; "Open" opens `step.url` in a new tab and marks done.

```tsx
// components/pages/path/steps/resource-step.tsx
"use client";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { PathSessionStep } from "@/lib/path-types";
import { StepFrame } from "../step-frame";

export function ResourceStep({
  step, onComplete,
}: {
  step: PathSessionStep;
  onComplete: (stepId: string) => void;
}) {
  return (
    <StepFrame step={step} onComplete={() => onComplete(step.id)} completeLabel="Mark as visited">
      <div className="p-6 max-w-2xl mx-auto text-center space-y-4">
        <p className="text-muted-foreground">External resource</p>
        <Button asChild onClick={() => onComplete(step.id)}>
          <a href={step.url ?? "#"} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4 mr-2" /> Open resource
          </a>
        </Button>
      </div>
    </StepFrame>
  );
}
```

- [ ] **Step 5: StepStage switch**

```tsx
// components/pages/path/step-stage.tsx
"use client";
import { PathSessionStep } from "@/lib/path-types";
import { VideoStep } from "./steps/video-step";
import { ArticleStep } from "./steps/article-step";
import { ResourceStep } from "./steps/resource-step";

export function StepStage({
  pathId, step, onComplete,
}: {
  pathId: string;
  step?: PathSessionStep;
  onComplete: (stepId: string, payload?: Record<string, any>) => void;
  onSelectStep: (id: string) => void;
  onNavigate: (path: string) => void;
}) {
  if (!step) return <div className="p-6 text-muted-foreground">Select a step to begin.</div>;
  switch (step.type) {
    case "VIDEO":
      return <VideoStep pathId={pathId} step={step} onComplete={onComplete} />;
    case "ARTICLE":
      return <ArticleStep step={step} onComplete={onComplete} />;
    case "RESOURCE":
      return <ResourceStep step={step} onComplete={onComplete} />;
    default:
      return (
        <div className="p-6 text-muted-foreground">
          {step.type} renderer coming next…
        </div>
      );
  }
}
```

- [ ] **Step 6: Typecheck + lint** — clean.
- [ ] **Step 7: Commit**
```bash
git add components/pages/path/step-stage.tsx components/pages/path/step-frame.tsx components/pages/path/steps lib/store.ts
git commit -m "feat(path): stage + inline video/article/resource step renderers"
```

---

## Task 7: QUIZ step (inline)

**Files:**
- Create: `components/pages/path/steps/quiz-step.tsx`
- Modify: `components/pages/path/step-stage.tsx` (add QUIZ case)

Reuse `CourseQuizPage` (`components/pages/course-quiz.tsx`), which takes `{ courseId, quizId, onNavigate, showNav, handleQuizSubmit(passed), onClose }`. On pass, complete the step. `courseId` = `step.groupId` for course-quizzes; for standalone quizzes it's null — pass `step.groupId ?? ""` and verify CourseQuizPage tolerates an empty courseId (it fetches the quiz by quizId; if it strictly requires courseId, see note).

- [ ] **Step 1: QuizStep**

```tsx
// components/pages/path/steps/quiz-step.tsx
"use client";
import { CourseQuizPage } from "@/components/pages/course-quiz";
import { PathSessionStep } from "@/lib/path-types";

export function QuizStep({
  step, onComplete, onNavigate,
}: {
  step: PathSessionStep;
  onComplete: (stepId: string, payload?: Record<string, any>) => void;
  onNavigate: (path: string) => void;
}) {
  return (
    <div className="p-2">
      <CourseQuizPage
        courseId={step.groupId ?? ""}
        quizId={step.itemId}
        showNav={false}
        onNavigate={onNavigate}
        handleQuizSubmit={(passed) => {
          // Record path-level completion regardless; score/points come from the
          // graded submission the quiz component already POSTed to /quizzes/:id/submit.
          onComplete(step.id, { passed });
        }}
      />
    </div>
  );
}
```

> Note: `CourseQuizPage` already submits to `/quizzes/:id/submit` (which writes UserQuiz.bestScore). Our `onComplete` then records the path-level UserRoadmapItem and refreshes the session, so the quiz's points/mastery reflect on the next session fetch (the container already re-fetches after complete). Verify `CourseQuizPage` works with `courseId=""`; if it throws/needs a real course, pass `step.groupId` and for standalone quizzes report DONE_WITH_CONCERNS — a small refactor of CourseQuizPage to make courseId optional may be needed (do it minimally if required).

- [ ] **Step 2: Add QUIZ case** to `step-stage.tsx`:
```tsx
    case "QUIZ":
      return <QuizStep step={step} onComplete={onComplete} onNavigate={onNavigate} />;
```
(import `QuizStep`.)

- [ ] **Step 3: Typecheck + lint** — clean.
- [ ] **Step 4: Commit**
```bash
git add components/pages/path/steps/quiz-step.tsx components/pages/path/step-stage.tsx
git commit -m "feat(path): inline quiz step"
```

---

## Task 8: EXERCISE + PROJECT steps (inline)

**Files:**
- Create: `components/pages/path/steps/exercise-step.tsx`
- Create: `components/pages/path/steps/project-step.tsx`
- Modify: `components/pages/path/step-stage.tsx` (add cases)

`ExercisePage` needs `{ courseId, exercise: Exercise, onNavigate }` — a full `Exercise` object. Fetch it via `getPathItem(step.payloadRef.endpoint)` (`/api/v3/exercises/:id`). `CourseProjectPage` needs `{ courseId, projectId, onNavigate }`.

- [ ] **Step 1: ExerciseStep**

```tsx
// components/pages/path/steps/exercise-step.tsx
"use client";
import { useEffect, useState } from "react";
import { ExercisePage } from "@/components/exercise";
import { PathSessionStep } from "@/lib/path-types";
import { useAppStore } from "@/lib/store";
import { Loader } from "@/components/ui/loader";
import { StepFrame } from "../step-frame";

export function ExerciseStep({
  step, onComplete, onNavigate,
}: {
  step: PathSessionStep;
  onComplete: (stepId: string, payload?: Record<string, any>) => void;
  onNavigate: (path: string) => void;
}) {
  const store = useAppStore();
  const [exercise, setExercise] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const data = await store.getPathItem(step.payloadRef.endpoint);
        setExercise(data);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.id]);

  if (loading) return <Loader />;
  if (!exercise)
    return <div className="p-6 text-muted-foreground">Exercise unavailable.</div>;

  return (
    <StepFrame step={step} onComplete={() => onComplete(step.id)} completeLabel="Mark complete & continue">
      <ExercisePage
        courseId={step.groupId ?? ""}
        exercise={exercise}
        onNavigate={onNavigate}
      />
    </StepFrame>
  );
}
```

- [ ] **Step 2: ProjectStep**

```tsx
// components/pages/path/steps/project-step.tsx
"use client";
import { CourseProjectPage } from "@/components/pages/course-project";
import { PathSessionStep } from "@/lib/path-types";
import { StepFrame } from "../step-frame";

export function ProjectStep({
  step, onComplete, onNavigate,
}: {
  step: PathSessionStep;
  onComplete: (stepId: string, payload?: Record<string, any>) => void;
  onNavigate: (path: string) => void;
}) {
  return (
    <StepFrame step={step} onComplete={() => onComplete(step.id)} completeLabel="Mark complete & continue">
      <CourseProjectPage
        courseId={step.groupId ?? ""}
        projectId={step.itemId}
        onNavigate={onNavigate}
      />
    </StepFrame>
  );
}
```

> Note: `CourseProjectPage` fetches the project by `projectId`. The backend plan flagged that the project GET route is by-slug, not id. Verify what `payloadRef.endpoint` (`/api/v3/projects/:id`) returns or whether `CourseProjectPage` resolves by id; if it needs a slug, fetch the project via `getPathItem(step.payloadRef.endpoint)` to obtain its slug, then pass that. If it 404s, report DONE_WITH_CONCERNS — backend route work may be needed.

- [ ] **Step 3: Add cases** to `step-stage.tsx`:
```tsx
    case "EXERCISE":
      return <ExerciseStep step={step} onComplete={onComplete} onNavigate={onNavigate} />;
    case "PROJECT":
      return <ProjectStep step={step} onComplete={onComplete} onNavigate={onNavigate} />;
```

- [ ] **Step 4: Typecheck + lint** — clean.
- [ ] **Step 5: Commit**
```bash
git add components/pages/path/steps/exercise-step.tsx components/pages/path/steps/project-step.tsx components/pages/path/step-stage.tsx
git commit -m "feat(path): inline exercise and project steps"
```

---

## Task 9: MOCK_INTERVIEW + BOOTCAMP steps + final wiring

**Files:**
- Create: `components/pages/path/steps/mock-step.tsx`
- Create: `components/pages/path/steps/bootcamp-step.tsx`
- Modify: `components/pages/path/step-stage.tsx`

Mock interview is a full session flow. For the inline embed, render the mock-interview template/entry inside the stage; "Start" launches the existing mock flow. Mock + bootcamp are OPTIONAL steps — surface a clear "optional / bonus" treatment and let the learner mark complete or skip.

- [ ] **Step 1: Recon the mock-interview entry.** Read `components/pages/mock-interviews/` to find the top-level component to render an interview by template id (`step.itemId`). The codebase map shows `mock-interview-template-card.tsx` and a chat/header set. Determine the minimal inline embed: render the template summary + a "Start interview" button that navigates to the existing mock route (`onNavigate`), OR embed the session component if it accepts a template id prop. Prefer the lightest correct embed.

- [ ] **Step 2: MockStep** (skeleton — adapt imports to what Step 1 found)

```tsx
// components/pages/path/steps/mock-step.tsx
"use client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PathSessionStep } from "@/lib/path-types";
import { StepFrame } from "../step-frame";

export function MockStep({
  step, onComplete, onNavigate,
}: {
  step: PathSessionStep;
  onComplete: (stepId: string) => void;
  onNavigate: (path: string) => void;
}) {
  return (
    <StepFrame step={step} onComplete={() => onComplete(step.id)} completeLabel="Mark complete">
      <div className="p-6 max-w-2xl mx-auto space-y-4">
        <Badge variant="outline">Optional · bonus</Badge>
        <p className="text-muted-foreground">
          Practice with a mock interview for this milestone.
        </p>
        <Button onClick={() => onNavigate(`/mock-interviews/${step.itemId}`)}>
          Start mock interview
        </Button>
      </div>
    </StepFrame>
  );
}
```

> Note: if the mock session component can be embedded with a template id, replace the navigate-out button with the inline component to honor "inline everything". The route `/mock-interviews/:id` is the existing template detail page. Use your Step-1 findings; if the inline session component requires complex setup (LiveKit room, tokens), embedding the template summary + inline start panel is the acceptable scoped version — note it.

- [ ] **Step 3: BootcampStep** — bootcamps are scheduled/cohort items; render a summary + link to the bootcamp page (optional/bonus), with mark-complete.

```tsx
// components/pages/path/steps/bootcamp-step.tsx
"use client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PathSessionStep } from "@/lib/path-types";
import { StepFrame } from "../step-frame";

export function BootcampStep({
  step, onComplete, onNavigate,
}: {
  step: PathSessionStep;
  onComplete: (stepId: string) => void;
  onNavigate: (path: string) => void;
}) {
  return (
    <StepFrame step={step} onComplete={() => onComplete(step.id)} completeLabel="Mark complete">
      <div className="p-6 max-w-2xl mx-auto space-y-4">
        {step.optional && <Badge variant="outline">Optional · bonus</Badge>}
        <p className="text-muted-foreground">Live cohort session for this milestone.</p>
        <Button onClick={() => onNavigate(`/bootcamps/${step.itemId}`)}>
          Open bootcamp
        </Button>
      </div>
    </StepFrame>
  );
}
```

- [ ] **Step 4: Add cases + default** to `step-stage.tsx`:
```tsx
    case "MOCK_INTERVIEW":
      return <MockStep step={step} onComplete={onComplete} onNavigate={onNavigate} />;
    case "BOOTCAMP":
      return <BootcampStep step={step} onComplete={onComplete} onNavigate={onNavigate} />;
```

- [ ] **Step 5: Typecheck + lint** — clean.
- [ ] **Step 6: Commit**
```bash
git add components/pages/path/steps/mock-step.tsx components/pages/path/steps/bootcamp-step.tsx components/pages/path/step-stage.tsx
git commit -m "feat(path): mock-interview and bootcamp steps; complete stage switch"
```

---

## Task 10: Entry point + final build

**Files:**
- Modify: wherever the path detail page links "Start/Continue" (e.g. `components/pages/learning-path-detail.tsx`) — add a primary "Continue in workspace" button routing to `/paths/[pathId]/learn`.

- [ ] **Step 1: Add the entry button.** Read `learning-path-detail.tsx`; near the existing enroll/continue CTA, add a button:
```tsx
<Button onClick={() => onNavigate?.(`/paths/${pathId}/learn`)}>
  Continue in workspace
</Button>
```
Match the file's existing prop names (`pathId`/`slug`, `onNavigate`/router). Do not remove existing CTAs (old routes stay live).

- [ ] **Step 2: Full build** — `npm run build`. Expected: compiles, the new route appears in the build output, zero type errors. Fix any errors surfaced (the per-task `tsc` should have caught most).

- [ ] **Step 3: Lint** — `npm run lint` → no new errors.

- [ ] **Step 4: Commit**
```bash
git add components/pages/learning-path-detail.tsx
git commit -m "feat(path): link path detail to the workspace"
```

---

## Verification (after all tasks)

- [ ] `npm run build` — succeeds, `/paths/[pathId]/learn/[[...stepId]]` listed.
- [ ] `npm run lint` — clean.
- [ ] **Manual / QA (needs backend running + an enrolled path):**
  - Open `/paths/<slug>/learn` → rail shows meters, course groups (collapsible, % badges), standalone steps; stage shows the resume step.
  - Click a video → plays; on finish (or Mark complete) the step turns DONE, meters update, cursor advances to next step automatically.
  - Quiz → take it; passing records completion and mastery points reflect in the Mastery meter on refresh.
  - Exercise/Project/Mock/Bootcamp render inline; complete advances.
  - Resource → opens external link, marks visited.
  - Hitting the points threshold flips the "Certificate unlocked" indicator.

---

## Notes for the implementer

- **Reuse, don't rebuild:** wrap the existing `VimeoPlayer`, `CourseQuizPage`, `ExercisePage`, `CourseProjectPage`, mock components. Bridge props (`courseId` ← `step.groupId`, fetch full objects via `getPathItem(payloadRef.endpoint)`).
- **The session is the source of truth:** after every `complete`, the container re-fetches the session so meters/groups/cursor stay correct. Optimistic `applyDelta` makes it feel instant.
- **Known backend gaps (flagged in the backend plan):** ARTICLE has no by-id GET route; PROJECT GET is by-slug not id. If a renderer's `payloadRef.endpoint` 404s, render a graceful fallback and report DONE_WITH_CONCERNS — these may need a small backend route addition in a follow-up.
- **courseId for standalone items:** `CourseQuizPage`/`ExercisePage`/`CourseProjectPage` assume a course context. Path-standalone items have `groupId: null`. If those components hard-require a course, make `courseId` optional in them with a minimal, surgical change — don't fork the components.
- **Scope discipline:** every step uses `StepFrame` for a consistent header + complete button. Don't redesign the existing sub-renderers; embed them.
