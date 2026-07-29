// Regression test for the "final whole-branch review" Finding 1 (CRITICAL):
// Disconnect must not immediately re-trigger the auto-provision effect.
//
// Covers the WORSE case called out in the finding: the component mounts
// already connected (autoTriggeredRef never fires on mount because status
// was already connected), so the guard against re-firing cannot rely on
// autoTriggeredRef alone — a disconnect must set its own guard.

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ── Mock sonner ──────────────────────────────────────────────────────────
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// ── Mock shadcn/Radix wrappers with plain DOM so Radix internals (portals,
// pointer capture, ResizeObserver) never have to run under jsdom. Visibility
// is driven by the same `open` prop the real components would receive. ────
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, ...rest }: any) => (
    <button onClick={onClick} disabled={disabled} {...rest}>
      {children}
    </button>
  ),
}));
vi.mock("@/components/ui/input", () => ({
  Input: (props: any) => <input {...props} />,
}));
vi.mock("@/components/ui/sheet", () => ({
  Sheet: ({ open, children }: any) =>
    open ? <div data-testid="sheet">{children}</div> : null,
  SheetContent: ({ children }: any) => <div>{children}</div>,
  SheetHeader: ({ children }: any) => <div>{children}</div>,
  SheetTitle: ({ children }: any) => <div>{children}</div>,
  SheetDescription: ({ children }: any) => <div>{children}</div>,
}));
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ open, children }: any) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <div>{children}</div>,
  DialogDescription: ({ children }: any) => <div>{children}</div>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
}));
vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => (
    <div data-testid="dropdown-content">{children}</div>
  ),
  DropdownMenuItem: ({ children, onClick }: any) => (
    // A div (not a button) — avoids nesting an <a> (View on GitHub, asChild)
    // inside a <button>, which the real Radix item allows via Slot but a
    // literal <button> wrapper would make invalid HTML.
    <div role="menuitem" onClick={onClick} style={{ cursor: "pointer" }}>
      {children}
    </div>
  ),
}));
vi.mock("@/components/ui/tabs", () => ({
  Tabs: ({ children }: any) => <div>{children}</div>,
  TabsList: ({ children }: any) => <div>{children}</div>,
  TabsTrigger: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
  TabsContent: ({ children }: any) => <div>{children}</div>,
}));

// ── Mock the store: the component mounts ALREADY connected (the "worse"
// case from the finding — autoTriggeredRef never fires on mount since
// status.connected is true from the start). ────────────────────────────
const getProjectGithub = vi.fn().mockResolvedValue({
  installed: true,
  connected: true,
  installUrl: "https://github.com/apps/mb/installations/new",
  repoFullName: "owner/mb-test-slug",
  owner: "owner",
  repo: "mb-test-slug",
});
const disconnectProjectGithub = vi.fn().mockResolvedValue({});
// This is the auto-provision call. If the bug is present, disconnecting
// re-triggers the auto-provision effect, which calls this.
const connectProjectGithub = vi.fn().mockResolvedValue({
  connected: true,
  repoFullName: "owner/mb-test-slug-2",
  owner: "owner",
  repo: "mb-test-slug-2",
});

vi.mock("@/lib/store", () => ({
  useAppStore: () => ({
    getProjectGithub,
    disconnectProjectGithub,
    connectProjectGithub,
    listGithubOwners: vi.fn().mockResolvedValue([]),
    listGithubRepos: vi.fn().mockResolvedValue([]),
    createGithubRepo: vi.fn(),
  }),
}));

vi.mock("@/lib/github-popup", () => ({
  openGithubPopup: vi.fn(),
  withReturn: (url: string) => url,
  openPopupOrWarn: vi.fn(),
}));

import { GithubConnect } from "@/components/pages/playground/github-connect";
import { toast } from "sonner";

describe("GithubConnect disconnect (Finding 1 regression)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getProjectGithub.mockResolvedValue({
      installed: true,
      connected: true,
      installUrl: "https://github.com/apps/mb/installations/new",
      repoFullName: "owner/mb-test-slug",
      owner: "owner",
      repo: "mb-test-slug",
    });
  });

  it("does not re-provision (auto-connect) immediately after an explicit disconnect", async () => {
    const user = userEvent.setup();
    render(<GithubConnect slug="test-slug" />);

    // Wait for initial load: connected trigger shows the repo name.
    await waitFor(() =>
      expect(screen.getByText("owner/mb-test-slug")).toBeInTheDocument(),
    );

    // Auto-provision must NOT have fired on mount (already connected).
    expect(connectProjectGithub).not.toHaveBeenCalled();

    // Open the dropdown menu item for Disconnect (our mock renders content
    // unconditionally, so it's already present) and click it — this opens
    // the confirm dialog, it does not disconnect yet.
    const disconnectMenuItem = screen.getByRole("menuitem", { name: /disconnect/i });
    await user.click(disconnectMenuItem);

    const dialog = await screen.findByTestId("dialog");
    expect(within(dialog).getByText(/Disconnect this project from GitHub\?/i)).toBeInTheDocument();

    // Confirm the disconnect via the dialog's destructive button.
    const confirmBtn = within(dialog).getByRole("button", { name: /^disconnect$/i });
    await user.click(confirmBtn);

    // The disconnect call must have gone through.
    await waitFor(() => expect(disconnectProjectGithub).toHaveBeenCalledWith("test-slug"));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Disconnected from GitHub"));

    // Give any pending effects/microtasks a chance to run (the auto-provision
    // effect runs synchronously off the status state update, but flush a
    // couple of ticks to be safe against any queued promise resolution).
    await new Promise((r) => setTimeout(r, 50));

    // THE ASSERTION THAT PROVES THE FIX: status flips to installed && !connected
    // right after disconnect — the exact shape the auto-provision effect
    // watches for. Without the `justDisconnectedRef` guard this immediately
    // calls handleSave -> connectProjectGithub("auto"), silently re-linking a
    // repo and making Disconnect a no-op. It must stay uncalled.
    expect(connectProjectGithub).not.toHaveBeenCalled();

    // And the UI must reflect actually-disconnected state (ghost single
    // button, not the connected dropdown trigger with a repo name).
    expect(screen.queryByText("owner/mb-test-slug")).not.toBeInTheDocument();
  });
});
