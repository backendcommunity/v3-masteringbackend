/**
 * E2E smoke: Try Playground → tour offer
 *
 * Runtime prerequisites (why this test is skipped in CI/local without the stack):
 *   1. A live academy backend (Express + PostgreSQL + Redis) at http://localhost:8000
 *      with the `playground-demo` project seeded in the database.
 *   2. A live Next.js frontend at http://localhost:3000 (playwright.config.ts webServer).
 *   3. A valid `mb_token` JWT cookie accepted by the academy backend (real signed-in session).
 *      The onboarding.spec.ts pattern injects `"test-token"` which is a placeholder — it is
 *      not a real JWT and will cause the /projects page to redirect to login.
 *   4. A running mb-executor service (Docker sandbox) so the playground sandbox can boot and
 *      serve the "sandbox-live" state that triggers the tour offer banner.
 *
 * Auth pattern copied from e2e/onboarding.spec.ts:
 *   context.addCookies([{ name: "mb_token", value: <jwt>, domain: "localhost", path: "/" }])
 *   No storage-state file or login helper exists in this project — the cookie is injected
 *   directly before each test. In a real CI environment this value must be replaced with a
 *   genuinely signed JWT (or a seeded test user token) for the assertions below to reach
 *   authenticated pages.
 */

import { test, expect } from "@playwright/test";

test.skip(
  true,
  [
    "Skipped: environment prerequisites not met.",
    "Requires: (1) academy backend,",
    "(2) valid signed mb_token JWT (not the placeholder used in onboarding.spec.ts),",
    "(3) running mb-executor Docker sandbox service so the playground can boot.",
    "The playground-demo is frontend-only (no database project needed).",
    "Remove test.skip once a real signed-in test session and the full stack are available.",
  ].join(" ")
);

test("Try Playground boots sample sandbox and offers the tour", async ({
  page,
  context,
}) => {
  // Mirror onboarding.spec.ts auth setup: inject the mb_token cookie.
  // NOTE: Replace "test-token" with a real signed JWT for this test to reach
  // authenticated pages. The onboarding tests use this placeholder because
  // they test the onboarding UI itself (which may render even without a valid
  // server-side session); the playground route requires a real authenticated user.
  await context.addCookies([
    {
      name: "mb_token",
      value: process.env.E2E_MB_TOKEN ?? "test-token",
      domain: "localhost",
      path: "/",
    },
  ]);

  // 1. Navigate to the projects listing page.
  await page.goto("/projects");

  // 2. Click the first "Try Playground" button (listing / nav / detail).
  //    The button may live inside a card — use first() to be resilient to
  //    multiple buttons on the page.
  await page.getByRole("button", { name: /try playground/i }).first().click();

  // 3. Assert we landed on the sample playground URL with ?tour=offer.
  await expect(page).toHaveURL(/\/projects\/playground-demo\/playground\?tour=offer/, {
    timeout: 15_000,
  });

  // 4. Assert the tour offer banner is visible.
  //    The banner text reads "Take a 60-second tour" (or similar); match loosely.
  await expect(page.getByText(/take a .*tour/i)).toBeVisible({ timeout: 30_000 });

  // 5. Click "Start tour" — driver.js popover should appear.
  await page.getByRole("button", { name: /start tour/i }).click();

  // 6. Assert the driver.js popover is rendered.
  await expect(page.locator(".driver-popover")).toBeVisible({ timeout: 10_000 });
});
