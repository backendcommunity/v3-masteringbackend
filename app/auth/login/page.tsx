"use client";

export const dynamic = "force-dynamic";

import type React from "react";

import { Suspense, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/store/auth";
import { analytics } from "@/lib/analytics";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
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

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "github" | null>(null);
  const auth = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });

  const ref = searchParams?.get("ref") ?? searchParams?.get("utm_source") ?? "";
  const redirect = searchParams?.get("redirect") ?? "";

  const handleSubmit = async (e: React.FormEvent) => {
    try {
      e.preventDefault();
      setEmailLoading(true);
      const { email, password } = formData;
      analytics.track("login_attempted", { method: "email" });
      const user = await auth.login(email, password, rememberMe);
      if (!user) {
        toast.error("Login failed");
        return;
      }
      toast.success("Login successful! Redirecting...");
      const redirectPath = redirect || "/";
      await router.push(redirectPath);
    } catch (error: any) {
      const message = error?.response?.data?.message ?? error?.message;
      if (message && message.includes("Confirm your email")) {
        router.push("/auth/email/verify?sent=true&email=" + formData.email);
        return;
      }
      analytics.track("login_failed", { method: "email", reason: message });
      toast.error(message || "Login failed. Please try again.");
    } finally {
      setEmailLoading(false);
    }
  };

  const isAuthLoading = emailLoading || oauthLoading !== null;

  return (
    <AuthShell>
      <AuthHeading
        title="Log in to your account"
        subtitle="Welcome back. Pick up where you left off."
      />

      {/* Social */}
      <div className="space-y-3">
        <a
          href={`${process.env.NEXT_PUBLIC_API_URL}/auth/github?ref=${ref}&redirect=${redirect}`}
          className={authSocialBtnClass}
          aria-disabled={isAuthLoading}
          onClick={(event) => {
            if (isAuthLoading) {
              event.preventDefault();
              return;
            }
            setOauthLoading("github");
            analytics.track("oauth_initiated", { provider: "github", page: "login" });
          }}
        >
          {oauthLoading === "github" ? <Loader2 className="w-5 h-5 animate-spin" /> : <GithubGlyph />}
          <span>Log in with GitHub</span>
        </a>

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
            analytics.track("oauth_initiated", { provider: "google", page: "login" });
          }}
        >
          {oauthLoading === "google" ? <Loader2 className="w-5 h-5 animate-spin" /> : <GoogleGlyph />}
          <span>Log in with Google</span>
        </a>
      </div>

      <AuthDivider label="or continue with email" />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className={authLabelClass}>Email Address</label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={authInputClass}
            placeholder="name@company.com"
            required
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="password" className="text-sm font-medium text-[#0E1F33]">Password</label>
            <a href="/auth/password/forgot" className="text-[13px] text-[#64748B] hover:text-[#13AECE] transition-colors">
              Forgot password?
            </a>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className={`${authInputClass} pr-12`}
              placeholder="••••••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0E1F33] transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded accent-[#13AECE]"
          />
          <span className="text-sm text-[#64748B]">Remember me</span>
        </label>

        <button type="submit" disabled={isAuthLoading} className={`${authPrimaryBtnClass} mt-2`}>
          {emailLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <span>Log In</span>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-[14px] text-[#64748B]">
        Don&apos;t have an account?{" "}
        <a
          href={redirect ? `/auth/register?redirect=${encodeURIComponent(redirect)}` : "/auth/register"}
          className="text-[#0E1F33] font-semibold border-b border-[#0E1F33]/40 hover:border-[#0E1F33] transition-colors"
        >
          Sign Up
        </a>
      </p>
    </AuthShell>
  );
}
