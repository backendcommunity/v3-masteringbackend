"use client"

import type React from "react"

import { useState } from "react"
import { ArrowLeft, Loader2, Mail, CheckCircle } from "luc ide-react"
import { BrandLogo } from "@/components/brand-logo"
import { ThemeToggle } from "@/components/theme-toggle"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setIsLoading(false)
    setIsEmailSent(true)
  }

  const handleResendEmail = async () => {
    setIsLoading(true)

    // Simulate resend API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setIsLoading(false)
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
            {isEmailSent ? "Check Your Email" : "Forgot Password?"}
          </h1>
          <p className="text-[#0E1F33]/70 dark:text-[#94A3B8]">
            {isEmailSent
              ? "We've sent a password reset link to your email address"
              : "No worries! Enter your email and we'll send you reset instructions"}
          </p>
        </div>

        {/* Content */}
        <div className="glass-card p-8 rounded-2xl shadow-xl">
          {!isEmailSent ? (
            /* Email Form */
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#0E1F33] dark:text-[#F1F5F9] mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 pl-12 bg-white dark:bg-[#0F172A] border border-[#97C3CC]/20 dark:border-[#475569]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#13AECE] dark:focus:ring-[#0EA5E9] focus:border-transparent text-[#0E1F33] dark:text-[#F1F5F9] placeholder-[#0E1F33]/50 dark:placeholder-[#94A3B8]"
                    placeholder="Enter your email address"
                    required
                  />
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#0E1F33]/50 dark:text-[#94A3B8]" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#0E1F33] dark:bg-[#0EA5E9] text-white py-3 px-4 rounded-lg hover:bg-[#0E1F33]/90 dark:hover:bg-[#0284C7] transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Sending reset link...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5" />
                    <span>Send Reset Link</span>
                  </>
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
                <h3 className="text-lg font-semibold text-[#0E1F33] dark:text-[#F1F5F9] mb-2">Reset Link Sent!</h3>
                <p className="text-[#0E1F33]/70 dark:text-[#94A3B8] mb-4">We've sent a password reset link to:</p>
                <p className="text-[#13AECE] dark:text-[#0EA5E9] font-medium break-all">{email}</p>
              </div>

              <div className="bg-[#97C3CC]/10 dark:bg-[#475569]/20 rounded-lg p-4">
                <h4 className="text-sm font-medium text-[#0E1F33] dark:text-[#F1F5F9] mb-2">What's next?</h4>
                <ul className="text-sm text-[#0E1F33]/70 dark:text-[#94A3B8] space-y-1">
                  <li>• Check your email inbox</li>
                  <li>• Click the reset link in the email</li>
                  <li>• Create a new password</li>
                  <li>• Sign in with your new password</li>
                </ul>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-[#0E1F33]/70 dark:text-[#94A3B8]">
                  Didn't receive the email? Check your spam folder or
                </p>
                <button
                  onClick={handleResendEmail}
                  disabled={isLoading}
                  className="text-[#13AECE] dark:text-[#0EA5E9] hover:text-[#13AECE]/80 dark:hover:text-[#0284C7] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mx-auto"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Resending...</span>
                    </>
                  ) : (
                    <span>Resend email</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <a
              href="/auth/login"
              className="inline-flex items-center space-x-2 text-[#0E1F33]/70 dark:text-[#94A3B8] hover:text-[#0E1F33] dark:hover:text-[#F1F5F9] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Sign In</span>
            </a>
          </div>
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
