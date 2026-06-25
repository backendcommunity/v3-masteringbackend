"use client";

import type React from "react";
import { useState } from "react";
import { Mail, CheckCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/store/auth";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import {
  AuthHeading,
  authInputClass,
  authLabelClass,
  authPrimaryBtnClass,
  authGhostBtnClass,
} from "@/components/auth/auth-ui";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [error, setError] = useState("");
  const auth = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await auth.sendForgotPasswordEmail(email);
      setIsEmailSent(true);
    } catch (error: any) {
      const message = error?.response?.data?.message ?? error?.message;
      toast.error(message);
      setError("Failed to send reset email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setIsLoading(true);
    try {
      await auth.sendForgotPasswordEmail(email);
      toast.success("Code Resent Successfully");
    } catch (err: any) {
      const message = err?.response?.data?.error?.message ?? err?.message;
      toast.error(message);
      setError("Failed to resend email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setIsLoading(true);
    try {
      const isVerified = await auth.verifyCode(email, code, "RESET");
      if (!isVerified) throw new Error("We could not verify code. Please try again");
      router.push(`/auth/password/reset?token=${code}&email=${encodeURIComponent(email)}`);
    } catch (error: any) {
      const message = error?.response?.data?.error?.message ?? error?.message;
      toast.error(message);
      setIsLoading(false);
    }
  };

  if (isEmailSent) {
    return (
      <AuthShell backHref="/auth/login">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mb-6" style={{ background: "rgba(34,197,94,0.15)" }}>
          <CheckCircle className="w-7 h-7 text-green-400" />
        </div>
        <AuthHeading
          title="Check your email"
          subtitle={
            <>
              We&apos;ve sent a reset code to{" "}
              <span className="text-[#0E1F33] font-medium break-all">{email}</span>
            </>
          }
        />

        <div className="rounded-lg p-4 mb-6 bg-[#F8FAFC] border border-[#E2E8F0]">
          <h3 className="text-[#0E1F33] font-medium text-sm mb-2">What&apos;s next?</h3>
          <ul className="text-[#64748B] text-sm space-y-1">
            <li>• Check your email inbox</li>
            <li>• Copy the code and paste it below</li>
            <li>• Click verify code</li>
            <li>• Create a new password</li>
          </ul>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter code"
            className={authInputClass}
          />
          <button onClick={handleVerifyCode} disabled={isLoading} className={authPrimaryBtnClass}>
            {isLoading ? (<><Loader2 className="w-4 h-4 animate-spin" /><span>Verifying...</span></>) : <span>Verify Code</span>}
          </button>
          <button onClick={handleResendEmail} disabled={isLoading} className={authGhostBtnClass}>
            {isLoading ? (<><Loader2 className="w-4 h-4 animate-spin" /><span>Resending...</span></>) : (<><Mail className="w-4 h-4" /><span>Resend Email</span></>)}
          </button>
        </div>

        <p className="text-[#94A3B8] text-sm mt-6">
          Didn&apos;t receive the email? Check your spam folder or contact support.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell backHref="/auth/login">
      <AuthHeading title="Forgot password?" subtitle="No worries — we'll send you reset instructions." />

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className={authLabelClass}>Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] w-5 h-5" />
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={`${authInputClass} pl-11`}
              placeholder="name@company.com"
            />
          </div>
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </div>

        <button type="submit" disabled={isLoading || !email} className={authPrimaryBtnClass}>
          {isLoading ? (<><Loader2 className="w-4 h-4 animate-spin" /><span>Sending Reset Link...</span></>) : (<><Mail className="w-4 h-4" /><span>Send Reset Instructions</span></>)}
        </button>
      </form>

      <div className="mt-6 p-4 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
        <h3 className="text-[#0E1F33] font-medium text-sm mb-2">Security Notice</h3>
        <p className="text-[#64748B] text-xs">
          Password reset codes expire after 24 hours. Check your spam folder if you don&apos;t receive the email.
        </p>
      </div>
    </AuthShell>
  );
}
