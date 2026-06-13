import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize HTML before rendering via dangerouslySetInnerHTML.
 * Strips scripts/event handlers/javascript: URLs while keeping safe formatting.
 * Idempotent — safe to wrap content that's already trusted.
 */
export function sanitizeHtml(dirty?: string | null): string {
  if (!dirty) return "";
  return DOMPurify.sanitize(dirty, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ["target", "rel"],
  });
}
