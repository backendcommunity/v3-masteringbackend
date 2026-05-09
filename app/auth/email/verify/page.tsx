"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle,
  XCircle,
  Mail,
  RefreshCw,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { useAuth } from "@/store/auth";
import { toast } from "sonner";

export default function VerifyEmailPage() {
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(
    null
  );
  const auth = useAuth();
  const [verificationStatus, setVerificationStatus] = useState<
    "loading" | "success" | "error" | "expired" | "sent"
  >("sent");
  const [isResending, setIsResending] = useState(false);
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSearchParams(new URLSearchParams(window.location.search));
    }
  }, []);

  const redirect = searchParams?.get("redirect") ?? "";

  useEffect(() => {
    if (!searchParams) return;
    const emailParam = searchParams.get("email");
    const sentQuery = searchParams.get("sent");
    setEmail(emailParam || "");

    if (sentQuery) {
      setVerificationStatus("sent");
      return;
    }
  }, [searchParams]);

  const handleResendVerification = async () => {
    setIsResending(true);
    await handleResendEmail();
    setIsResending(false);
    setVerificationStatus("sent");
  };

  const handleSubmit = async () => {
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

  const renderContent = () => {
    switch (verificationStatus) {
      case "loading":
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Verifying Your Email
            </h1>
            <p className="text-gray-600 dark:text-white/70">
              Please wait while we verify your email address...
            </p>
          </div>
        );

      case "sent":
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Check Your Email
            </h1>
            <p className="text-gray-600 dark:text-white/70 mb-6">
              We've sent a code to{" "}
              <span className="text-gray-900 dark:text-white font-medium break-all">
                {email}
              </span>
            </p>

            <div className="bg-gray-100 dark:bg-white/5 rounded-lg p-4 mb-6 text-left">
              <h3 className="text-gray-800 dark:text-white font-medium mb-2">
                What's next?
              </h3>
              <ul className="text-gray-600 dark:text-white/70 text-sm space-y-1">
                <li>• Check your email inbox</li>
                <li>• Copy the code and paste it below</li>
                <li>• Click on verify code</li>
                <li>• Sign in with your password</li>
              </ul>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 py-5">
              <div>
                <div className="relative">
                  <input
                    type="text"
                    id="token"
                    name="token"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    required
                    className="w-full px-4 py-3 pr-12 bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300"
                    placeholder="Enter your token"
                  />
                </div>
              </div>
            </form>

            <div className="space-y-4">
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full bg-[#0E1F33] dark:bg-[#0EA5E9] text-white py-3 px-4 rounded-lg hover:bg-[#1E293B] dark:hover:bg-[#0284C7] transition duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Verify Code
              </button>

              <hr />
              <div className="pt-5">
                <button
                  onClick={handleResendEmail}
                  disabled={isLoading}
                  className="w-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Resending...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      <span>Resend Token</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <p className="text-gray-500 dark:text-white/50 text-sm mt-6">
              Didn't receive the email? Check your spam folder or contact
              support.
            </p>
          </div>
        );

      case "success":
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Email Verified Successfully!
            </h1>
            <p className="text-gray-600 dark:text-white/70 mb-8">
              Your email has been verified. You can now access all features of
              your account.
            </p>
            <Link
              href={redirect ? `/auth/login?redirect=${encodeURIComponent(redirect)}` : "/auth/login"}
              className="w-full bg-[#0E1F33] dark:bg-[#0EA5E9] text-white py-3 px-4 rounded-lg hover:bg-[#0E1F33]/90 dark:hover:bg-[#0284C7] transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              Continue to Login
            </Link>
          </div>
        );

      case "expired":
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-yellow-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Verification Link Expired
            </h1>
            <p className="text-gray-600 dark:text-white/70 mb-8">
              This verification link has expired. Please request a new
              verification email.
            </p>
            <div className="space-y-4">
              <button
                onClick={handleResendVerification}
                disabled={isResending}
                className="w-full bg-[#0E1F33] dark:bg-[#0EA5E9] text-white py-3 px-4 rounded-lg hover:bg-[#0E1F33]/90 dark:hover:bg-[#0284C7] transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isResending ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Sending...</span>
                  </div>
                ) : (
                  "Resend Verification Email"
                )}
              </button>
              <Link
                href="/auth/login"
                className="block w-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white font-medium py-3 px-4 rounded-lg transition-all duration-300"
              >
                Back to Login
              </Link>
            </div>
          </div>
        );

      case "error":
      default:
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Verification Failed
            </h1>
            <p className="text-gray-600 dark:text-white/70 mb-8">
              We couldn't verify your email address. The token may be invalid or
              expired.
            </p>
            <div className="space-y-4">
              <button
                onClick={handleResendVerification}
                disabled={isResending}
                className="w-full bg-[#0E1F33] dark:bg-[#0EA5E9] text-white py-3 px-4 rounded-lg hover:bg-[#0E1F33]/90 dark:hover:bg-[#0284C7] transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isResending ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Sending...</span>
                  </div>
                ) : (
                  "Resend Verification Email"
                )}
              </button>
              <Link
                href="/auth/register"
                className="block w-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white font-medium py-3 px-4 rounded-lg transition-all duration-300"
              >
                Create New Account
              </Link>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#DFF2F8] via-white to-[#C3DEE5]/30 dark:from-[#0A0F1C] dark:via-[#1E293B] dark:to-[#0F172A] flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-[#13AECE]/10 dark:bg-[#0EA5E9]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[10%] right-[5%] w-80 h-80 bg-[#97C3CC]/10 dark:bg-[#475569]/20 rounded-full blur-3xl"></div>
      </div>

      {/* Back to Login */}
      <div className="absolute top-6 left-6 z-10">
        <Link
          href="/auth/login"
          className="flex items-center gap-2 text-gray-600 dark:text-white/70 hover:text-gray-800 dark:hover:text-white transition-colors duration-300"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Login</span>
        </Link>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          <div className="text-center flex mb-8">
            <div className="mx-auto mb-4">
              <BrandLogo />
            </div>
          </div>
          <div className="backdrop-blur-xl bg-white/80 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-2xl p-8 shadow-2xl">
            {renderContent()}

            <div className="text-center mt-8 pt-6 border-t border-gray-200 dark:border-white/10">
              <p className="text-gray-500 dark:text-white/50 text-sm">
                Need help?{" "}
                <Link
                  href="/contact"
                  className="text-primary dark:text-primary hover:text-primary/10 dark:hover:text-primary/50 underline"
                >
                  Contact Support
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
