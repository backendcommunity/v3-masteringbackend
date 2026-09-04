import { describe, it, expect, vi } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import PricingView from "@/components/pages/pricing";
import type { PublicPricing } from "@/lib/pricing";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(""),
}));
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => (
    <img alt={String(props.alt ?? "")} />
  ),
}));
vi.mock("@/hooks/use-user", () => ({ useUser: () => null }));
vi.mock("@/lib/analytics", () => ({ analytics: { track: vi.fn() } }));

const usPricing: PublicPricing = {
  tier: "GLOBAL",
  country: "US",
  currency: "USD",
  monthly: 19.99,
  annual: 199.99,
  enterprise: {
    tier: "GLOBAL",
    currency: "USD",
    monthlyPerUser: 25,
    annualPerUser: 250,
    minSeats: 2,
    selfServe: true,
  },
};

/**
 * A plan card, located by its own <h2> rather than by index — the three cards
 * are siblings in one grid and an index would silently follow a reorder.
 * `p-8` is the class every card carries and no element inside one does.
 */
function card(name: "Free" | "Pro" | "Enterprise"): HTMLElement {
  const heading = screen
    .getAllByRole("heading", { name, level: 2 })
    .find((h) => h.tagName === "H2");
  if (!heading) throw new Error(`No <h2> plan card heading named "${name}"`);
  const el = heading.closest("div.p-8");
  if (!el) throw new Error(`Card wrapper not found for "${name}"`);
  return el as HTMLElement;
}

/** The three plan cells of one comparison-table row, in column order. */
function compareRow(label: string): HTMLElement[] {
  const rowHeader = screen.getByText(label, { selector: "th" });
  const row = rowHeader.closest("tr");
  if (!row) throw new Error(`No <tr> for comparison row "${label}"`);
  const cells = Array.from(row.querySelectorAll("td"));
  expect(cells).toHaveLength(3);
  return cells as HTMLElement[];
}

/**
 * The comparison table itself. Assertions about what the TABLE does or does
 * not say must be scoped here — the cards and the FAQ legitimately use
 * overlapping prose ("a public portfolio", "coding exercises in the
 * playground"), and a page-wide text match would flag those as duplicate
 * rows.
 */
function table(): HTMLElement {
  const el = document.querySelector("table");
  if (!el) throw new Error("No comparison table rendered");
  return el as HTMLElement;
}

/** "yes" | "no" | the literal text a value cell prints. */
function mark(cell: HTMLElement): string {
  if (within(cell).queryByLabelText("Included")) return "yes";
  if (within(cell).queryByLabelText("Not included")) return "no";
  return cell.textContent?.trim() ?? "";
}

function renderPricing() {
  return render(<PricingView pricing={usPricing} />);
}

describe("Plan cards — advertised features", () => {
  it("gives Free every capability the free tier actually has", () => {
    renderPricing();
    const free = card("Free");

    for (const label of [
      /free courses/i,
      /one AI mock interview a month/i,
      /community forum access/i,
      /public portfolio/i,
      /XP, streaks/i,
    ]) {
      expect(within(free).getByText(label)).toBeInTheDocument();
    }
  });

  it("carries NO excluded rows — what a tier lacks is the table's job", () => {
    const { container } = renderPricing();

    // Two hand-picked crosses were a worse comparison than the table's 21
    // rows, and arbitrary besides. Every card list is now uniformly positive,
    // which is also what lets the ticks be decorative on all three.
    for (const name of ["Free", "Pro", "Enterprise"] as const) {
      expect(within(card(name)).queryByLabelText("Not included")).toBeNull();
      expect(within(card(name)).queryByLabelText("Included")).toBeNull();
    }
    // The crosses did not vanish from the page — they moved.
    expect(
      container.querySelectorAll('table svg[aria-label="Not included"]').length,
    ).toBeGreaterThan(10);
  });

  it("gives Pro the paid content, the interview quota, and support lines", () => {
    renderPricing();
    const pro = card("Pro");

    for (const label of [
      /every learning path and premium course/i,
      /all projects, with code review/i,
      /unlimited bite-size practice exercises/i,
      /unlimited AI mock interviews/i,
      /verified, shareable certificates/i,
      /priority support/i,
    ]) {
      expect(within(pro).getByText(label)).toBeInTheDocument();
    }
  });

  it("does not spend a Pro card line on something Free already has", () => {
    renderPricing();
    // Community forum access is on every tier. On the card that has to
    // justify an upgrade it is a wasted line; the table still marks it
    // across all three columns.
    expect(within(card("Pro")).queryByText(/community forum access/i)).toBeNull();
    expect(compareRow("Community forum access").map(mark)).toEqual([
      "yes",
      "yes",
      "yes",
    ]);
  });

  it("gives Enterprise the group-administration lines Pro cannot offer", () => {
    renderPricing();
    const enterprise = card("Enterprise");

    for (const label of [
      /admin dashboard/i,
      /team performance reports/i,
      /co-branded landing page/i,
      /1-on-1 team mentorship with industry experts/i,
      /hiring services/i,
    ]) {
      expect(within(enterprise).getByText(label)).toBeInTheDocument();
    }
  });

  it("uses the same strings the table uses for its group-admin claims", () => {
    renderPricing();
    // The card and the table were on two different vocabularies for the same
    // two capabilities ("Manage your group from one place" vs "Admin
    // dashboard"). Whatever the wording, one string must serve both.
    for (const label of [
      "Admin dashboard",
      "Team performance reports",
      "Co-branded landing page",
    ]) {
      expect(within(card("Enterprise")).getByText(label)).toBeInTheDocument();
      expect(compareRow(label).map(mark)).toEqual(["no", "no", "yes"]);
    }
  });

  it("summarises rather than inventories — bootcamps and exams live only in the table", () => {
    renderPricing();
    const enterprise = card("Enterprise");

    // Absent from the CARD's five lines, but genuine features of both paid
    // tiers: the table must still sell them, or trimming the card would have
    // quietly removed them from the product.
    expect(within(enterprise).queryByText(/bootcamps/i)).toBeNull();
    expect(within(enterprise).queryByText(/certification exams/i)).toBeNull();
  });

  it("TIER CHANGE: bootcamps and certification exams now reach Pro", () => {
    renderPricing();
    // Both were no / no / yes — Enterprise-only — until this change. The
    // Learn group is where they live now, and lib/data.ts's Pro record was
    // flipped to match (see lib/__tests__/plan-features.test.ts).
    expect(compareRow("Structured, cohort-based bootcamps").map(mark)).toEqual([
      "no",
      "yes",
      "yes",
    ]);
    expect(compareRow("Certification exams").map(mark)).toEqual([
      "no",
      "yes",
      "yes",
    ]);
  });

  it("never advertises a card claim the table cannot confirm", () => {
    renderPricing();
    // Hiring services is the newest Enterprise line and exists on no other
    // surface, so it is the one most likely to be added to a card and
    // forgotten in the table.
    expect(within(card("Enterprise")).getByText(/hiring services/i)).toBeInTheDocument();
    expect(compareRow("Hiring services").map(mark)).toEqual(["no", "no", "yes"]);
  });

  it("keeps Pro the longest card, so the ribbon and the content agree", () => {
    renderPricing();
    const count = (name: "Free" | "Pro" | "Enterprise") =>
      within(card(name)).getAllByRole("listitem").length;

    // The row centers each card on its own height (lg:items-center), so the
    // line count IS the visual hierarchy. REGRESSION: Enterprise once grew
    // to eight lines and stood taller than the card wearing "MOST POPULAR".
    expect(count("Pro")).toBeGreaterThan(count("Enterprise"));
    expect(count("Pro")).toBeGreaterThan(count("Free"));
    // And no card may sprawl — past ~6 lines the summary is competing with
    // the table instead of pointing at it.
    for (const name of ["Free", "Pro", "Enterprise"] as const) {
      expect(count(name)).toBeLessThanOrEqual(6);
    }
  });

  it("states the commercial model in the price block, never again in the feature list", () => {
    renderPricing();
    const enterprise = card("Enterprise");
    const list = within(enterprise).getAllByRole("listitem");

    // The eyebrow and the price block already say it, in larger type and
    // closer to the decision. A third restatement in the list spent a slot
    // repeating what the buyer had just read.
    expect(within(enterprise).getByText(/For teams of 2 and up/i)).toBeInTheDocument();
    expect(within(enterprise).getByText("$20.83").parentElement!.textContent).toMatch(
      /per user/i,
    );
    for (const item of list) {
      expect(item.textContent).not.toMatch(/per user/i);
      expect(item.textContent).not.toMatch(/\bseats?\b/i);
    }
    // And no rate may ever be restated in the list — it is region-priced.
    for (const item of list) {
      expect(item.textContent).not.toMatch(/[$₦]\d/);
    }
  });

  it("frames the two paid cards as a ladder, and leaves the base tier unframed", () => {
    renderPricing();

    expect(
      within(card("Pro")).getByText("Everything in Free, plus:"),
    ).toBeInTheDocument();
    expect(
      within(card("Enterprise")).getByText("Everything in Pro, plus:"),
    ).toBeInTheDocument();
    // Free is the base tier — there is no lower tier for a header to name.
    expect(within(card("Free")).queryByText(/everything in/i)).toBeNull();
  });

  it("announces each paid list WITH its inheritance header", () => {
    renderPricing();
    // aria-labelledby, not just visual adjacency: without it the framing
    // that makes the list a DELTA is lost to a screen reader, and Pro's six
    // lines read as the tier's entire contents.
    for (const [name, label] of [
      ["Pro", "Everything in Free, plus:"],
      ["Enterprise", "Everything in Pro, plus:"],
    ] as const) {
      const list = within(card(name)).getByRole("list", { name: label });
      expect(list).toBeInTheDocument();
    }
  });

  it("makes the Pro header true — Pro matches or beats every Free line", () => {
    renderPricing();
    // "Everything in Free, plus:" is a claim, and these are the table rows
    // that back it. If any Free capability were ever cut from Pro, the
    // header would start lying and this test would catch it.
    for (const label of [
      "Free courses",
      "Community forum access",
      "Create a professional profile",
      "Build and share your portfolio of projects",
      "XP, streaks, leaderboard",
    ]) {
      const [free, pro] = compareRow(label).map(mark);
      expect(free).toBe("yes");
      expect(pro).toBe("yes");
    }
    // The two Free lines that are quantities rather than yes/no still go up,
    // never down. Asserted as intent, not as literal figures — the Pro
    // allowance has already moved once (4 / month → Unlimited) and this test
    // is about the header staying true, not about the current number.
    const [freeInterviews, proInterviews] = compareRow("AI mock interviews").map(
      mark,
    );
    expect(freeInterviews).toBe("1 / month");
    expect(proInterviews).not.toBe(freeInterviews);
    expect(proInterviews).toBe("Unlimited");
    expect(compareRow("Learning paths").map(mark).slice(0, 2)).toEqual([
      "First steps",
      "Full access",
    ]);
  });

  it("keeps Enterprise a delta on Pro, not a re-listing of it", () => {
    renderPricing();
    const enterprise = card("Enterprise");

    expect(within(enterprise).getByText(/everything in pro, plus/i)).toBeInTheDocument();
    // Anything Pro already includes must not be repeated here — the card
    // would read as if Enterprise were the only tier offering it.
    expect(within(enterprise).queryByText(/priority support/i)).toBeNull();
    expect(within(enterprise).queryByText(/all projects, with code review/i)).toBeNull();
  });
});

describe("Billing cycle control — page level, not a Pro card feature", () => {
  const cycleSwitch = () => screen.getByRole("switch", { name: /bill yearly/i });

  it("lives outside all three plan cards", () => {
    renderPricing();
    const sw = cycleSwitch();
    for (const name of ["Free", "Pro", "Enterprise"] as const) {
      expect(card(name).contains(sw)).toBe(false);
    }
  });

  it("reprices Pro AND Enterprise — which is why it cannot live in one card", () => {
    renderPricing();
    // Annual on load: Pro's monthly equivalent and Enterprise's per-seat
    // monthly equivalent.
    expect(within(card("Pro")).getByText("$16.67")).toBeInTheDocument();
    expect(within(card("Enterprise")).getByText("$20.83")).toBeInTheDocument();

    fireEvent.click(cycleSwitch());

    expect(within(card("Pro")).getByText("$19.99")).toBeInTheDocument();
    expect(within(card("Enterprise")).getByText("$25.00")).toBeInTheDocument();
  });

  it("reprices the comparison table header too", () => {
    renderPricing();
    expect(
      screen.getByText("$20.83 per user /month billed annually"),
    ).toBeInTheDocument();

    fireEvent.click(cycleSwitch());

    expect(screen.getByText("$25.00 per user /month")).toBeInTheDocument();
    expect(screen.getByText("$19.99 /month")).toBeInTheDocument();
  });

  it("carries both cycle labels and the saving, so the switch reads unambiguously", () => {
    renderPricing();
    expect(screen.getByText("Monthly")).toBeInTheDocument();
    expect(screen.getByText("Yearly")).toBeInTheDocument();
    expect(screen.getByText(/save 2 months/i)).toBeInTheDocument();
  });
});

describe("Unshipped features are gated, not quietly sold", () => {
  const UNSHIPPED = [
    "Hiring services",
    "Ship live backend products",
    "Co-branded landing page",
  ];

  it("marks every unshipped feature 'Coming soon' in the table", () => {
    renderPricing();
    for (const label of UNSHIPPED) {
      const rowHeader = screen.getByText(label, { selector: "th" });
      expect(rowHeader.textContent).toMatch(/coming soon/i);
    }
  });

  it("marks them on the CARD too, wherever the card names one", () => {
    renderPricing();
    const enterprise = card("Enterprise");
    // Only two of the three appear on a card; "Ship live backend products"
    // is table-only. Whichever appear must carry the same caveat.
    for (const label of ["Hiring services", "Co-branded landing page"]) {
      const item = within(enterprise)
        .getByText(new RegExp(label, "i"))
        .closest("li");
      expect(item).not.toBeNull();
      expect((item as HTMLElement).textContent).toMatch(/coming soon/i);
    }
  });

  it("does NOT gate features that actually ship", () => {
    renderPricing();
    // The badge is driven by one shared set. If that set were ever widened
    // by accident, real capabilities would start reading as unavailable.
    for (const label of [
      "Free courses",
      "Certification exams",
      "Admin dashboard",
      "Team performance reports",
    ]) {
      const rowHeader = screen.getByText(label, { selector: "th" });
      expect(rowHeader.textContent).not.toMatch(/coming soon/i);
    }
  });
});

describe("The tier change ships without an announcement", () => {
  it("keeps bootcamps and certification exams on Pro", () => {
    renderPricing();
    // The tier change stands. Only the announcement was withdrawn.
    for (const label of [
      "Structured, cohort-based bootcamps",
      "Certification exams",
    ]) {
      expect(compareRow(label).map(mark)).toEqual(["no", "yes", "yes"]);
    }
  });

  it("carries no New in Pro banner and no New chips", () => {
    const { container } = renderPricing();

    expect(screen.queryByText(/New in Pro/i)).toBeNull();
    for (const label of [
      "Structured, cohort-based bootcamps",
      "Certification exams",
    ]) {
      const rowHeader = screen.getByText(label, { selector: "th" });
      // The chip rendered immediately after the label text, so a trailing
      // "New" is exactly what its return would look like.
      expect(rowHeader.textContent).not.toMatch(/New$/);
      expect(rowHeader.textContent).toBe(label);
    }
    // And the FAQ no longer flags them as new either — same announcement,
    // just in prose.
    expect(container.textContent).not.toMatch(/—\s*new\s*—/i);
  });
});

describe("Superlatives — one claim per card", () => {
  it("leaves Pro with Most Popular alone", () => {
    renderPricing();
    const ribbon = within(card("Pro")).getByText(/most popular/i);
    expect(ribbon.textContent).toBe("MOST POPULAR");
    expect(within(card("Pro")).queryByText(/best value/i)).toBeNull();
  });

  it("gives Best Value to Enterprise, exactly once on the page", () => {
    renderPricing();
    expect(within(card("Enterprise")).getByText(/best value/i)).toBeInTheDocument();
    // Two cards claiming the same superlative would make both meaningless.
    expect(screen.getAllByText(/best value/i)).toHaveLength(1);
    expect(screen.getAllByText(/most popular/i)).toHaveLength(1);
  });

  it("states the session length that separates it from Enterprise", () => {
    renderPricing();
    expect(
      within(card("Pro")).getByText(/up to 30 minutes each/i),
    ).toBeInTheDocument();
  });
});

describe("Comparison table — Learn group", () => {
  it("separates free courses from premium courses", () => {
    renderPricing();
    expect(compareRow("Free courses").map(mark)).toEqual(["yes", "yes", "yes"]);
    expect(compareRow("Premium courses").map(mark)).toEqual(["no", "yes", "yes"]);
  });

  it("distinguishes the free tier's path access from full access", () => {
    renderPricing();
    expect(compareRow("Learning paths").map(mark)).toEqual([
      "First steps",
      "Full access",
      "Full access",
    ]);
  });

  it("reserves custom path authoring for Enterprise", () => {
    renderPricing();
    expect(compareRow("Create your own custom paths").map(mark)).toEqual([
      "no",
      "no",
      "yes",
    ]);
  });
});

describe("Comparison table — Build group", () => {
  it("prices the three things a learner ships", () => {
    renderPricing();
    // Free is metered, not locked out, on all three — a cross here would
    // understate the free tier the same way the interview row once did.
    expect(compareRow("Step-by-step coding projects").map(mark)).toEqual([
      "Starter only",
      "yes",
      "yes",
    ]);
    for (const label of [
      "Bite-size practice exercises",
      "Ship live backend products",
    ]) {
      expect(compareRow(label).map(mark)).toEqual(["Limited", "yes", "yes"]);
    }
  });

  it("keeps code review a paid capability", () => {
    renderPricing();
    expect(compareRow("Code review on submissions").map(mark)).toEqual([
      "no",
      "yes",
      "yes",
    ]);
  });

  it("does not also sell exercises under a second row in Learn", () => {
    renderPricing();
    // "Coding exercises in the playground" moved to Build and was renamed.
    // Both rows at once would read as two separate products. Scoped to the
    // table: the Pro CARD may still describe the playground in prose.
    expect(table().textContent).not.toMatch(/coding exercises in the playground/i);
  });
});

describe("Comparison table — profile and portfolio", () => {
  it("gives every tier a profile and a portfolio", () => {
    renderPricing();
    expect(compareRow("Create a professional profile").map(mark)).toEqual([
      "yes",
      "yes",
      "yes",
    ]);
    expect(
      compareRow("Build and share your portfolio of projects").map(mark),
    ).toEqual(["yes", "yes", "yes"]);
  });

  it("states the portfolio once, and in this product's vocabulary", () => {
    const { container } = renderPricing();
    // Absorbed Build's old "Public portfolio" row rather than joining it —
    // scoped to the table, since the Free card and the FAQ still say
    // "public portfolio" in prose, which is not a duplicate row.
    expect(table().textContent).not.toMatch(/public portfolio/i);
    // And it is a portfolio of PROJECTS. "Analyses" is data-analytics
    // vocabulary; nothing on this platform produces one, so it must not
    // appear anywhere on the page.
    expect(container.textContent).not.toMatch(/analys[ei]s/i);
  });
});

describe("Comparison table — interview access is a quota, not a yes/no", () => {
  /**
   * REGRESSION. The table used to print a cross for Free against "AI mock
   * interviews", which is simply not what the API does: PLAN_CONFIG.free in
   * academy's mock-interview subscription-access helper grants one session a
   * calendar month. Understating the free tier on the pricing page is a
   * conversion bug and a credibility one.
   */
  it("shows Free its real monthly session, not a cross", () => {
    renderPricing();
    const [free, pro, ent] = compareRow("AI mock interviews").map(mark);

    expect(free).not.toBe("no");
    expect(free).toBe("1 / month");
    // TIER CHANGE: Pro moved from "4 / month" to unlimited.
    expect(pro).toBe("Unlimited");
    expect(ent).toBe("Unlimited");
  });

  it("says the same thing about Pro's allowance in all three places", () => {
    const { container } = renderPricing();

    // Card, table cell, FAQ. These three drifted apart once before (the
    // table said Free got no interviews while the API gave it one), so the
    // agreement is pinned rather than assumed.
    expect(
      within(card("Pro")).getByText(/unlimited AI mock interviews/i),
    ).toBeInTheDocument();
    expect(compareRow("AI mock interviews").map(mark)[1]).toBe("Unlimited");
    expect(container.textContent).toMatch(/unlimited scored mock interviews/i);

    // No survivor of the old four-a-month claim anywhere on the page.
    expect(container.textContent).not.toMatch(/four (AI )?mock interviews/i);
    expect(container.textContent).not.toMatch(/4 \/ month/);
  });

  it("keeps session LENGTH as the Pro/Enterprise interview differentiator", () => {
    renderPricing();
    const [, proCount, entCount] = compareRow("AI mock interviews").map(mark);
    const [, proLen, entLen] = compareRow("Interview session length").map(mark);

    // Count is now identical on both paid tiers, so if length were equal too
    // the table would be claiming Enterprise adds nothing on interviews.
    expect(proCount).toBe(entCount);
    expect(proLen).not.toBe(entLen);
    expect(proLen).toBe("15 or 30 min");
    expect(entLen).toBe("Up to 60 min");
  });

  it("prices the session lengths each tier can book", () => {
    renderPricing();
    expect(compareRow("Interview session length").map(mark)).toEqual([
      "15 min",
      "15 or 30 min",
      "Up to 60 min",
    ]);
  });

  it("gives every tier the scored report — only the sessions are gated", () => {
    renderPricing();
    expect(compareRow("Scored interview report").map(mark)).toEqual([
      "yes",
      "yes",
      "yes",
    ]);
  });
});

describe("Comparison table — Team & enterprise group", () => {
  it("marks the group-administration rows Enterprise-only", () => {
    renderPricing();
    for (const label of [
      "Admin dashboard",
      "Team performance reports",
      "Co-branded landing page",
    ]) {
      expect(compareRow(label).map(mark)).toEqual(["no", "no", "yes"]);
    }
  });

  it("states each group-admin capability exactly once", () => {
    const { container } = renderPricing();
    // The four rows this group nearly carried — "Admin dashboard" beside
    // "Manage your group from one place", "Team performance reports" beside
    // "See each member's learning activity and progress" — were two
    // capabilities under two names. Four Enterprise-only rows answering two
    // questions is padding, and padding is how a comparison table loses a
    // reader's trust.
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/manage your group from one place/i);
    expect(text).not.toMatch(/see each member's learning activity/i);
  });

  it("keeps mentorship and career services Enterprise-only", () => {
    renderPricing();
    for (const label of [
      "1-on-1 team mentorship with industry experts",
      "Dedicated career placement assistance",
      "Hiring services",
    ]) {
      expect(compareRow(label).map(mark)).toEqual(["no", "no", "yes"]);
    }
  });

  it("states the per-user model and quotes no seat allotment or overage rate", () => {
    const { container } = renderPricing();
    expect(compareRow("Per-user pricing, from 2 seats").map(mark)).toEqual([
      "no",
      "no",
      "yes",
    ]);
    // The "5 included seats, $10 each after" model is gone. Any surviving
    // trace of it on this page contradicts what /checkout charges.
    expect(container.textContent).not.toMatch(/\$10\s*(each|\/\s*seat)/i);
    expect(container.textContent).not.toMatch(/additional 5 team members/i);
  });
});

describe("Comparison table — Support group", () => {
  it("gives every tier the community forum and Pro upward priority support", () => {
    renderPricing();
    expect(compareRow("Community forum access").map(mark)).toEqual([
      "yes",
      "yes",
      "yes",
    ]);
    expect(compareRow("Priority support").map(mark)).toEqual([
      "no",
      "yes",
      "yes",
    ]);
  });
});

describe("Archived products are not sold", () => {
  /**
   * MB Lands was archived on Feb 28, 2026 and folded into Courses —
   * app/lands/page.tsx renders a deprecation notice and the sidebar entry is
   * commented out. The stale plan records in lib/data.ts still advertised
   * "Limited / Unlimited land access"; this pins that it never reaches a
   * surface a buyer pays from.
   */
  it("never advertises MB Lands access on any card or table row", () => {
    const { container } = renderPricing();
    expect(container.textContent).not.toMatch(/land access/i);
    expect(container.textContent).not.toMatch(/MB Lands/i);
  });
});

describe("Comparison table — structural integrity", () => {
  it("gives every feature row exactly one mark per plan column", () => {
    const { container } = renderPricing();
    const table = container.querySelector("table");
    expect(table).not.toBeNull();

    const bodyRows = Array.from(
      (table as HTMLTableElement).querySelectorAll("tbody tr"),
    ).filter((tr) => tr.getAttribute("aria-hidden") !== "true");

    // Three row shapes live in this tbody and only one of them carries marks.
    // A group heading ("Learn", "Grow", …) renders its name inside a <span>
    // alongside the little accent rule, so its <th> has element children;
    // a feature row's <th> is bare text. That is the discriminator — NOT
    // "does the row have empty cells", which is what the assertion is for.
    const isGroupHeading = (tr: Element) =>
      (tr.querySelector("th")?.children.length ?? 0) > 0;

    const featureRows = bodyRows.filter((tr) => !isGroupHeading(tr));

    // Sanity: the discriminator found both kinds. Without this, a change that
    // made every row look like a heading would empty `featureRows` and the
    // loops below would vacuously pass.
    expect(featureRows.length).toBeGreaterThan(10);
    expect(bodyRows.length - featureRows.length).toBeGreaterThan(0);

    for (const tr of bodyRows) {
      // Every row, heading or feature, must keep four columns or the marks
      // stop lining up under the plan headers they belong to.
      expect(tr.querySelectorAll("th")).toHaveLength(1);
      expect(tr.querySelectorAll("td")).toHaveLength(3);
    }

    for (const tr of featureRows) {
      expect(tr.querySelector("th")?.textContent?.trim()).toBeTruthy();
      // A silently empty cell reads as "not included" while asserting
      // nothing — it must be a tick, a cross, or explicit text.
      for (const cell of Array.from(tr.querySelectorAll("td"))) {
        expect(mark(cell as HTMLElement)).not.toBe("");
      }
    }
  });
});
