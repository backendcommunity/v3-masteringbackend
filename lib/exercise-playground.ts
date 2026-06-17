export interface LanguageOption {
  name: string;
  code: string;
  supported: boolean;
  snippet?: string;
}

/** Academy WebSocket origin = API URL minus the trailing /api/v3. */
export function deriveAcademyOrigin(apiUrl: string): string {
  return apiUrl.replace(/\/api\/v3\/?$/, "");
}

/** Languages the learner may pick: the exercise's allowed set, or all if empty. */
export function allowedLanguages(allowed: string[], all: LanguageOption[]): LanguageOption[] {
  if (!allowed || allowed.length === 0) return all;
  return all.filter((l) => allowed.includes(l.code));
}

/** Pre-selected language: the exercise's primary if allowed, else the first allowed. */
export function defaultLanguage(primary: string, allowed: string[], all: LanguageOption[]): string {
  const options = allowedLanguages(allowed, all);
  if (options.some((l) => l.code === primary)) return primary;
  return options[0]?.code ?? all[0]?.code ?? "node";
}

/** Map our language code to a Monaco editor language id. */
const MONACO: Record<string, string> = {
  node: "javascript",
  python: "python",
  php: "php",
  ruby: "ruby",
  java: "java",
  c: "c",
  cpp: "cpp",
  go: "go",
  rust: "rust",
  csharp: "csharp",
  kotlin: "kotlin",
  scala: "scala",
  perl: "perl",
};

export function monacoLang(code: string): string {
  return MONACO[code] ?? "plaintext";
}
