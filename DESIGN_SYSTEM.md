# MasteringBackend Design System — "Blueprint"

The visual system for the MasteringBackend platform. Born on the `/paths`
surfaces (June 2026), intended to spread to every catalog and working page.

**One sentence:** an engineer's brand with a learner's warmth — navy blueprint
heroes over a calm gray canvas, white working cards, one cyan accent that
always means *act*.

---

## 1. Principles

1. **Engineer's brand, learner's warmth.** Look like the tools backend
   developers already trust (Linear, Vercel, GitHub). Warmth comes from
   progress, milestones, and celebration — never from decorative illustration.
2. **The grid is identity.** The blueprint dot grid lives **inside navy
   heroes only** — where the brand speaks. The working canvas stays clean.
   Grid everywhere is noise; grid in the hero is signature.
3. **Progress is the protagonist.** Every key surface answers *"where am I,
   what's next"* before it says anything else. A hero must carry meters or
   stats — a banner that doesn't work doesn't ship.
4. **Colors are verbs.** Cyan = act/active. Emerald = mastered/done.
   Amber = level. Red = hard/destructive. Never decorate with semantic color.
5. **Depth from layers, not effects.** Navy anchor → gray canvas → white
   cards. No gradients, no shadow theater. (Brand-navy gradients on content
   surfaces were removed deliberately — don't reintroduce.)
6. **Built for our market.** Mobile-first, data-cost-aware: inline SVG only,
   no illustration assets, fast first paint. Beautiful at 3G.
7. **One hero per page type.** Catalog/index pages get the navy hero;
   working pages (workspace, dashboards) stay flat. The moment every page
   has a hero, none does.

## 2. Brand foundations

### Typography — Satoshi
**Satoshi is the brand font, everywhere.** Loaded via Fontshare in
`app/layout.tsx`; applied by the `body` rule in `app/globals.css`
(`"Satoshi", system-ui, sans-serif`). Do not introduce other typefaces.

| Role | Style |
|---|---|
| Page/hero title | `text-2xl`–`text-3xl font-bold` |
| Card title | `text-[15px] font-bold leading-snug` |
| Body / description | `text-sm text-muted-foreground leading-relaxed` |
| Meta / counts | `text-[11px]`–`text-[13px] text-muted-foreground` |
| **Eyebrow** (`.eyebrow-mono`) | `11px / 700 / tracking .18em / uppercase` — section markers on heroes, e.g. `// learn`, `path completion` |

The `//` code-comment prefix on eyebrows is the engineering wink — keep it.

### Color tokens (light)
| Token | Value | Use |
|---|---|---|
| `--background` | `216 25% 97%` `#F5F7FA` | Gray canvas — pages |
| `--card` | `0 0% 100%` | White working surfaces |
| Navy (hero) | `#0E1F33` (`bg-deep`) + strip `#0A1726` | Hero anchor only |
| `--primary` | `190 83% 44%` `#13AECE` | Actions, active, progress |
| Cyan-light | `#4AC5E8` | Accents on navy (badges, eyebrows) |
| Emerald | `emerald-400/500/600` | Done, mastery, certificates |
| Amber | `amber-100/400/700` | Level badges only |

Dark mode keeps the same semantics (`#171B26` canvas / `#1E2330` cards).

### The blueprint grid
`.hero-grid` utility (globals.css): white dots at 14% opacity, 22px spacing,
absolutely positioned **inside navy heroes only**. Never on the canvas,
never under dense card lists.

## 3. Surfaces

### Layer model
```
NAVY HERO  (#0E1F33 + .hero-grid)   ← identity + meters/stats
GRAY CANVAS (--background)          ← the field
WHITE CARDS (--card, border, r-2xl) ← the work
```

### Catalog hero (`/paths`, future `/mock-interviews`, `/courses`)
Anatomy, top→bottom: eyebrow (`// learn` — the Learn/Build/Grow pillar this
catalog belongs to) → title + cyan capability badge → one-line pitch →
platform stat row (`12 paths · 8,420 learners · 320h · 1,250 certificates`,
certificates in emerald). Right side: the **Journey glyph** (see §5).
Max height ≈ 180px. No CTA in catalog heroes — the cards are the CTA.

### Detail hero (`/paths/[id]`)
Eyebrow `// learning path` → `text-3xl` title → **primary CTA in the hero**
(`Continue Path` enrolled / `Enroll in path` + price line preview) → meta row
(amber level chip · duration · milestones · courses · learners).

**Completion strip** (enrolled only), darker navy `#0A1726`, below the hero
in the same rounded container: `PATH COMPLETION` cyan bar + `%`, and
`MASTERY · CERTIFICATE` emerald bar + `earned/threshold`. This is what makes
the hero functional on every visit — if a detail surface can't show meters,
it doesn't get a hero (principle 3/7).

### Working pages
Flat. Breadcrumb, content, white cards. No hero, no grid. The workspace,
dashboards, and settings never get the navy treatment.

## 4. Components (card DNA)

- **Card**: `bg-card rounded-2xl border border-border p-5`,
  `hover:shadow-md hover:border-primary/30` when clickable. No images/avatars
  in list cards.
- **PathCard / template card**: meta line (`9 courses · 12 milestones`,
  11px muted) + bookmark top-right → bold 15px title → 13px clamped
  description → slim progress (`h-1.5`, enrolled only) → footer:
  `border-t border-border/50`, duration left, level/difficulty pill +
  action button right.
- **Pills**: `rounded-full px-2 py-0.5 text-[11px] font-semibold` with a
  1.5px dot. Beginner/Easy = emerald, Intermediate/Medium = amber,
  Advanced/Hard = red.
- **Tab chips**: `rounded-xl px-3.5 py-2 text-sm font-medium`; active =
  `bg-primary text-primary-foreground`, rest = bordered + muted.
- **Up-next card** (detail): brand icon tile (`bg-primary/10 text-primary`)
  → eyebrow `UP NEXT · MILESTONE N` → step title → context line → inline
  progress + count → right-aligned `Continue` button.
- **Share row**: monochrome outline icon buttons (LinkedIn/X/Facebook/copy),
  brand color on hover only. No brand-colored social buttons.
- **Empty states**: icon + title + one sentence + optional clear-filters.

## 5. The Journey glyph

`JourneyGlyph` (in `learning-paths.tsx`): the Learn → Build → Grow cycle —
three nodes (LEARN cyan-filled book · BUILD code brackets · GROW emerald
trend) on a dashed orbit with arrowheads, labels in tracked caps. It is the
company thesis as ~2KB of inline SVG. Catalog heroes only; the detail hero
stays typographic (its right side is breathing room, its bottom is meters).

Pillar→catalog mapping for eyebrows and future glyph variants:
**Learn** = courses, paths, bootcamps · **Build** = projects, project30,
MB lands · **Grow** = mock interviews, certification.

## 6. Do / Don't

- ✅ Hero carries real data (stats or meters), ≤180px on catalogs.
- ✅ Grid inside heroes; canvas stays clean.
- ✅ Cyan for the one primary action per view.
- ❌ No new fonts. Satoshi only.
- ❌ No gradients on content surfaces, no banner without function.
- ❌ No amber outside level, no emerald outside done/mastery.
- ❌ No images/avatars in list cards; no off-palette brand-colored buttons
  (social share included).
- ❌ Never texture the working canvas.

## 7. File map

| What | Where |
|---|---|
| Tokens + `.hero-grid` + `.eyebrow-mono` | `app/globals.css` |
| Satoshi loading | `app/layout.tsx` (Fontshare link) |
| Catalog hero + `JourneyGlyph` | `components/pages/learning-paths.tsx` |
| Detail hero + completion strip | `components/pages/learning-path-detail.tsx` |
| Card DNA reference | `components/pages/paths/path-card.tsx`, `components/pages/mock-interviews/mock-interview-template-card.tsx` |
