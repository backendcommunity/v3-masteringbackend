"use client";

export const dynamic = "force-dynamic";

import type React from "react";

import { Suspense, useState } from "react";
import { analytics } from "@/lib/analytics";
import {
  Eye,
  EyeOff,
  Github,
  ArrowLeft,
  Loader2,
  Check,
  X,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { useAuth } from "@/store/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterContent />
    </Suspense>
  );
}

function RegisterContent() {
  const searchParams = useSearchParams();
  const auth = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "github" | null>(
    null,
  );
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [subscribeNewsletter, setSubscribeNewsletter] = useState(true);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Password strength calculation
  const getPasswordStrength = (password: string) => {
    let strength = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    strength = Object.values(checks).filter(Boolean).length;
    return { strength, checks };
  };

  const { strength, checks } = getPasswordStrength(formData.password);

  const getStrengthColor = (strength: number) => {
    if (strength <= 2) return "bg-red-500";
    if (strength <= 3) return "bg-yellow-500";
    if (strength <= 4) return "bg-blue-500";
    return "bg-green-500";
  };

  const getStrengthText = (strength: number) => {
    if (strength <= 2) return "Weak";
    if (strength <= 3) return "Fair";
    if (strength <= 4) return "Good";
    return "Strong";
  };

  const ref =
    searchParams?.get("ref") ??
    searchParams?.get("source") ??
    searchParams?.get("utm_source") ??
    "direct";
  const redirect = searchParams?.get("redirect");

  const handleSubmit = async (e: React.FormEvent) => {
    try {
      e.preventDefault();
      if (formData.password !== formData.confirmPassword) {
        toast.error("Passwords don't match");
        return;
      }
      if (!agreedToTerms) {
        toast.error("Please agree to the terms and conditions");
        return;
      }

      setEmailLoading(true);

      analytics.track("signup_attempted", { method: "email" });

      // Simulate API call
      const isRegistered = await auth.register({
        lastName: formData.lastName,
        firstName: formData.firstName,
        email: formData.email,
        password: formData.password,
        subscribe: subscribeNewsletter,
        signedUpThrough: "MASTERINGBACKEND",
        source:
          searchParams?.get("ref") ??
          searchParams?.get("source") ??
          searchParams?.get("utm_source") ??
          "direct",
      });

      setEmailLoading(false);
      // Handle registration logic here

      if (isRegistered)
        router.push(
          `/auth/email/verify?sent=true&email=${encodeURIComponent(formData.email)}${redirect ? `&redirect=${encodeURIComponent(redirect)}` : ""}`,
        );
    } catch (error: any) {
      const message =
        error?.response?.data?.error?.message ??
        error?.message ??
        "Registration failed. Please try again.";

      console.log(error, message);

      if (
        message.toLowerCase().includes("verify") ||
        message.toLowerCase().includes("verification")
      ) {
        router.push(
          `/auth/email/verify?sent=true&email=${encodeURIComponent(formData.email)}${redirect ? `&redirect=${encodeURIComponent(redirect)}` : ""}`,
        );
        return;
      }

      analytics.track("signup_failed", { method: "email", reason: message });
      toast.error(message);
      setEmailLoading(false);
    }
  };

  const isAuthLoading = emailLoading || oauthLoading !== null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8F4F8] via-white to-[#97C3CC]/20 dark:from-[#0A0F1C] dark:via-[#1E293B] dark:to-[#0F172A] flex items-center justify-center p-4">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-[#13AECE]/10 dark:bg-[#0EA5E9]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[10%] right-[5%] w-80 h-80 bg-[#97C3CC]/10 dark:bg-[#475569]/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <BrandLogo size="lg" showText={true} variant="default" />
          </div>
          <h1 className="text-3xl font-bold text-[#0E1F33] dark:text-[#F1F5F9] mb-2">
            Start Your Journey
          </h1>
          <p className="text-[#0E1F33]/70 dark:text-[#94A3B8]">
            Create your account and transform your backend career
          </p>
        </div>

        {/* Registration Form */}
        <div className="glass-card backdrop-blur-xl bg-white/10 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Social Registration Buttons */}
          <div className="space-y-3 mb-6">
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL}/auth/github?ref=${ref}&redirect=${redirect}`}
              className="w-full flex items-center justify-center space-x-3 bg-[#24292e] hover:bg-[#1a1e22] text-white py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-disabled={isAuthLoading}
              onClick={(event) => {
                if (isAuthLoading) {
                  event.preventDefault();
                  return;
                }
                setOauthLoading("github");
                analytics.track("oauth_initiated", {
                  provider: "github",
                  page: "register",
                });
              }}
            >
              {oauthLoading === "github" ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Github className="w-5 h-5" />
              )}
              <span>Continue with GitHub</span>
            </a>

            <a
              href={`${process.env.NEXT_PUBLIC_API_URL}/auth/google?ref=${ref}&redirect=${redirect}`}
              className="w-full flex items-center justify-center space-x-3 bg-[#24292e] hover:bg-[#1a1e22] text-white py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-disabled={isAuthLoading}
              onClick={(event) => {
                if (isAuthLoading) {
                  event.preventDefault();
                  return;
                }
                setOauthLoading("google");
                analytics.track("oauth_initiated", {
                  provider: "google",
                  page: "register",
                });
              }}
            >
              {oauthLoading === "google" ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              <span>Continue with Google</span>
            </a>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#97C3CC]/20 dark:border-[#475569]/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-[#1E293B] text-[#0E1F33]/60 dark:text-[#94A3B8]">
                Or create account with email
              </span>
            </div>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-[#0E1F33] dark:text-[#F1F5F9] mb-2"
                >
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white dark:bg-[#0F172A] border border-[#97C3CC]/20 dark:border-[#475569]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#13AECE] dark:focus:ring-[#0EA5E9] focus:border-transparent text-[#0E1F33] dark:text-[#F1F5F9] placeholder-[#0E1F33]/50 dark:placeholder-[#94A3B8]"
                  placeholder="John"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-[#0E1F33] dark:text-[#F1F5F9] mb-2"
                >
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white dark:bg-[#0F172A] border border-[#97C3CC]/20 dark:border-[#475569]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#13AECE] dark:focus:ring-[#0EA5E9] focus:border-transparent text-[#0E1F33] dark:text-[#F1F5F9] placeholder-[#0E1F33]/50 dark:placeholder-[#94A3B8]"
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[#0E1F33] dark:text-[#F1F5F9] mb-2"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-4 py-3 bg-white dark:bg-[#0F172A] border border-[#97C3CC]/20 dark:border-[#475569]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#13AECE] dark:focus:ring-[#0EA5E9] focus:border-transparent text-[#0E1F33] dark:text-[#F1F5F9] placeholder-[#0E1F33]/50 dark:placeholder-[#94A3B8]"
                placeholder="john@example.com"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[#0E1F33] dark:text-[#F1F5F9] mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-4 py-3 pr-12 bg-white dark:bg-[#0F172A] border border-[#97C3CC]/20 dark:border-[#475569]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#13AECE] dark:focus:ring-[#0EA5E9] focus:border-transparent text-[#0E1F33] dark:text-[#F1F5F9] placeholder-[#0E1F33]/50 dark:placeholder-[#94A3B8]"
                  placeholder="Create a strong password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#0E1F33]/50 dark:text-[#94A3B8] hover:text-[#0E1F33] dark:hover:text-[#F1F5F9] transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="flex-1 bg-gray-200 dark:bg-[#475569]/30 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(
                          strength,
                        )}`}
                        style={{ width: `${(strength / 5) * 100}%` }}
                      ></div>
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        strength <= 2
                          ? "text-red-500"
                          : strength <= 3
                            ? "text-yellow-500"
                            : strength <= 4
                              ? "text-blue-500"
                              : "text-green-500"
                      }`}
                    >
                      {getStrengthText(strength)}
                    </span>
                  </div>

                  {/* Password Requirements */}
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <div
                      className={`flex items-center space-x-1 ${
                        checks.length
                          ? "text-green-500"
                          : "text-[#0E1F33]/50 dark:text-[#94A3B8]"
                      }`}
                    >
                      {checks.length ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <X className="w-3 h-3" />
                      )}
                      <span>8+ characters</span>
                    </div>
                    <div
                      className={`flex items-center space-x-1 ${
                        checks.uppercase
                          ? "text-green-500"
                          : "text-[#0E1F33]/50 dark:text-[#94A3B8]"
                      }`}
                    >
                      {checks.uppercase ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <X className="w-3 h-3" />
                      )}
                      <span>Uppercase</span>
                    </div>
                    <div
                      className={`flex items-center space-x-1 ${
                        checks.lowercase
                          ? "text-green-500"
                          : "text-[#0E1F33]/50 dark:text-[#94A3B8]"
                      }`}
                    >
                      {checks.lowercase ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <X className="w-3 h-3" />
                      )}
                      <span>Lowercase</span>
                    </div>
                    <div
                      className={`flex items-center space-x-1 ${
                        checks.number
                          ? "text-green-500"
                          : "text-[#0E1F33]/50 dark:text-[#94A3B8]"
                      }`}
                    >
                      {checks.number ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <X className="w-3 h-3" />
                      )}
                      <span>Number</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-[#0E1F33] dark:text-[#F1F5F9] mb-2"
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className={`w-full px-4 py-3 pr-12 bg-white dark:bg-[#0F172A] border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-[#0E1F33] dark:text-[#F1F5F9] placeholder-[#0E1F33]/50 dark:placeholder-[#94A3B8] ${
                    formData.confirmPassword &&
                    formData.password !== formData.confirmPassword
                      ? "border-red-300 focus:ring-red-500"
                      : "border-[#97C3CC]/20 dark:border-[#475569]/20 focus:ring-[#13AECE] dark:focus:ring-[#0EA5E9]"
                  }`}
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#0E1F33]/50 dark:text-[#94A3B8] hover:text-[#0E1F33] dark:hover:text-[#F1F5F9] transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {formData.confirmPassword &&
                formData.password !== formData.confirmPassword && (
                  <p className="mt-1 text-xs text-red-500">
                    Passwords don't match
                  </p>
                )}
            </div>

            {/* Terms and Newsletter */}
            <div className="space-y-3">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="w-4 h-4 mt-0.5 text-[#13AECE] dark:text-[#0EA5E9] bg-white dark:bg-[#0F172A] border-[#97C3CC]/20 dark:border-[#475569]/20 rounded focus:ring-[#13AECE] dark:focus:ring-[#0EA5E9] focus:ring-2"
                  required
                />
                <span className="text-sm text-[#0E1F33] dark:text-[#F1F5F9]">
                  I agree to the{" "}
                  <a
                    href="#"
                    className="text-[#13AECE] dark:text-[#0EA5E9] hover:underline"
                  >
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a
                    href="#"
                    className="text-[#13AECE] dark:text-[#0EA5E9] hover:underline"
                  >
                    Privacy Policy
                  </a>
                </span>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={subscribeNewsletter}
                  onChange={(e) => setSubscribeNewsletter(e.target.checked)}
                  className="w-4 h-4 mt-0.5 text-[#13AECE] dark:text-[#0EA5E9] bg-white dark:bg-[#0F172A] border-[#97C3CC]/20 dark:border-[#475569]/20 rounded focus:ring-[#13AECE] dark:focus:ring-[#0EA5E9] focus:ring-2"
                />
                <span className="text-sm text-[#0E1F33] dark:text-[#F1F5F9]">
                  Subscribe to our newsletter for backend tips and career advice
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isAuthLoading || !agreedToTerms}
              className="w-full bg-[#0E1F33] dark:bg-[#0EA5E9] text-white py-3 px-4 rounded-lg hover:bg-[#0E1F33]/90 dark:hover:bg-[#0284C7] transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {emailLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Creating account...</span>
                </>
              ) : (
                <span>Create Account</span>
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-[#0E1F33]/70 dark:text-[#94A3B8]">
              Already have an account?{" "}
              <a
                href={
                  redirect
                    ? `/auth/login?redirect=${encodeURIComponent(redirect)}`
                    : "/auth/login"
                }
                className="text-[#13AECE] dark:text-[#0EA5E9] hover:text-[#13AECE]/80 dark:hover:text-[#0284C7] transition-colors font-medium"
              >
                Sign in
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
