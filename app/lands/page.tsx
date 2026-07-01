"use client"

import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"

/**
 * @deprecated - MB Lands archived Feb 28, 2026
 * Consolidated into Course structure.
 * Keep route for 30 days for backward compatibility.
 * Delete after March 31, 2026 if no stakeholder requests.
 */
export default function LandsDeprecated() {
  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 px-4">
        <h1 className="text-4xl font-bold">MB Lands (Archived)</h1>
        <p className="text-xl text-gray-600 max-w-2xl text-center">
          We're consolidating around four core products for a better learning experience.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 max-w-2xl mx-auto">
          <Link href="/learn">
            <div className="p-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg cursor-pointer transition">
              <h3 className="font-bold text-blue-900 mb-2">Courses</h3>
              <p className="text-sm text-blue-700">Video + article learning</p>
            </div>
          </Link>

          <Link href="/projects">
            <div className="p-4 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg cursor-pointer transition">
              <h3 className="font-bold text-purple-900 mb-2">Projects</h3>
              <p className="text-sm text-purple-700">Build real backend systems</p>
            </div>
          </Link>

          <Link href="/bootcamps">
            <div className="p-4 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg cursor-pointer transition">
              <h3 className="font-bold text-green-900 mb-2">Bootcamps</h3>
              <p className="text-sm text-green-700">Cohort-based learning</p>
            </div>
          </Link>

          <Link href="/interviews">
            <div className="p-4 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg cursor-pointer transition">
              <h3 className="font-bold text-orange-900 mb-2">Interviews</h3>
              <p className="text-sm text-orange-700">AI mock interviews</p>
            </div>
          </Link>
        </div>

        <p className="text-sm text-gray-500 mt-8">
          Pick a product and keep building.
        </p>
      </div>
    </DashboardLayout>
  )
}
