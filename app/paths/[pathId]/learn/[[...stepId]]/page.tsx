"use client";

import { PathWorkspace } from "@/components/pages/path-workspace";
import { useParams, useRouter } from "next/navigation";

export default function PathLearnRoute() {
  const router = useRouter();
  const params = useParams() as { pathId: string; stepId?: string[] };
  const stepId = params.stepId?.[0] ?? undefined;

  // Full-bleed, distraction-free: no global navbar/sidebar — only the
  // workspace's own PathTopBar. The watch page owns the whole viewport.
  return (
    <main className="h-screen overflow-hidden bg-background">
      <PathWorkspace
        pathId={params.pathId}
        initialStepId={stepId}
        onNavigate={(path) => router.push(path)}
      />
    </main>
  );
}
