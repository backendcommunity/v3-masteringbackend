"use client";

import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard-layout";

/**
 * @deprecated - Community page archived Feb 28, 2026
 * Social proof handled via Portfolio + Leaderboard instead.
 * Keep route for 30 days for backward compatibility.
 * Delete after March 31, 2026 if no stakeholder requests.
 */
export default function CommunityDeprecated() {
  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 px-4">
        <h1 className="text-4xl font-bold">Community — Coming Soon</h1>
        <p className="text-xl text-gray-600 max-w-2xl text-center">
          Connect with the community through our core learning features.
        </p>

        <div className="space-y-4 mt-8 max-w-2xl mx-auto w-full">
          <Link href="/leaderboard">
            <div className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 hover:from-yellow-100 hover:to-orange-100 border border-orange-200 rounded-lg cursor-pointer transition">
              <h3 className="font-bold text-orange-900 mb-2 text-lg">🏆 Leaderboard</h3>
              <p className="text-sm text-orange-700">
                Compete with other backend developers. Showcase your MB and achievements.
              </p>
            </div>
          </Link>

          <Link href="/portfolios">
            <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 border border-purple-200 rounded-lg cursor-pointer transition">
              <h3 className="font-bold text-purple-900 mb-2 text-lg">👤 Developer Portfolio</h3>
              <p className="text-sm text-purple-700">
                Build your public portfolio. Share your courses, projects, and achievements.
              </p>
            </div>
          </Link>

          <Link href="/learn">
            <div className="p-6 bg-gradient-to-r from-green-50 to-teal-50 hover:from-green-100 hover:to-teal-100 border border-teal-200 rounded-lg cursor-pointer transition">
              <h3 className="font-bold text-teal-900 mb-2 text-lg">📚 Join Bootcamp Cohorts</h3>
              <p className="text-sm text-teal-700">
                Collaborate with peer learners. Grow together through cohort-based learning.
              </p>
            </div>
          </Link>
        </div>

        <p className="text-sm text-gray-500 mt-8">
          Community features are being redesigned. Check back soon! →
        </p>
      </div>
    </DashboardLayout>
  );
}
