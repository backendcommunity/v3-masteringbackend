// Task 12 — owner-facing team management. This supersedes the task brief's
// original test, which asserted a hardcoded `/\$18\.42 today/`. That
// assertion is wrong: Paddle's currency localization means a USD-priced
// Enterprise plan can preview in a different currency entirely (a live
// preview returned INR) — the dialog must format whatever `currency` the
// `/seats/preview` response actually carries, never assume USD. These tests
// compute the expected string via the real `formatPrice` helper instead of
// hardcoding a symbol, so they'd fail loudly if the component ever fell back
// to a hardcoded currency again.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { InviteDialog } from "../invite-dialog";
import { formatPrice } from "@/lib/pricing";

const mockPreviewSeat = vi.fn();
const mockInviteMember = vi.fn();

vi.mock("@/lib/store", () => ({
  useAppStore: () => ({
    previewSeat: mockPreviewSeat,
    inviteMember: mockInviteMember,
  }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function setup(overrides: Partial<React.ComponentProps<typeof InviteDialog>> = {}) {
  const onOpenChange = vi.fn();
  const onInvited = vi.fn();
  render(
    <InviteDialog
      teamId="t1"
      seatsAvailable={1}
      open
      onOpenChange={onOpenChange}
      onInvited={onInvited}
      {...overrides}
    />,
  );
  return { onOpenChange, onInvited };
}

describe("InviteDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("invites directly when a seat is available — never calls the seat preview", async () => {
    mockInviteMember.mockResolvedValue({ id: "inv1" });
    const { onOpenChange, onInvited } = setup({ seatsAvailable: 3 });

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "a@acme.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send invite/i }));

    await waitFor(() =>
      expect(mockInviteMember).toHaveBeenCalledWith("t1", { email: "a@acme.com" }),
    );
    expect(mockPreviewSeat).not.toHaveBeenCalled();
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect(onInvited).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("at capacity: previews the charge in whatever currency the server returns, and confirms with buySeat before inviting", async () => {
    mockPreviewSeat.mockResolvedValue({
      immediateChargeMinor: 1842,
      currency: "INR",
      nextBilledAt: "2027-08-19",
    });
    mockInviteMember.mockResolvedValue({ id: "inv1" });
    setup({ seatsAvailable: 0 });

    // Server-derived preview, not a hardcoded currency — this is the exact
    // string the brief's test got wrong by assuming "$18.42".
    const expectedPrice = formatPrice(18.42, "INR");
    await waitFor(() =>
      expect(screen.getByText(new RegExp(expectedPrice.replace(/[.]/, "\\.")))).toBeInTheDocument(),
    );
    expect(screen.queryByText(/\$18\.42/)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "a@acme.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /confirm & invite/i }));

    await waitFor(() =>
      expect(mockInviteMember).toHaveBeenCalledWith("t1", {
        email: "a@acme.com",
        buySeat: true,
      }),
    );
  });

  it("scales the previewed charge by the currency's own decimal exponent, not a fixed /100 (JPY is zero-decimal)", async () => {
    // JPY has no minor unit at all — 500 minor units IS 500 yen. A fixed
    // /100 (the bug this guards against) would misprice this as ¥5.
    mockPreviewSeat.mockResolvedValue({
      immediateChargeMinor: 500,
      currency: "JPY",
      nextBilledAt: null,
    });
    mockInviteMember.mockResolvedValue({ id: "inv1" });
    setup({ seatsAvailable: 0 });

    await waitFor(() => expect(screen.getByText(/500/)).toBeInTheDocument());
    // The exact wrong output a fixed /100 would have produced.
    expect(screen.queryByText(/¥5\.00/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\b5\.00\b/)).not.toBeInTheDocument();
  });

  it("treats a nonzero charge with a missing currency as an error, never as free or as a blank price", async () => {
    mockPreviewSeat.mockResolvedValue({
      immediateChargeMinor: 1842,
      currency: null,
      nextBilledAt: null,
    });
    setup({ seatsAvailable: 0 });

    await waitFor(() =>
      expect(screen.getByText(/couldn't confirm what this seat would cost/i)).toBeInTheDocument(),
    );
    // Must never fall into the "free" copy — that would be fail-unsafe in
    // the wrong direction on a money path (telling an owner "no charge"
    // when a nonzero charge is in fact pending).
    expect(screen.queryByText(/won't charge you anything today/i)).not.toBeInTheDocument();
    // And must never render the priced copy with a blank/undefined amount.
    expect(screen.queryByText(/today for an extra seat/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "a@acme.com" },
    });
    // Submission stays blocked — there is no safe price to confirm.
    expect(screen.getByRole("button", { name: /confirm & invite/i })).toBeDisabled();
  });

  it("does not show a $0.00 charge when a previously funded seat is just vacant — it reads as free, not a zero-dollar transaction", async () => {
    mockPreviewSeat.mockResolvedValue({
      immediateChargeMinor: 0,
      currency: "USD",
      nextBilledAt: null,
    });
    setup({ seatsAvailable: 0 });

    await waitFor(() =>
      expect(screen.getByText(/won't charge you anything today/i)).toBeInTheDocument(),
    );
    expect(screen.queryByText(/\$0/)).not.toBeInTheDocument();
    expect(screen.queryByText(/today for an extra seat/i)).not.toBeInTheDocument();
  });

  it("does not offer a seat-purchase flow to a team whose processor can't self-serve seats (AsyncPay)", async () => {
    mockPreviewSeat.mockRejectedValue({
      response: {
        status: 400,
        data: { message: "Seats for this team are managed by our team." },
      },
    });
    setup({ seatsAvailable: 0 });

    expect(await screen.findByText(/Request more seats/i)).toBeInTheDocument();
    expect(screen.queryByText(/today for an extra seat/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /confirm & invite/i })).not.toBeInTheDocument();
    expect(mockInviteMember).not.toHaveBeenCalled();
  });

  it("surfaces a generic error (not the AsyncPay message) when the preview call fails for an unrelated reason", async () => {
    mockPreviewSeat.mockRejectedValue({ response: { status: 500 } });
    setup({ seatsAvailable: 0 });

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(screen.queryByText(/Request more seats/i)).not.toBeInTheDocument();
  });

  it("disables submission until an email is entered", () => {
    setup({ seatsAvailable: 3 });
    expect(screen.getByRole("button", { name: /send invite/i })).toBeDisabled();
  });

  it("surfaces the server's error message and keeps the dialog open when the invite itself fails", async () => {
    mockInviteMember.mockRejectedValue({
      response: { data: { message: "That person is already on this team" } },
    });
    const { onOpenChange } = setup({ seatsAvailable: 3 });

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "a@acme.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send invite/i }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("That person is already on this team"),
    );
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });
});
