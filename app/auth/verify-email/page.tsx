"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Loader2, CheckCircle, AlertCircle, Mail, RefreshCw } from "lucide-react"
import { BrandLogo } from "@/components/brand-logo"
import { ThemeToggle } from "@/components/theme-toggle"

export default function VerifyEmailPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [verificationStatus, setVerificationStatus] = useState<"loading" | "success" | "error" | "expired">("loading")
  const [isResending, setIsResending] = useState(false)
  const [email, setEmail] = useState("user@example.com") // This would come from URL params or context

  // Simulate email verification on component mount
  useEffect(() => {
    const verifyEmail = async () => {
      // Simulate API call to verify email
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // For demo purposes, randomly determine verification result
      const random = Math.random()
      if (random > 0.8) {
        setVerificationStatus("expired")
      } else if (random > 0.1) {
        setVerificationStatus("success")
      } else {
        setVerificationStatus("error")
      }

      setIsLoading(false)
    }

    verifyEmail()
  }, [])

  const handleResendVerification = async () => {
    setIsResending(true)

    // Simulate resend API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setIsResending(false)
    // Show success message or handle response
  }

  const renderContent = () => {
    switch (verificationStatus) {
      case "loading":
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-[#13AECE]/10 dark:bg-[#0EA5E9]/20 rounded-full flex items-center justify-center mx-auto">
              <Loader2 className="w-8 h-8 text-[#13AECE] dark:text-[#0EA5E9] animate-spin" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#0E1F33] dark:text-[#F1F5F9] mb-2">Verifying Your Email</h3>
              <p className="text-[#0E1F33]/70 dark:text-[#94A3B8]">Please wait while we verify your email address...</p>
            </div>
          </div>
        )

      case "success":
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#0E1F33] dark:text-[#F1F5F9] mb-2">
                Email Verified Successfully!
              </h3>
              <p className="text-[#0E1F33]/70 dark:text-[#94A3B8] mb-4">
                Your email address has been verified. You can now access all features of your account.
              </p>
              <p className="text-[#13AECE] dark:text-[#0EA5E9] font-medium break-all">{email}</p>
            </div>

            <div className="bg-[#97C3CC]/10 dark:bg-[#475569]/20 rounded-lg p-4">
              <h4 className="text-sm font-medium text-[#0E1F33] dark:text-[#F1F5F9] mb-2">What's next?</h4>
              <ul className="text-sm text-[#0E1F33]/70 dark:text-[#94A3B8] space-y-1">
                <li>• Complete your profile setup</li>
                <li>• Explore our learning paths</li>
                <li>• Join the community</li>
                <li>• Start your first project</li>
              </ul>
            </div>

            <div className="space-y-3">
              <a
                href="/auth/login"
                className="block bg-[#0E1F33] dark:bg-[#0EA5E9] text-white px-6 py-3 rounded-lg hover:bg-[#0E1F33]/90 dark:hover:bg-[#0284C7] transition-all duration-200 font-medium"
              >
                Continue to Dashboard
              </a>
              <a
                href="/"
                className="block text-[#13AECE] dark:text-[#0EA5E9] hover:text-[#13AECE]/80 dark:hover:text-[#0284C7] transition-colors"
              >
                Explore Masteringbackend
              </a>
            </div>
          </div>
        )

      case "expired":
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#0E1F33] dark:text-[#F1F5F9] mb-2">
                Verification Link Expired
              </h3>
              <p className="text-[#0E1F33]/70 dark:text-[#94A3B8] mb-4">
                This email verification link has expired. Verification links are valid for 24 hours for security
                reasons.
              </p>
              <p className="text-[#13AECE] dark:text-[#0EA5E9] font-medium break-all">{email}</p>
            </div>

            <div className="bg-[#97C3CC]/10 dark:bg-[#475569]/20 rounded-lg p-4">
              <h4 className="text-sm font-medium text-[#0E1F33] dark:text-[#F1F5F9] mb-2">
                Need a new verification link?
              </h4>
              <p className="text-sm text-[#0E1F33]/70 dark:text-[#94A3B8]">
                We can send you a new verification email to complete your account setup.
              </p>
            </div>

            <button
              onClick={handleResendVerification}
              disabled={isResending}
              className="w-full bg-[#0E1F33] dark:bg-[#0EA5E9] text-white px-6 py-3 rounded-lg hover:bg-[#0E1F33]/90 dark:hover:bg-[#0284C7] transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isResending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Sending new link...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  <span>Send New Verification Email</span>
                </>
              )}
            </button>
          </div>
        )

      case "error":
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#0E1F33] dark:text-[#F1F5F9] mb-2">Verification Failed</h3>
              <p className="text-[#0E1F33]/70 dark:text-[#94A3B8] mb-4">
                We couldn't verify your email address. This could be due to an invalid or corrupted verification link.
              </p>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg p-4">
              <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">Possible reasons:</h4>
              <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                <li>• The verification link is invalid</li>
                <li>• The link has been used already</li>
                <li>• There was a temporary server error</li>
              </ul>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleResendVerification}
                disabled={isResending}
                className="w-full bg-[#0E1F33] dark:bg-[#0EA5E9] text-white px-6 py-3 rounded-lg hover:bg-[#0E1F33]/90 dark:hover:bg-[#0284C7] transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isResending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Sending new link...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5" />
                    <span>Send New Verification Email</span>
                  </>
                )}
              </button>
              <a
                href="/auth/login"
                className="block text-[#13AECE] dark:text-[#0EA5E9] hover:text-[#13AECE]/80 dark:hover:text-[#0284C7] transition-colors"
              >
                Try signing in anyway
              </a>
            </div>
          </div>
        )

      default:
        return null
    }
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
          <h1 className="text-3xl font-bold text-[#0E1F33] dark:text-[#F1F5F9] mb-2">Email Verification</h1>
          <p className="text-[#0E1F33]/70 dark:text-[#94A3B8]">
            {isLoading
              ? "Verifying your email address..."
              : verificationStatus === "success"
                ? "Welcome to Masteringbackend!"
                : "Let's get your email verified"}
          </p>
        </div>

        {/* Content */}
        <div className="glass-card p-8 rounded-2xl shadow-xl">
          {renderContent()}

          {/* Back to Login */}
          {verificationStatus !== "loading" && (
            <div className="mt-6 pt-6 border-t border-[#97C3CC]/20 dark:border-[#475569]/20 text-center">
              <a
                href="/auth/login"
                className="inline-flex items-center space-x-2 text-[#0E1F33]/70 dark:text-[#94A3B8] hover:text-[#0E1F33] dark:hover:text-[#F1F5F9] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Sign In</span>
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
