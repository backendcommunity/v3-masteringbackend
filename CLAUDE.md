# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Workflow Orchestration

### 1. Plan Node Default

- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately — don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy

- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop

- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done

- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)

- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes — don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing

- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests — then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.

## Project Overview

Mastering Backend is a learning platform for backend development. It's a Next.js 15 application with React 19 using the App Router, featuring courses, bootcamps, projects, roadmaps, mock interviews, and gamification (XP, badges, leaderboards).

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # Run ESLint
npm run start    # Start production server
```

Bundle analysis: Set `ANALYZE=true` before build.

## Architecture

### State Management

Two Zustand stores handle state:

- **`store/auth.ts`**: Authentication state (`useAuth`) - login, register, logout, token management via `mb_token` cookie
- **`lib/store.ts`**: Application data (`useAppStore`) - courses, projects, bootcamps, user data, API calls

The `lib/data.ts` file defines TypeScript interfaces (User, Course, Bootcamp, etc.) and a `dataStore` object for local caching. `lib/localDB.ts` provides localStorage persistence.

### API Layer

- **`lib/api.ts`**: Axios instance with base URL from `NEXT_PUBLIC_API_URL`, auto-redirects to login on 401/403
- **`lib/auth.ts`**: Auth-specific API calls (login, register, verify email, password reset)
- **`lib/courses.ts`**: Course-related API calls

### Authentication Flow

- Middleware (`middleware.ts`) protects all routes except `/auth/*` and `/xpayment`
- Token stored in both `mb_token` cookie and localStorage
- Unauthenticated users redirect to `/auth/login` with return URL

### Component Organization

- **`components/ui/`**: shadcn/ui primitives (Button, Dialog, Card, etc.) - uses Radix UI
- **`components/pages/`**: Full page components (course-detail, bootcamp-dashboard, etc.)
- **`components/`**: Shared components (dashboard-layout, navigation-bar, etc.)

### Routing Structure

App Router pages in `app/`:

- `/auth/*` - Login, register, verify, password reset
- `/courses/*` - Course listing and detail
- `/bootcamps/*` - Bootcamp programs
- `/projects/*` - Hands-on projects
- `/roadmaps/*` - Learning roadmaps
- `/mock-interviews/*` - AI mock interviews (uses LiveKit for real-time video)
- `/profile`, `/settings`, `/leaderboard` - User features

### Key Technologies

- **UI**: Tailwind CSS with CSS variables for theming (dark mode via next-themes)
- **Components**: shadcn/ui (configured in `components.json`)
- **Forms**: react-hook-form + zod validation
- **Video**: Vimeo player, LiveKit for real-time
- **Code Editor**: Monaco Editor
- **Notifications**: Sonner for toasts

### Path Aliases

Configured in `tsconfig.json`:

- `@/components` → `components/`
- `@/lib` → `lib/`
- `@/hooks` → `hooks/`
- `@/store` → `store/`

## Environment Variables

- `NEXT_PUBLIC_API_URL` - Backend API base URL (default: `http://localhost:8081/api/v3`)
- `NEXT_PUBLIC_WEBHOOK_URL` - WebSocket/code execution server

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
- Author a backlog-ready spec/issue → invoke /spec
