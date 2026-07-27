"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { AdminAssignmentsPage } from "@/components/pages/admin-assignments";
import { useAppStore } from "@/lib/store";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { ShieldOff } from "lucide-react";

export default function AdminAssignmentsPageRoute() {
  const store = useAppStore();
  const [role, setRole] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    store.getUser().then((user: any) => {
      setRole(user?.role ?? "USER");
    }).catch(() => {
      setRole("USER");
    }).finally(() => {
      setChecking(false);
    });
  }, []);

  if (checking) {
    return (
      <DashboardLayout>
        <PageSkeleton />
      </DashboardLayout>
    );
  }

  if (role !== "ADMIN" && role !== "INSTRUCTOR") {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
          <ShieldOff className="h-12 w-12 text-muted-foreground" />
          <h1 className="text-3xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground max-w-sm">
            You need Admin or Instructor privileges to view this page.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <AdminAssignmentsPage />
    </DashboardLayout>
  );
}
