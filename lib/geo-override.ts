// Propagates the developer-only `__geo` region override across navigation.
//
// `/pricing` and `/checkout` each resolve the visitor's region server-side,
// and both accept a `?__geo=NG`-style override for exercising regional
// pricing on localhost (see academy's resolveCountryWithOverride in
// src/extensions/payment/pricing/resolve-country.ts — it returns early,
// before even reading the param, unless ITS OWN context is LOCAL or
// DEVELOP). That gate is what keeps this dev-only; nothing here widens it,
// and nothing here validates the value — the backend already normalises it
// through the same country-code path as a real geo header, so duplicating
// that here would just be a second, driftable source of truth.
//
// The override works when a page loads directly with it in the URL, but a
// developer clicking "Go Pro" from `/pricing?__geo=NG` was landing on
// `/checkout` with no override at all — the link was built with no idea the
// override existed. This helper closes that gap by reading `__geo` off the
// CURRENT page's URL (via the caller's own `useSearchParams()`, same as
// `/pricing` already does for `redirect`) and copying it onto outgoing
// internal links, so the override survives a click instead of only a
// hand-edited address bar.
export const GEO_OVERRIDE_PARAM = "__geo";

/**
 * Minimal shape this needs from `useSearchParams()` — just `get`, so a test
 * can pass a plain `URLSearchParams` instead of mounting Next's router.
 */
type ReadableSearchParams = Pick<URLSearchParams, "get">;

/**
 * Appends the current URL's `__geo` value onto `href`, if present.
 *
 * - No `__geo` in the current URL → `href` is returned unchanged (byte-for-
 *   byte — production visitors never carry this param, so their links must
 *   stay identical to today's).
 * - `__geo` present → appended with `?` or `&` depending on whether `href`
 *   already has a query string. Existing params (e.g. `redirect`) are left
 *   untouched — this only ever appends, never rebuilds the query string, so
 *   there's nothing to clobber.
 * - The value is percent-encoded via `encodeURIComponent` so it cannot break
 *   out of the query string; it is not otherwise validated or sanitised.
 */
export function withGeoOverride(
  href: string,
  searchParams: ReadableSearchParams | null | undefined,
): string {
  const geo = searchParams?.get(GEO_OVERRIDE_PARAM);
  if (!geo) return href;

  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}${GEO_OVERRIDE_PARAM}=${encodeURIComponent(geo)}`;
}
