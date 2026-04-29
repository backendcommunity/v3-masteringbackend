import type { Metadata } from "next";
import { DashboardLayout } from "@/components/dashboard-layout";
import { DashboardContent } from "@/components/dashboard-content";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Your backend engineering learning hub. Pick up where you left off, track course progress, manage streaks, and stay on your path to becoming a senior backend developer.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  );
}
