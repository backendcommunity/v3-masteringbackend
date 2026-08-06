import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorBoundary } from "../error-boundary";

vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));

const mockSubmitFeedback = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/store", () => ({
  useAppStore: () => ({ submitFeedback: mockSubmitFeedback }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function Boom(): never {
  throw new Error("Simulated crash: cannot read properties of undefined");
}

describe("ErrorBoundary — Report Issue", () => {
  it("renders a Report Issue button (not a link) after a crash, with NO AuthProvider in the tree", () => {
    // Deliberately NOT wrapped in AuthProvider — this is the exact scenario
    // the design doc calls out: the fallback UI must work when AuthProvider
    // itself is what crashed.
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );

    expect(screen.getByRole("button", { name: /report issue/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /report issue/i })).not.toBeInTheDocument();
  });

  it("opens the feedback dialog prefilled with the crash's error message", () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );

    fireEvent.click(screen.getByRole("button", { name: /report issue/i }));

    // The dialog opens and the error message appears in it (shown read-only above the textarea)
    expect(
      screen.getAllByText(/simulated crash: cannot read properties of undefined/i),
    ).toHaveLength(2);
    // Verify the Send button is present (indicates dialog is open)
    expect(screen.getByRole("button", { name: /send/i })).toBeInTheDocument();
  });

  it("submits successfully with no auth context available", async () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );

    fireEvent.click(screen.getByRole("button", { name: /report issue/i }));
    fireEvent.change(screen.getByPlaceholderText(/your feedback/i), {
      target: { value: "I clicked Run and it crashed" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    expect(mockSubmitFeedback).toHaveBeenCalledWith(
      expect.objectContaining({ source: "error-boundary" }),
    );
  });
});
