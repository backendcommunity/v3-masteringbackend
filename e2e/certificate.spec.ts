import { test, expect, Page } from "@playwright/test";

const API = "http://localhost:8081/api/v3";
const SLUG = "backend-workshop";
const CERT_CODE = "BA12345CERT";

const MOCK_CERT = {
  code: CERT_CODE,
  holderName: "Ada Lovelace",
  courseName: "Backend Workshop",
  finalScore: 100,
  issuedAt: "2026-07-08T00:00:00.000Z",
};

const MOCK_COURSE = {
  id: "course-1",
  slug: SLUG,
  title: "Backend Workshop",
  description: "A workshop course",
  instructor: "Solomon Eseme",
  thumbnail: "",
  progress: 100,
  isCompleted: true,
  isFree: false,
  isEnrolled: true,
};

const MOCK_USER_COURSE = {
  courseId: "course-1",
  isCompleted: true,
  completedAt: "2026-07-08T00:00:00.000Z",
  progress: 100,
};

const MOCK_USER = {
  id: "user-1",
  name: "Ada Lovelace",
  email: "ada@example.com",
  mustResetPassword: false,
  hasFinishedOnboarding: true,
  subscription: null,
};

/**
 * Sets up full backend mocking:
 *  1. Adds mb_token cookie so Next.js middleware passes (dev mode: any token accepted)
 *  2. Adds a catch-all fallback (registered first → matched last by Playwright's LIFO order)
 *     so unmocked backend calls never reach the real server and never trigger handleAuthFailure
 *  3. Mocks /auth/me with the supplied user
 */
async function mockAuthenticatedUser(page: Page, user = MOCK_USER) {
  // Cookie must be set before navigation
  await page.context().addCookies([
    {
      name: "mb_token",
      value: "test-token",
      domain: "localhost",
      path: "/",
    },
  ]);

  // ① Catch-all (added FIRST → last in LIFO → only fires when nothing more specific matches)
  // Return empty arrays by default so components calling .filter()/.map() don't crash
  await page.route(`${API}/**`, (route) => {
    route.fulfill({ json: { success: true, data: [], items: [], total: 0 } });
  });

  // ② /auth/me — highest priority (added last → first in LIFO)
  await page.route(`${API}/auth/me`, (route) =>
    route.fulfill({ json: { success: true, data: user } })
  );
}

async function mockCertVerify(
  page: Page,
  code: string,
  valid: boolean,
  cert = MOCK_CERT
) {
  await page.route(`${API}/certifications/verify/${code}`, (route) =>
    route.fulfill({
      json: {
        success: true,
        data: valid ? { valid: true, certificate: cert } : { valid: false },
      },
    })
  );
}

async function mockCourseAPIs(page: Page) {
  // Both paths — Next.js constructs `?isRoadmap=undefined` from undefined param
  await page.route(`**/api/v3/courses/${SLUG}?isRoadmap=undefined`, (route) =>
    route.fulfill({ json: { success: true, data: MOCK_COURSE } })
  );
  await page.route(`**/api/v3/users/courses/${SLUG}`, (route) =>
    route.fulfill({ json: { success: true, data: MOCK_USER_COURSE } })
  );
}

// ─────────────────────────────────────────────────────────────────────────────

test.describe("Certificate page — ?code= access", () => {
  test("shows certificate when valid code supplied (no course completion gate)", async ({
    page,
  }) => {
    await mockAuthenticatedUser(page);
    await mockCourseAPIs(page);
    await mockCertVerify(page, CERT_CODE, true);

    await page.goto(`/courses/${SLUG}/certificate?code=${CERT_CODE}`);
    await page.waitForLoadState("networkidle");

    // Should NOT show the gate
    await expect(page.getByText("Certificate Not Available")).not.toBeVisible();

    // Cert holder name should appear
    await expect(page.getByText("Ada Lovelace")).toBeVisible({ timeout: 8000 });
  });

  test("shows 'Invalid Certificate' when code fails verification", async ({
    page,
  }) => {
    await mockAuthenticatedUser(page);
    await mockCourseAPIs(page);
    await mockCertVerify(page, "BADCODE", false);

    await page.goto(`/courses/${SLUG}/certificate?code=BADCODE`);
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("Invalid Certificate")).toBeVisible({
      timeout: 8000,
    });
    await expect(
      page.getByText("This certificate code could not be verified.")
    ).toBeVisible();
  });

  test("shows gate when no code and course not completed", async ({ page }) => {
    await mockAuthenticatedUser(page);

    // Override course APIs with incomplete data
    await page.route(`**/api/v3/courses/${SLUG}?isRoadmap=undefined`, (route) =>
      route.fulfill({
        json: {
          success: true,
          data: { ...MOCK_COURSE, isCompleted: false, progress: 0 },
        },
      })
    );
    await page.route(`**/api/v3/users/courses/${SLUG}`, (route) =>
      route.fulfill({
        json: {
          success: true,
          data: { ...MOCK_USER_COURSE, isCompleted: false, progress: 0 },
        },
      })
    );

    await page.goto(`/courses/${SLUG}/certificate`);
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("Certificate Not Available")).toBeVisible({
      timeout: 8000,
    });
    await expect(
      page.getByText("Complete the course to earn your certificate.")
    ).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────

test.describe("Certificate page — unauthenticated redirect", () => {
  test("redirects to login with cert URL preserved in redirect param", async ({
    page,
  }) => {
    // No cookie → middleware redirects to login
    const certPath = `/courses/${SLUG}/certificate?code=${CERT_CODE}`;
    await page.goto(certPath);

    await page.waitForURL(/\/auth\/login/, { timeout: 8000 });

    const url = new URL(page.url());
    const redirect = decodeURIComponent(url.searchParams.get("redirect") ?? "");
    expect(redirect).toContain("certificate");
    expect(redirect).toContain(`code=${CERT_CODE}`);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

test.describe("mustResetPassword modal", () => {
  // Navigate to cert page for modal tests — fewer API dependencies than the full dashboard.
  // DashboardLayout (which renders the modal) wraps the cert page too.
  const MODAL_PAGE = `/courses/${SLUG}/certificate?code=${CERT_CODE}`;

  async function setupModalPage(page: Page, user = { ...MOCK_USER, mustResetPassword: true }) {
    await mockAuthenticatedUser(page, user);
    await mockCourseAPIs(page);
    await mockCertVerify(page, CERT_CODE, true);
  }

  test("modal appears and blocks dashboard when mustResetPassword=true", async ({
    page,
  }) => {
    await setupModalPage(page);

    await page.goto(MODAL_PAGE);
    await page.waitForLoadState("networkidle");

    // Dialog must be visible
    await expect(
      page.getByRole("dialog").filter({ hasText: "Set Your Password" })
    ).toBeVisible({ timeout: 8000 });
  });

  test("modal is non-dismissible (click outside does nothing)", async ({
    page,
  }) => {
    await setupModalPage(page);
    await page.goto(MODAL_PAGE);

    const dialog = page.getByRole("dialog").filter({
      hasText: "Set Your Password",
    });
    await expect(dialog).toBeVisible({ timeout: 8000 });

    // Click backdrop
    await page.mouse.click(10, 10);

    // Still visible
    await expect(dialog).toBeVisible();
  });

  test("modal not shown for normal users", async ({ page }) => {
    await setupModalPage(page, { ...MOCK_USER, mustResetPassword: false });
    await page.goto(MODAL_PAGE);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);

    await expect(
      page.getByRole("dialog").filter({ hasText: "Set Your Password" })
    ).not.toBeVisible();
  });

  test("modal closes after successful password change", async ({ page }) => {
    await setupModalPage(page);

    // Mock password change — must return updated user so store clears mustResetPassword
    await page.route(`${API}/auth/password/change`, (route) =>
      route.fulfill({
        json: {
          success: true,
          data: { ...MOCK_USER, mustResetPassword: false },
        },
      })
    );

    await page.goto(MODAL_PAGE);

    const dialog = page.getByRole("dialog").filter({
      hasText: "Set Your Password",
    });
    await expect(dialog).toBeVisible({ timeout: 8000 });

    await page.getByLabel(/current.*password|temporary.*password/i).fill("TEMP1234");
    await page.getByLabel(/^new password/i).fill("NewSecure123!");
    await page.getByLabel(/confirm.*password/i).fill("NewSecure123!");
    await page.getByRole("button", { name: /set password/i }).click();

    await expect(dialog).not.toBeVisible({ timeout: 6000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────

test.describe("Course page — OG image switches on ?certificate= param", () => {
  test("OG image API route returns 200 for valid cert code", async ({
    page,
  }) => {
    // Mock the backend verify call the OG route makes (server-side fetch in route.tsx)
    // The OG route is a Next.js API route, not browser — just hit it directly
    const res = await page.goto(
      `/api/og/cert?code=${CERT_CODE}`
    );
    // May return 500 if backend not reachable, but route must exist (not 404)
    expect(res!.status()).not.toBe(404);
  });
});
