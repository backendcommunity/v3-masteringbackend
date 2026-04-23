/**
 * Account Recovery Page
 * Epic 4, Story 4.2: Recover Deleted Account
 *
 * Page: /recover-account?token=xyz
 * Allows users to recover their account within 7-day window
 */

"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import Link from "next/link";

type RecoveryStatus = "loading" | "success" | "error" | "invalid" | "idle";

function RecoverAccountContent() {
  const searchParams = useSearchParams();
  const token = searchParams?.get("token");

  const [status, setStatus] = useState<RecoveryStatus>("idle");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recoveryData, setRecoveryData] = useState<{
    email?: string;
    recoveredAt?: string;
  } | null>(null);

  // Auto-recover if token is present
  useEffect(() => {
    if (token && status === "idle") {
      handleRecover();
    }
  }, [token, status]);

  const handleRecover = async () => {
    if (!token) {
      setStatus("invalid");
      setError("No recovery token provided");
      return;
    }

    try {
      setLoading(true);
      setStatus("loading");
      setError(null);

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/v3/users/undelete`,
        { token },
        { withCredentials: true },
      );

      if (response.data.success) {
        setStatus("success");
        setRecoveryData({
          email: response.data.user?.email,
          recoveredAt: new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
        });
        toast.success("Account recovered successfully!");

        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 3000);
      }
    } catch (err: any) {
      console.error("Recovery error:", err);
      setStatus("error");
      const message =
        err.response?.data?.message ||
        "Failed to recover account. Token may be invalid or expired.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Loading State */}
        {status === "loading" && (
          <Card className="border-gray-700 bg-gray-800">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-white">
                <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                Recovering Account...
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-300">
                Please wait while we restore your account...
              </p>
            </CardContent>
          </Card>
        )}

        {/* Success State */}
        {status === "success" && (
          <Card className="border-green-700 bg-green-900/20">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-green-400">
                <CheckCircle2 className="w-6 h-6" />
                Account Recovered!
              </CardTitle>
              <CardDescription className="text-green-300 mt-2">
                Your account has been successfully restored
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Success Details */}
              <div className="p-4 bg-green-900/30 border border-green-700 rounded-lg space-y-2">
                {recoveryData?.email && (
                  <p className="text-sm text-green-200">
                    <strong>Email:</strong> {recoveryData.email}
                  </p>
                )}
                {recoveryData?.recoveredAt && (
                  <p className="text-sm text-green-200">
                    <strong>Recovered at:</strong> {recoveryData.recoveredAt}
                  </p>
                )}
              </div>

              {/* What's Next */}
              <div className="p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
                <h3 className="font-semibold text-blue-200 mb-2">
                  What's next?
                </h3>
                <ul className="text-sm text-blue-200 space-y-1 list-disc list-inside">
                  <li>Your account is now active</li>
                  <li>All your courses and progress are restored</li>
                  <li>You can continue learning immediately</li>
                </ul>
              </div>

              {/* Action Button */}
              <div className="flex gap-2 justify-center">
                <Link href="/dashboard" className="w-full">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Go to Dashboard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {status === "error" && (
          <Card className="border-red-700 bg-red-900/20">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-red-400">
                <XCircle className="w-6 h-6" />
                Recovery Failed
              </CardTitle>
              <CardDescription className="text-red-300 mt-2">
                Unable to recover your account
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Error Details */}
              <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg">
                <p className="text-sm text-red-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </p>
              </div>

              {/* Help Box */}
              <div className="p-4 bg-yellow-900/30 border border-yellow-700 rounded-lg">
                <h3 className="font-semibold text-yellow-200 mb-2">
                  Possible reasons:
                </h3>
                <ul className="text-sm text-yellow-200 space-y-1 list-disc list-inside">
                  <li>Recovery token has expired (7-day limit)</li>
                  <li>Token is invalid or has already been used</li>
                  <li>Account was permanently deleted</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-center">
                <Link href="/login" className="flex-1">
                  <Button variant="outline" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link href="/support" className="flex-1">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Contact Support
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Invalid State */}
        {status === "invalid" && (
          <Card className="border-gray-700 bg-gray-800">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-yellow-400">
                <AlertCircle className="w-6 h-6" />
                No Recovery Token
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="p-4 bg-gray-700/50 border border-gray-600 rounded-lg">
                <p className="text-sm text-gray-200">
                  It looks like you're trying to recover your account, but no
                  recovery token was found in the link.
                </p>
              </div>

              <div className="p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
                <h3 className="font-semibold text-blue-200 mb-2">
                  How to recover your account:
                </h3>
                <ol className="text-sm text-blue-200 space-y-1 list-decimal list-inside">
                  <li>
                    Check your email for the account deletion confirmation
                  </li>
                  <li>Click the "Recover Account" link in the email</li>
                  <li>You have 7 days to recover your account</li>
                </ol>
              </div>

              <div className="flex gap-2 justify-center">
                <Link href="/" className="flex-1">
                  <Button variant="outline" className="w-full">
                    Go Home
                  </Button>
                </Link>
                <Link href="/support" className="flex-1">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Contact Support
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Idle State - Waiting for token */}
        {status === "idle" && (
          <Card className="border-gray-700 bg-gray-800">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-yellow-400">
                <Clock className="w-6 h-6" />
                Account Recovery
              </CardTitle>
              <CardDescription className="text-gray-300 mt-2">
                7-day recovery window
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
                <p className="text-sm text-blue-200 mb-3">
                  <strong>Your account is pending deletion.</strong>
                </p>
                <p className="text-sm text-blue-200">
                  You have 7 days from the deletion date to recover your
                  account. After that, your data will be permanently deleted.
                </p>
              </div>

              <div className="flex gap-2 justify-center">
                <Link href="/" className="flex-1">
                  <Button variant="outline" className="w-full">
                    Go Home
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Fallback loading component for Suspense
function RecoverAccountLoading() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-gray-700 bg-gray-800">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-yellow-400">
            <Loader2 className="w-6 h-6 animate-spin" />
            Loading...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-400">
            Processing recovery request...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Main export with Suspense boundary for useSearchParams()
export default function RecoverAccountPage() {
  return (
    <Suspense fallback={<RecoverAccountLoading />}>
      <RecoverAccountContent />
    </Suspense>
  );
}

/**
 * INTEGRATION INSTRUCTIONS:
 *
 * 1. Place this file at: app/recover-account/page.tsx
 *
 * 2. Update email templates to include recovery link:
 *    - From: DELETE_ACCOUNT email template
 *    - Link format: https://yourapp.com/recover-account?token={deleteToken}
 *
 * 3. Update environment variables:
 *    - NEXT_PUBLIC_API_URL (if needed)
 *
 * 4. Test the recovery flow:
 *    - Delete account from settings
 *    - Check email for recovery link
 *    - Click link to test recovery page
 *    - Verify all states (loading, success, error, invalid)
 *
 * FEATURES:
 * ✅ Auto-recovery with token from URL
 * ✅ Beautiful loading state
 * ✅ Success state with redirect
 * ✅ Error state with help text
 * ✅ Invalid token handling
 * ✅ Dark mode design
 * ✅ Responsive layout
 * ✅ Clear user guidance
 * ✅ Toast notifications
 * ✅ Auto-redirect on success
 */
