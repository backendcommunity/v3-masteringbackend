"use client";

import { useState } from "react";
import { useAuth } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface ForcePasswordChangeModalProps {
  /**
   * True when the account's name was guessed from its email at import time
   * (e.g. "grace@example.com" -> "Grace"). This modal is the only chance to
   * fix that guess — the temporary password was emailed once and cannot be
   * looked up again, so there is no second prompt if the person bounces off
   * this screen.
   */
  nameIsProvisional?: boolean;
}

export function ForcePasswordChangeModal({
  nameIsProvisional = false,
}: ForcePasswordChangeModalProps) {
  const user = useAuth((s) => s.user);
  const changePassword = useAuth((s) => s.changePassword);
  const derivedName = user?.name ?? "";
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [name, setName] = useState(derivedName);
  const [loading, setLoading] = useState(false);
  // Always open: this modal only renders while a flag forces it (see
  // dashboard-layout.tsx). `open` is not driven by dismiss affordances —
  // there are none — only by the successful submit below.
  const [open, setOpen] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirm) {
      toast.error("Passwords do not match");
      return;
    }

    let trimmedName: string | undefined;
    if (nameIsProvisional) {
      trimmedName = name.trim();
      if (!trimmedName) {
        toast.error("Please enter your name");
        return;
      }
      // "Grace" is precisely the value being replaced — accepting it back
      // would silently defeat the whole feature.
      if (trimmedName === derivedName.trim()) {
        toast.error(
          `"${trimmedName}" was guessed from your email — please enter your real name to continue.`
        );
        return;
      }
    }

    setLoading(true);
    try {
      // Passwords and the corrected name in ONE call — never split into two
      // requests, or a failure between them could leave a new password paired
      // with a still-provisional name that nothing would come back to fix.
      await changePassword(oldPassword, newPassword, trimmedName);
      toast.success("Password updated successfully!");
      setOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} modal>
      <DialogContent
        className="sm:max-w-md"
        hideCloseButton
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Set Your Password</DialogTitle>
          <DialogDescription>
            Your account was created with a temporary password. Please set a new password to continue.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {nameIsProvisional && (
            <div className="space-y-2">
              <Label htmlFor="user-name">Your name</Label>
              <Input
                id="user-name"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="old-password">Temporary password</Label>
            <Input
              id="old-password"
              type="password"
              placeholder="Enter the temporary password from your email"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              placeholder="At least 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm new password</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="Repeat new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Updating…" : "Set password"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
