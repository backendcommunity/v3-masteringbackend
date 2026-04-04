"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { LearningPathDetailPage } from "@/components/pages/learning-path-detail"
import { useParams, useRouter } from "next/navigation"

export default function LearningPathDetailPageRoute() {
  const router = useRouter()
  const { pathId } = useParams() as { pathId: string }

  return (
    <DashboardLayout>
      <LearningPathDetailPage pathId={pathId} onNavigate={(path) => router.push(path)} />
    </DashboardLayout>
  )
}
