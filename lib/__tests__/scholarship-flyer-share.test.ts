import { describe, it, expect } from "vitest";
import {
  LINKEDIN_CAPTION,
  X_CAPTION,
  SCHOLARSHIP_URL,
  linkedInShareUrl,
  xShareUrl,
  flyerFileName,
} from "@/lib/scholarship-flyer/share";

describe("captions", () => {
  it("tags the page on LinkedIn and the handle on X", () => {
    expect(LINKEDIN_CAPTION).toContain("@Mastering Backend");
    expect(X_CAPTION).toContain("@master_backend");
  });

  it("links back to the scholarship page from both", () => {
    expect(SCHOLARSHIP_URL).toBe("https://masteringai.dev/scholarship");
    expect(LINKEDIN_CAPTION).toContain(SCHOLARSHIP_URL);
    expect(X_CAPTION).toContain(SCHOLARSHIP_URL);
  });

  it("names the campaign, the cohort and the start date", () => {
    for (const caption of [LINKEDIN_CAPTION, X_CAPTION]) {
      expect(caption).toContain("₦27 Million");
      expect(caption).toContain("Cohort 2");
    }
    expect(LINKEDIN_CAPTION).toContain("September 7");
  });

  it("stays inside the X character limit", () => {
    expect(X_CAPTION.length).toBeLessThanOrEqual(280);
  });
});

describe("share urls", () => {
  it("encodes the caption into the LinkedIn composer", () => {
    const url = linkedInShareUrl();
    expect(url.startsWith("https://www.linkedin.com/feed/?shareActive=true&text=")).toBe(true);
    expect(url).toContain(encodeURIComponent("@Mastering Backend"));
    expect(url).toContain(encodeURIComponent(SCHOLARSHIP_URL));
    expect(url).not.toContain("\n");
  });

  it("encodes the caption into the X composer", () => {
    const url = xShareUrl();
    expect(url.startsWith("https://x.com/intent/post?text=")).toBe(true);
    expect(url).toContain(encodeURIComponent("@master_backend"));
    expect(url).toContain(encodeURIComponent(SCHOLARSHIP_URL));
  });
});

describe("flyerFileName", () => {
  it("uses the first name, lowercased and stripped", () => {
    expect(flyerFileName("Solomon Eseme")).toBe("solomon-ai-bootcamp-flyer.png");
  });

  it("falls back when the name has no usable characters", () => {
    expect(flyerFileName("   ")).toBe("my-ai-bootcamp-flyer.png");
    expect(flyerFileName("!!!")).toBe("my-ai-bootcamp-flyer.png");
  });
});
