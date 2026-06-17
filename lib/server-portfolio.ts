import type { PortfolioResponse } from "./portfolio-types";

/**
 * Server-side fetch for the PUBLIC portfolio (no auth/cookies).
 *
 * Used by `generateMetadata` and the OG image route — both run on the server and
 * cannot use the browser `api` axios client (which relies on `withCredentials`
 * and a relative baseURL). We hit the same absolute API base the client uses
 * (`NEXT_PUBLIC_API_URL`, e.g. `https://api.../api/v3`) so OG/SSR works for
 * logged-out viewers. Returns null on any failure so callers never throw.
 */
export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/v3";
}

export async function fetchPublicPortfolio(
  userId: string,
): Promise<PortfolioResponse | null> {
  if (!userId) return null;
  try {
    const res = await fetch(
      `${getApiBaseUrl()}/portfolio/public/${encodeURIComponent(userId)}`,
      {
        // Refresh OG/metadata at most once a minute — keeps shares fresh
        // without hammering the API on every crawler hit.
        next: { revalidate: 60 },
      },
    );
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.data as PortfolioResponse) ?? null;
  } catch {
    return null;
  }
}
