"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle, XCircle, Mail, RefreshCw } from "lucide-react"
import { BrandLogo } from "@/components/brand-logo"

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const [verificationStatus, setVerificationStatus] = useState<"loading" | "success" | "error" | "expired">("loading")
  const [isResending, setIsResending] = useState(false)
  const [token, setToken] = useState("")
  const [email, setEmail] = useState("")

  useEffect(() => {
    const tokenParam = searchParams.get("token")
    const emailParam = searchParams.get("email")

    if (tokenParam) {
      setToken(tokenParam)
      setEmail(emailParam || "")

      // Simulate email verification
      const verifyEmail = async () => {
        await new Promise((resolve) => setTimeout(resolve, 2000))
        // Simulate different outcomes
        const outcomes = ["success", "error", "expired"]
        const randomOutcome = outcomes[Math.floor(Math.random() * outcomes.length)]
        setVerificationStatus(randomOutcome as any)
      }

      verifyEmail()
    } else {
      setVerificationStatus("error")
    }
  }, [searchParams])

  const handleResendVerification = async () => {
    setIsResending(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsResending(false)
    // You could show a success message here
  }

  const renderContent = () => {
    switch (verificationStatus) {
      case "loading":
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">Verifying Your Email</h1>
            <p className="text-white/70">Please wait while we verify your email address...</p>
          </div>
        )

      case "success":
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">Email Verified Successfully!</h1>
            <p className="text-white/70 mb-8">
              Your email has been verified. You can now access all features of your account.
            </p>
            <Link
              href="/auth/login"
              className="inline-block w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-[1.02]"
            >
              Continue to Login
            </Link>
          </div>
        )

      case "expired":
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-yellow-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">Verification Link Expired</h1>
            <p className="text-white/70 mb-8">
              This verification link has expired. Please request a new verification email.
            </p>
            <div className="space-y-4">
              <button
                onClick={handleResendVerification}
                disabled={isResending}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
                className="block w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium py-3 px-4 rounded-lg transition-all duration-300"
              >
                Back to Login
              </Link>
            </div>
          </div>
        )

      case "error":
      default:
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">Verification Failed</h1>
            <p className="text-white/70 mb-8">
              We couldn't verify your email address. The link may be invalid or expired.
            </p>
            <div className="space-y-4">
              <button
                onClick={handleResendVerification}
                disabled={isResending}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
                className="block w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium py-3 px-4 rounded-lg transition-all duration-300"
              >
                Create New Account
              </Link>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 dark:from-black dark:via-purple-950 dark:to-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          {/* Glass Card */}
          <div className="backdrop-blur-xl bg-white/10 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-2xl p-8 shadow-2xl">
            {/* Logo */}
            <div className="text-center mb-8">
              <BrandLogo className="mx-auto mb-4" />
            </div>

            {renderContent()}

            {/* Footer */}
            <div className="text-center mt-8 pt-6 border-t border-white/10">
              <p className="text-white/50 text-sm">
                Need help?{" "}
                <Link href="/support" className="text-purple-400 hover:text-purple-300 underline">
                  Contact Support
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
