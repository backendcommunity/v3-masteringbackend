/**
 * An imported user whose name we guessed must correct it here. This is the
 * only moment we get: the temporary password cannot be looked up, so if they
 * bounce off this modal there is no second prompt.
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockChangePassword = vi.fn();
let mockUser: any = {
  name: "Grace",
  nameIsProvisional: true,
  mustResetPassword: true,
};

vi.mock("@/store/auth", () => ({
  useAuth: (selector: any) =>
    selector({ user: mockUser, changePassword: mockChangePassword }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { ForcePasswordChangeModal } from "../force-password-change-modal";
import { toast } from "sonner";

async function fillPasswords(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/temporary password/i), "TEMP1234");
  await user.type(screen.getByLabelText(/^new password/i), "NewSecure123!");
  await user.type(screen.getByLabelText(/confirm/i), "NewSecure123!");
}

describe("ForcePasswordChangeModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = {
      name: "Grace",
      nameIsProvisional: true,
      mustResetPassword: true,
    };
    mockChangePassword.mockResolvedValue({
      ...mockUser,
      mustResetPassword: false,
      nameIsProvisional: false,
    });
  });

  it("asks for a name when the current one was guessed", () => {
    render(<ForcePasswordChangeModal nameIsProvisional />);
    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();
  });

  it("does not ask when the name is already real", () => {
    render(<ForcePasswordChangeModal nameIsProvisional={false} />);
    expect(screen.queryByLabelText(/your name/i)).not.toBeInTheDocument();
  });

  it("cannot be dismissed", () => {
    render(<ForcePasswordChangeModal nameIsProvisional />);
    // A forced step that closes is not forced.
    expect(
      screen.queryByRole("button", { name: /close|cancel/i }),
    ).not.toBeInTheDocument();
  });

  // ── Beyond the brief: the tests that protect the actual guarantee ───────

  it("refuses submission while the name is left as the derived guess, and says why", async () => {
    const user = userEvent.setup();
    render(<ForcePasswordChangeModal nameIsProvisional />);

    await fillPasswords(user);
    // Name field left exactly as prefilled ("Grace") — the derived guess.
    await user.click(screen.getByRole("button", { name: /set password/i }));

    expect(mockChangePassword).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringMatching(/name/i),
    );
  });

  it("a user with nameIsProvisional=false sees no name field and can still change their password", async () => {
    mockUser = {
      name: "Real Name",
      nameIsProvisional: false,
      mustResetPassword: true,
    };
    const user = userEvent.setup();
    render(<ForcePasswordChangeModal nameIsProvisional={false} />);

    expect(screen.queryByLabelText(/your name/i)).not.toBeInTheDocument();

    await fillPasswords(user);
    await user.click(screen.getByRole("button", { name: /set password/i }));

    await waitFor(() => expect(mockChangePassword).toHaveBeenCalledTimes(1));
    expect(mockChangePassword).toHaveBeenCalledWith(
      "TEMP1234",
      "NewSecure123!",
      undefined,
    );
  });

  it("sends the corrected name and the passwords in ONE changePassword call", async () => {
    const user = userEvent.setup();
    render(<ForcePasswordChangeModal nameIsProvisional />);

    const nameField = screen.getByLabelText(/your name/i);
    await user.clear(nameField);
    await user.type(nameField, "Grace Adaeze");

    await fillPasswords(user);
    await user.click(screen.getByRole("button", { name: /set password/i }));

    await waitFor(() => expect(mockChangePassword).toHaveBeenCalledTimes(1));
    expect(mockChangePassword).toHaveBeenCalledWith(
      "TEMP1234",
      "NewSecure123!",
      "Grace Adaeze",
    );
  });
});
