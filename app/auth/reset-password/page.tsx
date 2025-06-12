"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Eye, EyeOff, ArrowLeft, Loader2, CheckCircle, AlertCircle, Check, X } from "lucide-react"
import { BrandLogo } from "@/components/brand-logo"
import { ThemeToggle } from "@/components/theme-toggle"

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null)
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  })

  // Simulate token validation on component mount
  useEffect(() => {
    const validateToken = async () => {
      // Simulate API call to validate reset token
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // For demo purposes, randomly determine if token is valid
      const isValid = Math.random() > 0.2 // 80% chance of valid token
      setIsValidToken(isValid)
    }

    validateToken()
  }, [])

  // Password strength calculation
  const getPasswordStrength = (password: string) => {
    let strength = 0
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    }

    strength = Object.values(checks).filter(Boolean).length
    return { strength, checks }
  }

  const { strength, checks } = getPasswordStrength(formData.password)

  const getStrengthColor = (strength: number) => {
    if (strength <= 2) return "bg-red-500"
    if (strength <= 3) return "bg-yellow-500"
    if (strength <= 4) return "bg-blue-500"
    return "bg-green-500"
  }

  const getStrengthText = (strength: number) => {
    if (strength <= 2) return "Weak"
    if (strength <= 3) return "Fair"
    if (strength <= 4) return "Good"
    return "Strong"
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords don't match!")
      return
    }

    setIsLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setIsLoading(false)
    setIsSuccess(true)
  }

  // Loading state while validating token
  if (isValidToken === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#E8F4F8] via-white to-[#97C3CC]/20 dark:from-[#0A0F1C] dark:via-[#1E293B] dark:to-[#0F172A] flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#13AECE] dark:text-[#0EA5E9] mx-auto mb-4" />
          <p className="text-[#0E1F33]/70 dark:text-[#94A3B8]">Validating reset link...</p>
        </div>
      </div>
    )
  }

  // Invalid token state
  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#E8F4F8] via-white to-[#97C3CC]/20 dark:from-[#0A0F1C] dark:via-[#1E293B] dark:to-[#0F172A] flex items-center justify-center p-4">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-[#13AECE]/10 dark:bg-[#0EA5E9]/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[10%] right-[5%] w-80 h-80 bg-[#97C3CC]/10 dark:bg-[#475569]/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <BrandLogo size="lg" showText={true} variant="default" />
            </div>
            <h1 className="text-3xl font-bold text-[#0E1F33] dark:text-[#F1F5F9] mb-2">Invalid Reset Link</h1>
            <p className="text-[#0E1F33]/70 dark:text-[#94A3B8]">This password reset link is invalid or has expired</p>
          </div>

          <div className="glass-card p-8 rounded-2xl shadow-xl text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>

            <h3 className="text-lg font-semibold text-[#0E1F33] dark:text-[#F1F5F9] mb-4">Link Expired or Invalid</h3>

            <p className="text-[#0E1F33]/70 dark:text-[#94A3B8] mb-6">
              Password reset links expire after 24 hours for security reasons. Please request a new reset link.
            </p>

            <a
              href="/auth/forgot-password"
              className="inline-block bg-[#0E1F33] dark:bg-[#0EA5E9] text-white px-6 py-3 rounded-lg hover:bg-[#0E1F33]/90 dark:hover:bg-[#0284C7] transition-all duration-200 font-medium"
            >
              Request New Reset Link
            </a>

            <div className="mt-6">
              <a
                href="/auth/login"
                className="inline-flex items-center space-x-2 text-[#0E1F33]/70 dark:text-[#94A3B8] hover:text-[#0E1F33] dark:hover:text-[#F1F5F9] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Sign In</span>
              </a>
            </div>
          </div>

          <div className="absolute top-4 right-4">
            <ThemeToggle />
          </div>
        </div>
      </div>
    )
  }

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
            {isSuccess ? "Password Reset Complete" : "Reset Your Password"}
          </h1>
          <p className="text-[#0E1F33]/70 dark:text-[#94A3B8]">
            {isSuccess ? "Your password has been successfully updated" : "Enter your new password below"}
          </p>
        </div>

        {/* Content */}
        <div className="glass-card p-8 rounded-2xl shadow-xl">
          {!isSuccess ? (
            /* Reset Password Form */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* New Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#0E1F33] dark:text-[#F1F5F9] mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 pr-12 bg-white dark:bg-[#0F172A] border border-[#97C3CC]/20 dark:border-[#475569]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#13AECE] dark:focus:ring-[#0EA5E9] focus:border-transparent text-[#0E1F33] dark:text-[#F1F5F9] placeholder-[#0E1F33]/50 dark:placeholder-[#94A3B8]"
                    placeholder="Enter your new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#0E1F33]/50 dark:text-[#94A3B8] hover:text-[#0E1F33] dark:hover:text-[#F1F5F9] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="mt-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="flex-1 bg-gray-200 dark:bg-[#475569]/30 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(strength)}`}
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
                        className={`flex items-center space-x-1 ${checks.length ? "text-green-500" : "text-[#0E1F33]/50 dark:text-[#94A3B8]"}`}
                      >
                        {checks.length ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        <span>8+ characters</span>
                      </div>
                      <div
                        className={`flex items-center space-x-1 ${checks.uppercase ? "text-green-500" : "text-[#0E1F33]/50 dark:text-[#94A3B8]"}`}
                      >
                        {checks.uppercase ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        <span>Uppercase</span>
                      </div>
                      <div
                        className={`flex items-center space-x-1 ${checks.lowercase ? "text-green-500" : "text-[#0E1F33]/50 dark:text-[#94A3B8]"}`}
                      >
                        {checks.lowercase ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        <span>Lowercase</span>
                      </div>
                      <div
                        className={`flex items-center space-x-1 ${checks.number ? "text-green-500" : "text-[#0E1F33]/50 dark:text-[#94A3B8]"}`}
                      >
                        {checks.number ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
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
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className={`w-full px-4 py-3 pr-12 bg-white dark:bg-[#0F172A] border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-[#0E1F33] dark:text-[#F1F5F9] placeholder-[#0E1F33]/50 dark:placeholder-[#94A3B8] ${
                      formData.confirmPassword && formData.password !== formData.confirmPassword
                        ? "border-red-300 focus:ring-red-500"
                        : "border-[#97C3CC]/20 dark:border-[#475569]/20 focus:ring-[#13AECE] dark:focus:ring-[#0EA5E9]"
                    }`}
                    placeholder="Confirm your new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#0E1F33]/50 dark:text-[#94A3B8] hover:text-[#0E1F33] dark:hover:text-[#F1F5F9] transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="mt-1 text-xs text-red-500">Passwords don't match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || formData.password !== formData.confirmPassword || strength < 3}
                className="w-full bg-[#0E1F33] dark:bg-[#0EA5E9] text-white py-3 px-4 rounded-lg hover:bg-[#0E1F33]/90 dark:hover:bg-[#0284C7] transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Updating password...</span>
                  </>
                ) : (
                  <span>Update Password</span>
                )}
              </button>
            </form>
          ) : (
            /* Success State */
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-[#0E1F33] dark:text-[#F1F5F9] mb-2">
                  Password Updated Successfully!
                </h3>
                <p className="text-[#0E1F33]/70 dark:text-[#94A3B8]">
                  Your password has been updated. You can now sign in with your new password.
                </p>
              </div>

              <a
                href="/auth/login"
                className="inline-block bg-[#0E1F33] dark:bg-[#0EA5E9] text-white px-6 py-3 rounded-lg hover:bg-[#0E1F33]/90 dark:hover:bg-[#0284C7] transition-all duration-200 font-medium"
              >
                Sign In Now
              </a>
            </div>
          )}
        </div>

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <a
            href="/"
            className="inline-flex items-center space-x-2 text-[#0E1F33]/70 dark:text-[#94A3B8] hover:text-[#0E1F33] dark:hover:text-[#F1F5F9] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </a>
        </div>

        {/* Theme Toggle */}
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
      </div>
    </div>
  )
}
