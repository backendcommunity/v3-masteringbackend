"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { X, CheckCircle } from "lucide-react";

import { routes } from "@/lib/routes";

interface OnboardingSkipBannerProps {
  userName: string;
}

export function OnboardingSkipBanner({ userName }: OnboardingSkipBannerProps) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      className="relative rounded-lg p-4 mb-4 flex items-center justify-between"
      style={{
        background: "linear-gradient(135deg, rgba(19, 174, 206, 0.1) 0%, rgba(19, 174, 206, 0.05) 100%)",
        border: "1px solid rgba(19, 174, 206, 0.2)",
      }}
    >
      <div className="flex items-center gap-3">
        <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
        <div>
          <p className="font-semibold text-sm text-white">
            Complete your profile setup, {userName.split(" ")[0]}
          </p>
          <p className="text-xs" style={{ color: "#9CA3AF" }}>
            Get personalized course recommendations and start earning rewards.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => router.push(routes.onboarding)}
          className="font-semibold text-sm rounded-md px-4 py-1.5"
          style={{ background: "hsl(var(--primary))", color: "#fff" }}
        >
          Complete Setup
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded"
          style={{ color: "#6B7280" }}
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
