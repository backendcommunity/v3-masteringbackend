/**
 * Plan-feature facts that MORE THAN ONE marketing surface has to agree on.
 *
 * Both /pricing and /pricing/enterprise name the same features. When these
 * lists lived inside one page's component file, the second page could only
 * copy them — and a copy is exactly how a feature ends up marked "Coming
 * soon" on one page and sold as shipped on the other.
 */

/**
 * Announced, sold, and NOT YET BUILT. Nothing in this set exists in the
 * codebase — no route, no model, no module — so every surface that names one
 * must say so rather than let a buyer assume it ships today.
 *
 * Keyed by the EXACT feature label. The lookup only matches when every
 * surface uses the same wording, which is the point: it makes the naming
 * agreement between the cards, the comparison tables and the feature grid
 * enforceable instead of aspirational.
 *
 * Remove a label from this set the moment the feature lands; leaving it here
 * understates a real capability, which is its own kind of wrong.
 */
export const COMING_SOON = new Set<string>([
  "Hiring services",
  "Ship live backend products",
  "Co-branded landing page",
  // "Build learning programs" deliberately does NOT belong here: custom paths
  // already ship, so a manager can assemble one today. It was chipped for one
  // revision on the assumption nothing built it; that was wrong, and chipping
  // a shipped capability understates the product just as badly as selling an
  // unbuilt one overstates it.
]);

/**
 * Learners work at these companies — the trusted-by band under the plan cards
 * on /pricing and on /pricing/enterprise. Mirrors the marketing site's
 * ALUMNI_COMPANIES (app/page.tsx in the landing-page repo).
 *
 * "Our learners work at" — deliberately NOT "trusted by", which would claim a
 * customer relationship with these companies. What is true is narrower: this
 * is where people who learned here are employed.
 */
export const TRUSTED_BY_COMPANIES: string[] = [
  "Kuda",
  "Paystack",
  "Cowrywise",
  "Flutterwave",
  "Andela",
  "Amazon",
  "Google",
  "Meta",
  "Netflix",
  "Shopify",
  "Stripe",
  "Uber",
];
