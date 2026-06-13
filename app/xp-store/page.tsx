"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { XpRedemptionPage } from "@/components/pages/xp-redemption"
import { useRouter } from "next/navigation"

export default function XpStorePageRoute() {
  const router = useRouter()

  const handleNavigate = (path: string) => {
    router.push(path)
  }

  return (
    <DashboardLayout>
      <XpRedemptionPage onNavigate={handleNavigate} />
    </DashboardLayout>
  )
}
