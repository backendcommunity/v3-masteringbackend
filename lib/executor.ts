const EXECUTOR_URL =
  process.env.NEXT_PUBLIC_EXECUTOR_URL ?? "http://localhost:4000";

function toBase64(code: string): string {
  try {
    return btoa(code);
  } catch {
    const bytes = new TextEncoder().encode(code);
    let binary = "";
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    return btoa(binary);
  }
}

export interface ExecuteTestCase {
  input: any[];
  expected: any;
  description: string;
}

export interface ExecuteResult {
  success: boolean;
  results?: Array<{ pass: boolean }>;
  raw?: { stdout: string; stderr: string; exitCode: number };
  error?: string;
}

export async function executeCode(
  code: string,
  language: string,
  testCases?: ExecuteTestCase[],
  functionName?: string,
): Promise<ExecuteResult> {
  const body: Record<string, any> = { code: toBase64(code), language };
  if (testCases?.length) body.testCases = testCases;
  if (functionName) body.functionName = functionName;

  const res = await fetch(`${EXECUTOR_URL}/api/execute/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { success: false, error: err.error ?? "Execution failed" };
  }

  return res.json();
}
