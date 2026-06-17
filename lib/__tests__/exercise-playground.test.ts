import { describe, it, expect } from "vitest";
import {
  deriveAcademyOrigin,
  allowedLanguages,
  defaultLanguage,
  monacoLang,
} from "../exercise-playground";

const ALL = [
  { name: "Node.js", code: "node", supported: true },
  { name: "Python", code: "python", supported: false },
  { name: "Java", code: "java", supported: false },
];

describe("deriveAcademyOrigin", () => {
  it("strips a trailing /api/v3", () => {
    expect(deriveAcademyOrigin("http://localhost:8081/api/v3")).toBe("http://localhost:8081");
  });
  it("strips /api/v3/ with trailing slash", () => {
    expect(deriveAcademyOrigin("https://api.mb.com/api/v3/")).toBe("https://api.mb.com");
  });
  it("returns origin unchanged when no suffix", () => {
    expect(deriveAcademyOrigin("https://api.mb.com")).toBe("https://api.mb.com");
  });
});

describe("allowedLanguages", () => {
  it("returns all when exercise allows none explicitly", () => {
    expect(allowedLanguages([], ALL).map((l) => l.code)).toEqual(["node", "python", "java"]);
  });
  it("filters to the exercise's allowed set", () => {
    expect(allowedLanguages(["python", "java"], ALL).map((l) => l.code)).toEqual(["python", "java"]);
  });
});

describe("defaultLanguage", () => {
  it("uses the exercise's primary language when allowed", () => {
    expect(defaultLanguage("python", ["python", "java"], ALL)).toBe("python");
  });
  it("falls back to the first allowed language", () => {
    expect(defaultLanguage("ruby", ["java"], ALL)).toBe("java");
  });
  it("falls back to the first of all when nothing allowed", () => {
    expect(defaultLanguage("ruby", [], ALL)).toBe("node");
  });
});

describe("monacoLang", () => {
  it("maps node to javascript", () => {
    expect(monacoLang("node")).toBe("javascript");
  });
  it("passes through python", () => {
    expect(monacoLang("python")).toBe("python");
  });
  it("falls back to plaintext for unknown", () => {
    expect(monacoLang("zzz")).toBe("plaintext");
  });
});
