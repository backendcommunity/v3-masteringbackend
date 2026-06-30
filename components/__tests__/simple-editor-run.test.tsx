// components/__tests__/simple-editor-run.test.tsx
// Task 6: TDD — SimpleEditor real code execution via /playgrounds/execute

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ── Browser APIs missing in jsdom ───────────────────────────────────────────
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});

// ── Mock Monaco editor ──────────────────────────────────────────────────────
vi.mock("@monaco-editor/react", () => ({
  default: ({ value, onChange }: { value?: string; onChange?: (v: string) => void }) => {
    const React = require("react");
    return React.createElement("textarea", {
      "data-testid": "monaco-editor",
      value: value ?? "",
      onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => onChange?.(e.target.value),
      readOnly: false,
    });
  },
}));

// ── Mock next-themes ────────────────────────────────────────────────────────
vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light" }),
}));

// ── Mock Radix UI Select ─────────────────────────────────────────────────────
vi.mock("@/components/ui/select", () => ({
  Select: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "select" }, children),
  SelectTrigger: ({ children }: { children: React.ReactNode }) =>
    React.createElement("button", { "data-testid": "select-trigger" }, children),
  SelectValue: ({ placeholder }: { placeholder?: string }) =>
    React.createElement("span", null, placeholder ?? ""),
  SelectContent: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "select-content" }, children),
  SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": `select-item-${value}` }, children),
}));

// ── Mock Shadcn Card ─────────────────────────────────────────────────────────
vi.mock("@/components/ui/card", () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) =>
    React.createElement("div", { "data-testid": "card", className }, children),
  CardHeader: ({ children, className }: { children: React.ReactNode; className?: string }) =>
    React.createElement("div", { "data-testid": "card-header", className }, children),
  CardTitle: ({ children }: { children: React.ReactNode }) =>
    React.createElement("h2", { "data-testid": "card-title" }, children),
  CardDescription: ({ children }: { children: React.ReactNode }) =>
    React.createElement("p", { "data-testid": "card-description" }, children),
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) =>
    React.createElement("div", { "data-testid": "card-content", className }, children),
}));

// ── Mock Shadcn Checkbox ─────────────────────────────────────────────────────
vi.mock("@/components/ui/checkbox", () => ({
  Checkbox: ({
    checked,
    onCheckedChange,
    id,
    disabled,
  }: {
    checked?: boolean;
    onCheckedChange?: (v: boolean) => void;
    id?: string;
    disabled?: boolean;
  }) =>
    React.createElement("input", {
      type: "checkbox",
      id,
      checked: checked ?? false,
      disabled,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        onCheckedChange?.(e.target.checked),
      "data-testid": "user-input-toggle",
      readOnly: false,
    }),
}));

// ── Mock Shadcn Label + Input + Button ───────────────────────────────────────
vi.mock("@/components/ui/label", () => ({
  Label: ({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) =>
    React.createElement("label", { htmlFor }, children),
}));

vi.mock("@/components/ui/input", () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) =>
    React.createElement("input", { "data-testid": "title-input", ...props }),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    disabled,
    className,
    variant,
    size,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
    variant?: string;
    size?: string;
  }) =>
    React.createElement(
      "button",
      { onClick, disabled, className, "data-variant": variant, "data-size": size },
      children,
    ),
}));

// ── Mock sonner ──────────────────────────────────────────────────────────────
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// ── Mock store ───────────────────────────────────────────────────────────────
const executeCode = vi.fn();
const getSavedPlaygrounds = vi.fn().mockResolvedValue([]);

vi.mock("@/lib/store", () => ({
  useAppStore: () => ({
    executeCode,
    getSavedPlaygrounds,
    savePlayground: vi.fn(),
  }),
}));

// ── Mock utils ───────────────────────────────────────────────────────────────
vi.mock("@/lib/utils", () => ({
  cn: (...args: string[]) => args.filter(Boolean).join(" "),
  codeSample: "// write your code here",
}));

// ── Mock languages ───────────────────────────────────────────────────────────
vi.mock("@/lib/languages", () => ({
  languages: [
    { code: "node", name: "Node.js", label: "Node.js", snippet: "console.log('hello')" },
    { code: "python", name: "Python", label: "Python", snippet: "print('hello')" },
  ],
}));

// Imports after mocks so vi.mock hoisting has all factories available
import { SimpleEditor } from "@/components/pages/SimpleEditor";
import { toast } from "sonner";

beforeEach(() => {
  vi.clearAllMocks();
  getSavedPlaygrounds.mockResolvedValue([]);
});

function getRunButton() {
  const buttons = screen.getAllByRole("button", { name: /run/i });
  // The last Run button is the primary action button
  return buttons[buttons.length - 1];
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("SimpleEditor — real code execution", () => {
  it("calls store.executeCode with language and base64 code (no stdin) when input is closed", async () => {
    const user = userEvent.setup();

    executeCode.mockResolvedValue({
      stdout: "hello world",
      stderr: "",
      exitCode: 0,
      timedOut: false,
      timeMs: 120,
    });

    // Render with a node playground — language useEffect sets snippet as the code
    render(
      <SimpleEditor
        playground={{
          id: "p1",
          language: "node",
          code: btoa("console.log('hi')"),
          title: "t",
        } as any}
        full={true}
      />,
    );

    await user.click(getRunButton());

    await waitFor(() => {
      expect(executeCode).toHaveBeenCalledOnce();
    });

    const call = executeCode.mock.calls[0][0];
    // language must be "node"
    expect(call.language).toBe("node");
    // code must be valid base64
    expect(() => atob(call.code)).not.toThrow();
    // stdin must be absent (no user input)
    expect(call.stdin).toBeUndefined();
  });

  it("renders stdout in the result panel on success and fires toast.success", async () => {
    const user = userEvent.setup();

    executeCode.mockResolvedValue({
      stdout: "hello world",
      stderr: "",
      exitCode: 0,
      timedOut: false,
      timeMs: 120,
    });

    render(
      <SimpleEditor
        playground={{
          id: "p1",
          language: "node",
          code: btoa("console.log('hi')"),
          title: "t",
        } as any}
        full={true}
      />,
    );

    await user.click(getRunButton());

    expect(await screen.findByText("hello world")).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith("Code executed");
  });

  it("renders stderr in red pre on non-zero exit code and fires toast.error", async () => {
    const user = userEvent.setup();

    executeCode.mockResolvedValue({
      stdout: "",
      stderr: "SyntaxError: Unexpected token",
      exitCode: 1,
      timedOut: false,
      timeMs: 80,
    });

    render(
      <SimpleEditor
        playground={{
          id: "p1",
          language: "node",
          code: btoa("bad code"),
          title: "t",
        } as any}
        full={true}
      />,
    );

    await user.click(getRunButton());

    const errEl = await screen.findByText("SyntaxError: Unexpected token");
    expect(errEl).toBeInTheDocument();
    expect(errEl.className).toContain("text-red-500");
    expect(toast.error).toHaveBeenCalledWith("Program exited with errors");
  });

  it("shows Timed out note and fires toast.error when timedOut is true", async () => {
    const user = userEvent.setup();

    executeCode.mockResolvedValue({
      stdout: "",
      stderr: "",
      exitCode: 1,
      timedOut: true,
      timeMs: 10000,
    });

    render(
      <SimpleEditor
        playground={{
          id: "p1",
          language: "node",
          code: btoa("while(true){}"),
          title: "t",
        } as any}
        full={true}
      />,
    );

    await user.click(getRunButton());

    expect(await screen.findByText("Timed out")).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith("Execution timed out");
  });

  it("shows API error message in stderr panel when executeCode rejects", async () => {
    const user = userEvent.setup();

    executeCode.mockRejectedValue({
      response: { data: { message: "Rate limit exceeded" } },
    });

    render(
      <SimpleEditor
        playground={{
          id: "p1",
          language: "node",
          code: btoa("code"),
          title: "t",
        } as any}
        full={true}
      />,
    );

    await user.click(getRunButton());

    expect(await screen.findByText("Rate limit exceeded")).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith("Rate limit exceeded");
  });

  it("passes stdin in the payload when user input drawer is open with text", async () => {
    const user = userEvent.setup();

    executeCode.mockResolvedValue({
      stdout: "Alice",
      stderr: "",
      exitCode: 0,
      timedOut: false,
      timeMs: 100,
    });

    render(
      <SimpleEditor
        playground={{
          id: "p1",
          language: "node",
          code: btoa("process.stdin.read()"),
          title: "t",
        } as any}
        full={true}
      />,
    );

    // Toggle the "Add Input" checkbox to open the stdin drawer
    const checkbox = screen.getByTestId("user-input-toggle");
    await user.click(checkbox);

    // Type stdin value into the textarea
    const textarea = screen.getByPlaceholderText(/enter input for your program/i);
    await user.type(textarea, "Alice");

    await user.click(getRunButton());

    await waitFor(() => {
      expect(executeCode).toHaveBeenCalledWith(
        expect.objectContaining({
          stdin: "Alice",
        }),
      );
    });
  });
});
