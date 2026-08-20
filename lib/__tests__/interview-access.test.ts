import { describe, it, expect } from "vitest";
import {
  DURATION_UNLOCKED_BY,
  UNLIMITED,
  isDurationLocked,
  isInterviewGated,
  maxAllowedDuration,
  sessionAllowanceLabel,
  type InterviewAccess,
} from "@/lib/interview-access";

/**
 * Fixtures mirror what getMockInterviewAccess actually returns for each tier
 * (academy's src/modules/mock-interview/helpers/subscription-access.ts).
 */
const free = (used = 0): InterviewAccess => ({
  tier: "free",
  hasAccess: used < 1,
  maxSessions: 1,
  usedSessions: used,
  remainingSessions: Math.max(0, 1 - used),
  allowedDurations: [15],
});

const pro = (used = 0): InterviewAccess => ({
  tier: "pro",
  hasAccess: true,
  maxSessions: UNLIMITED,
  usedSessions: used,
  remainingSessions: UNLIMITED,
  allowedDurations: [15, 30],
});

const enterprise = (used = 0): InterviewAccess => ({
  tier: "enterprise",
  hasAccess: true,
  maxSessions: UNLIMITED,
  usedSessions: used,
  remainingSessions: UNLIMITED,
  allowedDurations: [15, 30, 45, 60],
});

/** The API's "user not found" shape — no allowance at all. */
const unknownUser: InterviewAccess = {
  tier: "free",
  hasAccess: false,
  maxSessions: 0,
  usedSessions: 0,
  remainingSessions: 0,
  allowedDurations: [],
  message: "User not found",
};

describe("isInterviewGated", () => {
  it("gates a free user who has spent their trial", () => {
    expect(isInterviewGated(free(1))).toBe(true);
  });

  it("lets a free user with their trial still in hand through", () => {
    expect(isInterviewGated(free(0))).toBe(false);
  });

  it("never gates an unlimited tier, however many sessions they have run", () => {
    expect(isInterviewGated(pro(0))).toBe(false);
    expect(isInterviewGated(pro(99))).toBe(false);
    expect(isInterviewGated(enterprise(99))).toBe(false);
  });

  it("gates the API's user-not-found shape", () => {
    expect(isInterviewGated(unknownUser)).toBe(true);
  });

  it("does NOT gate while access is still unknown", () => {
    // Null is "we have not been told yet" — loading, or a failed fetch. The
    // server refuses on its own with a 402, so treating unknown as gated
    // would wall off paying users over a network blip.
    expect(isInterviewGated(null)).toBe(false);
    expect(isInterviewGated(undefined)).toBe(false);
  });

  it("fires for EVERY exhausted payload the old inline condition missed", () => {
    // The regression this function exists for. The page used to ask
    // `remainingSessions >= 1 && !hasAccess`, and because the API guarantees
    // `hasAccess === (remainingSessions !== 0)`, those two halves can never
    // hold at once. Asserted here as a property over every payload shape the
    // server can produce, so the contradiction cannot be reintroduced.
    const everyShape: InterviewAccess[] = [
      free(0),
      free(1),
      free(2),
      pro(0),
      pro(50),
      enterprise(0),
      unknownUser,
    ];

    for (const access of everyShape) {
      const oldCondition = access.remainingSessions >= 1 && !access.hasAccess;
      expect(oldCondition).toBe(false); // it fired for nothing, ever
      expect(isInterviewGated(access)).toBe(!access.hasAccess);
    }

    // And it does fire for the payloads that matter: both spent free users
    // and the user-not-found shape.
    expect(everyShape.filter(isInterviewGated)).toHaveLength(3);
  });
});

describe("maxAllowedDuration", () => {
  it("reads the longest bookable session off the API's own list", () => {
    expect(maxAllowedDuration(free())).toBe(15);
    expect(maxAllowedDuration(pro())).toBe(30);
    expect(maxAllowedDuration(enterprise())).toBe(60);
  });

  it("returns null rather than -Infinity when the list is empty", () => {
    // Math.max() with no arguments is -Infinity, which would have rendered
    // as "up to -Infinity min each".
    expect(maxAllowedDuration({ allowedDurations: [] })).toBeNull();
  });
});

describe("sessionAllowanceLabel", () => {
  /**
   * REGRESSION. This page printed
   * `${remainingSessions} of ${maxSessions} sessions remaining this month`
   * for every non-free tier. The moment Pro went unlimited the API started
   * returning -1 for both, and a Pro subscriber was shown
   * "-1 of -1 sessions remaining this month".
   */
  it("never renders the -1 sentinel", () => {
    for (const access of [pro(), enterprise(), pro(12), enterprise(99)]) {
      const label = sessionAllowanceLabel(access);
      expect(label).not.toBeNull();
      expect(label).not.toMatch(/-1/);
      expect(label).not.toMatch(/-?Infinity/);
    }
  });

  it("says unlimited, WITH the session length, on both paid tiers", () => {
    // Length is the only thing separating them now, so an allowance line
    // that omits it makes Pro and Enterprise look identical.
    expect(sessionAllowanceLabel(pro())).toBe(
      "Unlimited sessions, up to 30 min each",
    );
    expect(sessionAllowanceLabel(enterprise())).toBe(
      "Unlimited sessions, up to 60 min each",
    );
    expect(sessionAllowanceLabel(pro())).not.toBe(
      sessionAllowanceLabel(enterprise()),
    );
  });

  it("counts the free tier's single monthly session", () => {
    expect(sessionAllowanceLabel(free())).toBe(
      "1 free trial interview available, up to 15 min each",
    );
  });

  it("reports the free trial as used once it is spent", () => {
    expect(sessionAllowanceLabel(free(1))).toBe("Free trial used");
  });

  it("stays silent for a user the API could not resolve", () => {
    // Not "0 of 0 sessions remaining" — there is no allowance to describe.
    expect(sessionAllowanceLabel(unknownUser)).toBeNull();
  });

  it("still handles a metered multi-session tier, should one return", () => {
    const legacyPro: InterviewAccess = {
      ...pro(),
      maxSessions: 4,
      remainingSessions: 3,
    };
    expect(sessionAllowanceLabel(legacyPro)).toBe(
      "3 of 4 sessions remaining this month, up to 30 min each",
    );
  });
});

describe("isDurationLocked", () => {
  it("locks only the durations the tier cannot book", () => {
    expect(isDurationLocked(free(), 15)).toBe(false);
    expect(isDurationLocked(free(), 30)).toBe(true);
    expect(isDurationLocked(pro(), 30)).toBe(false);
    expect(isDurationLocked(pro(), 45)).toBe(true);
    expect(isDurationLocked(enterprise(), 60)).toBe(false);
  });

  /**
   * REGRESSION. The original guard was
   * `hasAccess === true && !allowedDurations.includes(d)`, which inverted
   * itself the moment a free user ran out: hasAccess goes false, every
   * option became selectable, and they could build a 60-minute template
   * their tier can never book.
   */
  it("keeps locking durations after the free trial is exhausted", () => {
    const spent = free(1);
    expect(spent.hasAccess).toBe(false);
    expect(isDurationLocked(spent, 60)).toBe(true);
    expect(isDurationLocked(spent, 15)).toBe(false);
  });

  it("locks nothing while access is still loading", () => {
    // Disabling every option against a null payload would make the form
    // unusable for the moment before the request resolves.
    expect(isDurationLocked(null, 60)).toBe(false);
    expect(isDurationLocked(undefined, 60)).toBe(false);
    expect(isDurationLocked({ allowedDurations: [] }, 60)).toBe(false);
  });
});

describe("DURATION_UNLOCKED_BY", () => {
  /**
   * REGRESSION. Every unavailable duration used to be labelled
   * "(Enterprise)". A free user was therefore told 30-minute sessions
   * required Enterprise, when Pro grants them — an upsell aimed at the
   * wrong, more expensive plan.
   */
  it("names the CHEAPEST tier that unlocks each length", () => {
    expect(DURATION_UNLOCKED_BY[30]).toBe("Pro");
    expect(DURATION_UNLOCKED_BY[45]).toBe("Enterprise");
    expect(DURATION_UNLOCKED_BY[60]).toBe("Enterprise");
  });

  it("claims no upgrade for the length every tier already has", () => {
    expect(DURATION_UNLOCKED_BY[15]).toBeUndefined();
  });

  it("agrees with the tier fixtures it is meant to mirror", () => {
    // Anything Pro can book must not be advertised as an Enterprise perk.
    for (const d of pro().allowedDurations) {
      expect(DURATION_UNLOCKED_BY[d]).not.toBe("Enterprise");
    }
    // Anything only Enterprise can book must point at Enterprise.
    const proOnly = new Set(pro().allowedDurations);
    for (const d of enterprise().allowedDurations.filter((x) => !proOnly.has(x))) {
      expect(DURATION_UNLOCKED_BY[d]).toBe("Enterprise");
    }
  });
});
