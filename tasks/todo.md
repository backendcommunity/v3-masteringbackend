# Course watch → exact Path Step (PathWorkspace) experience

Goal: course `/watch` renders the EXACT path-step component (`PathWorkspace`), full-bleed,
own `PathTopBar`, sidebar transcript — driven by a course-built `PathSession`.

## Contract (both sides agree)
PathSession / PathSessionStep / PathSessionDelta / CelebrationEvent — see `lib/path-types.ts`.

Endpoints (REST, `/api/v3`):
- `GET  /courses/:slug/session`                → PathSession (built from the course)
- `POST /courses/:slug/steps/:stepId/complete` → PathSessionDelta   (body = payload)
- `POST /courses/:slug/steps/:stepId/progress` → 200                (body = { duration })

`payloadRef.endpoint` per step must resolve to existing course item endpoints whose shape the
path step components already consume (getPathItem is generic — just GETs it).

## Backend (academy repo · Solomon)
- [ ] Mirror `src/modules/paths/helpers/build-session.ts` → build PathSession from a Course:
      chapters → PathGroup(type:"COURSE"); videos/quizzes/exercises/playgrounds → steps; cursor.resumeStepId =
      first incomplete; path progress/mastery/points/isCompleted from course progress. Courses don't issue path
      certs → certEligible:false (PathWorkspace tolerates no-cert).
- [ ] Mirror `complete-step.ts` → complete a course step → PathSessionDelta; map to existing markVideoComplete /
      quiz / exercise completion + points; celebrations percent/levelUp/topicCompleted (NO certUnlocked).
- [ ] progress endpoint → persist watch duration. Preserve premium gating via step `access.allowed/reason`.
- [ ] Mount under courses module routes.

## Frontend (v3 repo · Quadri)
- [ ] Store methods: getCourseSession / completeCourseStep / updateCourseStepProgress → the 3 endpoints.
- [ ] Generalize `PathWorkspace` WITHOUT forking — optional injected props defaulting to path store methods:
      loadSession?, completeStep?, updateProgress?, stepRoute?(id,stepId)=>string. Path step stays identical.
- [ ] Full-bleed course route mirroring path learn route: add `app/courses/[slug]/learn/[[...stepId]]/page.tsx`
      → bare `<main h-screen overflow-hidden>` + `<PathWorkspace>` with course loaders + stepRoute. NO DashboardLayout.
- [ ] Old watch route → resolve chapter/video to a stepId and redirect to `/courses/:slug/learn/:stepId`.
- [ ] Do NOT touch path-* files except the minimal PathWorkspace prop additions.

## Verify
- [ ] Path step unchanged (regression). Course watch = exact PathWorkspace, full-bleed, transcript centered.
- [ ] Premium gate still blocks premium videos. Both builds green.
