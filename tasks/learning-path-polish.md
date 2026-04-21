# Learning Path Polish — Implementation Plan

**Scope:** `/paths/:slug` (learning-path-detail.tsx) + supporting stores/backend
**Date:** 2026-03-29
**Status:** Planning

---

## 1. Current State Audit (Critical Gaps)

### Hardcoded / Broken Data
| Location | Current | Should Be |
|---|---|---|
| Topic progress bar | `value={50}` | `topic.userTopic?.progress ?? 0` |
| Current course progress | `35%` + `"Chapter 3 of 8"` | Derived from `userTopic.completedItems` |
| Topic % label | `"50% complete"` | `${topic.userTopic?.progress ?? 0}% complete` |
| Current topic card | Shows topic only | Shows exact video/content to resume |
| Completed course "Review" | No CTA | Navigate to last-watched position |

### Backend Data Available (not yet used)
- `topic.completed` → boolean, computed by `buildResolvedTopics`
- `topic.progress` → `userTopic.progress` integer (0–100)
- `topic.userTopic.totalTasks` → denominator for progress
- `topic.courses[].isCompleted` → per-course completion
- `userTopic.completedItems` → array of `{ itemId, itemType, completed }` — available via `getMilestone(slug, topicId)`

### Missing Analytics Events
Frontend fires zero analytics events for the learning path feature.

---

## 2. Task Breakdown

### Task 1 — Real Progress Data (All Progress Bars)

**Problem:** Every progress bar in the enrolled view uses hardcoded values.

**Solution:** The backend `resolveRoadmaps → buildResolvedTopics` already computes:
- `topic.progress` (int 0–100) from `completedCount / totalContentsMap[topicId] * 100`
- `topic.completed` (bool)

The `roadmap.progress` is also computed server-side.

**Changes (frontend only, no backend changes needed):**

```
learning-path-detail.tsx:

1. Overall progress bar (enrolled header):
   - Replace progress calculation with roadmap.progress (already server-side)

2. Current topic card progress bar:
   - Replace value={50} with currentTopic.progress ?? 0
   - Replace "50% complete" with `${currentTopic.progress ?? 0}% complete`

3. Current course card inner progress:
   - Replace "35%" with computed value from getMilestone
   - Replace "Chapter 3 of 8" with real chapter count from course.chapters

4. Progress overview grid (Topics Completed stat):
   - Derive from resolvedTopics: topics.filter(t => t.completed).length
   - This is reliable since backend computes it

5. Learning-paths.tsx card progress:
   - Currently uses topicIndex / topics.length — replace with roadmap.progress
   - roadmap.progress is already returned by resolveRoadmaps
```

**Backend note:** `getRoadmaps` (list endpoint) calls `resolveRoadmaps` → `buildResolvedTopics`. Confirm `roadmap.progress` is included in the list response. If not, ensure `fetchRoadmapDashboardData` is called for list too.

---

### Task 2 — Current Topic Card: Show Exact Resume Point

**Problem:** The "Current" card shows only the topic title and a generic "Continue Topic" button. Users don't know *where* they are in the topic.

**Solution:** On page load for enrolled users, call `getMilestone(pathId, currentTopic.id)` to get `completedItems`. Find the first uncompleted item. Show it as the "next up" item in the current topic card.

**UX Design:**
```
┌─────────────────────────────────────────┐
│ 🔵 Current: [Topic Title]               │
│    [topic description...]               │
│                                         │
│  ▶ Next Up                              │
│  ┌──────────────────────────────────┐   │
│  │ 📹 [Video Title]                 │   │
│  │    Chapter 3 · 12 min remaining  │   │
│  └──────────────────────────────────┘   │
│                                         │
│  ████████░░░░░░ 52%   4/8 complete      │
│                                         │
│  [ Continue Topic ]  [ Resources ]      │
└─────────────────────────────────────────┘
```

**Implementation:**
```typescript
// New state in component
const [currentItem, setCurrentItem] = useState<{
  type: string; title: string; chapterTitle?: string; itemIndex: number; totalItems: number;
} | null>(null);

// Load on mount for enrolled users
useEffect(() => {
  if (!isEnrolled || !currentTopic) return;
  loadCurrentItem();
}, [isEnrolled, currentTopic?.id]);

async function loadCurrentItem() {
  const milestone = await store.getMilestone(pathId, currentTopic.id);
  const completedIds = new Set(
    (milestone?.userTopic?.completedItems ?? [])
      .filter((ci: any) => ci.completed)
      .map((ci: any) => ci.itemId)
  );
  const totalTasks = milestone?.userTopic?.totalTasks ?? 0;
  const completedCount = milestone?.userTopic?.completedItems?.filter((ci: any) => ci.completed).length ?? 0;

  // Walk courses → chapters → videos to find first uncompleted
  for (const courseItem of currentTopic.courses ?? []) {
    const course = courseItem.course ?? courseItem;
    for (const chapter of course.chapters ?? []) {
      for (const video of chapter.videos ?? []) {
        if (!completedIds.has(video.id)) {
          setCurrentItem({ type: "video", title: video.title, chapterTitle: chapter.title,
            itemIndex: completedCount, totalItems: totalTasks });
          return;
        }
      }
    }
  }
  // Walk non-course items
  const otherItems = getNonCourseItems(currentTopic, true);
  const nextOther = otherItems.find(i => !completedIds.has(i.id));
  if (nextOther) {
    setCurrentItem({ type: nextOther.type, title: nextOther.title,
      itemIndex: completedCount, totalItems: totalTasks });
  }
}
```

**Current topic card render:**
- Show `currentItem.title` with its type icon as "Next Up"
- Show `${currentItem.itemIndex} / ${currentItem.totalItems} complete`
- Replace the two hardcoded progress values with real data from `currentTopic.progress`

---

### Task 3 — Review Completed Content

**Problem:** Completed topics/courses show only "✓ Done" with no way to revisit content.

**Solution:** Add "Review" CTAs to completed items. Navigation mirrors the "continue" flow but always goes to the first video (or the course detail).

**Design:**
- Completed **courses**: show a small "↩ Review" ghost button → `routes.roadmapCoursePreview(pathId, topicId, courseId)`
- Completed **exercises/quizzes/projects**: show "↩ Retry" or "↩ Review" → same routes as live content
- Completed **topics header**: add "Review Topic" link

**Implementation in `renderContentItem`:**
```tsx
// For completed items, show a review button instead of nothing
{isCompleted && (
  <Button size="sm" variant="ghost" className="w-full mt-2 h-7 text-xs"
    onClick={() => { /* same navigation switch as active items */ }}>
    <RotateCcw className="h-3 w-3 mr-1" />
    Review
  </Button>
)}
```

For completed course cards in the completed topics section, add a small "Review" link next to the "✓ Done" badge.

---

### Task 4 — Certificate Card (Motivational Sidebar)

**Design:** Always visible in the enrolled sidebar. Two states:

**In-progress state:**
```
┌──────────────────────────────┐
│ 🏆 Your Certificate          │
│                              │
│  ████████████░░░░ 72%        │
│  "Complete all topics to     │
│   earn your certificate"     │
│                              │
│  [  Preview Certificate  ]   │
│  (blurred preview image)     │
└──────────────────────────────┘
```

**Completed state:**
```
┌──────────────────────────────┐
│ 🏆 Certificate Earned! 🎉    │
│                              │
│  [Certificate Preview]       │
│                              │
│  [ Download PDF ]            │
│  [ Share on LinkedIn ]       │
└──────────────────────────────┘
```

**Psychology:** The blurred certificate preview creates a "curiosity gap" and loss aversion — you can almost see it, you want to unlock it.

---

### Task 5 — Psychology & Engagement (Hooked Model)

The Hooked model (Nir Eyal): **Trigger → Action → Variable Reward → Investment**

#### 5a. Triggers

**External triggers** (surface in the UI):
- Progress notification-style banners: "You're 67% of the way — past the hardest part!"
- Streak callout: "Keep your 14-day streak going!"
- Time investment: "You've invested 8 hours in this path"

**Internal triggers** (design to create associations):
- Boredom → "What to learn next?" — show a clear next action
- Anxiety about career → Show "Learners who completed this path got hired at [companies]"
- FOMO → "234 learners enrolled this week"

**Implementation:**
```tsx
// Motivational banner in enrolled view (between header and progress card)
{isEnrolled && currentTopic && (
  <div className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="font-semibold">
          {progress >= 75 ? "🔥 Almost there! You're in the final stretch." :
           progress >= 50 ? "💪 Past the halfway point — keep the momentum!" :
           progress >= 25 ? "✅ Great start! You're building real momentum." :
           "🚀 Your journey begins. The best backend engineers started here."}
        </p>
        <p className="text-sm text-blue-100 mt-1">
          {completedTopics.length} of {topics.length} topics complete
        </p>
      </div>
      {user?.currentStreak && user.currentStreak > 1 && (
        <div className="text-center ml-4 flex-shrink-0">
          <div className="text-2xl font-bold">{user.currentStreak}</div>
          <div className="text-xs text-blue-100">day streak 🔥</div>
        </div>
      )}
    </div>
  </div>
)}
```

#### 5b. Variable Reward

The "variable reward" is the unpredictability that makes habits sticky (slot machine principle):

- **Topic completion celebration:** When last item of a topic is marked complete, show a toast with XP earned
- **Unlocking next topic:** Animate the next topic "unlocking" when current completes
- **Milestone badges:** Show "You're now 50% through [Path]" milestone notification
- **Leaderboard glimpse:** In sidebar, show "You're in the top X% of this path" (uses roadmap.students count)

**Implementation:**
```tsx
// In sidebar — social proof + leaderboard teaser
{isEnrolled && roadmap.students > 0 && (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center gap-2 mb-2">
        <Users className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-medium">Learning Together</span>
      </div>
      <p className="text-2xl font-bold">{roadmap.students.toLocaleString()}</p>
      <p className="text-xs text-muted-foreground">learners enrolled</p>
      {progress > 0 && (
        <p className="text-xs text-green-600 mt-2 font-medium">
          You're ahead of {Math.round(progress * 0.6)}% of learners
        </p>
      )}
    </CardContent>
  </Card>
)}
```

#### 5c. Investment (makes users more likely to return)

The more a user invests, the more they value the product:

- **Show time invested:** "You've invested 12 hours in this path" (use `userTopic.timeInvested` from backend)
- **Show items completed:** X videos watched, Y quizzes passed
- **XP earnings:** "You've earned 450 MB from this path"
- **Streak contribution:** "This path contributed to 14 of your streak days"

**Implementation (Quick Stats sidebar, enrolled view):**
```tsx
// Enhanced Quick Stats card
<Card>
  <CardHeader>
    <CardTitle className="text-lg">Your Investment</CardTitle>
  </CardHeader>
  <CardContent className="space-y-3">
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">Topics completed</span>
      <span className="font-semibold">{completedTopics.length}/{topics.length}</span>
    </div>
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">Overall progress</span>
      <span className="font-semibold text-blue-600">{progress}%</span>
    </div>
    <Separator />
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground flex items-center gap-1">
        <Zap className="h-3 w-3" /> XP earned
      </span>
      <span className="font-semibold text-yellow-600">
        {completedTopics.length * 5 * 10} MB
      </span>
    </div>
  </CardContent>
</Card>
```

#### 5d. Progress Momentum ("Endowed Progress Effect")

The endowed progress effect: people are more motivated when they feel they've already started. Show progress as already started from day 1.

- Even for freshly enrolled users, show "1 of X topics" not "0 of X"
- Animate progress bars on page load (CSS transition from 0 → actual value)
- Show "You enrolled X days ago" to anchor investment

---

### Task 6 — Analytics & Tracking

Every meaningful user action must be tracked. Use `analytics.track()`.

| Event | Trigger | Properties |
|---|---|---|
| `path_viewed` | Page load | `{ pathId, pathTitle, isEnrolled, progress }` |
| `path_enrolled` | After successful enrollment | `{ pathId, pathTitle, method }` |
| `path_enrollment_started` | User clicks any enroll button | `{ pathId, source: "sidebar"/"curriculum"/"listing" }` |
| `path_payment_dialog_opened` | PaymentDialog opens | `{ pathId, roadmapAmount }` |
| `path_continue_clicked` | Continue/Resume button | `{ pathId, topicId, topicTitle, contentType }` |
| `path_content_clicked` | Individual content item | `{ pathId, topicId, contentType, contentId, contentTitle }` |
| `path_completed_content_reviewed` | Review button on completed item | `{ pathId, contentType, contentId }` |
| `path_waitlist_clicked` | Join waitlist on isWaiting path | `{ pathId, waitingLink }` |

**Implementation:** Add analytics calls directly in the relevant handlers. Import from `@/lib/analytics`.

---

### Task 7 — UX / UI Fixes

#### 7a. Remove Unnecessary Elements
- **"Resources" button** on current topic card: it does nothing. Remove.
- **"Back to Path" / "All Paths" button text** is inconsistent between enrolled/non-enrolled — standardize to "← Learning Paths"
- **Duplicate PaymentDialog rendering**: currently rendered in both branches. Refactor to render once at component bottom.

#### 7b. Empty States
- When `topics.length === 0`: show "This path has no content yet" instead of broken layout
- When `currentTopic.courses.length === 0` and no other items: show helpful message

#### 7c. Loading States
- The `navigateToFirstUncompletedVideo` function shows `navigating` state but only on a few buttons. Apply `disabled={navigating}` consistently.
- Add a skeleton/shimmer for `currentItem` while `getMilestone` loads.

#### 7d. Visual Hierarchy Improvements
- **Timeline connector line** between topics should be color-coded: green for completed, blue for current, gray for upcoming
- **Topic numbers** in the timeline should be consistently sized
- **Badge colors**: "Locked" should be `variant="outline"` with lock icon — not gray filled
- **Non-enrolled curriculum**: course cards are all blue — make them more distinct (vary by content type)

#### 7e. Mobile Responsiveness
- The 3-column grid (`lg:grid-cols-3`) collapses properly on mobile, but the sidebar renders below content
- On mobile, the sidebar's "Continue Learning" card should float as a sticky CTA at the bottom

---

### Task 8 — Accessibility

| Issue | Fix |
|---|---|
| Progress bars lack ARIA | Add `role="progressbar"` `aria-valuenow` `aria-valuemin="0"` `aria-valuemax="100"` |
| Icon-only locked badges | Add `aria-label="Locked content"` |
| PaymentDialog focus trap | Verify `DialogContent` traps focus (shadcn/ui Dialog does this by default) |
| Color-only status | Don't rely on color alone — "✓ Done" text + green color is correct; "Locked" needs lock icon + text (already has Lock icon) |
| Keyboard navigation | All interactive cards should be keyboard focusable — wrap in `button` or add `tabIndex={0}` + `onKeyDown` |
| `aria-busy` during loading | Add to the main container when `navigating === true` |

---

### Task 9 — Error Handling

| Scenario | Current | Fix |
|---|---|---|
| `getMilestone` fails | Silently falls back, may navigate to `/paths/:slug` | Catch error, show toast "Couldn't load your progress, try again" |
| `enrollInRoadmap` fails with specific messages | Shows generic error | Parse and show backend message (already done partially) |
| `waitingLink` is null when `isWaiting=true` | "Join Waitlist" button is hidden | Show "Contact us to join the waitlist" text link instead |
| Topic has no courses/items | UI shows nothing | Show "No content in this topic yet" |
| API returns empty `completedItems` | Works — treated as empty Set | ✅ already handled |
| `roadmap.paddle_price_id` is null | PaymentDialog shows error toast | Add `disableOnetime={!roadmap?.paddle_price_id}` prop to gray it out upfront |

---

### Task 10 — Branding Alignment

Masteringbackend brand: **Navy `#0E1F33`** + **Teal `#13AECE`** + clean minimal dark/light mode.

| Element | Current | Fix |
|---|---|---|
| Motivational banner | N/A | Gradient from `#0E1F33` to `#13AECE` |
| Current topic border | `border-blue-200` | Keep — consistent with design |
| Enrollment CTA sidebar | Generic blue | Use `bg-[#13AECE]` for primary action |
| Certificate card icon | N/A | Gold `#F2C94C` for Trophy (matches existing rewards) |
| Progress bars | Generic blue | Keep — sufficient |
| "Coming Soon" state | Generic blue circle | Use brand teal bg circle |

---

## 3. Implementation Order

Priority is `impact × ease`:

| # | Task | Impact | Effort | Priority |
|---|---|---|---|---|
| 1 | Fix all hardcoded progress bars (Task 1) | High | Low | **P0** |
| 2 | Current topic card — show exact resume point (Task 2) | High | Medium | **P0** |
| 3 | Analytics tracking (Task 6) | High | Low | **P0** |
| 4 | Review completed content (Task 3) | High | Low | **P1** |
| 5 | Certificate card (Task 4) | High | Low | **P1** |
| 6 | Psychology/Hooked features (Task 5) | High | Medium | **P1** |
| 7 | Error handling (Task 9) | Medium | Low | **P1** |
| 8 | UX fixes — remove dead buttons, empty states (Task 7) | Medium | Low | **P2** |
| 9 | Accessibility (Task 8) | Medium | Low | **P2** |
| 10 | Branding alignment (Task 10) | Low | Low | **P2** |

---

## 4. Backend Changes Required

Minimal. Backend already computes most data. Only one change needed:

### 4a. Expose `roadmap.progress` in the roadmap list endpoint

**File:** `src/modules/roadmaps/queries/get-roadmaps.ts`
**Change:** Confirm `resolveRoadmaps` is called for list endpoint (not just slug endpoint). If not, call it.

Currently `getRoadmaps` (list) may not resolve per-user progress data. `getRoadmapBySlug` does. Verify and align.

**Why:** `learning-paths.tsx` currently computes `progress` from `topicIndex / topics.length` instead of using backend's accurate `roadmap.progress`. If the list endpoint already returns `progress` from `resolveRoadmaps`, just use it.

### 4b. No other backend changes needed

`buildResolvedTopics` already returns `topic.progress`, `topic.completed`, `topic.userTopic`. All data is there — we just aren't using it in the frontend.

---

## 5. Files to Change

| File | Changes |
|---|---|
| `components/pages/learning-path-detail.tsx` | ALL 10 tasks — primary file |
| `components/pages/learning-paths.tsx` | Use `roadmap.progress` from backend (Task 1), add `path_viewed` analytics |
| `lib/store.ts` | No changes needed |

---

## 6. Key Decisions

1. **`getMilestone` call on page load (enrolled users only):** Adds one extra API call. Acceptable — it's the same call that the video watch page makes. Cache TTL already covers it.

2. **PaymentDialog rendered once:** Move to component bottom outside both conditional returns using a React fragment or portal pattern.

3. **"Review" on completed items:** Uses the same navigation routes as active items. No new pages needed.

4. **Time invested:** Backend returns `timeInvested` on userTopic via `getRoadmapTopic`. Since we don't call per-topic on page load, we'll compute an estimate: `completedTopics.length * avgTopicDuration`. Show only for enrolled users with ≥1 completed topic.

5. **Certificate card:** For now, shows progress toward certificate. The actual PDF download is a separate feature (certificate module already exists for courses). Wire to `routes.pathCertificate` when available; for now show a "coming soon" state on the certificate card itself.
