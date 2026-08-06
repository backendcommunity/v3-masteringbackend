# Frontend Architecture Migration Runbook

**Audience:** frontend engineers working in this repository  
**Status:** implementation guide  
**Primary constraint:** no breaking changes

This document turns the architecture review into an executable migration. It is deliberately incremental: the application must continue to serve the same URLs, accept the same cookies, call the same backend contracts, and support the same user workflows after every merged pull request.

Do not start by rewriting pages or replacing every API call. Establish safety, add seams around the existing behaviour, migrate one vertical slice at a time, and only then delete obsolete code.

## 1. Definition of “non-breaking”

The following are public compatibility contracts. Do not alter one without an approved, separately planned migration.

- All current browser routes, route parameters, redirects, and deep links.
- The `mb_token` and `mb_refresh_token` cookie names, semantics, and expiry behaviour.
- Existing backend endpoint paths, HTTP methods, request payloads, and response envelopes.
- OAuth hand-off URLs and their `redirect`/`ref` query parameters.
- Public access to `/portfolios/:userId`, `/certifications/verify/:code`, `/ai/payment`, and `/xpayment`.
- Payment provider checkout behaviour and webhook-driven enrollment.
- Playground, exercise socket, executor, and LiveKit session flows.
- Existing environment variable names until their replacement has been deployed everywhere.

For every change, define:

1. The old path.
2. The new path.
3. The feature flag or fallback that selects between them.
4. The metrics that prove the new path works.
5. The exact rollback action.

## 2. Working rules

### 2.1 Keep each PR narrow

One PR should do one of these jobs: add instrumentation, introduce an adapter, migrate one endpoint family, extract one module, or remove a fully unused legacy path. Do not mix refactors with product changes.

### 2.2 Add before redirecting

Use this sequence for every migration:

```text
observe → add compatible implementation → test → shadow/opt in → make default → observe → remove old implementation
```

Never replace a direct integration in the same PR that introduces a new proxy, token mechanism, or service contract.

### 2.3 Preserve one source of truth

The backend owns authorization and canonical user/domain data. Browser stores may cache and render data, but must not become an authorization source or a competing session authority.

### 2.4 Keep server-only data server-only

Any variable prefixed `NEXT_PUBLIC_` is intentionally available to browser JavaScript. Only put public routing/configuration values there. Provider secrets, internal service URLs, signing keys, and privileged API credentials must be server-only variables.

## 3. Baseline: mandatory checks before changing architecture

Run these commands and attach results to the first migration issue/PR:

```bash
yarn build:check
yarn test
yarn e2e
yarn tsc --noEmit
```

Record these in the migration issue:

- Build result and all existing type/lint failures.
- Test failures or known flaky tests.
- Route smoke-test results for login, public portfolio, certificate verification, checkout, course playback, an exercise, a playground, and a mock interview.
- Sentry error rate, frontend API error rate, refresh-token failure rate, and browser console errors for the prior seven days.
- The deployed frontend version and API/service versions used by staging.

Do not treat an existing failure as harmless. Classify it as one of: fix now, accepted temporary baseline with an owner/date, or remove obsolete test/code.

## 4. Phase 0 — map ownership and add observability

### Objective

Create an accurate system map before changing traffic flow.

### Deliverables

1. A service inventory with owner, base URL, authentication mechanism, user-facing dependency, and rollback owner for:
   - Academy API (`NEXT_PUBLIC_API_URL`)
   - webhook/socket service (`NEXT_PUBLIC_WEBHOOK_URL`)
   - playground worker (`NEXT_PUBLIC_PLAYGROUND_WORKER_URL`)
   - executor (`NEXT_PUBLIC_EXECUTOR_URL`)
   - exercise Socket.IO endpoint
   - LiveKit
   - Paddle and AsyncPay
2. A route inventory marking public, authenticated, admin-only, payment, and real-time routes.
3. A request correlation convention: generate or forward one request ID from browser → BFF → downstream service.
4. Dashboards for request volume, latency, status code, retry, and fallback usage per service.

### Implementation steps

1. List all direct calls with `rg` and categorize each by service and domain.
2. Add a small telemetry helper. It must redact tokens, cookies, email addresses, payment fields, and user-generated code.
3. Add request IDs to the common HTTP client first. For raw `fetch` calls, add the same header through a wrapper in later phases.
4. Add Sentry tags: `domain`, `operation`, `transport`, `service`, and `request_id` when available.
5. Do not log response bodies by default.

### Validation

- Verify one request from each service can be followed in frontend telemetry and downstream logs.
- Confirm Sentry events do not contain Authorization headers, cookies, or PII beyond approved identifiers.

### Rollback

Disable only the new telemetry flag. Never disable existing error reporting while investigating a migration.

## 5. Phase 1 — restore release safety

### Objective

Make CI a reliable signal before moving architecture.

### Current risk

`next.config.js` currently ignores build-time ESLint and TypeScript errors. This allows an invalid application to deploy.

### Implementation steps

1. Add scripts without changing existing names:

```json
{
  "typecheck": "tsc --noEmit",
  "test:unit": "vitest run",
  "test:e2e": "playwright test"
}
```

2. Run `typecheck` and lint in CI as **non-blocking reporting jobs**. Publish outputs as artifacts.
3. Fix failures in focused PRs. Prefer correct types and real fixes; do not blanket files with `any`, `@ts-ignore`, or disabling rules.
4. Change CI jobs to required once the baseline is green.
5. Remove `ignoreBuildErrors` and `ignoreDuringBuilds` in a dedicated PR after CI is required and green.
6. Make the production build run the same commands as CI.

### Required gates before merge

```text
typecheck passes
lint passes
unit tests pass
affected E2E smoke tests pass
production build passes
```

### Rollback

If a newly required check blocks a release due to an unrelated known baseline, temporarily mark only that CI check advisory, create a dated corrective issue, and restore it to required within one sprint. Do not re-enable skipped production type checks as the normal solution.

## 6. Phase 2 — centralize configuration

### Objective

Replace scattered environment lookups and inconsistent localhost defaults with validated configuration.

### Target structure

```text
lib/config/
  client.ts       # values safe for browser code
  server.ts       # server-only values
  schema.ts       # shared validation and types
  index.ts        # explicit exports only
```

### Implementation steps

1. Define a schema for each current variable, including valid URL format and environment-specific requirements.
2. Keep every current name as an input alias. Resolve existing `NEXT_PUBLIC_API_URL` before introducing a replacement name.
3. Export named values such as `clientConfig.academyApiUrl`; do not expose `process.env` from application modules.
4. Validate client configuration at application startup and server configuration at server/BFF startup. Fail closed in production for required service configuration.
5. Update one domain at a time to consume the config module.
6. Add a test that verifies all production-required variables and that no fallback URL is selected in production.

### Rules

- Default localhost URLs are allowed only in local development.
- A browser-safe config module must contain no secrets.
- Do not rename or delete old environment variables until telemetry shows all deployments use their replacements.

### Validation

Run local, staging, and production-like builds with their intended environments. Confirm a missing production URL fails startup clearly rather than silently calling localhost.

## 7. Phase 3 — create a single API access layer

### Objective

Standardize HTTP behaviour without changing backend endpoints.

### Target structure

```text
lib/http/
  client.ts             # transport, request ID, timeout, normalized errors
  errors.ts             # typed safe error shape
  auth-interceptor.ts   # temporary compatibility adapter
lib/api/
  auth.ts
  courses.ts
  paths.ts
  projects.ts
  playground.ts
  interviews.ts
  payments.ts
```

### Implementation steps

1. Keep `lib/api.ts` as a backwards-compatible facade; do not delete it initially.
2. Put request ID, timeout, cancellation, credentials policy, and error normalization in one transport module.
3. Preserve `withCredentials: true` for existing Academy calls.
4. Define a typed `ApiError` with status, service, operation, request ID, safe message, and retryability. Do not put raw server error bodies in UI state.
5. Migrate the lowest-risk read-only domain first, such as certificates or public portfolio data.
6. Migrate one domain per PR. Replace direct raw `fetch` only after an equivalent typed client method exists.
7. Retire `socketAPI` only after all callers are mapped to an intentional service-specific client.

### Retry policy

- Retry only idempotent requests and only for transient errors.
- Never automatically retry payment creation, enrollment mutations, OAuth callbacks, code execution, or writes without an idempotency key.
- Respect cancellation when a React component unmounts or route navigation changes.

### Validation

For each migrated endpoint, compare old and new requests in staging: URL, method, body, credentials, headers, response interpretation, error UI, and analytics event.

### Rollback

Use a per-domain feature flag that routes the call to the old client. Keep the legacy call path until the new path has a full release cycle of healthy metrics.

## 8. Phase 4 — consolidate session management

### Objective

Retain the current cookie contract while reducing the number of competing auth flows.

### Existing touchpoints to converge

- `middleware.ts`
- `lib/api.ts`
- `lib/auth-refresh.ts`
- `components/providers/auth-provider.tsx`
- `store/auth.ts`
- local user cache helpers

### Target behaviour

```text
middleware: route gate only
session module: refresh deduplication, logout and session state transitions
auth provider: bootstrap/render state only
Zustand auth store: UI projection of the current session/user only
backend: token issuance, refresh and authorization authority
```

### Implementation steps

1. Write an auth state-transition table and test anonymous, loading, authenticated, refreshing, expired, logout, idle-lock, resume, OAuth return, and public page states.
2. Introduce one `session` module that owns refresh deduplication and emits state changes. Reuse the current `/auth/refresh` endpoint and cookie behaviour.
3. Modify Axios interception to delegate to that module, retaining the current queueing behaviour during transition.
4. Make `AuthProvider` subscribe to the session module instead of independently deciding refresh behavior.
5. Make `useAuth` reflect session/user state. It must not persist or treat a browser token as authoritative.
6. Keep middleware verification behavior unchanged until backend and BFF ownership are explicitly agreed.
7. Test public routes explicitly: a 401 from optional user lookup must never redirect a portfolio or certificate visitor to login.

### Security checks

- Verify token validation fails closed in deployed environments.
- Ensure logout clears only application-owned browser data and invalidates server session according to backend policy.
- Do not expose refresh tokens to JavaScript.
- Validate OAuth `redirect` parameters against an allowlist to prevent open redirects.

### Rollback

Keep former provider refresh scheduling behind a flag for one release. Roll back by switching the flag, not by changing cookie names or backend token semantics.

## 9. Phase 5 — introduce a BFF safely

### Objective

Give the browser one stable application boundary while leaving downstream services unchanged.

### Initial scope

Start with low-risk, read-only calls. Good candidates are public certificate verification or public portfolio reads. Do **not** start with payment, OAuth, code execution, or websocket migration.

### Implementation steps

1. Add a route handler under `app/api/bff/<domain>/...` that calls the existing downstream endpoint server-side.
2. Preserve the browser response shape exactly; the first proxy is intentionally boring.
3. Forward only required headers. Derive identity from the session/cookie; do not blindly forward browser authorization headers.
4. Add request ID propagation, timeout, structured logging, and safe error translation.
5. Add a feature flag selecting direct client → BFF client per domain.
6. Deploy with direct path still default. Enable BFF for internal users first, then a small percentage of users.
7. Compare error rate, p95 latency, cache behavior, and response parity. Make BFF default only after comparison is healthy.

### BFF rules

- Do not turn route handlers into an unstructured pass-through proxy. Each handler belongs to a domain and has an explicit contract.
- Keep browser contracts stable even when downstream contracts change; adapters belong at this boundary.
- Authenticate and authorize server-side for privileged operations.
- Add CSRF protection or origin validation for cookie-authenticated state-changing BFF endpoints.
- Cache only data that is safe to cache and has explicit invalidation/TTL behavior.

### Migration order

1. Public certificates and portfolios.
2. Course/path read models.
3. Auth-adjacent user/profile reads.
4. Playground metadata and access-token minting.
5. LiveKit token issuance.
6. Payment setup operations.
7. Mutating enrollment/progress operations.

## 10. Phase 6 — secure and simplify real-time/code execution integrations

### Objective

Remove broad browser coupling to internal workers while retaining existing learner experience.

### Playground and executor plan

1. Document current calls, scopes, cookies, and data flows in `lib/playground-client.ts`, `lib/executor.ts`, project playground components, and exercise components.
2. Have the BFF request or mint a short-lived, scoped capability for a single user/project/session.
3. Preserve worker endpoint during transition; add support for scoped capability alongside current authorization.
4. Update one playground workflow to request capability through the BFF.
5. Enforce expiration, audience, project/user scope, and rate limits at worker/executor.
6. Add graceful UI states for unavailable worker, timeout, queue delay, reconnect, and expired capability.
7. Only then remove direct browser access to broad worker/executor URLs.

### Exercise socket plan

1. Keep event names and payload shapes stable first.
2. Add connection diagnostics: connection ID, reconnect count, selected transport, authenticated user/session ID, and safe server error code.
3. Add versioned event schemas and contract tests for submission and run lifecycle events.
4. Introduce a BFF-issued socket credential only when backend support exists.
5. Maintain polling or explicit refresh fallback for final submission state if sockets disconnect.

### LiveKit and payments

- LiveKit room/token creation must move through the server boundary; never create privileged room tokens in browser code.
- Paddle tokens documented as public client tokens may remain public. Confirm each value against provider documentation before moving it.
- Payment creation, pricing authorization, subscription changes, and enrollment decisions must be server-authoritative and idempotent.
- Test payment migration against sandbox before production rollout. Use feature flags with a one-click revert.

## 11. Phase 7 — modularize by domain

### Objective

Reduce change risk in the largest modules without changing screen behavior.

### Priority files

- `components/pages/project-playground.tsx`
- `lib/data.ts`
- `lib/store.ts`
- `components/pages/learning-path-detail.tsx`
- `components/pages/mock-interviews.tsx`
- `components/pages/project30.tsx`
- `components/pages/mock-interview-session.tsx`

### Extraction pattern

For each target file:

1. Add characterization tests for current behavior before moving code.
2. Identify pure helpers, types, API calls, state/workflow logic, and presentational sections.
3. Extract pure helpers first; add unit tests.
4. Extract API/domain adapters next.
5. Extract state transitions to a domain hook, reducer, or state machine with clear inputs and outputs.
6. Extract visual sections as components with narrow typed props.
7. Leave original page as a composition layer until migration is complete.
8. Verify routes, keyboard interactions, loading states, error states, and analytics events after every extraction.

### Example target layout

```text
features/playground/
  api.ts
  types.ts
  state.ts
  use-playground-session.ts
  components/
    file-tree.tsx
    terminal.tsx
    editor.tsx
    run-controls.tsx
  __tests__/
```

Do not create a global `utils` dumping ground. A helper should live with the domain that owns it unless it is genuinely reused by independent domains.

## 12. Phase 8 — contracts, caching, and data ownership

### Objective

Prevent frontend/backend drift and eliminate ad hoc cache behavior.

### Implementation steps

1. Agree on an API contract source with backend owners; OpenAPI is preferred if the backend can publish it.
2. Generate or validate TypeScript types from that contract in CI.
3. Introduce domain DTO adapters at the API/BFF boundary. UI components should consume stable frontend domain models, not arbitrary backend response objects.
4. Document cache owner and invalidation for every cached resource.
5. Replace unnamed localStorage caches with a small cache module that records key, schema version, TTL, user scope, and invalidation trigger.
6. Never cache sensitive data without explicit security review.

### Required contract tests

- Auth login/refresh/logout response and cookie behavior.
- Public portfolio/certificate response shapes.
- Course/path progression operations.
- Exercise submission and result events.
- Playground file/tree/run operations.
- Payment setup and post-payment enrollment status.

## 13. Phase 9 — deployment and operational cleanup

### Objective

Choose one canonical production deployment model and prove Next.js behaviour works on it.

### Implementation steps

1. Confirm supported hosting platform and runtime with platform owners. The repository currently contains Vercel/v0 references and Netlify configuration.
2. Create a production-like staging deployment with same runtime, routing, environment variables, and observability settings.
3. Verify server rendering, App Router dynamic routes, route handlers, middleware redirects, Open Graph images, and Sentry tunnel behavior.
4. Review Netlify catch-all redirect before relying on it. A blanket redirect to `/index.html` is generally incompatible with SSR-first Next App Router deployment unless the platform adapter explicitly requires it.
5. Remove duplicate or conflicting deployment configuration only after canonical environment passes the smoke suite.
6. Document deployment, rollback, environment rotation, and incident ownership in the repository.

### Production rollout checklist

- [ ] Build artifact created from required CI checks.
- [ ] Required environment variables validated.
- [ ] Smoke tests pass against deployed URL.
- [ ] Sentry release/version is set.
- [ ] Dashboard links are in release ticket.
- [ ] Feature flags and rollback owners are recorded.
- [ ] No migration removes a legacy path during its first production rollout.

## 14. Test matrix for every migration

Run the relevant subset locally and in staging. Any change to a shared boundary requires the full affected suite.

| Area | Minimum verification |
|---|---|
| Routes/middleware | Anonymous protected route, authenticated route, public portfolio, certificate verification, redirect preservation |
| Auth | Login, register, email verification, OAuth, refresh, expired refresh, logout, idle lock/resume |
| API client/BFF | Request/response parity, 4xx/5xx UI, timeout, cancellation, request ID, direct-path fallback |
| Courses/paths | Listing, continue learning, video progress, quiz, exercise, certificate |
| Playground | Load, tree, edit, save, run, terminal, reconnect, expired session, service unavailable |
| Mock interviews | Create/join, LiveKit token, chat/video flow, completion, results |
| Payments | Sandbox checkout, success/cancel, webhook completion, enrollment, idempotent retry |
| Public SEO | SSR HTML, metadata, Open Graph image, no auth redirect |

## 15. Feature-flag requirements

Every traffic-changing migration needs a flag with:

- A descriptive name, domain owner, and expiry date.
- A default matching proven old behavior.
- Targeting for internal/staging users before wider rollout.
- A dashboard split by flag variant.
- A documented rollback: change the flag, not a code hotfix.
- A deletion issue once rollout completes.

Do not use a flag to permanently support two undocumented architectures. It is temporary migration infrastructure.

## 16. Pull request template for this migration

Copy this into each migration PR description:

```md
## Scope
- Domain:
- Legacy behavior preserved:
- New boundary/adapter:

## Compatibility
- Routes/URLs affected:
- Cookies/auth behavior affected:
- API request/response compatibility checked:
- Public-page behavior checked:

## Rollout
- Flag name and default:
- Shadow/internal rollout plan:
- Metrics/dashboard:
- Rollback action and owner:

## Verification
- [ ] typecheck
- [ ] lint
- [ ] unit tests
- [ ] affected E2E tests
- [ ] staging smoke test
- [ ] error/latency comparison

## Follow-up
- Legacy removal issue:
- Flag expiry date:
```

## 17. What not to do

- Do not rewrite all pages into a new architecture in one branch.
- Do not change cookie names, login redirect semantics, OAuth query parameters, or backend response shapes as part of a frontend refactor.
- Do not put secrets in `NEXT_PUBLIC_*` variables.
- Do not replace direct browser calls with a BFF and delete the old path in the same release.
- Do not auto-retry non-idempotent mutations.
- Do not use `any`, ignored TypeScript errors, or disabled lint rules to force release gates green.
- Do not send cookies, tokens, payment data, or user code to analytics/error logs.
- Do not delete deployment configuration until selected host has passed a production-like test.

## 18. Completion criteria

The migration is complete only when all of the following are true:

- Production builds fail on TypeScript and lint errors.
- Browser configuration is centralized and validated.
- All browser HTTP access goes through approved typed domain clients.
- The browser-facing BFF owns the agreed high-risk integrations.
- Session lifecycle has one implementation path and one source of truth.
- Real-time/code execution connections use scoped, expiring access and degrade gracefully.
- The largest feature files have been split into testable domain modules.
- Contract tests protect frontend/backend compatibility.
- One deployment model is documented, tested, and operationally owned.
- Legacy paths, environment aliases, and migration flags have been removed only after verified non-use.

## 19. Recommended implementation order

1. Baseline and dashboards.
2. CI/type/lint gates.
3. Typed configuration.
4. Common API transport and one read-only domain migration.
5. Session consolidation.
6. BFF read-only pilot.
7. BFF rollout by domain.
8. Playground/socket/LiveKit capability hardening.
9. Payment migration.
10. Large-file/domain extraction and contract generation in parallel with the above.
11. Hosting/deployment cleanup.
12. Legacy deletion.

This order is intentional: safety and observability come before routing traffic; read-only paths prove the BFF; authentication and payments move only after the pattern is established.

