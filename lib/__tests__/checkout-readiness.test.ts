import { describe, it, expect } from "vitest";
import {
  classifyCheckoutReadiness,
  checkoutSubscribeLabel,
} from "@/lib/checkout-readiness";

describe("classifyCheckoutReadiness", () => {
  it("is unavailable when there is no price ID, even once the SDK resolves", () => {
    expect(
      classifyCheckoutReadiness({ hasPriceId: false, sdkResolved: true }),
    ).toBe("unavailable");
  });

  it("is unavailable when there is no price ID and the SDK has not resolved either", () => {
    expect(
      classifyCheckoutReadiness({ hasPriceId: false, sdkResolved: false }),
    ).toBe("unavailable");
  });

  it("is loading when a price ID exists but the SDK has not resolved yet", () => {
    expect(
      classifyCheckoutReadiness({ hasPriceId: true, sdkResolved: false }),
    ).toBe("loading");
  });

  it("is ready when both a price ID and a resolved SDK are present", () => {
    expect(
      classifyCheckoutReadiness({ hasPriceId: true, sdkResolved: true }),
    ).toBe("ready");
  });
});

describe("checkoutSubscribeLabel", () => {
  it("reads 'Checkout unavailable' when unavailable, regardless of isProcessing", () => {
    expect(checkoutSubscribeLabel("unavailable", false)).toBe(
      "Checkout unavailable",
    );
    expect(checkoutSubscribeLabel("unavailable", true)).toBe(
      "Checkout unavailable",
    );
  });

  it("reads 'Loading...' when loading, regardless of isProcessing", () => {
    expect(checkoutSubscribeLabel("loading", false)).toBe("Loading...");
    expect(checkoutSubscribeLabel("loading", true)).toBe("Loading...");
  });

  it("reads 'Subscribe' when ready and not processing", () => {
    expect(checkoutSubscribeLabel("ready", false)).toBe("Subscribe");
  });

  it("reads 'Processing...' when ready and processing", () => {
    expect(checkoutSubscribeLabel("ready", true)).toBe("Processing...");
  });
});
