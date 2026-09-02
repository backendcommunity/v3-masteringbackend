import { describe, it, expect } from "vitest";
import { wrapText, layoutRuns, coverRect } from "@/lib/scholarship-flyer/draw-flyer";

/** Stand-in metrics: every character is 10px wide, whatever the weight. */
const measureText = (text: string) => text.length * 10;
const measureRun = (text: string) => text.length * 10;

describe("wrapText", () => {
  it("keeps a short line whole", () => {
    expect(wrapText(measureText, "one two", 200)).toEqual(["one two"]);
  });

  it("breaks on the last word that fits", () => {
    // "aaa bbb" is 70px, adding " ccc" would be 110px.
    expect(wrapText(measureText, "aaa bbb ccc", 100)).toEqual(["aaa bbb", "ccc"]);
  });

  it("never drops a word that is wider than the line", () => {
    const lines = wrapText(measureText, "supercalifragilistic ok", 50);
    expect(lines.join(" ")).toBe("supercalifragilistic ok");
  });

  it("collapses runs of whitespace", () => {
    expect(wrapText(measureText, "one   two", 500)).toEqual(["one two"]);
  });
});

describe("layoutRuns", () => {
  const runs = (name: string) => [
    { text: "I,", weight: 400, color: "a" },
    { text: name, weight: 700, color: "b" },
    { text: ", will be joining the", weight: 400, color: "a" },
  ];

  it("keeps the whole sentence on one line when it fits", () => {
    const lines = layoutRuns(measureRun, runs("Ada"), 10_000);
    expect(lines).toHaveLength(1);
    expect(lines[0].map((w) => w.text).join("")).toBe("I, Ada, will be joining the");
  });

  it("hugs the comma to the name rather than starting a word with it", () => {
    const lines = layoutRuns(measureRun, runs("Ada"), 10_000);
    const words = lines[0].map((w) => w.text);
    expect(words).toContain(",");
    expect(words.some((w) => w === " ,")).toBe(false);
  });

  it("wraps to a second line when the name is long", () => {
    const lines = layoutRuns(measureRun, runs("Oluwaseyifunmi Adebayo-Ogun"), 400);
    expect(lines.length).toBeGreaterThan(1);
  });

  it("preserves each run's weight so the name stays bolder", () => {
    const lines = layoutRuns(measureRun, runs("Ada"), 10_000);
    const name = lines[0].find((w) => w.text.trim() === "Ada");
    expect(name?.weight).toBe(700);
  });

  it("starts every line at x=0", () => {
    const lines = layoutRuns(measureRun, runs("Oluwaseyifunmi Adebayo-Ogun"), 400);
    lines.forEach((line) => expect(line[0].x).toBe(0));
  });
});

describe("coverRect", () => {
  it("crops the sides of a landscape photo", () => {
    const { sx, sy, sw, sh } = coverRect(4000, 2000, 236, 236);
    expect(sw).toBe(2000);
    expect(sh).toBe(2000);
    expect(sx).toBe(1000);
    expect(sy).toBe(0);
  });

  it("crops the top and bottom of a portrait photo", () => {
    const { sx, sy, sw, sh } = coverRect(2000, 4000, 236, 236);
    expect(sw).toBe(2000);
    expect(sh).toBe(2000);
    expect(sx).toBe(0);
    expect(sy).toBe(1000);
  });

  it("uses a square photo whole", () => {
    expect(coverRect(500, 500, 236, 236)).toEqual({ sx: 0, sy: 0, sw: 500, sh: 500 });
  });
});
