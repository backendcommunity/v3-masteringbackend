// Single source of truth for routes that must work WITHOUT a logged-in session
// (recruiters, social crawlers, anyone with the link). Every auth gate consults
// this — keep them in sync by importing from here, never re-listing inline:
//
//   1. middleware.ts        — must not redirect these to /auth/login
//   2. AuthProvider         — must not bootstrap (fetchUser) the session on these
//   3. api.ts interceptor   — must not hard-redirect to login on a 401 here
//
// If you add a public page, add its prefix here and all three gates honour it.
export const PUBLIC_PATH_PREFIXES = [
  "/portfolios/",
  "/certifications/verify/",
  "/ai/payment",
  "/xpayment",
  // Scholarship flyer generator: a campaign tool handed to people who have no
  // account and may never make one.
  "/scholarship/flyer",
];

/** True when `pathname` is a public (no-login) route. */
export function isPublicPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return PUBLIC_PATH_PREFIXES.some((p) => pathname.startsWith(p));
}
