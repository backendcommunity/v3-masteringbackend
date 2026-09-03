/**
 * Where "Talk to sales" goes, for every surface that offers it.
 *
 * There is no sales route in this app (the marketing site owns /contact-us;
 * nothing sales-shaped exists under app/), so this is a mailto to the address
 * the site already publishes as its own — see lib/seo.ts's organization
 * email — rather than an invented route that would 404.
 *
 * Shared, not copied: /pricing's Enterprise card, its comparison-table CTA
 * row, and /pricing/enterprise all use it, and a team that emails one address
 * from one page and a different one from the next loses replies.
 *
 * Replace with a real route the moment one exists.
 *
 * The subject line is pre-filled so the reply lands with context instead of
 * an empty "Enterprise" thread.
 */
export const SALES_CONTACT_HREF = `mailto:hi@masteringbackend.com?subject=${encodeURIComponent(
  "Enterprise plan — team pricing",
)}`;
