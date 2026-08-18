// Open-redirect / XSS guard for the `redirect` query parameter.
//
// `redirect` is attacker-controllable (it comes straight off the URL) and is
// consumed in two shapes across the app: handed to router.push/replace, and —
// since the regional-pricing upsell shipped — rendered as an <a href> on the
// pricing page's "Continue with the free plan" exit. The href sink is the
// dangerous one: `?redirect=javascript:alert(1)` becomes a script-executing
// link that no amount of React escaping stops, because an href is a URL
// context, not a text context.
//
// The rule here is deliberately strict — same-origin RELATIVE paths only:
//   - must start with a single "/"
//   - must NOT start with "//" or "/\" (protocol-relative -> off-site)
//   - must carry no URL scheme at all (javascript:, data:, https:, ...)
//   - must still satisfy all of the above after one round of percent-decoding,
//     so "/%2f%2fevil.com" can't smuggle a protocol-relative URL past the
//     literal check
// Anything else is discarded in favour of the caller's fallback. We never try
// to "repair" a hostile value; a visitor sent to the dashboard is a small
// annoyance, a visitor sent to an attacker's page is an incident.

import { routes } from "@/lib/routes";

/** Any RFC-3986 scheme prefix: "javascript:", "data:", "https:", "x+y-1:". */
const SCHEME_RE = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;

/**
 * C0 controls (incl. tab/CR/LF, which browsers STRIP out of a URL before
 * parsing it, so "/java\\nscript:..." must never be treated as inert) and DEL.
 */
const CONTROL_RE = /[\u0000-\u001f\u007f]/;

function isSameOriginPath(value: string): boolean {
  if (!value.startsWith("/")) return false;
  // "//evil.com" is protocol-relative; browsers also normalise "\" to "/",
  // so "/\evil.com" reaches the same place.
  if (value.startsWith("//") || value.startsWith("/\\")) return false;
  if (SCHEME_RE.test(value)) return false;
  if (CONTROL_RE.test(value)) return false;
  return true;
}

/**
 * Returns the value only if it is a safe same-origin relative path, else null.
 * Use this when "no redirect" is a meaningful state (e.g. deciding whether to
 * append a `redirect` param at all).
 */
export function safeRedirectPath(
  value: string | null | undefined,
): string | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!isSameOriginPath(trimmed)) return null;

  // The literal form is safe; make sure the decoded form is too. One decode
  // pass is enough: browsers do not recursively decode a URL before
  // navigating, so "/%252f%252fevil.com" resolves to a real same-origin path.
  let decoded: string;
  try {
    decoded = decodeURIComponent(trimmed);
  } catch {
    // Malformed percent-encoding — can't reason about it, so don't trust it.
    return null;
  }
  if (!isSameOriginPath(decoded)) return null;

  return trimmed;
}

/**
 * Same check, but always yields something navigable. Use this at the point of
 * use (href / router.push) where a destination is required.
 */
export function sanitizeRedirect(
  value: string | null | undefined,
  fallback: string = routes.dashboard,
): string {
  return safeRedirectPath(value) ?? fallback;
}
