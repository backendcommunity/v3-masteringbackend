import sanitize from "sanitize-html";
import DOMPurify from "dompurify";

/**
 * Isomorphic HTML sanitization with NO jsdom dependency.
 *
 * Replaces isomorphic-dompurify, which dragged jsdom (-> @exodus/bytes, an
 * ESM-only package) into the server bundle and crashed the Netlify SSR Lambda
 * with ERR_REQUIRE_ESM on Node < 20.19. sanitize-html is pure JS and runs the
 * same on server and client. SVG keeps DOMPurify's proven svg profile, but only
 * on the client (the browser build of dompurify never imports jsdom).
 */

const isBrowser = typeof window !== "undefined";

// Rich HTML: mirrors DOMPurify's html profile closely enough to avoid visual
// regressions (headings, images, tables, code, lists, inline formatting) while
// still dropping scripts, event handlers, and javascript: URLs.
const RICH_HTML: sanitize.IOptions = {
  allowedTags: [
    ...sanitize.defaults.allowedTags,
    "h1",
    "h2",
    "img",
    "figure",
    "figcaption",
    "del",
    "ins",
    "sup",
    "sub",
    "mark",
    "u",
    "s",
    "abbr",
    "details",
    "summary",
  ],
  allowedAttributes: {
    ...sanitize.defaults.allowedAttributes,
    a: ["href", "name", "target", "rel"],
    img: ["src", "alt", "title", "width", "height", "loading"],
    "*": ["class", "id", "align", "dir", "lang"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  // Force safe link relationships on any link that opens a new tab.
  transformTags: {
    a: (tagName, attribs) => {
      if (attribs.target === "_blank") {
        attribs.rel = "noopener noreferrer";
      }
      return { tagName, attribs };
    },
  },
};

/**
 * Sanitize HTML before rendering via dangerouslySetInnerHTML.
 * Strips scripts/event handlers/javascript: URLs while keeping safe formatting.
 * Idempotent — safe to wrap content that's already trusted.
 */
export function sanitizeHtml(dirty?: string | null): string {
  if (!dirty) return "";
  return sanitize(dirty, RICH_HTML);
}

/**
 * Strip ALL markup, returning plain text. Equivalent to DOMPurify
 * `{ ALLOWED_TAGS: [] }`.
 */
export function sanitizeText(dirty?: string | null): string {
  if (!dirty) return "";
  return sanitize(dirty, { allowedTags: [], allowedAttributes: {} });
}

/**
 * Sanitize an inline SVG (e.g. AI-generated chat diagrams) using DOMPurify's
 * svg + svgFilters profile. Runs on the client only; on the server it returns
 * an empty string so no jsdom is needed — the diagram fills in after hydration.
 * SVG content here is produced by client-side chat interactions, so deferring
 * its first paint is safe.
 */
export function sanitizeSvg(dirty?: string | null): string {
  if (!dirty) return "";
  if (!isBrowser) return "";
  return DOMPurify.sanitize(dirty, {
    USE_PROFILES: { svg: true, svgFilters: true },
  });
}
