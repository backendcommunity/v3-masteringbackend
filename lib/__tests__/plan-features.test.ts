import { describe, it, expect } from "vitest";
import { dataStore } from "@/lib/data";

/**
 * These pin the plan records that drive /subscription/plans
 * (components/pages/subscription-plans.tsx renders `dataStore.plans` directly
 * as three cards). They are the second surface a buyer reads plan features
 * from — /pricing is the first — and the two must not disagree.
 */

type Feature = { name: string; included: boolean };

function plan(id: "free" | "pro" | "enterprise") {
  const found = dataStore.plans.find((p) => p.id === id);
  if (!found) throw new Error(`No plan record with id "${id}"`);
  return found;
}

function features(id: "free" | "pro" | "enterprise"): Feature[] {
  return (plan(id).features ?? []) as Feature[];
}

function included(id: "free" | "pro" | "enterprise"): string[] {
  return features(id)
    .filter((f) => f.included)
    .map((f) => f.name);
}

function excluded(id: "free" | "pro" | "enterprise"): string[] {
  return features(id)
    .filter((f) => !f.included)
    .map((f) => f.name);
}

const ALL_IDS = ["free", "pro", "enterprise"] as const;

describe("Plan records — shape", () => {
  it("ships exactly the three plans the pricing surfaces expect", () => {
    expect(dataStore.plans.map((p) => p.id)).toEqual([
      "free",
      "pro",
      "enterprise",
    ]);
  });

  it("gives every feature a name and an explicit included flag", () => {
    for (const id of ALL_IDS) {
      for (const feature of features(id)) {
        expect(typeof feature.name).toBe("string");
        expect(feature.name.length).toBeGreaterThan(0);
        expect(typeof feature.included).toBe("boolean");
      }
    }
  });

  it("never lists the same feature twice on one plan", () => {
    for (const id of ALL_IDS) {
      const names = features(id).map((f) => f.name);
      expect(new Set(names).size).toBe(names.length);
    }
  });
});

describe("Plan records — Free", () => {
  it("includes the free-tier capabilities", () => {
    expect(included("free")).toEqual(
      expect.arrayContaining([
        "Access to free courses",
        "Basic learning paths",
        "Access to Free projects",
        "Limited interview access",
        "Community forum access",
      ]),
    );
  });

  it("marks every paid capability as not included, so the card compares", () => {
    expect(excluded("free")).toEqual(
      expect.arrayContaining([
        "Premium courses",
        "Bootcamps",
        "Interview preparation",
        "Certification exams",
        "1-on-1 team mentorship",
        "Career services",
        "Hiring services",
        "Admin dashboard",
        "Team performance reports",
        "Co-branded landing page",
      ]),
    );
  });
});

describe("Plan records — Pro", () => {
  it("includes the full content library and interview preparation", () => {
    expect(included("pro")).toEqual(
      expect.arrayContaining([
        "Access to free courses",
        "All learning paths",
        "Premium courses",
        "Unlimited project access",
        "Interview preparation",
        "Community forum access",
      ]),
    );
  });

  it("includes bootcamps and certification exams", () => {
    // TIER CHANGE: both were Enterprise-only until now. /pricing's Learn
    // group marks them no / yes / yes, and these two surfaces must not
    // disagree about what a Pro subscriber has paid for.
    expect(included("pro")).toEqual(
      expect.arrayContaining(["Bootcamps", "Certification exams"]),
    );
  });

  it("does not claim the Enterprise-only capabilities", () => {
    expect(excluded("pro")).toEqual(
      expect.arrayContaining([
        "1-on-1 team mentorship",
        "Career services",
        "Hiring services",
        "Admin dashboard",
        "Team performance reports",
        "Co-branded landing page",
      ]),
    );
  });
});

describe("Plan records — Enterprise", () => {
  it("includes everything Pro does", () => {
    const enterpriseIncluded = included("enterprise");
    for (const name of included("pro")) {
      expect(enterpriseIncluded).toContain(name);
    }
  });

  it("adds the team and career capabilities on top", () => {
    expect(included("enterprise")).toEqual(
      expect.arrayContaining([
        "Bootcamps",
        "Certification exams",
        "1-on-1 team mentorship",
        "Career services",
        "Hiring services",
        "Admin dashboard",
        "Team performance reports",
        "Co-branded landing page",
      ]),
    );
  });

  it("carries no seat or per-user pricing line at all", () => {
    // These records feed a card whose price block already states the model,
    // and the rate is region-resolved per request — a static pricing line
    // here could only ever be a second, drifting opinion about it.
    for (const feature of features("enterprise")) {
      expect(feature.name).not.toMatch(/per user/i);
      expect(feature.name).not.toMatch(/\bseats?\b/i);
    }
  });

  it("excludes nothing — it is the top tier", () => {
    expect(excluded("enterprise")).toEqual([]);
  });

  /**
   * REGRESSION. Enterprise used to be sold as "5 included seats, $10 each
   * after that". It is now priced PER USER from the first seat with a
   * two-seat minimum and no cap (lib/pricing.ts's EnterprisePricing, and
   * academy's src/extensions/payment/pricing/tiers.ts). A feature line
   * quoting the old model would contradict what /checkout charges — and
   * would quote a USD figure at a buyer who is billed in naira.
   */
  it("quotes no seat allotment and no hardcoded overage rate", () => {
    const text = features("enterprise")
      .map((f) => f.name)
      .join(" ");
    expect(text).not.toMatch(/additional 5 team members/i);
    expect(text).not.toMatch(/\$\d/);
  });
});

describe("Plan records — archived products", () => {
  /**
   * MB Lands was archived on Feb 28, 2026 and folded into Courses:
   * app/lands/page.tsx is a deprecation notice, and the sidebar entry is
   * commented out in components/dashboard-sidebar.tsx. No plan may advertise
   * access to it.
   */
  it("advertises no MB Lands access on any plan", () => {
    for (const id of ALL_IDS) {
      for (const feature of features(id)) {
        expect(feature.name).not.toMatch(/land access/i);
      }
    }
  });
});

describe("Plan records — cross-plan consistency", () => {
  it("keeps the shared feature names spelled identically across plans", () => {
    // subscription-plans.tsx renders the three lists side by side. A feature
    // spelled "Community forum access" on one card and "Community access" on
    // the next reads as two different things and breaks the horizontal scan.
    const shared = [
      "Access to free courses",
      "Community forum access",
      "Premium courses",
      "Bootcamps",
      "Interview preparation",
      "Certification exams",
      "1-on-1 team mentorship",
      "Career services",
      "Hiring services",
      "Admin dashboard",
      "Team performance reports",
      "Co-branded landing page",
    ];
    for (const name of shared) {
      for (const id of ALL_IDS) {
        expect(features(id).map((f) => f.name)).toContain(name);
      }
    }
  });

  it("never marks a feature included on a lower tier but excluded on a higher one", () => {
    const proNames = new Map(features("pro").map((f) => [f.name, f.included]));
    const entNames = new Map(
      features("enterprise").map((f) => [f.name, f.included]),
    );

    for (const feature of features("free")) {
      if (!feature.included) continue;
      if (proNames.has(feature.name)) {
        expect(proNames.get(feature.name)).toBe(true);
      }
      if (entNames.has(feature.name)) {
        expect(entNames.get(feature.name)).toBe(true);
      }
    }

    for (const feature of features("pro")) {
      if (!feature.included) continue;
      if (entNames.has(feature.name)) {
        expect(entNames.get(feature.name)).toBe(true);
      }
    }
  });
});

describe("Plan records — unshipped capabilities are flagged", () => {
  /**
   * Mirrors the COMING_SOON set in components/pages/pricing.tsx. Both
   * /pricing and /subscription/plans are purchase surfaces; a capability
   * gated on one and shown as live on the other is worse than not gating it
   * at all, because the buyer who checked both now has reason to doubt each.
   */
  const UNSHIPPED = ["Hiring services", "Co-branded landing page"];

  it("marks the unshipped Enterprise capabilities comingSoon", () => {
    const byName = new Map(
      features("enterprise").map((f) => [f.name, f as Feature & { comingSoon?: boolean }]),
    );
    for (const name of UNSHIPPED) {
      expect(byName.get(name)).toBeDefined();
      expect(byName.get(name)?.comingSoon).toBe(true);
    }
  });

  it("does not flag capabilities that actually ship", () => {
    for (const id of ALL_IDS) {
      for (const feature of features(id) as (Feature & { comingSoon?: boolean })[]) {
        if (UNSHIPPED.includes(feature.name)) continue;
        expect(feature.comingSoon).toBeUndefined();
      }
    }
  });
});

describe("Plan records — Free plan wording", () => {
  it("names the free project tier positively rather than as a limitation", () => {
    expect(included("free")).toContain("Access to Free projects");
    expect(features("free").map((f) => f.name)).not.toContain(
      "Limited project access",
    );
  });
});
