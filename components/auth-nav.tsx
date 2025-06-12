import Link from "next/link"

export function AuthNav() {
  return (
    <div className="fixed top-4 right-4 z-50 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg p-4 space-y-2">
      <h3 className="text-white font-semibold text-sm mb-2">Auth Pages</h3>
      <div className="space-y-1">
        <Link href="/auth/login" className="block text-white/80 hover:text-white text-sm transition-colors">
          → Login
        </Link>
        <Link href="/auth/register" className="block text-white/80 hover:text-white text-sm transition-colors">
          → Register
        </Link>
        <Link href="/auth/forgot-password" className="block text-white/80 hover:text-white text-sm transition-colors">
          → Forgot Password
        </Link>
        <Link
          href="/auth/reset-password?token=sample-token"
          className="block text-white/80 hover:text-white text-sm transition-colors"
        >
          → Reset Password
        </Link>
        <Link
          href="/auth/verify-email?token=sample-token&email=test@example.com"
          className="block text-white/80 hover:text-white text-sm transition-colors"
        >
          → Verify Email
        </Link>
      </div>
    </div>
  )
}
