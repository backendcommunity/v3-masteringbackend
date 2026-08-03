"use client";

export const dynamic = "force-dynamic";

import type React from "react";

import { Suspense, useState } from "react";
import { analytics } from "@/lib/analytics";
import { Eye, EyeOff, Loader2, Check, X } from "lucide-react";
import { useAuth } from "@/store/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/auth-shell";
import {
  AuthHeading,
  AuthDivider,
  authInputClass,
  authLabelClass,
  authPrimaryBtnClass,
  authSocialBtnClass,
  GithubGlyph,
  GoogleGlyph,
} from "@/components/auth/auth-ui";

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

  const getPasswordStrength = (password: string) => {
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
    const strength = Object.values(checks).filter(Boolean).length;
    return { strength, checks };
  };

  const { strength, checks } = getPasswordStrength(formData.password);

  const getStrengthColor = (s: number) => {
    if (s <= 2) return "bg-red-500";
    if (s <= 3) return "bg-yellow-500";
    if (s <= 4) return "bg-blue-500";
    return "bg-green-500";
  };
  const getStrengthText = (s: number) => {
    if (s <= 2) return "Weak";
    if (s <= 3) return "Fair";
    if (s <= 4) return "Good";
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
      if (isRegistered)
        router.push(
          `/auth/email/verify?sent=true&email=${encodeURIComponent(formData.email)}${redirect ? `&redirect=${encodeURIComponent(redirect)}` : ""}`,
        );
    } catch (error: any) {
      const message =
        error?.response?.data?.error?.message ??
        error?.message ??
        "Registration failed. Please try again.";
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
    <AuthShell>
      <AuthHeading
        title="Create your account"
        subtitle="Join the ecosystem turning engineers into high-paid backend pros."
      />

      {/* Social */}
      <div className="space-y-3">
        {/* <a
          href={`${process.env.NEXT_PUBLIC_API_URL}/auth/github?ref=${ref}&redirect=${redirect}`}
          className={authSocialBtnClass}
          aria-disabled={isAuthLoading}
          onClick={(event) => {
            if (isAuthLoading) {
              event.preventDefault();
              return;
            }
            setOauthLoading("github");
            analytics.track("oauth_initiated", { provider: "github", page: "register" });
          }}
        >
          {oauthLoading === "github" ? <Loader2 className="w-5 h-5 animate-spin" /> : <GithubGlyph />}
          <span>Sign up with GitHub</span>
        </a> */}

        <a
          href={`${process.env.NEXT_PUBLIC_API_URL}/auth/google?ref=${ref}&redirect=${redirect}`}
          className={authSocialBtnClass}
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
            <GoogleGlyph />
          )}
          <span>Sign up with Google</span>
        </a>
      </div>

      <AuthDivider label="or sign up with email" />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className={authLabelClass}>
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              value={formData.firstName}
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
              className={authInputClass}
              placeholder="John"
              required
            />
          </div>
          <div>
            <label htmlFor="lastName" className={authLabelClass}>
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
              className={authInputClass}
              placeholder="Doe"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className={authLabelClass}>
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className={authInputClass}
            placeholder="name@company.com"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className={authLabelClass}>
            Choose Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className={`${authInputClass} pr-12`}
              placeholder="Create a strong password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0E1F33] transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          {formData.password && (
            <div className="mt-2">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 bg-[#E2E8F0] rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(strength)}`}
                    style={{ width: `${(strength / 5) * 100}%` }}
                  />
                </div>
                <span
                  className={`text-xs font-medium ${
                    strength <= 2
                      ? "text-red-400"
                      : strength <= 3
                        ? "text-yellow-400"
                        : strength <= 4
                          ? "text-blue-400"
                          : "text-green-400"
                  }`}
                >
                  {getStrengthText(strength)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-xs">
                {[
                  ["8+ characters", checks.length],
                  ["Uppercase", checks.uppercase],
                  ["Lowercase", checks.lowercase],
                  ["Number", checks.number],
                ].map(([label, ok]) => (
                  <div
                    key={label as string}
                    className={`flex items-center gap-1 ${ok ? "text-green-400" : "text-[#94A3B8]"}`}
                  >
                    {ok ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <X className="w-3 h-3" />
                    )}
                    <span>{label as string}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className={authLabelClass}>
            Confirm Password
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              className={`${authInputClass} pr-12 ${
                formData.confirmPassword &&
                formData.password !== formData.confirmPassword
                  ? "border-red-400/70 focus:border-red-400 focus:ring-red-400/25"
                  : ""
              }`}
              placeholder="Confirm your password"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0E1F33] transition-colors"
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
              <p className="mt-1 text-xs text-red-400">
                Passwords don&apos;t match
              </p>
            )}
        </div>

        <div className="space-y-3 pt-1">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded accent-[#13AECE]"
              required
            />
            <span className="text-sm text-[#64748B]">
              I agree to the{" "}
              <a
                href="#"
                className="text-[#0E1F33] hover:text-[#13AECE] underline"
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="#"
                className="text-[#0E1F33] hover:text-[#13AECE] underline"
              >
                Privacy Policy
              </a>
            </span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={subscribeNewsletter}
              onChange={(e) => setSubscribeNewsletter(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded accent-[#13AECE]"
            />
            <span className="text-sm text-[#64748B]">
              Subscribe to our newsletter for backend tips and career advice
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={isAuthLoading || !agreedToTerms}
          className={`${authPrimaryBtnClass} mt-2`}
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

      <p className="mt-6 text-center text-[14px] text-[#64748B]">
        Already have an account?{" "}
        <a
          href={
            redirect
              ? `/auth/login?redirect=${encodeURIComponent(redirect)}`
              : "/auth/login"
          }
          className="text-[#0E1F33] font-semibold border-b border-[#0E1F33]/40 hover:border-[#0E1F33] transition-colors"
        >
          Log In
        </a>
      </p>
    </AuthShell>
  );
}
