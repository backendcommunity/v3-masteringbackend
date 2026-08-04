import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { PathFeedbackDialog } from "../path-feedback-dialog";

const mockSubmitFeedback = vi.fn();
vi.mock("@/lib/store", () => ({
  useAppStore: () => ({ submitFeedback: mockSubmitFeedback }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function setup(overrides: Partial<React.ComponentProps<typeof PathFeedbackDialog>> = {}) {
  const onOpenChange = vi.fn();
  render(
    <PathFeedbackDialog
      open
      onOpenChange={onOpenChange}
      source="playground"
      {...overrides}
    />,
  );
  return { onOpenChange };
}

describe("PathFeedbackDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("disables Send while the textarea is empty", () => {
    setup();
    expect(screen.getByRole("button", { name: /send/i })).toBeDisabled();
  });

  it("on success: toasts, clears text, and closes via onOpenChange", async () => {
    mockSubmitFeedback.mockResolvedValue(undefined);
    const { onOpenChange } = setup();

    fireEvent.change(screen.getByPlaceholderText(/your feedback/i), {
      target: { value: "Loved this lesson" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(mockSubmitFeedback).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Loved this lesson", source: "playground" }),
    );
  });

  it("on failure: toasts an error, keeps the dialog open, and preserves the typed text", async () => {
    mockSubmitFeedback.mockRejectedValue(new Error("network error"));
    const { onOpenChange } = setup();

    fireEvent.change(screen.getByPlaceholderText(/your feedback/i), {
      target: { value: "Something broke" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    expect(screen.getByPlaceholderText(/your feedback/i)).toHaveValue("Something broke");
  });

  it("joins prefillMessage and the user's text on submit, budgeted under 3000 chars", async () => {
    mockSubmitFeedback.mockResolvedValue(undefined);
    setup({ source: "error-boundary", prefillMessage: "TypeError: x is not a function" });

    const textarea = screen.getByPlaceholderText(/your feedback/i);
    expect(textarea).toHaveAttribute(
      "maxlength",
      String(3000 - "TypeError: x is not a function".length - 2),
    );

    fireEvent.change(textarea, { target: { value: "It happened when I clicked Run" } });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => expect(mockSubmitFeedback).toHaveBeenCalled());
    expect(mockSubmitFeedback.mock.calls[0][0].message).toBe(
      "TypeError: x is not a function\n\nIt happened when I clicked Run",
    );
  });

  it("renders a custom trigger when provided, instead of the default icon button", () => {
    const { onOpenChange } = setup({ open: false, trigger: <button type="button">Report Issue</button> });
    const triggerButton = screen.getByRole("button", { name: "Report Issue" });
    expect(triggerButton).toBeInTheDocument();

    fireEvent.click(triggerButton);
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });
});
