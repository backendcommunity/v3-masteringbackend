"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle, XCircle, Mail, RefreshCw, Loader2 } from "lucide-react";
import { useAuth } from "@/store/auth";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/auth-shell";
import {
  AuthHeading,
  authInputClass,
  authPrimaryBtnClass,
  authGhostBtnClass,
} from "@/components/auth/auth-ui";

export default function VerifyEmailPage() {
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null);
  const auth = useAuth();
  const [verificationStatus, setVerificationStatus] = useState<
    "loading" | "success" | "error" | "expired" | "sent"
  >("sent");
  const [isResending, setIsResending] = useState(false);
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") setSearchParams(new URLSearchParams(window.location.search));
  }, []);

  const redirect = searchParams?.get("redirect") ?? "";

  useEffect(() => {
    if (!searchParams) return;
    const emailParam = searchParams.get("email");
    const sentQuery = searchParams.get("sent");
    setEmail(emailParam || "");
    if (sentQuery) setVerificationStatus("sent");
  }, [searchParams]);

  const handleResendVerification = async () => {
    setIsResending(true);
    await handleResendEmail();
    setIsResending(false);
    setVerificationStatus("sent");
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    try {
      setIsLoading(true);
      setVerificationStatus("loading");
      const isVerified = await auth.verifyEmail({ code: token, email });
      if (isVerified) {
        setVerificationStatus("success");
        setIsLoading(false);
        return;
      }
      setVerificationStatus("error");
      setIsLoading(false);
    } catch (error: any) {
      const message = error?.response?.data?.error?.message ?? error?.message ?? "Verification failed";
      toast.error(message);
      setIsLoading(false);
      setVerificationStatus("error");
    }
  };

  const handleResendEmail = async () => {
    try {
      setIsLoading(true);
      const resent = await auth.resendEmail(email);
      if (!resent) {
        setVerificationStatus("error");
        setIsLoading(false);
        return;
      }
      setVerificationStatus("sent");
      setIsLoading(false);
      toast.success("Token resent successfully");
    } catch (error: any) {
      const message = error?.response?.data?.message ?? error?.message;
      toast.error(message);
      setIsLoading(false);
    }
  };

  const StatusIcon = ({ bg, children }: { bg: string; children: React.ReactNode }) => (
    <div className="w-14 h-14 rounded-full flex items-center justify-center mb-6" style={{ background: bg }}>
      {children}
    </div>
  );

  const renderContent = () => {
    switch (verificationStatus) {
      case "loading":
        return (
          <>
            <StatusIcon bg="rgba(19,174,206,0.15)"><RefreshCw className="w-7 h-7 text-[#13AECE] animate-spin" /></StatusIcon>
            <AuthHeading title="Verifying your email" subtitle="Please wait while we verify your email address..." />
          </>
        );

      case "success":
        return (
          <>
            <StatusIcon bg="rgba(34,197,94,0.15)"><CheckCircle className="w-7 h-7 text-green-400" /></StatusIcon>
            <AuthHeading title="Email verified" subtitle="Your email has been verified. You can now access your account." />
            <Link href={redirect ? `/auth/login?redirect=${encodeURIComponent(redirect)}` : "/auth/login"} className={authPrimaryBtnClass}>
              Continue to Login
            </Link>
          </>
        );

      case "expired":
        return (
          <>
            <StatusIcon bg="rgba(234,179,8,0.15)"><Mail className="w-7 h-7 text-yellow-400" /></StatusIcon>
            <AuthHeading title="Verification link expired" subtitle="This link has expired. Request a new verification email." />
            <div className="space-y-4">
              <button onClick={handleResendVerification} disabled={isResending} className={authPrimaryBtnClass}>
                {isResending ? (<><Loader2 className="w-4 h-4 animate-spin" /><span>Sending...</span></>) : "Resend Verification Email"}
              </button>
              <Link href="/auth/login" className={authGhostBtnClass}>Back to Login</Link>
            </div>
          </>
        );

      case "error":
        return (
          <>
            <StatusIcon bg="rgba(239,68,68,0.15)"><XCircle className="w-7 h-7 text-red-400" /></StatusIcon>
            <AuthHeading title="Verification failed" subtitle="We couldn't verify your email. The code may be invalid or expired." />
            <div className="space-y-4">
              <button onClick={() => setVerificationStatus("sent")} className={authPrimaryBtnClass}>Try Again</button>
              <button onClick={handleResendVerification} disabled={isResending} className={authGhostBtnClass}>
                {isResending ? (<><Loader2 className="w-4 h-4 animate-spin" /><span>Sending...</span></>) : "Resend Verification Email"}
              </button>
            </div>
          </>
        );

      case "sent":
      default:
        return (
          <>
            <StatusIcon bg="rgba(34,197,94,0.15)"><CheckCircle className="w-7 h-7 text-green-400" /></StatusIcon>
            <AuthHeading
              title="Check your email"
              subtitle={<>We&apos;ve sent a code to <span className="text-[#0E1F33] font-medium break-all">{email}</span></>}
            />

            <div className="rounded-lg p-4 mb-6 bg-[#F8FAFC] border border-[#E2E8F0]">
              <h3 className="text-[#0E1F33] font-medium text-sm mb-2">What&apos;s next?</h3>
              <ul className="text-[#64748B] text-sm space-y-1">
                <li>• Check your email inbox</li>
                <li>• Copy the code and paste it below</li>
                <li>• Click verify code</li>
                <li>• Sign in with your password</li>
              </ul>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                id="token"
                name="token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
                className={authInputClass}
                placeholder="Enter your code"
              />
              <button onClick={handleSubmit} disabled={isLoading} className={authPrimaryBtnClass}>
                Verify Code
              </button>
              <button type="button" onClick={handleResendEmail} disabled={isLoading} className={authGhostBtnClass}>
                {isLoading ? (<><Loader2 className="w-4 h-4 animate-spin" /><span>Resending...</span></>) : (<><Mail className="w-4 h-4" /><span>Resend Token</span></>)}
              </button>
            </form>

            <p className="text-[#94A3B8] text-sm mt-6">
              Didn&apos;t receive the email? Check your spam folder or contact support.
            </p>
          </>
        );
    }
  };

  return (
    <AuthShell backHref="/auth/login">
      {renderContent()}
      <div className="text-center mt-8 pt-6 border-t border-[#E2E8F0]">
        <p className="text-[#94A3B8] text-sm">
          Need help?{" "}
          <Link href="/contact" className="text-[#13AECE] hover:underline">Contact Support</Link>
        </p>
      </div>
    </AuthShell>
  );
}
