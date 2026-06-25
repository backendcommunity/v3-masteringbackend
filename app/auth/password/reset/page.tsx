"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Eye, EyeOff, CheckCircle } from "lucide-react";
import { useAuth } from "@/store/auth";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/auth-shell";
import {
  AuthHeading,
  authInputClass,
  authLabelClass,
  authPrimaryBtnClass,
} from "@/components/auth/auth-ui";

export default function ResetPasswordPage() {
  const auth = useAuth();
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [formData, setFormData] = useState({ password: "", confirmPassword: "" });
  const [passwordStrength, setPasswordStrength] = useState({
    length: false, uppercase: false, lowercase: false, number: false, special: false,
  });

  useEffect(() => {
    if (typeof window !== "undefined") setSearchParams(new URLSearchParams(window.location.search));
  }, []);

  useEffect(() => {
    if (!searchParams) return;
    setToken(searchParams.get("token") || "");
    setEmail(searchParams.get("email") || "");
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setIsLoading(true);
    try {
      const success = await auth.resetPassword(token, email, formData.password);
      if (!success) throw new Error("Password reset failed. Please try again");
      setIsSuccess(true);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "password") {
      setPasswordStrength({
        length: value.length >= 8,
        uppercase: /[A-Z]/.test(value),
        lowercase: /[a-z]/.test(value),
        number: /\d/.test(value),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(value),
      });
    }
  };

  const getStrengthScore = () => Object.values(passwordStrength).filter(Boolean).length;
  const getStrengthColor = () => {
    const score = getStrengthScore();
    if (score <= 2) return "bg-red-500";
    if (score <= 3) return "bg-yellow-500";
    if (score <= 4) return "bg-blue-500";
    return "bg-green-500";
  };

  if (isSuccess) {
    return (
      <AuthShell backHref="/auth/login">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mb-6" style={{ background: "rgba(34,197,94,0.15)" }}>
          <CheckCircle className="w-7 h-7 text-green-400" />
        </div>
        <AuthHeading
          title="Password reset successful"
          subtitle="Your password has been reset. You can now sign in."
        />
        <Link href="/auth/login" className={authPrimaryBtnClass}>
          Continue to Login
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell backHref="/auth/login">
      <AuthHeading title="Reset your password" subtitle="Enter your new password below." />

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="password" className={authLabelClass}>New Password</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className={`${authInputClass} pr-12`}
              placeholder="Enter your new password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0E1F33] transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {formData.password && (
            <div className="mt-2 flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full ${i <= getStrengthScore() ? getStrengthColor() : "bg-[#E2E8F0]"}`}
                />
              ))}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className={authLabelClass}>Confirm Password</label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
              className={`${authInputClass} pr-12 ${
                formData.confirmPassword && formData.password !== formData.confirmPassword
                  ? "border-red-400/70 focus:border-red-400 focus:ring-red-400/25"
                  : ""
              }`}
              placeholder="Confirm your new password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0E1F33] transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {formData.confirmPassword && formData.password !== formData.confirmPassword && (
            <p className="text-red-400 text-sm mt-2">Passwords do not match</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || formData.password !== formData.confirmPassword || !formData.password}
          className={authPrimaryBtnClass}
        >
          {isLoading ? "Resetting password..." : "Reset Password"}
        </button>
      </form>
    </AuthShell>
  );
}
