"use client";

import type React from "react";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, CheckCircle, Loader2 } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { useAuth } from "@/store/auth";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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
      if (!isVerified)
        throw new Error("We could not verify code. Please try again");

      router.push(
        `/auth/password/reset?token=${code}&email=${encodeURIComponent(email)}`,
      );
    } catch (error: any) {
      const message = error?.response?.data?.error?.message ?? error?.message;
      toast.error(message);
      setIsLoading(false);
    }
  };

  if (isEmailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#E8F4F8] via-white to-[#97C3CC]/20 dark:from-[#0A0F1C] dark:via-[#1E293B] dark:to-[#0F172A] flex items-center justify-center p-4">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-primary/10 dark:bg-[#0EA5E9]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-[10%] right-[5%] w-80 h-80 bg-[#97C3CC]/10 dark:bg-[#475569]/20 rounded-full blur-3xl" />
        </div>

        <div className="absolute top-6 left-6 z-10">
          <Link
            href="/auth/login"
            className="flex items-center gap-2 text-[#0E1F33]/60 dark:text-white/70 hover:text-[#0E1F33] dark:hover:text-white transition-colors duration-300"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Login</span>
          </Link>
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
          <div className="w-full max-w-md">
            <div className="backdrop-blur-xl bg-white dark:bg-black/20 border border-[#E2E8F0] dark:border-white/10 rounded-2xl p-8 shadow-2xl text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>

              <h1 className="text-2xl font-bold text-[#0E1F33] dark:text-white mb-4">
                Check Your Email
              </h1>
              <p className="text-[#334155] dark:text-white/70 mb-6">
                We've sent a password reset link to{" "}
                <span className="text-[#0E1F33] dark:text-white font-medium break-all">
                  {email}
                </span>
              </p>

              <div className="bg-[#F1F5F9] dark:bg-white/5 rounded-lg p-4 mb-6 text-left">
                <h3 className="text-[#0E1F33] dark:text-white font-medium mb-2">
                  What's next?
                </h3>
                <ul className="text-[#334155] dark:text-white/70 text-sm space-y-1">
                  <li>• Check your email inbox</li>
                  <li>• Copy the code and paste it below</li>
                  <li>• Click on verify code</li>
                  <li>• Create a new password</li>
                  <li>• Sign in with your new password</li>
                </ul>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter code"
                  className="w-full px-4 py-3 bg-white dark:bg-white/10 border border-[#E2E8F0] dark:border-white/20 rounded-lg text-[#0E1F33] dark:text-white placeholder-[#64748B] dark:placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] transition"
                />
                <button
                  onClick={handleVerifyCode}
                  disabled={isLoading}
                  className="w-full bg-[#0E1F33] dark:bg-[#0EA5E9] text-white py-3 px-4 rounded-lg hover:bg-[#1E293B] dark:hover:bg-[#0284C7] transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <span>Verify Code</span>
                  )}
                </button>

                <button
                  onClick={handleResendEmail}
                  disabled={isLoading}
                  className="w-full bg-white border border-[#E2E8F0] text-[#0E1F33] dark:bg-white/10 dark:border-white/20 dark:text-white font-medium py-3 px-4 rounded-lg hover:bg-[#F8FAFC] dark:hover:bg-white/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Resending...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      <span>Resend Email</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-[#64748B] dark:text-white/50 text-sm mt-6">
                Didn't receive the email? Check your spam folder or contact
                support.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Initial Email Entry Form
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8F4F8] via-white to-[#97C3CC]/20 dark:from-[#0A0F1C] dark:via-[#1E293B] dark:to-[#0F172A] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-primary/10 dark:bg-[#0EA5E9]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[10%] right-[5%] w-80 h-80 bg-[#97C3CC]/10 dark:bg-[#475569]/20 rounded-full blur-3xl"></div>
      </div>

      <div className="absolute top-6 left-6 z-10">
        <Link
          href="/auth/login"
          className="flex items-center gap-2 text-[#0E1F33]/60 dark:text-white/70 hover:text-[#0E1F33] dark:hover:text-white transition-colors duration-300"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Login</span>
        </Link>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-10 flex mx-auto justify-center text-center">
          <BrandLogo />
        </div>
        <div className="backdrop-blur-xl bg-white dark:bg-black/20 border border-[#E2E8F0] dark:border-white/10 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-2xl font-bold text-[#0E1F33] dark:text-white mb-2">
            Forgot Password?
          </h1>
          <p className="text-[#334155] dark:text-white/70 mb-6">
            No worries, we’ll send you reset instructions
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[#0E1F33] dark:text-white mb-2"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#94A3B8] dark:text-white/50 w-5 h-5" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-white dark:bg-white/10 border border-[#E2E8F0] dark:border-white/20 rounded-lg text-[#0E1F33] dark:text-white placeholder-[#94A3B8] dark:placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] transition"
                  placeholder="Enter your email"
                />
              </div>
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading || !email}
              className="w-full bg-[#0E1F33] dark:bg-[#0EA5E9] text-white py-3 px-4 rounded-lg hover:bg-[#1E293B] dark:hover:bg-[#0284C7] transition duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending Reset Link...</span>
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  <span>Send Reset Instructions</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 p-4 bg-[#F1F5F9] dark:bg-white/5 rounded-lg">
            <h3 className="text-[#0E1F33] dark:text-white font-medium text-sm mb-2">
              Security Notice
            </h3>
            <p className="text-[#334155] dark:text-white/70 text-xs">
              Password reset links expire after 24 hours. Check your spam folder
              if you don't receive the email.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
