"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, ArrowLeft, Check, CheckCircle } from "lucide-react";
import { useAuth } from "@/store/auth";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const auth = useAuth();
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(
    null
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSearchParams(new URLSearchParams(window.location.search));
    }
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

  const getStrengthScore = () =>
    Object.values(passwordStrength).filter(Boolean).length;
  const getStrengthColor = () => {
    const score = getStrengthScore();
    if (score <= 2) return "bg-red-500";
    if (score <= 3) return "bg-yellow-500";
    if (score <= 4) return "bg-blue-500";
    return "bg-green-500";
  };

  const sharedWrapperClasses =
    "min-h-screen bg-gradient-to-br from-[#E8F4F8] via-white to-[#97C3CC]/20 dark:from-[#0A0F1C] dark:via-[#1E293B] dark:to-[#0F172A] flex items-center justify-center p-4";

  const sharedCardClasses =
    "backdrop-blur-xl bg-white dark:bg-black/20 border border-[#E2E8F0] dark:border-white/10 rounded-2xl p-8 shadow-2xl";

  if (isSuccess) {
    return (
      <div className={sharedWrapperClasses}>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-primary/10 dark:bg-[#0EA5E9]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-[10%] right-[5%] w-80 h-80 bg-[#97C3CC]/10 dark:bg-[#475569]/20 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 w-full max-w-md text-center">
          <div className={sharedCardClasses}>
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-[#0E1F33] dark:text-white mb-4">
              Password Reset Successful!
            </h1>
            <p className="text-[#334155] dark:text-white/70 mb-8">
              Your password has been reset. You can now sign in.
            </p>
            <Link
              href="/auth/login"
              className="w-full bg-[#0E1F33] dark:bg-[#0EA5E9] text-white py-3 px-4 rounded-lg hover:bg-[#1E293B] dark:hover:bg-[#0284C7] transition-all duration-200 font-medium flex items-center justify-center"
            >
              Continue to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={sharedWrapperClasses}>
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

      <div className="relative z-10 w-full max-w-md">
        <div className={sharedCardClasses}>
          <h1 className="text-2xl font-bold text-[#0E1F33] dark:text-white mb-2">
            Reset Your Password
          </h1>
          <p className="text-[#334155] dark:text-white/70 mb-6">
            Enter your new password below
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/** Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[#0E1F33] dark:text-white mb-2"
              >
                New Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 pr-12 bg-white dark:bg-white/10 border border-[#E2E8F0] dark:border-white/20 rounded-lg text-[#0E1F33] dark:text-white placeholder-[#94A3B8] dark:placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
                  placeholder="Enter your new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#64748B] dark:text-white/50 hover:text-black dark:hover:text-white"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Strength Meter */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full ${
                          i <= getStrengthScore()
                            ? getStrengthColor()
                            : "bg-[#E2E8F0] dark:bg-white/10"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/** Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-[#0E1F33] dark:text-white mb-2"
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 pr-12 bg-white dark:bg-white/10 border border-[#E2E8F0] dark:border-white/20 rounded-lg text-[#0E1F33] dark:text-white placeholder-[#94A3B8] dark:placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
                  placeholder="Confirm your new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#64748B] dark:text-white/50 hover:text-black dark:hover:text-white"
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
                  <p className="text-red-500 text-sm mt-2">
                    Passwords do not match
                  </p>
                )}
            </div>

            <button
              type="submit"
              disabled={
                isLoading ||
                formData.password !== formData.confirmPassword ||
                !formData.password
              }
              className="w-full bg-[#0E1F33] dark:bg-[#0EA5E9] text-white py-3 px-4 rounded-lg hover:bg-[#1E293B] dark:hover:bg-[#0284C7] transition duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? "Resetting password..." : "Reset Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
