import { DashboardLayout } from "@/components/dashboard-layout";
import { AdminAssignmentsPage } from "@/components/pages/admin-assignments";

export default function AdminAssignmentsPageRoute() {
  return (
    <DashboardLayout>
      <AdminAssignmentsPage />
    </DashboardLayout>
  );
}
