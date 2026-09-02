import { describe, it, expect } from "vitest";
import { fitName, MAX_NAME_CHARS, LEAD_MAX_PX, LEAD_MIN_PX } from "@/lib/scholarship-flyer/fit-name";

describe("fitName", () => {
  it("keeps a short name whole and at the largest size", () => {
    const fit = fitName("Ada", () => 1);
    expect(fit.name).toBe("Ada");
    expect(fit.fontSize).toBe(LEAD_MAX_PX);
    expect(fit.truncated).toBe(false);
  });

  it("collapses runs of whitespace and trims", () => {
    expect(fitName("  Solomon   Eseme ", () => 1).name).toBe("Solomon Eseme");
  });

  it("falls back to a placeholder when the name is empty", () => {
    expect(fitName("   ", () => 1).name).toBe("Your Name");
  });

  it("truncates past the character cap with an ellipsis", () => {
    const fit = fitName("Maximilian Oluwadamilare Adeyemi", () => 1);
    expect(fit.truncated).toBe(true);
    expect(fit.name.length).toBeLessThanOrEqual(MAX_NAME_CHARS);
    expect(fit.name.endsWith("…")).toBe(true);
  });

  it("steps the size down while the sentence takes more than two lines", () => {
    // Sentence fits two lines only at 38px and below.
    const fit = fitName("Chukwuemeka Nwachukwu", (px) => (px > 38 ? 3 : 2));
    expect(fit.fontSize).toBe(38);
  });

  it("never goes below the floor, even if it still overflows", () => {
    const fit = fitName("Chukwuemeka Nwachukwu", () => 4);
    expect(fit.fontSize).toBe(LEAD_MIN_PX);
  });

  it("does not count a name that is exactly at the cap as truncated", () => {
    const exact = "A".repeat(MAX_NAME_CHARS);
    const fit = fitName(exact, () => 1);
    expect(fit.truncated).toBe(false);
    expect(fit.name).toBe(exact);
  });
});
